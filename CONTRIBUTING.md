# Contributing

Keep changes small and reviewable. This repo is a generic company platform template, so avoid committing real domains, client names, user accounts, or plaintext secrets.

## Manifest Rules

- Cluster-wide operators live in `manifests/system/`.
- Reusable application bases live in `manifests/applications/<app>/base/`.
- Deployed workloads live under the tenant that owns them.
- Company services belong under `manifests/tenants/my-tenant/company-services/`.
- Client/product workloads belong under `manifests/tenants/my-tenant/projects/`.
- Prefer `TEMPLATE_DOMAIN`, `TEMPLATE_*`, and `CHANGE_ME_*` placeholders in committed examples.

## Validation

Run the narrowest relevant checks first, then broader checks:

```sh
kubectl kustomize manifests/clusters/my-cluster
bun run typecheck
bun run format:check
```

If local JavaScript dependencies are not installed, install them or note that the Bun checks could not run.
