const { AssetManager } = require("@dfinity/assets");
const { HttpAgent } = require("@dfinity/agent");
const { Ed25519KeyIdentity } = require("@dfinity/identity");
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const util = require("util");

const globPromise = util.promisify(glob);
//const identity = Ed25519KeyIdentity.fromJSON(fs.readFileSync('./identity.json', 'utf-8'));
const agent = HttpAgent.createSync({
  host: "https://icp-api.io", //"http://mylocalhost.com:4943",
  //identity,
});
//agent.fetchRootKey();
const assetManager = new AssetManager({
  canisterId: "m7sm4-2iaaa-aaaab-qabra-cai",
  agent,
});

async function upload(asset_dir) {
  const old = await assetManager.list();
  console.log(old);
  const batch = assetManager.batch();
  const files = await globPromise(`${asset_dir}/**/*`);
  for (const file of files) {
    const relativePath = path.relative(asset_dir, file);
    const fileName = `/${relativePath}`;
    const contents = fs.readFileSync(file);
    console.log(fileName);
    await batch.store(contents, { fileName });
  }
  await batch.commit();
}

if (process.argv.length < 3) {
  console.error("Usage: node uploadAsset.js <asset_dir>");
  process.exit(1);
}
(async () => {
  const [, , asset_dir] = process.argv;
  await upload(asset_dir);
})();
