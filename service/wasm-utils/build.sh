#!/bin/bash

set -e

if [ "$SKIP_WASM" == "true" ];
then
  mkdir -p target/wasm32-unknown-unknown/release
  echo -n -e '\x00\x61\x73\x6d\x01\x00\x00\x00' > target/wasm32-unknown-unknown/release/wasm_utils.wasm
  echo "skip"
else
  cargo build --target wasm32-unknown-unknown --release --package wasm-utils
fi
