{ ... }:
{
  imports = [ ../../modules/common.nix ../../modules/nebula.nix ../../modules/k3s.nix ];
  company.nebula.enable = true;
  company.k3s.enable = true;
}
