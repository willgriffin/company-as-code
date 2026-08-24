# Company as Code

Reusable, organization-neutral GitOps template for a hybrid k3s platform. The
repository describes cluster services, tenant boundaries, and application
workloads; it does not contain an organization's credentials, users, private
operator source, or production-only configuration.

## Boundaries

The platform has three deliberately separate layers:

1. **Host layer:** generic Hetzner edge capacity and private homelab capacity.
   The hardware-neutral NixOS and Ansible examples in `nixos-config/` and
   `ansible/` own the host lifecycle, k3s installation, mesh connectivity,
   disks, and node labels. Production inventory and credentials stay outside
   this repository.
2. **Cluster layer:** k3s, Flux, SOPS-encrypted configuration, networking,
   ingress, certificates, storage operators, backup, and observability under
   `manifests/system/`.
3. **Workload layer:** reusable application bases and tenant-owned overlays
   under `manifests/applications/` and `manifests/tenants/`.

See [Architecture](docs/ARCHITECTURE.md) for the ownership model and
[Deployment](docs/DEPLOYMENT.md) for the order of operations.

## Repository layout

- `infrastructure/` and `templates/nodes/`: provider and node interfaces,
  including a plan-only, organization-neutral Hetzner CDKTF adapter.
- `ansible/` and `nixos-config/`: generic host bootstrap and hardware-neutral
  k3s examples; private inventory, hardware configuration, and credentials are
  intentionally omitted.
- `manifests/clusters/`: Flux entrypoint for one example cluster.
- `manifests/system/`: cluster substrate and optional platform modules.
- `manifests/applications/`: reusable Kustomize bases/templates.
- `manifests/tenants/my-tenant/`: generic tenant example, including company
  services, storage, runners, and an example client project.
- `manifests/shared/templates/`: reusable building blocks for future tenants
  and projects.
- `docs/STACK-PARITY.md`: source-to-template parity inventory and exclusions.

The `my-tenant` and `example-client` names are placeholders. Replace them,
along with `TEMPLATE_DOMAIN`, storage classes, network ranges, repository URLs,
and secret templates, before deploying.

## Stack model

The always-present control loop is k3s + Flux + SOPS/age. The cluster example
also provides templates for certificates, ingress, load balancing, DNS,
network overlay, databases, object storage, backups, observability, image
automation, and runners. Several of these are environment- or workload-
dependent; they are not requirements for every installation. The current
selection and its status are maintained in [Stack parity](docs/STACK-PARITY.md).

Application bases stay generic. A tenant overlay supplies its namespace,
domain, storage class, image policy, database, backup policy, and secrets. A
base is not a promise that every application is enabled in every cluster.

Hermes is a special boundary: the operator and runtime are released from the
separately versioned `org-as-code` repository. This repository contains a
suspended, opt-in consumer of its signed, pinned chart. The current published
CRDs cannot yet express secret-backed workloads, so workload actuation remains
disabled. See [Hermes](docs/HERMES.md).

## Safety and validation

Never commit plaintext credentials. Copy `*.secret.template.yaml` to an
encrypted `*.secret.enc.yaml` only after replacing placeholders and encrypting
with SOPS. Use `./reset-to-template.sh --check` for a read-only placeholder
inventory; it never deletes files or resets a working tree.

Before opening a change, run:

```sh
bun run typecheck
bun run lint
bun run format:check
bun run test
kubectl kustomize manifests/clusters/my-cluster
```
