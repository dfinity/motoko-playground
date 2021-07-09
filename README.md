# Motoko Playground

Build and deploy Motoko canisters in browser

## Installation

```
npm install
dfx deploy --argument '(null)'
```

## Update Vessel package list

* Clone the package-set repo: https://github.com/dfinity/vessel-package-set
* `dhall resolve --file ./src/packages.dhall | dhall > normalized`
* `dhall-to-json --file normalized > src/config/package-set.json`
