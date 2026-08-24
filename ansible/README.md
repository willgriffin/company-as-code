# Generic Ansible bootstrap

The playbooks in this directory prepare Debian/Ubuntu hosts for a hybrid k3s
cluster. `inventory/hosts.yml` is intentionally address-free: put reachable
SSH addresses and host-specific mesh addresses in a private inventory or
`inventory/host_vars` directory that is not committed here.

Run a normal deployment after supplying private values:

```sh
ansible-playbook playbooks/site.yml \
  -e @/private/ansible/vars.yml
```

In practice, prefer Ansible Vault, SOPS, or a CI secret provider over shell
arguments so credentials do not appear in process listings. The roles consume
these external values:

| Variable | Used by | Source |
| --- | --- | --- |
| `k3s_token` | `k3s_server` | external secret manager |
| `k3s_server_address` | `k3s_server` | private inventory/extra vars |
| `nebula_ca_cert`, `nebula_host_cert`, `nebula_host_key` | `nebula` | external certificate/key store |
| `nebula_ip`, `nebula_lighthouse_ip`, `nebula_lighthouse_public_endpoint` | `nebula` | private inventory |
| `tailscale_auth_key` | `tailscale` | short-lived external auth key |
| `management_allowed_cidrs` | `common` | private inventory; reviewed SSH source ranges |
| `cluster_allowed_cidrs` | `common` | private inventory; node-to-node source ranges when no trusted mesh interface is used |
| `k3s_flannel_interface` | `k3s_server` | private inventory; reviewed private interface, or the selected mesh interface |

Set `nebula_enabled: true` or `tailscale_enabled: true` only after their
inputs are available. Set `nebula_allowed_groups` to the smallest required
Nebula groups; the role permits ICMP by default and does not open all mesh
traffic. `bootstrap-nebula.yml` is a one-host recovery path over
an ordinary SSH address; use `--limit` and provide `bootstrap_public_host`
from a trusted private source.

The role defaults are deliberately conservative and contain no known-hosts
file, encrypted vault, fixed address, private key, or organization identity.
Use SSH host-key verification from the operator's own known-hosts policy when
running against real infrastructure.

The common role fails before enabling UFW unless
`management_allowed_cidrs` contains at least one reviewed source range. Cluster
ports are opened only to `cluster_allowed_cidrs`; when Nebula or Tailscale is
selected, only the same API, kubelet, flannel, and embedded-etcd ports are
opened on that interface. The role never marks the whole mesh as trusted.
The k3s role also requires an explicit Flannel interface and verifies that it
matches `nebula_interface` or `tailscale0` when that mesh is selected.

The example pins both bootstrap release versions and SHA-256 checksums. When
changing `k3s_version`, `k3s_install_script_url`, `nebula_version`, or
`nebula_arch`, update the matching checksum from the upstream release and
review the download source in the same change.
