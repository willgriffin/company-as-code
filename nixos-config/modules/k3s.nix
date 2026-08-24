{ config, lib, ... }:

let
  cfg = config.company.k3s;
  serverFlags = [
    "--write-kubeconfig-mode=0640"
  ]
    ++ lib.optional cfg.disableTraefik "--disable=traefik"
    ++ lib.optional cfg.disableServiceLB "--disable=servicelb"
    ++ lib.optional cfg.clusterInit "--cluster-init";
  agentFlags = lib.optional (cfg.serverAddress != null) "--server=${cfg.serverAddress}";
  networkFlags = lib.optional (cfg.flannelInterface != "")
    "--flannel-iface=${cfg.flannelInterface}";
  labelFlags = lib.mapAttrsToList (name: value: "--node-label=${name}=${value}") cfg.labels;
  taintFlags = map (taint: "--node-taint=${taint}") cfg.taints;
in
{
  options.company.k3s = {
    enable = lib.mkEnableOption "k3s Kubernetes node";

    role = lib.mkOption {
      type = lib.types.enum [ "server" "agent" ];
      default = "server";
      description = "Whether this host runs a k3s control plane or worker agent.";
    };

    clusterInit = lib.mkOption {
      type = lib.types.bool;
      default = false;
      description = "Initialize a new embedded-etcd cluster on this server.";
    };

    serverAddress = lib.mkOption {
      type = lib.types.nullOr lib.types.str;
      default = null;
      example = "https://control-plane.example.invalid:6443";
      description = "Existing k3s API URL used by an agent or joining server.";
    };

    tokenFile = lib.mkOption {
      type = lib.types.nullOr lib.types.path;
      default = null;
      example = "/run/secrets/k3s-token";
      description = "Runtime path containing the external cluster token.";
    };

    flannelInterface = lib.mkOption {
      type = lib.types.str;
      default = "";
      example = "nebula1";
      description = "Reviewed private or mesh interface used for k3s pod networking.";
    };

    clusterInterfaces = lib.mkOption {
      type = lib.types.listOf lib.types.str;
      default = [];
      example = [ "nebula1" ];
      description = "Reviewed private or mesh interfaces allowed to carry k3s node traffic.";
    };

    disableTraefik = lib.mkOption {
      type = lib.types.bool;
      default = true;
      description = "Disable the bundled Traefik deployment.";
    };

    disableServiceLB = lib.mkOption {
      type = lib.types.bool;
      default = true;
      description = "Disable the bundled ServiceLB deployment.";
    };

    labels = lib.mkOption {
      type = lib.types.attrsOf lib.types.str;
      default = {};
      description = "Additional labels applied to this k3s node.";
    };

    taints = lib.mkOption {
      type = lib.types.listOf lib.types.str;
      default = [];
      description = "Optional taints applied to this k3s node.";
    };

    extraFlags = lib.mkOption {
      type = lib.types.listOf lib.types.str;
      default = [];
      description = "Additional flags passed to k3s after the safe defaults.";
    };
  };

  config = lib.mkIf cfg.enable {
    assertions = [
      {
        assertion = cfg.clusterInterfaces != [];
        message = "Set company.k3s.clusterInterfaces to reviewed private or mesh interfaces before enabling k3s.";
      }
      {
        assertion = cfg.flannelInterface != "" && lib.elem cfg.flannelInterface cfg.clusterInterfaces;
        message = "Set company.k3s.flannelInterface to one of company.k3s.clusterInterfaces.";
      }
      {
        assertion = !(config.company.nebula.enable && config.company.tailscale.enable);
        message = "Enable at most one mesh transport per host.";
      }
      {
        assertion = !config.company.nebula.enable || cfg.flannelInterface == config.company.nebula.interface;
        message = "When Nebula is enabled, company.k3s.flannelInterface must match company.nebula.interface.";
      }
      {
        assertion = !config.company.tailscale.enable || cfg.flannelInterface == "tailscale0";
        message = "When Tailscale is enabled, company.k3s.flannelInterface must be tailscale0.";
      }
    ];

    networking.firewall.interfaces = lib.genAttrs cfg.clusterInterfaces (_: {
      allowedTCPPorts = [ 10250 ] ++ lib.optionals (cfg.role == "server") [
        6443
        2379
        2380
      ];
      allowedUDPPorts = [ 8472 ];
    });

    services.k3s = {
      enable = true;
      role = cfg.role;
      extraFlags = (if cfg.role == "server" then serverFlags else agentFlags)
        ++ networkFlags
        ++ labelFlags
        ++ taintFlags
        ++ cfg.extraFlags;
    } // lib.optionalAttrs (cfg.serverAddress != null) {
      serverAddr = cfg.serverAddress;
    } // lib.optionalAttrs (cfg.tokenFile != null) {
      tokenFile = cfg.tokenFile;
    };
  };
}
