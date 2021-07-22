
declare var Motoko: any;

export interface PackageInfo {
  name: string,
  repo: string,
  version: string,
  dir?: string,
  dependencies?: Array<string>,
  description?: string,
  homepage?: string,
}

export interface RepoInfo {
  repo: string;
  branch: string;
  dir: string;
}

export async function fetchPackage(info: PackageInfo): Promise<boolean> {
  if (!info.repo.startsWith("https://github.com/") || !info.repo.endsWith(".git")) {
    return false;
  }
  const repo: RepoInfo = {
    repo: info.repo.slice(0, -4).replace(/^(https:\/\/github.com\/)/, ""),
    branch: info.version,
    dir: info.dir || "src",
  };
  const result = await fetchGithub(repo, info.name);
  if (result) {
    Motoko.addPackage(info.name, info.name + "/");
  }
  return result?true:false;
}

export async function fetchGithub(repo: RepoInfo, target_dir = "") : Promise<Record<string, string>|undefined> {
  const possiblyCDN = !((repo.branch.length % 2 === 0 && /^[A-F0-9]+$/i.test(repo.branch)) || repo.branch === "master" || repo.branch === "main");
  if (possiblyCDN) {
    const result = await fetchFromCDN(repo, target_dir);
    if (result) { return result; };
  }
  return await fetchFromGithub(repo, target_dir);
}

export function saveWorkplaceToMotoko(files: Record<string,string>) {
  for (const [name, code] of Object.entries(files)) {
    if (!name.endsWith('mo')) continue;
    Motoko.saveFile(name, code);
  }
}

async function fetchFromCDN(repo: RepoInfo, target_dir = "") : Promise<Record<string,string>|undefined> {
  const meta_url = `https://data.jsdelivr.com/v1/package/gh/${repo.repo}@${repo.branch}/flat`;
  const base_url = `https://cdn.jsdelivr.net/gh/${repo.repo}@${repo.branch}`;
  const response = await fetch(meta_url);
  const json = await response.json();
  if (!json.hasOwnProperty('files')) {
    return;
  }
  const promises: any[] = [];
  const files = {};
  for (const f of json.files) {
    if (f.name.startsWith(`/${repo.dir}/`) && /\.mo$/.test(f.name)) {
      const promise = (async () => {
        const content = await (await fetch(base_url + f.name)).text();
        const stripped = target_dir + f.name.slice(repo.dir?repo.dir.length + 1:0);
        Motoko.saveFile(stripped, content);
        files[stripped] = content;
      })();
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
  
async function fetchFromGithub(repo: RepoInfo, target_dir = "") : Promise<Record<string, string>|undefined> {
  const meta_url = `https://api.github.com/repos/${repo.repo}/git/trees/${repo.branch}?recursive=1`;
  const base_url = `https://raw.githubusercontent.com/${repo.repo}/${repo.branch}/`;
  const response = await fetch(meta_url);
  const json = await response.json();
  if (!json.hasOwnProperty('tree')) {
    return;
  }
  const promises: any[] = [];
  const files = {};
  for (const f of json.tree) {
    if (f.path.startsWith(repo.dir?`${repo.dir}/`:'') && f.type === 'blob' && /\.mo$/.test(f.path)) {
      const promise = (async () => {
        const content = await (await fetch(base_url + f.path)).text();
        const stripped = target_dir + (target_dir?'/':'') + f.path.slice(repo.dir?repo.dir.length + 1:0);
        Motoko.saveFile(stripped, content);
        files[stripped] = content;
      })();
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
