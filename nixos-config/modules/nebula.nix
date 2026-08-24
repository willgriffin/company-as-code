{ config, lib, pkgs, ... }:

let
  cfg = config.company.nebula;
  groupRules = map (group: { port = "any"; proto = "any"; inherit group; }) cfg.allowedGroups;
in
{
  options.company.nebula = {
    enable = lib.mkEnableOption "Nebula mesh node";

    package = lib.mkOption {
      type = lib.types.package;
      default = pkgs.nebula;
      description = "Nebula package; override for a pinned or newer release.";
    };

    caCertFile = lib.mkOption {
      type = lib.types.path;
      default = "/run/secrets/nebula/ca.crt";
      description = "Runtime path to the externally managed Nebula CA certificate.";
    };

    hostCertFile = lib.mkOption {
      type = lib.types.path;
      default = "/run/secrets/nebula/host.crt";
      description = "Runtime path to this host's externally managed Nebula certificate.";
    };

    hostKeyFile = lib.mkOption {
      type = lib.types.path;
      default = "/run/secrets/nebula/host.key";
      description = "Runtime path to this host's externally managed Nebula key.";
    };

    lighthouseIps = lib.mkOption {
      type = lib.types.listOf lib.types.str;
      default = [];
      description = "Nebula mesh addresses for lighthouse nodes.";
    };

    staticHostMap = lib.mkOption {
      type = lib.types.attrsOf (lib.types.listOf lib.types.str);
      default = {};
      description = "Optional lighthouse-to-public-endpoint map, supplied per deployment.";
    };

    listenPort = lib.mkOption {
      type = lib.types.port;
      default = 4242;
      description = "UDP port used by Nebula.";
    };

    interface = lib.mkOption {
      type = lib.types.str;
      default = "nebula1";
      description = "Nebula tunnel interface name.";
    };

    allowedGroups = lib.mkOption {
      type = lib.types.listOf lib.types.str;
      default = [];
      description = "Nebula groups allowed to reach this host; ICMP is always allowed.";
    };
  };

  config = lib.mkIf cfg.enable {
    services.nebula.networks.mesh = {
      enable = true;
      package = cfg.package;
      ca = cfg.caCertFile;
      cert = cfg.hostCertFile;
      key = cfg.hostKeyFile;
      lighthouses = cfg.lighthouseIps;
      staticHostMap = cfg.staticHostMap;
      listen.port = cfg.listenPort;
      settings = {
        punchy = {
          punch = true;
          respond = true;
        };
        tun.dev = cfg.interface;
        firewall = {
          outbound = [ { port = "any"; proto = "any"; host = "any"; } ];
          inbound = [ { port = "any"; proto = "icmp"; host = "any"; } ] ++ groupRules;
        };
      };
    };

    networking.firewall = {
      allowedUDPPorts = [ cfg.listenPort ];
      trustedInterfaces = [ cfg.interface ];
    };
  };
}
