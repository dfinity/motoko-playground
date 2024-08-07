const { addBeforeLoader, loaderByName } = require("@craco/craco");
const webpack = require("webpack");

// Patch unsupported MD4 hash function for Node >= 17.x
const crypto = require("crypto");
const { createHash } = crypto;
crypto.createHash = (algorithm) =>
  createHash(algorithm === "md4" ? "sha256" : algorithm);

let canisterEnv;

function initCanisterIds() {
  let localCanisters, prodCanisters, canisters;
  try {
    localCanisters = require("./.dfx/local/canister_ids.json");
  } catch (error) {
    console.log("No local canister_ids.json found. Continuing production");
  }
  try {
    prodCanisters = require("./canister_ids.json");
  } catch (error) {
    console.log("No production canister_ids.json found. Continuing with local");
  }

  const localNetwork = "local";
  const network = process.env.DFX_NETWORK || localNetwork;

  canisters = network === localNetwork ? localCanisters : prodCanisters;

  for (const canister in canisters) {
    const canisterName = canister.toUpperCase() + "_CANISTER_ID";
    process.env[canisterName] = canisters[canister][network];
    canisterEnv = {
      ...canisterEnv,
      [canisterName]: canisters[canister][network],
    };
  }
}
initCanisterIds();

const overrideWebpackConfig = ({ webpackConfig }) => {
  webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
    (plugin) =>
      // Removes ModuleScopePlugin so `dfx-generated/` aliases work correctly
      !Object.keys(plugin).includes("appSrcs")
  );
  webpackConfig.plugins.push(new webpack.EnvironmentPlugin(canisterEnv));

  // Load WASM modules
  webpackConfig.resolve.extensions.push(".wasm");
  webpackConfig.module.rules.forEach((rule) => {
    (rule.oneOf || []).forEach((oneOf) => {
      if (oneOf.loader && oneOf.loader.indexOf("file-loader") >= 0) {
        oneOf.exclude.push(/\.wasm$/);
      }
    });
  });
  addBeforeLoader(webpackConfig, loaderByName("file-loader"), {
    test: /\.wasm$/,
    exclude: /node_modules/,
    loaders: ["wasm-loader"],
  });

  return webpackConfig;
};

module.exports = {
  plugins: [
    {
      plugin: { overrideWebpackConfig },
    },
    {
      // Fixes a Babel error encountered on Node 16.x / 18.x
      plugin: require("craco-babel-loader"),
      options: {
        includes: [
          /(\.dfx)/,
          /node_modules\/@noble/,
        ],
      },
    },
  ],
};
