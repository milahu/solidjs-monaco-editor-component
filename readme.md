# solidjs-monaco-editor-component

use [monaco-editor](https://github.com/microsoft/monaco-editor) in [solidjs](https://github.com/solidjs/solid)

## live demo

https://milahu.github.io/solidjs-monaco-editor-component/

## status

proof of concept

i needed this for [nixos-config-webui](https://github.com/milahu/nixos-config-webui/tree/master/frontend) ([call to MonacoEditor](https://github.com/milahu/nixos-config-webui/blob/03f4286ab76c3c946f0ae936299aec198d9df877/frontend/src/App.jsx#L590))

currently, this also includes [lezer-parser-nix](https://github.com/milahu/lezer-parser-nix) for syntax-highlighting of [nix](https://github.com/NixOS/nix) files.

for syntax-highlighting, i prefer the [lezer parser](https://github.com/lezer-parser/lezer), because it is more portable than the [tree-sitter parser](https://github.com/tree-sitter/node-tree-sitter), which requires WASM. `monaco-editor` does not support `lezer` or `tree-sitter` directly, so there is some glue code (adapter).

dependencies are managed as git submodules, because this makes development easier than `node_modules`. this means, after `git clone` you must run `npm install` in the submodules. probably there are better ways to do this (monorepo).

## usage

see [demo/src/App.jsx](demo/src/App.jsx)

## install

```sh
# use pnpm or yarn or npm
NPM=pnpm
if ! command -v $NPM >/dev/null 2>&1; then NPM=yarn; fi
if ! command -v $NPM >/dev/null 2>&1; then NPM=npm; fi

git clone https://github.com/milahu/solidjs-monaco-editor-component \
  --depth=1 --recurse-submodules
cd solidjs-monaco-editor-component

# build submodule
cd lezer-parser-nix
$NPM install
cd ..

$NPM install
$NPM run dev
```

## based on

- https://github.com/Menci/monaco-tree-sitter
