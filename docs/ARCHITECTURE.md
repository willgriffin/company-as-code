# Architecture

This repo is a reusable company platform template. System components provide the cluster substrate. Tenants own domain, identity, mail, storage, backup policy, and deployed services. Company services and client projects live under the tenant that owns them.

Top-level `applications/` contains reusable bases. Deployed instances live under `tenants/my-tenant/`.
