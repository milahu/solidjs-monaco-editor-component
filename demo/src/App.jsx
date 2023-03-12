//import logo from './logo.svg';
import styles from './App.module.css';

import MonacoEditor from '../../MonacoEditor.jsx'

const value = `\
# xclip.nix
# https://github.com/NixOS/nixpkgs/blob/master/pkgs/tools/misc/xclip/default.nix

{ lib
, stdenv
, fetchFromGitHub
, autoreconfHook
, libXmu
}:

stdenv.mkDerivation rec {
  pname = "xclip";
  version = "0.13";

  src = fetchFromGitHub {
    owner = "astrand";
    repo = "xclip";
    rev = version;
    sha256 = "0q0hmvcjlv8arhh1pzhja2wglyj6n7z209jnpnzd281kqqv4czcs";
  };

  nativeBuildInputs = [ autoreconfHook ];

  buildInputs = [ libXmu ];

  meta = {
    description = "Tool to access the X clipboard from a console application";
    homepage = "https://github.com/astrand/xclip";
    license = lib.licenses.gpl2;
    platforms = lib.platforms.all;
  };
}
`

function App() {
  return (
    <div class={styles.App} style=" ">
      {
        // header
      }
      <div>
        live demo for <a href="https://github.com/milahu/solidjs-monaco-editor-component">solidjs-monaco-editor-component</a>
      </div>
      {
        // main
      }
      <div class={styles.editor}>
        <MonacoEditor
          options={{
            value,
            minimap: {
              enabled: false,
            },
          }}
        />
      </div>
      {
        // footer
      }
      <div>
        some footer
      </div>
    </div>
  );
}

export default App;
