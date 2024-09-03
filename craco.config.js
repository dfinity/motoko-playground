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

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Remove ModuleScopePlugin
      webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
        (plugin) => !Object.keys(plugin).includes("appSrcs")
      );

      // Add EnvironmentPlugin
      webpackConfig.plugins.push(new webpack.EnvironmentPlugin(canisterEnv));

      // Configure WASM loading
      webpackConfig.experiments = {
        asyncWebAssembly: true,
      };
      // Add rule for WASM files
      webpackConfig.module.rules.push({
        test: /\.wasm$/,
        type: "webassembly/async",
      });
      // Configure Worker loading with comlink-loader
      webpackConfig.module.rules.push({
        test: /\.worker\.(js|ts)$/,
        use: [
          {
            loader: 'comlink-loader-webpack5',
            options: {
              singleton: true,
            },
          },
        ],
      });

      return webpackConfig;
    },
  },
};
