# Company as Code

Reusable GitOps template for a company-owned k3s platform. It runs company domain services, agent services, project/client workloads, and multi-site backup infrastructure.

## Model

- `system/`: cluster substrate and operators.
- `applications/`: reusable app bases/templates.
- `tenants/my-tenant/`: ownership, domain, identity, secrets, storage, and backup boundary.
- `tenants/my-tenant/company-services/`: company operating services.
- `tenants/my-tenant/projects/`: client and product workloads.

Replace `TEMPLATE_DOMAIN`, storage classes, cloud provider values, and secret templates before deployment.

## Core Stack

Flux, SOPS, cert-manager, nginx-ingress, MetalLB, external-dns, Kanidm, Dex, Stalwart, Zulip, Vikunja, OxiCloud, Forgejo, Vaultwarden, Matomo, Bifrost, Hermes, ContextForge, Hindsight, OpenObserve, Garage, MinIO, Velero, ARC, Renovate, Nebula, and k3s.

## Validation

```sh
bun run typecheck
bun run format:check
kubectl kustomize manifests/clusters/my-cluster
```
