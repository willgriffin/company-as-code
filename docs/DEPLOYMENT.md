# Deployment

Deploy in layers. The example cluster is a starting point, not a turnkey
production environment.

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
2. Copy each required `*.secret.template.yaml` to an encrypted
   `*.secret.enc.yaml`, replace placeholders, encrypt with SOPS, and add only
   the encrypted file to the owning Kustomization.
3. Create the Flux Git credentials and `flux-system/sops-age` secrets in the
   bootstrap namespace.
4. Bootstrap Flux against `manifests/clusters/my-cluster`, or apply the
   generated Flux bootstrap resources through the organization's approved
   process.

See [Secrets](SECRETS.md) for the encryption and review rules.

For Ansible hosts, set a narrow `management_allowed_cidrs` value in private
inventory before the first run. The bootstrap intentionally refuses to enable
UFW with globally reachable SSH; cluster ports are likewise limited to
`cluster_allowed_cidrs` or a trusted mesh interface.

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
considering the example workload. The current chart has no typed
`HermesWorkload.spec.secrets` contract, so keep workload actuation disabled for
secret-backed runtimes. The chart's version and signature policy are
documented in [Hermes](HERMES.md).

## 5. Validate

Run the repository checks before opening a change:

```sh
bun run typecheck
bun run lint
bun run format:check
bun run test
kubectl kustomize manifests/clusters/my-cluster
```

Then verify Flux health, certificate issuance, storage provisioning, backup
configuration, and the tenant's selected ingress endpoints in the target
cluster. A successful local render does not prove that provider credentials,
DNS, storage, or recovery procedures are correct.
