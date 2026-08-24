# Stack parity inventory

This inventory records how the evolved hybrid IaC model maps to this reusable
template. “Included” means a generic boundary or example exists; it does not
mean that every deployment should enable the component.

| Evolved platform concern | Template location/status | Boundary or exclusion |
| --- | --- | --- |
| Public edge capacity | `infrastructure/providers/hetzner/`, `templates/nodes/hetzner/` | Generic provider/node interfaces only; no account, region, IP, or host inventory |
| Homelab/private capacity | `nixos-config/`, `ansible/`, and node-role inputs | Hardware configuration, private inventory, addresses, and credentials stay outside this repo |
| k3s cluster | `manifests/clusters/`, `manifests/system/` | Cluster declarations are generic; bootstrap credentials are external |
| Private cross-site network | `manifests/system/nebula/` (conditional) | Enable only when the deployment has a managed overlay and keys |
| GitOps | Flux resources under `manifests/clusters/my-cluster/flux-system/` and cluster Kustomizations | Git source URL and deploy key are deployment inputs |
| Encrypted configuration | `*.secret.template.yaml` plus SOPS workflow | No plaintext secrets, private age keys, or provider credentials |
| TLS and ingress | cert-manager, nginx-ingress | Issuer email, DNS, and ingress address plan must be supplied by adopter |
| Load balancing and DNS | MetalLB and external-dns (conditional) | Provider-specific load balancer/DNS implementations are not universal requirements |
| Stateful data | PostgreSQL/MariaDB operators, tenant storage overlays | Select storage classes and operators to match enabled workloads |
| Object/archive storage | Garage, MinIO, Velero, archive sync (conditional) | Buckets, endpoints, keys, and recovery policy are deployment-specific |
| Observability | OpenObserve and collector (conditional) | No organization telemetry endpoint or retention policy is embedded |
| Image/update automation | Flux image automation and Renovate templates | Policies are examples; image sources and update approval remain adopter-owned |
| CI runners | ARC and tenant/project runner overlays (conditional) | No organization runner registration token or private labels |
| Company services | Tenant overlays for identity, mail, and selected services | The example is scaffolding; enable only services the adopter owns and configures |
| Project workloads | `manifests/tenants/my-tenant/projects/example-client/` | Example client is disposable and must be renamed or removed |
| Hermes operator/runtime | `docs/HERMES.md`; consumer wiring when enabled | Source, CRDs, chart, and runtime release stay in separately versioned `org-as-code` |
| Organization-specific policy | Excluded | No HappyVertical/private identities, domains, credentials, app forks, or production data |

## Reading the inventory

The current cluster entrypoint reconciles a broad example selection so that
Kustomize dependencies and ownership boundaries are visible. A real adopter
should prune modules first, then add only the overlays and credentials required
for its edge, homelab, storage, identity, and application choices. The absence
of a module from a deployment is not a parity failure; it is usually an
intentional capability choice.

Parity checks should cover both files and behavior:

```sh
./reset-to-template.sh --check
kubectl kustomize manifests/clusters/my-cluster
```

Review this table when the source IaC stack changes. Update it with a concrete
template path or an explicit exclusion rather than adding a product name that
the repository does not actually implement.
