# Operating Workflow

1. Update reusable app defaults in `manifests/applications/<app>/base/` only when the default should apply across tenants.
2. Update tenant-owned deployments under `manifests/tenants/my-tenant/`.
3. Keep backup, storage, image automation, and DNS changes represented in tenant config or shared templates.
4. Render Kustomize entrypoints before opening a PR.
