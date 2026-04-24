{ pkgs ? import (fetchTarball "https://github.com/NixOS/nixpkgs/archive/1d0d45860e228238021fa8195ab62d04595e629d.tar.gz") {} }:

pkgs.mkShell {
    buildInputs = [ pkgs.hugo pkgs.nur.repos.hutzdog.lmt ];

    shellHook = ''
      echo Nix Development Shell
    '';
}
