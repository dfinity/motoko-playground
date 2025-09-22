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
- [Install mops-cli](https://github.com/chenyan2002/mops-cli/releases)
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

If you want to deploy frontend, remember to upload `assetstorage.wasm.gz` to the backend canister and update the module hash in `FrontendDeployModal`.

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
const PLAYGROUND_ORIGIN = 'https://play.motoko.org'
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

## Creating a custom playground with separate pool creation

As an alternative to a staging environment or the Motoko mainnet playground, the Motoko playground allows for custom, private playgrounds to be deployed. Using a custom playground allows for extensive customization, such as enabling access control by restricting the playground's usage to only allow certain principals, configuring more generous canister timeouts and the amount of available cycles, and allowing some (or all) of the function calls that the mainnet Motoko playground does not allow, such as sending cycles to other canisters. 

Using a custom playground can help simplify development for teams, since the whole team can use a custom playground without needing to manage individual cycle balances. To create a custom playground, **separate pool creation** can be used. 

### Clone the Motoko playground repo with the command:

```
git clone https://github.com/dfinity/motoko-playground
```

### To create a separate pool, first use the current Motoko playground pool and `wasm-utils` canisters as the starting point. 

These can be found [here](https://github.com/dfinity/motoko-playground/tree/main/service).

### Then, edit the `pool/Main.mo` file to  change your custom playground settings, such as:

- Add access control as desired, such as creating an `whitelist` of principals that are permitted to use the custom playground.

- Change the Wasm transformation to fit your desired configuration. In some cases, this may just be `wasm = args.wasm_module`, since if there is an `allowlist` in place, the principals allowed to install canisters can be trusted, such as:

```motoko
let wasm = args.wasm_module;
```

### Then deploy the pool canister, and if necessary, deploy the `wasm-utils` canister:

```
dfx deploy pool
dfx deploy wasm-utils
```

### Lastly, define the local playground network in your project's `dfx.json` file. In this definition, you will need to set the playground canister's ID (the `pool` canister ID) and define the amount of seconds before a canister is returned to the pool, as shown below:

```json
"<network name>": {
  "playground": {
    "playground_canister": "<canister pool id>",
    "timeout_seconds": <amount of seconds after which a canister is returned to the pool>
  },
  "providers": [
      "https://icp0.io"
  ]
}
```

If the value `<network name>` is set as `playground`, then the command `dfx deploy --playground` will deploy to your custom playground. Otherwise, the command has to use `--network <network name>`.
