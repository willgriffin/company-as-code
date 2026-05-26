# Workflow

Use the tenant ownership model for all new work:

- Add cluster-wide controllers under `manifests/system/`.
- Add reusable defaults under `manifests/applications/<app>/base/`.
- Add deployed company services under `manifests/tenants/my-tenant/company-services/`.
- Add client/product workloads under `manifests/tenants/my-tenant/projects/<project>/`.

Before shipping changes, render `manifests/clusters/my-cluster` and relevant nested Kustomize entrypoints. Keep domain names and secrets templated.
