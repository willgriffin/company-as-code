# Architecture

This repository is a reusable hybrid platform template. It includes generic
host-bootstrap examples as well as the Kubernetes/GitOps layer, but it is not a
production host inventory or an organization-operator repository.

## Hybrid k3s topology

The intended topology has two capacity classes joined into one k3s cluster:

- **Hetzner edge:** generic public nodes provide the reachable edge for
  control-plane availability, ingress, and other explicitly labelled edge
  workloads. Public addresses, firewall rules, and the load-balancer range are
  deployment inputs, not fixed identities in this template.
- **Homelab/private capacity:** the hardware-neutral examples in
  `nixos-config/` and `ansible/` manage the shape of private machines, disks,
  storage-heavy workloads, and optional workers. The host layer supplies k3s
  membership, Nebula networking, storage classes, and node labels/taints;
  production inventory, hardware configuration, and secret inputs remain
  outside this repository.

The two classes communicate over the cluster's private network. `Nebula` is a
provided system-module template where that overlay is needed. A deployment can
use another private network, but it must preserve the same interface: stable
node reachability, explicit roles, and no credentials in Git.

## Reconciliation flow

```text
Hetzner + homelab hosts
        │  k3s / network / storage supplied by host layer
        ▼
      k3s API
        │
        ├─ Flux source + Kustomize/Helm reconciliation
        ├─ SOPS/age decryption inside Flux
        └─ system modules ──► tenant overlays ──► project workloads
```

Flux owns the desired-state loop. System Kustomizations establish platform
prerequisites before the `tenant-my-tenant` Kustomization. SOPS-encrypted
objects are decrypted only during reconciliation using the cluster's age key;
plaintext values do not belong in this repository.

## Core and optional platform modules

The distinction is about a module's role, not whether a sample manifest exists
in `manifests/system/`.

| Layer | Core contract | Optional/conditional modules in this template |
| --- | --- | --- |
| Cluster | k3s, Flux source/controllers, Kustomize/Helm reconciliation, SOPS/age key, and a working CNI | Host-specific provisioning, node roles, and private-network implementation |
| Network edge | A reachable ingress path and certificate issuer | MetalLB for bare metal/homelab addresses; external-dns for provider-managed DNS; Nebula or Tailscale for a cross-site overlay; Gateway API CRDs for Gateway implementations |
| State | A selected storage class and the operators required by enabled workloads | CloudNativePG/PostgreSQL, MariaDB, Redis, RabbitMQ, MinIO, Garage, and tenant storage catalogs |
| Resilience | A documented recovery target for each stateful workload | Velero, Garage archive sync, external S3 archive, and per-workload backup policies |
| Operations | Flux health and reconciliation visibility | OpenObserve/collector, node-exporter, Flux image automation, ARC runners, Renovate, and tofu-controller |
| Specialized nodes | Explicit scheduling and security boundaries | Opt-in AMD/NVIDIA device plugins; no GPU package is part of the default cluster graph |
| Identity/services | Tenant-owned configuration and secrets | Dex/Kanidm, Stalwart, and any company-service overlay; they are not needed by a cluster that has no such workload |

`cert-manager` and an ingress controller are the default web-serving path in
the example. MetalLB is appropriate for a private/bare-metal address pool;
public-cloud installations may replace it with their provider load balancer.
Do not enable both paths without an intentional address-allocation design.

## Application model

Applications use a Kustomize base/overlay convention:

- `manifests/applications/<name>/base/` contains reusable defaults and
  placeholders. Bases must not contain tenant domains, credentials, or
  tenant-specific storage names.
- `manifests/tenants/<tenant>/company-services/<name>/` is the tenant overlay.
  It owns namespace, ingress, database, PVC, backup, and secret references.
- `manifests/tenants/<tenant>/projects/<project>/` is a project overlay. It may
  compose application components, databases, buckets, and runners without
  changing the company-service boundary.

Some current bases are intentionally small placeholders while their tenant
overlays carry the concrete manifests. That is an explicit template state,
not a claim that every service is already fully generalized.

## Explicit exclusions

This repository excludes:

- organization-specific domains, user identities, tokens, API keys, and
  private Git/OCI endpoints;
- the production host inventory, hardware-specific NixOS configuration,
  private Ansible inventory, and private firewall/storage topology;
- the Hermes operator, CRDs, controller, and runtime image build. Those are
  owned and versioned by `org-as-code` and consumed as a signed chart;
- private application forks, organization-specific policy, and production
  data;
- any claim that optional modules or every example application must be enabled
  in a deployment.

The placeholder tenant and example client are safe scaffolding only. They must
be renamed or removed as part of adopting the template.
