{ config, lib, ... }:

let
  cfg = config.company.tailscale;
in
{
  options.company.tailscale = {
    enable = lib.mkEnableOption "Tailscale daemon";

    acceptRoutes = lib.mkOption {
      type = lib.types.bool;
      default = false;
      description = "Accept routes advertised by other tailnet nodes.";
    };

    acceptDns = lib.mkOption {
      type = lib.types.bool;
      default = false;
      description = "Allow Tailscale to manage DNS configuration.";
    };
  };

  config = lib.mkIf cfg.enable {
    services.tailscale = {
      enable = true;
    };

    networking.firewall.trustedInterfaces = [ "tailscale0" ];

    # Authentication is intentionally out of the flake. Authenticate after
    # deployment with `tailscale up` and an externally managed auth key.
    environment.etc."company/tailscale-flags".text = ''
      --accept-routes=${if cfg.acceptRoutes then "true" else "false"}
      --accept-dns=${if cfg.acceptDns then "true" else "false"}
    '';
  };
}
