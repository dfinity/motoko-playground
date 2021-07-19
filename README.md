# Motoko Playground

A playground for the Internet Computer's native Motoko language.

The Motoko playground allows users to build and deploy Motoko canisters directly in the browser,
without downloading SDK, setting up a local dev environment, and without a wallet.

The Motoko playground consists of

* its frontend, a web application served by the asset canister, which consists of the following components,
  + A Motoko compiler produced by `js-of-ocaml`.
  + A Monaco editor that supports Motoko syntax validation.
  + A Vessel package manager that loads libraries from the vessel package set.
  + A deploy module that integrates canister upgrade, actor class and Candid UI.
  + A code import module that allows to import any Motoko code from Github.
* its backend, a canister on the IC that controlls all canisters deployed by the users.
  + Each deployed canister has an initial cycle of 0.5T and is available for 10 minutes.
  + The deployed canister is not allowed to transfer cycles. The cycle transfer instruction will be removed by the backend at the Wasm level.
  + To ensure resource fairness, we require a proof of work when the user requests for a canister id.
  + [TODO] Deploy user owned canisters when users provide their own wallets
  + [TODO] Code sharing and storage

We plan on adding many more features to make playground a full featured web IDE for the Internet Computer.
Community contributions are highly welcomed!

## Running Locally

Prerequisites: dfx, npm, vessel, rust.

To run the Motoko playground locally, proceed as follows after cloning the respository.

```
npm install
dfx start [--clean] [--background]
dfx deploy --argument '(null)'
```

### Update Vessel package list

* Clone the package-set repo: https://github.com/dfinity/vessel-package-set
* `dhall resolve --file vessel-package-set/src/packages.dhall | dhall > /tmp/normalized`
* `dhall-to-json --file /tmp/normalized > motoko-playground/src/config/package-set.json`
