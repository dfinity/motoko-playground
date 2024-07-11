#!bash

# TODO: figure out import dependencies

$(dfx cache show)/moc $1 -o backend.wasm --release --idl --stable-types --public-metadata candid:service --package base $(dfx cache show)/base
