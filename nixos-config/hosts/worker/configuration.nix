{ ... }:

{
  networking.hostName = "worker";

  # Safe evaluation-only placeholder. Replace with a reviewed private or mesh
  # interface before deploying this example to a host.
  company.common.managementInterfaces = [ "private0" ];

  company.k3s = {
    enable = true;
    role = "agent";
    serverAddress = "https://control-plane.example.invalid:6443";
    tokenFile = "/run/secrets/k3s-token";
    flannelInterface = "private0";
    clusterInterfaces = [ "private0" ];
    nodeIp = "10.0.0.11";
  };

  company.nebula.enable = false;
  company.tailscale.enable = false;
  company.gpu.amd.enable = false;
  company.gpu.nvidia.enable = false;
}
