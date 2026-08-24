# Company as Code

An organization-neutral template for operating a hybrid k3s platform with
Flux, Kustomize, Helm, and SOPS/age.

It provides host-bootstrap examples, cluster services, reusable application
bases, and tenant/project overlays. It is a starting point, not a turnkey
production installer: private inventory, credentials, hardware configuration,
domains, provider state, and production data belong outside this repository.

> [!IMPORTANT]
> Existing installations must follow the
> [mandatory migration preflight](docs/DEPLOYMENT.md#mandatory-existing-install-preflight)
> before changing their Git source or ref. The checked-in `suspend` and `prune`
> settings cannot make that live transition atomic by themselves.

## Operating model

The template separates three ownership layers:

```text
hosts and private network
          │
          ▼
        k3s
          │
          ▼
Flux + Kustomize/Helm + SOPS/age
          │
          ├── cluster services and operators
          ├── tenant-owned services
          └── project workloads
```

- **Host:** provider/node interfaces plus generic Ansible and NixOS examples
  establish machines, k3s membership, private reachability, storage, and node
  roles.
- **Cluster:** Flux reconciles networking, certificates, ingress, operators,
  storage, backup, observability, and other selected platform capabilities.
- **Workload:** reusable application bases are configured by tenant and project
  overlays that own domains, persistence, policies, and secret references.

The intended core is k3s, Flux reconciliation, encrypted configuration, a
working network, and a selected storage strategy. Most platform modules and
all example workloads are optional. See [Architecture](docs/ARCHITECTURE.md)
for the ownership model and [Stack parity](docs/STACK-PARITY.md) for the
capability inventory.

## Repository map

| Path | Purpose |
| --- | --- |
| `infrastructure/`, `templates/nodes/` | Provider and node interfaces, including a plan-only Hetzner adapter |
| `ansible/`, `nixos-config/` | Generic host and k3s bootstrap examples |
| `manifests/clusters/my-cluster/` | Flux entrypoint and reconciliation dependency graph |
| `manifests/system/` | Cluster substrate, operators, and optional platform modules |
| `manifests/applications/` | Reusable application bases |
| `manifests/tenants/my-tenant/` | Example tenant, company services, storage, runners, and projects |
| `manifests/shared/templates/` | Reusable tenant and project building blocks |
| `docs/` | Architecture, deployment, secrets, recovery, and component guidance |

`my-tenant`, `example-client`, `TEMPLATE_*`, and `CHANGE_ME_*` are scaffolding.
Rename or replace them before deployment.

## Adopt the template

1. Review [Architecture](docs/ARCHITECTURE.md) and choose the provider,
   networking, storage, ingress, identity, backup, and workload capabilities
   the target actually needs. Remove unused modules before enabling them.
2. Use `.env.example` as a non-secret planning reference. Replace tenant,
   project, domain, storage, repository, image, load-balancer, DNS, and archive
   placeholders in deployment-owned configuration.
3. Run the read-only marker check:

   ```sh
   ./reset-to-template.sh --check
   ```

4. Create each required encrypted Secret from its adjacent
   `*.secret.template.yaml`; never deploy the template or commit plaintext
   values. Follow [Secrets](docs/SECRETS.md).
5. Follow [Deployment](docs/DEPLOYMENT.md) to prepare hosts, bootstrap Flux,
   and reconcile only the selected system and tenant components.

A successful local render proves composition, not production readiness. Verify
provider access, DNS, storage, backups, restores, and application behavior in
the target environment.

## Existing installations

This revision is not an unattended in-place upgrade. Before advancing Git,
suspend the owning root and tenant Flux Kustomizations, disable pruning on the
live tenant object, and verify that live state. Keep tenant reconciliation
suspended while retained Secrets and PVCs are inventoried, encrypted
replacements are installed, stateful data is migrated, and recovery behavior
is proven. Explicitly retire legacy objects only after their data is no longer
required.

The complete procedure—including the Matomo filesystem and legacy Hermes data
boundaries—is in the
[deployment preflight](docs/DEPLOYMENT.md#mandatory-existing-install-preflight).

## Secrets

Never commit credentials, tokens, private keys, provider state, backups, or
exported application data. For deployment:

1. copy a required `*.secret.template.yaml` to `*.secret.enc.yaml`;
2. replace every placeholder locally;
3. encrypt `data` and `stringData` with SOPS using the deployment's age
   recipient; and
4. add only the encrypted file to its owning Kustomization.

Keep templates out of deployable `resources:` lists. Store the age private key
and recovery material outside Git. See [Secrets](docs/SECRETS.md) for the full
contract.

## Hermes

Hermes is an opt-in external integration. The separately versioned
`org-as-code` project owns the operator, CRDs, chart, controller, and runtime
release; this repository owns only signed, immutable consumer wiring and
generic workload declarations.

The operator and example Flux Kustomizations are suspended by default,
actuation is disabled, and the example workload remains inactive at zero
replicas. Enabling Hermes requires encrypted registry credentials, a review of
the published CRDs and managed namespaces, verified release identities, and an
explicit decision for every actuation gate. Runtime credentials use typed
same-namespace Secret references. See [Hermes packaging and rollout](docs/HERMES.md).

## Validation

Run the local baseline before opening a change:

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
```

CI additionally validates all YAML, negative secret fixtures, the Hetzner
adapter, NixOS configurations, Ansible playbooks, and workflow syntax. A change
to one of those areas should run its focused checks locally as well.

## Further reading

- [Architecture](docs/ARCHITECTURE.md) — layers, ownership, and exclusions.
- [Deployment](docs/DEPLOYMENT.md) — fresh installs and existing-install
  migration.
- [Secrets](docs/SECRETS.md) — SOPS/age workflow and key custody.
- [Stack parity](docs/STACK-PARITY.md) — included and conditional capabilities.
- [Hermes](docs/HERMES.md) — external operator boundary and safe rollout.
- [Manifest layout](manifests/README.md) — manifest ownership conventions.
- [Contributing](CONTRIBUTING.md) — repository contribution guidance.
