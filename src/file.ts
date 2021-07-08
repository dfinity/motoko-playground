import { WorkplaceState } from "./contexts/WorkplaceState";

declare var Motoko: any;

export interface PackageInfo {
  name: string,
  repo: string,
  version: string,
  dependencies?: Array<string>,
  description?: string,
  homepage?: string,
}

export async function fetchVesselPackageSet(tag = "latest") : Promise<Array<PackageInfo>> {
  const url = `https://github.com/dfinity/vessel-package-set/releases/download/${tag}/package-set.json`;
  const json = await (await fetch(url)).json();
  return json;
}

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

export async function fetchPackage(info: PackageInfo, dir = "src"): Promise<boolean> {
  const repo = info.repo.slice(0, -4).replace(/^(https:\/\/github.com\/)/, "");
  const branch = info.version;
  const result = await fetchGithub(repo, branch, dir, info.name);
  if (result) {
    Motoko.addPackage(info.name, info.name + "/");
  }
  return result?true:false;
}

export async function fetchGithub(repo, branch, dir, target_dir = "") : Promise<Record<string, string>|undefined> {
  const meta_url = `https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`;
  const base_url = `https://raw.githubusercontent.com/${repo}/${branch}/`;
  const response = await fetch(meta_url);
  const json = await response.json();
  if (!json.hasOwnProperty('tree')) {
    return;
  }
  const promises = [];
  const files = {};
  for (const f of json.tree) {
    if (f.path.startsWith(dir?`${dir}/`:'') && f.type === 'blob' && /\.mo$/.test(f.path)) {
      const promise = (async () => {
        const content = await (await fetch(base_url + f.path)).text();
        const stripped = target_dir + (target_dir?'/':'') + f.path.slice(dir?dir.length + 1:0);
        Motoko.saveFile(stripped, content);
        files[stripped] = content;
      })();
      // @ts-ignore
      promises.push(promise);
    }
  }
  if (!promises.length) {
    return;
  }
  return Promise.all(promises).then(() => {
    return files;
  });
}

export function saveWorkplaceToMotoko(state: WorkplaceState) {
  for (const [name, code] of Object.entries(state.files)) {
    if (!name.endsWith('mo')) continue;
    Motoko.saveFile(name, code);
  }
  const aliases: Array<[string, string]> = [];
  for (const [name, info] of Object.entries(state.canisters)) {
    aliases.push([name, info.id.toText()]);
  }
  Motoko.setActorAliases(aliases);
}
