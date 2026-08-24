# Deployment

Deploy in layers. The example cluster is a starting point, not a turnkey
production environment.

## Mandatory existing-install preflight

This revision is not safe as an unattended in-place upgrade. Earlier versions
owned a `my-tenant-hermes` namespace with `hermes-agent-data` (50 GiB) and
`hermes-workspace-files` (100 GiB) PVCs, deployed backup credentials such as
`garage-credentials` directly, and ran Matomo without the durable filesystem
introduced by the new base. Flux can observe a new Git revision before it
applies a `prune: false` change to the child Kustomization, so the checked-in
flag alone cannot make that transition atomic.

Before changing the cluster's Git source or ref, an operator must suspend both
the owning bootstrap Kustomization and its tenant child, then disable pruning
on the live child object:

```sh
flux suspend kustomization flux-system --namespace flux-system
flux suspend kustomization tenant-my-tenant --namespace flux-system
kubectl patch kustomization tenant-my-tenant --namespace flux-system \
  --type merge --patch '{"spec":{"prune":false}}'
kubectl get kustomization flux-system --namespace flux-system \
  -o jsonpath='{.spec.suspend}{"\n"}'
kubectl get kustomization tenant-my-tenant --namespace flux-system \
  -o jsonpath='{.spec.suspend}{" "}{.spec.prune}{"\n"}'
```

Do not update the Git source unless those commands print `true` and then
`true false`. Advance the source to this revision, whose checked-in tenant
state is also `suspend: true` and `prune: false`, then let the root install that
owned state and verify the child again:

```sh
flux resume kustomization flux-system --namespace flux-system
flux reconcile kustomization flux-system --namespace flux-system --with-source
kubectl get kustomization tenant-my-tenant --namespace flux-system \
  -o jsonpath='{.spec.suspend}{" "}{.spec.prune}{"\n"}'
```

Do not continue unless the last command still prints `true false`. The root may
remain active because the new Git revision now owns those safe child fields.
Complete this staged migration while tenant reconciliation remains suspended:

1. inventory every retained Secret and PVC; create encrypted
   `*.secret.enc.yaml` replacements from the provided templates and add them
   to their owning Kustomizations;
2. create the rendered `my-tenant-matomo/matomo-data` PVC separately, copy the
   running Matomo pod's complete `/var/www/html` tree into it with an approved
   one-shot copy/restore job, and verify at least `config/config.ini.php`,
   installed plugins, and uploaded assets before the new Deployment mounts it;
3. resume `tenant-my-tenant` only after the retained data and encrypted
   replacements are ready, then prove database backups, restores, Matomo, and
   the replacement Secrets work; and
4. migrate or explicitly retire the legacy Hermes data. The suspended,
   zero-replica operator example does not copy either legacy PVC.

Flux advances its inventory while pruning is disabled. Re-enabling
`prune: true` later does not rediscover objects orphaned during this migration.
After verified backups and data copies, delete each orphan explicitly (for
example, delete `my-tenant-hermes` only when both PVCs are intentionally being
retired), record that destructive decision, and then re-enable pruning for
future changes.

For a fresh installation, add all required encrypted Secret resources first.
There is no legacy filesystem or inventory to migrate, so change the tenant to
`prune: true` in deployment-owned Git and resume it after the initial system
reconciliation succeeds.

## 1. Prepare the host layer

Start from the generic examples in `nixos-config/` or `ansible/`, then use the
organization's host automation to:

1. create generic Hetzner edge nodes and private homelab nodes;
2. install k3s and join the nodes with the intended control-plane/worker roles;
3. establish private reachability (Nebula if selected), disks, storage
   classes, labels, taints, and the ingress/load-balancer address plan; and
4. record no host credentials or private inventory in this repository.

The provider and node directories document the inputs expected by this layer.
Add hardware configuration, reachable addresses, host keys, and secret
material through private inventory or an external secret manager; do not add
them to this repository.

The NixOS examples use a deliberately nonexistent `private0` interface. Before
deployment, replace it in both `company.common.managementInterfaces` and
`company.k3s.clusterInterfaces` with reviewed private or mesh interfaces. This
keeps SSH and node ports closed on public interfaces by default.

## 2. Configure the template

Copy `.env.example` as a local planning file, then replace placeholders in the
manifests and configuration that will be deployed:

- tenant and project names;
- `TEMPLATE_DOMAIN` and service hostnames;
- fast/bulk storage classes and, when used, the MetalLB address range;
- Flux Git repository/ref and image-automation settings; and
- external archive endpoint, region, and bucket names.

Use `./reset-to-template.sh --check` before deployment to find remaining
`TEMPLATE_*` and `CHANGE_ME` markers. The check is read-only.

## 3. Establish secrets and Flux

1. Create an age key for the cluster and store the private material outside
   Git (password vault plus an offline recovery copy).
2. Replace the placeholder `age:` recipient in `.sops.yaml` with the generated
   public recipient. The `SOPS_AGE_RECIPIENT` example variable does not update
   this file automatically.
3. Copy each required `*.secret.template.yaml` to an encrypted
   `*.secret.enc.yaml`, replace placeholders, encrypt with SOPS, and add only
   the encrypted file to the owning Kustomization.
4. Create the Flux Git credentials and `flux-system/sops-age` secrets in the
   bootstrap namespace.
5. Bootstrap Flux against `manifests/clusters/my-cluster`, or apply the
   generated Flux bootstrap resources through the organization's approved
   process.

The cluster Kustomize entrypoint patches every child Flux Kustomization with
the `sops-age` decryption reference. Flux decryption is per reconciliation; do
not remove that patch or assume a parent Kustomization passes decryption to its
children.

See [Secrets](SECRETS.md) for the encryption and review rules.

For Ansible hosts, set a narrow `management_allowed_cidrs` value in private
inventory before the first run. The bootstrap intentionally refuses to enable
UFW with globally reachable SSH; cluster ports are likewise limited to
`cluster_allowed_cidrs` or the required Kubernetes ports on a configured mesh
interface. No mesh interface is trusted wholesale.

## 4. Reconcile in dependency order

The normal order is:

1. Flux source/controllers and shared configuration;
2. certificate issuer, ingress, and the selected load-balancer/DNS path;
3. database, storage, backup, observability, and runner modules required by
   the chosen workloads; and
4. `tenant-my-tenant`, then its company-service and project overlays.

Keep optional modules disabled when their provider, storage, or workload is not
present. In particular, choose either the provider's public load balancer or a
MetalLB pool for a given address plan, and do not enable external-dns without
provider credentials and a controlled DNS zone.

Hermes is reconciled separately from its workload declarations. Both Flux
Kustomizations are suspended by default. After adding encrypted registry
credentials, resume only the signed, pinned `org-as-code` chart with
`workloadApply: false`; inspect its CRDs, status, and rendered objects before
considering the example workload. Keep credential values out of workload
environment maps: use its typed `HermesWorkload.spec.secrets` references and
label encrypted runtime Secrets as documented in [Hermes](HERMES.md).

## 5. Validate

Run the repository checks before opening a change:

```sh
bun run typecheck
bun run lint
bun run format:check
bun run build
bun run test
scripts/ci/render-kustomizations.sh
scripts/ci/check-plaintext-secrets.sh
scripts/ci/check-template-literals.sh
kubectl kustomize manifests/clusters/my-cluster
git diff --check
```

Then verify Flux health, certificate issuance, storage provisioning, backup
configuration, and the tenant's selected ingress endpoints in the target
cluster. A successful local render does not prove that provider credentials,
DNS, storage, or recovery procedures are correct.
