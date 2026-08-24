# Reusable NixOS hybrid-host examples

This directory is a hardware-neutral starting point for a hybrid k3s fleet.
The flake exposes two example configurations:

```text
control-plane   first k3s server, with embedded-etcd initialization enabled
worker          k3s agent joining the control-plane URL
```

Build or inspect one with `nix flake check` and
`nix eval .#nixosConfigurations.control-plane.config.system.build.toplevel`.
Install a selected host with `nixos-rebuild --flake .#control-plane` after
adding the target's generated hardware configuration and boot settings.

Before deployment, replace the examples' nonexistent `private0` placeholder.
Set `company.common.managementInterfaces` to the reviewed private or mesh
interfaces that may receive SSH, and `company.k3s.clusterInterfaces` to those
that carry node traffic. The module opens SSH only on the former; on the latter
it opens kubelet and flannel traffic on every node, plus the API and embedded
etcd peer ports on server nodes. It never trusts an entire mesh interface.

## Optional modules

`modules/nebula.nix` and `modules/tailscale.nix` provide alternative mesh
transports. `modules/amd.nix` and `modules/nvidia.nix` provide opt-in GPU
defaults for workers. The example hosts leave all four disabled so the flake
does not assume a network, GPU, or hardware layout.

When Nebula is enabled, set `company.nebula.lighthouseIps` and (if needed)
`company.nebula.staticHostMap`, then set `company.k3s.flannelInterface` to the
same interface. Add only the required Nebula security groups through
`company.nebula.allowedGroups`; the module allows ICMP by default and does not
open all mesh traffic. The CA, host certificate, and host key default to paths below
`/run/secrets/nebula`; provide them with SOPS-Nix, systemd credentials, or
another secret manager during deployment. They are deliberately not stored in
this repository.

The k3s token is likewise read from `company.k3s.tokenFile`. The example uses
`/run/secrets/k3s-token` as a path only; provision its contents through an
external secret input. Tailscale authentication is performed after activation
with `tailscale up` and an externally managed, short-lived auth key.

The flake intentionally contains no hardware-configuration files, disk
partitioning, IP addresses, credentials, host keys, or organization-specific
names. Copy the examples into a private deployment and add those values there.
