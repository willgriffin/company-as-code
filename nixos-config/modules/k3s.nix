{ lib, config, ... }:
{
  options.company.k3s.enable = lib.mkEnableOption "k3s node over Nebula";
  config = lib.mkIf config.company.k3s.enable {
    services.k3s.enable = true;
    services.k3s.extraFlags = [ "--flannel-iface=nebula1" ];
  };
}
