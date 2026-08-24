# Forgejo base

This base contains the namespace, Forgejo Helm OCI source, Forgejo HelmRelease, and the
CloudNativePG database with scheduled backups. Tenant overlays should reference this base
and provide their encrypted secrets separately.

Replace the `TEMPLATE_*` values for the tenant before deployment. Secret templates are
intentionally not included in this kustomization; copy and encrypt them with SOPS first.
