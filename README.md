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
  - Each deployed canister has an initial cycle of 0.5T and is available for 20 minutes.
  - To avoid wasting cycles, the deployed canister is not allowed to transfer cycles. The cycle transfer instructions will be removed by the backend at the Wasm level.
  - To ensure resource fairness, we require a proof of work when the user requests for a canister id.

We plan on adding many more features to make playground a full-featured web IDE for the Internet Computer. See our [issues](https://github.com/dfinity/motoko-playground/issues) for more details. Community contributions are highly welcomed!

## Running Locally

### Prerequisites:

- [Install Internet Computer SDK](https://sdk.dfinity.org/docs/quickstart/local-quickstart.html)
- [Install npm](https://nodejs.org/en/download/)
- [Install mops](https://mops.one/docs/install)
  ```
  npm i -g ic-mops
  ```
- [Install Rust](https://www.rust-lang.org/tools/install)
- Add wasm32 target to Rust
  ```
  rustup target add wasm32-unknown-unknown
  ```

### To run the Motoko Playground locally, proceed as follows after cloning the respository:

```sh
npm install # Install `npm` dependencies
npm start # Run the local development server
```

### Deploy the Motoko Playground to your local replica using the following command:

```sh
dfx deploy
```

### npm audit warnings

Vulnerabilities from dev dependencies are false positives, we only aim to fix warnings from `npm audit --production`.

### Update Vessel package list

- Clone the package-set repo: https://github.com/dfinity/vessel-package-set
- Make sure [`dhall` and `dhall-to-json` are installed](https://docs.dhall-lang.org/tutorials/Getting-started_Generate-JSON-or-YAML.html#os-x) with `apt` or `brew`
- `dhall-to-json --file vessel-package-set/src/packages.dhall > motoko-playground/src/config/package-set.json`

## Editor Integrations

The Motoko Playground supports
limited [cross-origin communication](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage). If you are
building a custom smart contract editor or similar application, you can use the following code snippet to open a project in Motoko Playground:

```js
const PLAYGROUND_ORIGIN = 'https://m7sm4-2iaaa-aaaab-qabra-cai.raw.ic0.app'
const APP_ID = 'MyEditor'

// Workplace files for a project
const userFiles = {
  'Main.mo': 'actor { public func hello() : async Text { "Hello World" } }'
}

// GitHub package dependencies for a project
const userPackages = [{
  name: 'quicksort',
  repo: 'https://github.com/dfinity/examples.git',
  version: 'master',
  dir: 'motoko/quicksort/src'
}]

// Open the Motoko Playground in a new window
const playground = window.open(`${PLAYGROUND_ORIGIN}?post=${APP_ID}`, 'playground')

// Call repeatedly until loaded (interval ID used for acknowledgement)
const ack = setInterval(() => {
  const request = {
    type: 'workplace',
    acknowledge: ack,
    packages: userPackages,
    actions: [{
      type: 'loadProject',
      payload: {
        files: userFiles
      }
    }],
    deploy: true
  }
  // Concatenate APP_ID and request JSON
  const data = APP_ID + JSON.stringify(request)
  console.log('Request data:', data)
  playground.postMessage(data, PLAYGROUND_ORIGIN)
}, 1000)

// Listen for acknowledgement
const responseListener = ({source, origin, data}) => {
  if(
          typeof data === 'string' &&
          data.startsWith(APP_ID) &&
          source === playground &&
          origin === PLAYGROUND_ORIGIN
  ) {
    console.log('Response data:', data)
    // Parse JSON part of message (prefixed by APP_ID)
    const response = JSON.parse(data.substring(APP_ID.length))
    if(response.acknowledge === ack) {
      clearInterval(ack)
      window.removeEventListener('message', responseListener)
    }
  }
}
window.addEventListener('message', responseListener)
```

Note: this works for `localhost`out of the box. If you would like to use this feature in production, please submit a PR
adding your application's public URL to [`src/integrations/allowedOrigins.js`](src/integrations/allowedOrigins.js).

