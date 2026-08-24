{ ... }:

{
  networking.hostName = "worker";

  company.k3s = {
    enable = true;
    role = "agent";
    serverAddress = "https://control-plane.example.invalid:6443";
    tokenFile = "/run/secrets/k3s-token";
    flannelInterface = null;
  };

  company.nebula.enable = false;
  company.tailscale.enable = false;
  company.gpu.amd.enable = false;
  company.gpu.nvidia.enable = false;
}
