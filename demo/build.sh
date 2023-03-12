#! /usr/bin/env bash

# chdir to project root
cd "$(dirname "$0")"/..

set -e

# use pnpm or yarn or npm
NPM=pnpm
if ! command -v $NPM >/dev/null 2>&1; then NPM=yarn; fi
if ! command -v $NPM >/dev/null 2>&1; then NPM=npm; fi

cd lezer-parser-nix
#git clean -fxd
$NPM install
# build is called by install
#$NPM run build
cd ..

$NPM install

cd demo
$NPM install
$NPM run build
