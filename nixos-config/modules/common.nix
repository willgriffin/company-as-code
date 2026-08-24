{ config, lib, pkgs, ... }:

{
  imports = [
    ./k3s.nix
    ./nebula.nix
    ./tailscale.nix
    ./amd.nix
    ./nvidia.nix
  ];

  options.company.common.enable = lib.mkOption {
    type = lib.types.bool;
    default = true;
    description = "Enable common NixOS host defaults.";
  };

  config = lib.mkIf config.company.common.enable {
    # Keep these defaults safe for a newly copied example.  A host can opt out
    # of the common module when it needs a distribution-specific base.
    nixpkgs.config.allowUnfree = true;
    nix.settings.experimental-features = [ "nix-command" "flakes" ];
    nix.settings.auto-optimise-store = true;
    nix.gc = {
      automatic = true;
      dates = "weekly";
      options = "--delete-older-than 14d";
    };

    networking.useDHCP = lib.mkDefault true;
    networking.firewall.enable = true;

    # Evaluation-safe placeholders for the example hosts. Replace these with
    # generated hardware configuration and the target's boot-loader settings.
    fileSystems."/" = lib.mkDefault {
      device = "/dev/disk/by-label/nixos";
      fsType = "ext4";
    };
    boot.loader.systemd-boot.enable = lib.mkDefault true;
    boot.loader.efi.canTouchEfiVariables = lib.mkDefault false;

    services.openssh = {
      enable = true;
      settings = {
        PasswordAuthentication = false;
        PermitRootLogin = "no";
      };
    };

    environment.systemPackages = with pkgs; [
      curl
      git
      htop
      jq
      tmux
      vim
    ];

    # This is a compatibility baseline, not a hardware configuration.  Set a
    # different stateVersion deliberately when creating a long-lived host.
    system.stateVersion = lib.mkDefault "25.11";
  };
}
