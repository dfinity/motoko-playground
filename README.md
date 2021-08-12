# Motoko Playground

A playground for the Internet Computer's native Motoko language.

The Motoko playground allows users to build and deploy Motoko canisters directly in the browser,
without downloading SDK, setting up a local dev environment, and without a wallet.

The Motoko playground consists of

- its frontend, a web application served by the asset canister, which consists of the following components,
  - A Motoko compiler produced by `js-of-ocaml`.
  - A Monaco editor that supports Motoko syntax validation.
  - A Vessel package manager that loads libraries from the vessel package set.
  - A deploy module that integrates canister upgrade, actor class and Candid UI.
  - A code import module that allows to import any Motoko code from Github.
- its backend, a canister on the IC that controlls all canisters deployed by the users.
  - Each deployed canister has an initial cycle of 0.5T and is available for 10 minutes.
  - To avoid wasting cycles, the deployed canister is not allowed to transfer cycles. The cycle transfer instructions will be removed by the backend at the Wasm level.
  - To ensure resource fairness, we require a proof of work when the user requests for a canister id.

We plan on adding many more features to make playground a full-featured web IDE for the Internet Computer. See our [issues](https://github.com/dfinity/motoko-playground/issues) for more details. Community contributions are highly welcomed!

## Running Locally

### Prerequisites:

- [Install Internet Computer SDK](https://sdk.dfinity.org/docs/quickstart/local-quickstart.html)
- [Install npm](https://nodejs.org/en/download/)
- [Install Vessel](https://github.com/dfinity/vessel/releases)
  - Download the latest release to your `/usr/local/bin` folder
  - Rename from `vessel-{platform}` to `vessel`
  - Run `chmod +x /usr/local/bin/vessel`
- [Install Rust](https://www.rust-lang.org/tools/install)
- Add wasm32 target to Rust
  ```
  rustup target add wasm32-unknown-unknown
  ```
- Install binaryen

  ```
  apt install binaryen

  #OR

  brew install binaryen
  ```

### To run the Motoko playground locally, proceed as follows after cloning the respository.

```
npm install
dfx start [--clean] [--background]
dfx deploy --argument '(null)'
```

### Update Vessel package list

- Clone the package-set repo: https://github.com/dfinity/vessel-package-set
- Make sure [`dhall` and `dhall-to-json` are installed](https://docs.dhall-lang.org/tutorials/Getting-started_Generate-JSON-or-YAML.html#os-x) with `apt` or `brew`
- `dhall resolve --file vessel-package-set/src/packages.dhall | dhall > /tmp/normalized`
- `dhall-to-json --file /tmp/normalized > motoko-playground/src/config/package-set.json`
