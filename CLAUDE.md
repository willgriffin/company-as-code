# Company as Code Agent Notes

This repository is a reusable GitOps template for a company-owned k3s platform.

## Current Stack

- Flux, SOPS, cert-manager, nginx-ingress, MetalLB, external-dns
- Kanidm and Dex for identity
- Stalwart for mail
- Zulip, Vikunja, OxiCloud, Forgejo, Vaultwarden, Matomo
- Bifrost, Hermes, ContextForge, Hindsight
- OpenObserve for observability
- Garage, MinIO, Velero, and external S3 archive for backup/storage
- ARC runners, Renovate, Nebula, and multi-cloud k3s node templates

## Layout

- `manifests/system/`: cluster-wide substrate and operators
- `manifests/applications/`: reusable bases/templates
- `manifests/tenants/my-tenant/`: deployed company tenant example
- `manifests/tenants/my-tenant/company-services/`: tenant-owned company services
- `manifests/tenants/my-tenant/projects/`: client and product workloads

Do not commit real plaintext secrets. Use SOPS-encrypted copies of `*.secret.template.yaml` when adding real values.
