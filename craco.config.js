const { addBeforeLoader, loaderByName } = require('@craco/craco');
const generateAliases = require("./src/config/generateAliases");
const path = require("path");
const webpack = require("webpack");

const aliases = generateAliases();

let canisterEnv;

function initCanisterIds() {
  let localCanisters, prodCanisters, canisters;
  try {
    localCanisters = require(path.resolve(
      ".dfx",
      "local",
      "canister_ids.json"
    ));
  } catch (error) {
    console.log("No local canister_ids.json found. Continuing production");
  }
  try {
    prodCanisters = require(path.resolve("canister_ids.json"));
  } catch (error) {
    console.log("No production canister_ids.json found. Continuing with local");
  }

  const network = process.env.DFX_NETWORK;

  canisters = network === "local" ? localCanisters : prodCanisters;

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
  webpackConfig.resolve.alias = { ...webpackConfig.resolve.alias, ...aliases };
  webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
    (plugin) =>
      // Removes ModuleScopePlugin so `dfx-generated/` aliases work correctly
      !Object.keys(plugin).includes("appSrcs")
  );
  webpackConfig.plugins = [
    ...webpackConfig.plugins,
    new webpack.EnvironmentPlugin(canisterEnv),
  ];

  // Load WASM modules
  webpackConfig.resolve.extensions.push('.wasm');
  webpackConfig.module.rules.forEach((rule) => {
    (rule.oneOf || []).forEach((oneOf) => {
      if (oneOf.loader && oneOf.loader.indexOf('file-loader') >= 0) {
        oneOf.exclude.push(/\.wasm$/);
      }
    });
  });
  addBeforeLoader(webpackConfig, loaderByName('file-loader'), {
    test: /\.wasm$/,
    exclude: /node_modules/,
    loaders: ['wasm-loader'],
  });

  return webpackConfig;
};

module.exports = {
  plugins: [{
    plugin: { overrideWebpackConfig }
  }, {
    // Fixes a Babel error encountered on Node 16.x / 18.x
    plugin: require("craco-babel-loader"),
    options: {
      includes: [/(\.dfx)/],
    }
  }],
};
