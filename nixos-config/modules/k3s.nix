{ config, lib, ... }:

let
  cfg = config.company.k3s;
  serverFlags = [
    "--write-kubeconfig-mode=0640"
    "--cluster-cidr=${cfg.clusterCidr}"
    "--service-cidr=${cfg.serviceCidr}"
  ]
    ++ lib.optional cfg.disableTraefik "--disable=traefik"
    ++ lib.optional cfg.disableServiceLB "--disable=servicelb"
    ++ lib.optional cfg.clusterInit "--cluster-init";
  agentFlags = lib.optional (cfg.serverAddress != null) "--server=${cfg.serverAddress}";
  networkFlags = [
    "--node-ip=${cfg.nodeIp}"
    "--flannel-iface=${cfg.flannelInterface}"
  ];
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

    nodeIp = lib.mkOption {
      type = lib.types.str;
      default = "";
      example = "10.0.0.10";
      description = "Private or mesh address advertised by k3s for this node.";
    };

    clusterCidr = lib.mkOption {
      type = lib.types.str;
      default = "10.42.0.0/16";
      description = "Pod CIDR passed to k3s servers and admitted by host networking.";
    };

    serviceCidr = lib.mkOption {
      type = lib.types.str;
      default = "10.43.0.0/16";
      description = "Service CIDR passed to k3s servers and admitted by host networking.";
    };

    podInterfaces = lib.mkOption {
      type = lib.types.listOf lib.types.str;
      default = [ "cni0" "flannel.1" ];
      description = "Local k3s overlay interfaces trusted for pod and service traffic.";
    };

    clusterInterfaces = lib.mkOption {
      type = lib.types.listOf lib.types.str;
      default = [];
      example = [ "nebula1" ];
      description = "Reviewed private or mesh interfaces allowed to carry k3s node traffic.";
    };

    ingressNodePorts = lib.mkOption {
      type = lib.types.listOf lib.types.port;
      default = [ 30080 30443 ];
      description = "Ingress NodePorts accepted only on reviewed cluster interfaces.";
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
        assertion = cfg.nodeIp != "";
        message = "Set company.k3s.nodeIp to this node's reviewed private or mesh address.";
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
      {
        assertion = lib.all (flag:
          lib.all (reserved: !(lib.hasInfix reserved flag)) [
            "--flannel-iface"
            "--node-ip"
            "--cluster-cidr"
            "--service-cidr"
          ]) cfg.extraFlags;
        message = "Do not override network identity or CIDRs through company.k3s.extraFlags; use the typed company.k3s options.";
      }
    ];

    networking.firewall.interfaces = lib.genAttrs cfg.clusterInterfaces (_: {
      allowedTCPPorts = [ 10250 ] ++ cfg.ingressNodePorts ++ lib.optionals (cfg.role == "server") [
        6443
        2379
        2380
      ];
      allowedUDPPorts = [ 8472 ];
    });
    networking.firewall.trustedInterfaces = cfg.podInterfaces;

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
