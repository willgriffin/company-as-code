{ lib, config, ... }:
{
  options.company.nebula.enable = lib.mkEnableOption "Nebula mesh node";
  config = lib.mkIf config.company.nebula.enable {
    networking.firewall.allowedUDPPorts = [ 4242 ];
    networking.firewall.trustedInterfaces = [ "nebula1" ];
  };
}
