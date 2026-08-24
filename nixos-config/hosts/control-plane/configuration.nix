{ ... }:

{
  networking.hostName = "control-plane";

  # Safe evaluation-only placeholder. Replace with a reviewed private or mesh
  # interface before deploying this example to a host.
  company.common.managementInterfaces = [ "private0" ];

  company.k3s = {
    enable = true;
    role = "server";
    clusterInit = true;
    tokenFile = "/run/secrets/k3s-token";
    # Replace with the reviewed private interface, or the selected mesh.
    flannelInterface = "private0";
    clusterInterfaces = [ "private0" ];
    nodeIp = "10.0.0.10";
  };

  # Optional overlays are intentionally disabled in the example. Enable one
  # after supplying its external credentials/configuration for a deployment.
  company.nebula.enable = false;
  company.tailscale.enable = false;
  company.gpu.amd.enable = false;
  company.gpu.nvidia.enable = false;
}
