{
  description = "Reusable NixOS examples for a hybrid k3s cluster";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";

  outputs = { nixpkgs, ... }:
    let
      system = "x86_64-linux";
      commonModules = [ ./modules/common.nix ];
    in
    {
      nixosConfigurations = {
        control-plane = nixpkgs.lib.nixosSystem {
          inherit system;
          modules = commonModules ++ [ ./hosts/control-plane/configuration.nix ];
        };

        worker = nixpkgs.lib.nixosSystem {
          inherit system;
          modules = commonModules ++ [ ./hosts/worker/configuration.nix ];
        };
      };
    };
}
