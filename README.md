# Motoko Playground

A playground for the Internet Computer's native Motoko language.

## Installation

Prerequisites: dfx, npm, vessel

```
npm install
dfx deploy --argument '(null)'
```

## Update Vessel package list

* Clone the package-set repo: https://github.com/dfinity/vessel-package-set
* `dhall resolve --file vessel-package-set/src/packages.dhall | dhall > /tmp/normalized`
* `dhall-to-json --file /tmp/normalized > motoko-playground/src/config/package-set.json`
