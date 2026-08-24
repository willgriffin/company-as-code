{ config, lib, pkgs, ... }:

let
  cfg = config.company.gpu.nvidia;
in
{
  options.company.gpu.nvidia = {
    enable = lib.mkEnableOption "NVIDIA GPU support";

    containerRuntime = lib.mkOption {
      type = lib.types.bool;
      default = false;
      description = "Enable NVIDIA Container Toolkit for k3s workloads.";
    };

    openKernel = lib.mkOption {
      type = lib.types.bool;
      default = true;
      description = "Use the open NVIDIA kernel module where supported.";
    };
  };

  config = lib.mkIf cfg.enable {
    services.xserver.videoDrivers = [ "nvidia" ];
    hardware.graphics = {
      enable = true;
      enable32Bit = true;
    };
    hardware.nvidia = {
      open = cfg.openKernel;
      modesetting.enable = true;
    };
    hardware.nvidia-container-toolkit.enable = cfg.containerRuntime;
    environment.systemPackages = lib.optionals cfg.containerRuntime [
      pkgs.nvidia-container-toolkit
    ];
  };
}
