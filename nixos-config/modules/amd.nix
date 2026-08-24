{ config, lib, pkgs, ... }:

let
  cfg = config.company.gpu.amd;
in
{
  options.company.gpu.amd = {
    enable = lib.mkEnableOption "AMD GPU support";

    rocm = lib.mkOption {
      type = lib.types.bool;
      default = false;
      description = "Expose ROCm-oriented environment defaults for workloads.";
    };

    generation = lib.mkOption {
      type = lib.types.enum [ "rdna2" "rdna3" "rdna3.5" "cdna2" "cdna3" ];
      default = "rdna3";
      description = "GPU generation used to select the ROCm compatibility hint.";
    };
  };

  config = lib.mkIf cfg.enable {
    hardware.graphics = {
      enable = true;
      enable32Bit = true;
    };
    hardware.enableRedistributableFirmware = true;
    boot.kernelModules = [ "amdgpu" ];
    boot.kernelParams = [ "amd_pstate=guided" ];
    environment.systemPackages = [ pkgs.radeontop ];
    environment.variables = lib.mkIf cfg.rocm {
      HSA_OVERRIDE_GFX_VERSION = {
        rdna2 = "10.3.0";
        rdna3 = "11.0.0";
        "rdna3.5" = "11.5.1";
        cdna2 = "9.0.0";
        cdna3 = "9.4.0";
      }.${cfg.generation};
      ROC_ENABLE_PRE_VEGA = "1";
    };
  };
}
