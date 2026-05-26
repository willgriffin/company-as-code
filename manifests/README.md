# Manifests

This tree is organized around ownership boundaries.

- `clusters/my-cluster/`: Flux entrypoint for system and tenant reconciliation.
- `system/`: shared cluster substrate and operators.
- `applications/`: reusable application bases/templates.
- `tenants/my-tenant/`: example company tenant with identity, mail, storage, runners, company services, and projects.
- `automation/images/`: Flux image repositories, policies, and update automation.
- `shared/templates/`: reusable building blocks for future tenant/project overlays.

Deployed workloads should live under the tenant that owns them. Top-level application bases should stay reusable and free of tenant-specific domains, credentials, or storage names.
