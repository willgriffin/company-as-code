# Deployment

1. Replace `TEMPLATE_DOMAIN`, storage classes, load balancer ranges, Git repository URLs, and cloud values.
2. Copy every `*.secret.template.yaml` that contains real values to `*.secret.enc.yaml` and encrypt with SOPS.
3. Bootstrap Flux at `manifests/clusters/my-cluster` with image automation components enabled.
4. Reconcile system components first, then `tenant-my-tenant`.
