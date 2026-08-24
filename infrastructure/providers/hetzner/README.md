# Hetzner provider adapter

This adapter is a small, organization-neutral CDKTF stack for Hetzner Cloud.
It provisions a private network and subnet, an optional firewall, a configurable
number of servers, and an optional load balancer. It contains no DNS, mail,
object storage, remote state bucket, or application-specific resources.

The stack is deliberately plan-oriented. It has no apply or destroy command;
review and apply the generated Terraform plan through the deployment process
used by the consuming environment.

## Quick start

```sh
cd infrastructure/hetzner
npm ci
npm run typecheck
npm run synth                 # offline; HCLOUD_TOKEN is not required

# Optional: create a provider-backed plan (never applies changes)
export HCLOUD_TOKEN="..."
npm run plan
```

The minimal HCloud bindings used by this adapter are checked in under `.gen/`
and record provider schema 1.54.0. This keeps ordinary validation independent
of the CDKTF generator toolchain. OpenTofu and a configured HCloud token are
required for `npm run plan`; synthesis and type checking do not contact
Hetzner.

Treat a provider-schema refresh as a dependency update: regenerate in an
isolated workspace, retain only the resource bindings imported by `main.ts`,
review the generated diff, and rerun synthesis before committing it.

## Configuration

All inputs are environment variables. Defaults are intentionally small and
generic. Set `SSH_PUBLIC_KEY` before creating servers that need SSH access;
when it is omitted, no SSH-key resource is created and the server receives no
SSH key.

| Variable | Default | Description |
| --- | --- | --- |
| `HCLOUD_TOKEN` | unset | Hetzner API token; required for a remote plan |
| `NAME_PREFIX` | `cluster` | Prefix for resource names |
| `SSH_PUBLIC_KEY` | unset | Public key material to register with Hetzner |
| `SSH_KEY_NAME` | `cluster-access` | Name of the registered SSH key |
| `PRIVATE_NETWORK_CIDR` | `10.0.0.0/16` | Private network range |
| `PRIVATE_SUBNET_CIDR` | `10.0.1.0/24` | Cloud subnet range |
| `NETWORK_ZONE` | `eu-central` | Hetzner network zone for the subnet |
| `ENABLE_FIREWALL` | `true` | Create and attach the firewall |
| `FIREWALL_NAME` | `cluster-firewall` | Firewall resource name |
| `SSH_ALLOWED_CIDRS` | empty | Comma-separated SSH source CIDRs |
| `FIREWALL_PUBLIC_TCP_PORTS` | empty | Comma-separated public TCP ports |
| `SERVER_COUNT` | `1` | Number of servers (zero is allowed for topology-only plans) |
| `SERVER_TYPE` | `cpx11` | Hetzner server type |
| `LOCATION` | `fsn1` | Hetzner server and load balancer location |
| `IMAGE` | `ubuntu-24.04` | Server image |
| `ENABLE_LOAD_BALANCER` | `false` | Create and attach one load balancer |
| `LOAD_BALANCER_TYPE` | `lb11` | Load balancer type |
| `LOAD_BALANCER_PORTS` | `80,443` | TCP ports to expose and health-check |

The firewall always permits TCP, UDP, and ICMP from the configured private
network. Public SSH is disabled by default; provide a narrow
`SSH_ALLOWED_CIDRS` value when break-glass access is needed. Public ports are
only opened when listed in `FIREWALL_PUBLIC_TCP_PORTS`.

## Plan-only workflow

1. Copy the variables above into an environment owned by the consuming
   deployment system. Keep the API token and key material outside the
   repository.
2. Run `npm run typecheck` and `npm run synth` without credentials to inspect
   the generated stack shape.
3. With `HCLOUD_TOKEN` set, run `npm run plan` and review the Terraform plan.
4. Apply only the reviewed plan using the consuming environment's change
   controls. This adapter does not provide an apply or destroy script.

The generated local Terraform state path is the default CDKTF local backend.
Configure state storage outside this adapter when a shared or remote state
workflow is required.
