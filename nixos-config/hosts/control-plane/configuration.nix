{ ... }:

{
  networking.hostName = "control-plane";

  company.k3s = {
    enable = true;
    role = "server";
    clusterInit = true;
    tokenFile = "/run/secrets/k3s-token";
    # Set to "nebula1" when the optional Nebula module is enabled.
    flannelInterface = null;
  };

  # Optional overlays are intentionally disabled in the example. Enable one
  # after supplying its external credentials/configuration for a deployment.
  company.nebula.enable = false;
  company.tailscale.enable = false;
  company.gpu.amd.enable = false;
  company.gpu.nvidia.enable = false;
}
