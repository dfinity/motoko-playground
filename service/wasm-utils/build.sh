#!/bin/bash

cargo build --target wasm32-unknown-unknown --release --package wasm-utils
wasm-opt --strip-debug target/wasm32-unknown-unknown/release/wasm_utils.wasm -o target/wasm32-unknown-unknown/release/wasm_opt.wasm