const { AssetManager } = require("@dfinity/assets");
const { HttpAgent } = require("@dfinity/agent");
const { Ed25519KeyIdentity } = require("@dfinity/identity");
const fs = require("fs");
const path = require("path");
const glob = require("glob");
const util = require("util");
const crypto = require("crypto");

const globPromise = util.promisify(glob);
const identity = Ed25519KeyIdentity.fromJSON(
  fs.readFileSync("./identity.json", "utf-8"),
);
const agent = HttpAgent.createSync({
  host: "https://icp-api.io", //"http://mylocalhost.com:4943",
  identity,
});
//agent.fetchRootKey();

async function upload(canisterId, asset_dirs) {
  const assetManager = new AssetManager({
    canisterId,
    agent,
  });
  const old = await assetManager.list();
  console.log(old);
  const batch = assetManager.batch();
  for (const asset_dir of asset_dirs.split(",")) {
    const files = await globPromise(`${asset_dir}/**/*`, { nodir: true });
    for (const file of files) {
      const fileName = path.relative(asset_dir, file);
      const contents = fs.readFileSync(file);
      const key = `/${fileName}`;
      const item = old.find((f) => f.key === key);
      if (item) {
        const hash = crypto.createHash("sha256").update(contents).digest();
        const encoding = item.encodings.find(
          (e) => e.content_encoding === "identity",
        );
        if (encoding && Buffer.from(encoding.sha256[0]).equals(hash)) {
          console.log(`Skip ${fileName}`);
          continue;
        } else {
          console.log(`Replace ${fileName}`);
          batch.delete(key);
        }
      } else {
        console.log(`Add ${fileName}`);
      }
      // TODO: pass in headers when supported
      await batch.store(contents, { fileName });
    }
  }
  await batch.commit();
}

if (process.argv.length !== 4) {
  console.error("Usage: node uploadAsset.js <canister_id> <asset_dir>");
  process.exit(1);
}
(async () => {
  const [, , canister_id, asset_dir] = process.argv;
  await upload(canister_id, asset_dir);
})();
