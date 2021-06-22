// map filepath to code session { state, model }
export const files = {};
export var current_session_name = "main.mo";
export const filetab = document.createElement("div");

declare var Motoko: any;

export async function addPackage(name, repo, version, dir, logger) {
  const meta_url = `https://data.jsdelivr.com/v1/package/gh/${repo}@${version}/flat`;
  const base_url = `https://cdn.jsdelivr.net/gh/${repo}@${version}`;
  const response = await fetch(meta_url);
  const json = await response.json();
  const promises = [];
  const fetchedFiles = [];
  for (const f of json.files) {
    if (f.name.startsWith(`/${dir}/`) && /\.mo$/.test(f.name)) {
      const promise = (async () => {
        const content = await (await fetch(base_url + f.name)).text();
        const stripped = name + f.name.slice(dir.length + 1);
        // @ts-ignore
        fetchedFiles.push(stripped);
        Motoko.saveFile(stripped, content);
      })();
      // @ts-ignore
      promises.push(promise);
    }
  }
  Promise.all(promises).then(() => {
    Motoko.addPackage(name, name + "/");
    logger.log(`Package ${name} loaded (${promises.length} files).`);
    // const content = [
    //   `// Fetched from ${repo}@${version}/${dir}`,
    //   // @ts-ignore
    //   ...fetchedFiles.map((s) => `mo:${s.slice(0, -3)}`),
    // ].join("\n");
  });
}

export function saveWorkplaceToMotoko(workplace = {}) {
  for (const [name, code] of Object.entries(workplace)) {
    if (!name.endsWith('mo')) continue;
    // @ts-ignore
    Motoko.saveFile(name, code);
  }
  // const aliases = [];
  // for (const [name, id] of Object.entries(canister)) {
  //   // @ts-ignore
  //   aliases.push([name, id.toText()]);
  // }
  // Motoko.setActorAliases(aliases);
}
