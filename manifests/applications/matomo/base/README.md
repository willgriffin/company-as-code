# Matomo base

This directory contains the organization-neutral Matomo workload. It uses the official
Docker image, a MariaDB operator resource, persistent Matomo storage, and an hourly archive
job. The base intentionally has no organization domain, identity provider, image registry,
node topology, or user accounts.

Tenant overlays should patch the hostname and storage class, and provide an encrypted copy of
the accompanying `secrets.secret.template.yaml`.
