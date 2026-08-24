# Matomo base

This directory contains the organization-neutral Matomo workload. It uses the official
Docker image, a MariaDB operator resource, persistent Matomo storage, and an hourly archive
job. The base intentionally has no organization domain, identity provider, image registry,
node topology, or user accounts.

Tenant overlays should patch the hostname and storage class, and provide an encrypted copy of
the accompanying `secrets.secret.template.yaml`.

This base mounts `/var/www/html` from `matomo-data`. Before upgrading an older
deployment that stored that tree in its container layer, suspend its Flux
Kustomization, create the rendered PVC, copy the complete live tree into it,
and verify `config/config.ini.php`, plugins, and uploads. Do not let the new
Deployment start against an empty claim; see `docs/DEPLOYMENT.md`.
