import { loadMoc } from "./mocShim";

export interface PackageInfo {
  name: string;
  repo: string;
  version: string;
  dir?: string;
  dependencies?: Array<string>;
  description?: string;
  homepage?: string;
}

export interface RepoInfo {
  repo: string;
  branch: string;
  dir: string;
}

export async function fetchPackage(info: PackageInfo): Promise<boolean> {
  const Motoko = await loadMoc();
  if (
    !info.repo.startsWith("https://github.com/") ||
    !info.repo.endsWith(".git")
  ) {
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
  return result ? true : false;
}

export async function fetchGithub(
  repo: RepoInfo,
  target_dir = "",
): Promise<Record<string, string | Uint8Array> | undefined> {
  const possiblyCDN = !(
    (repo.branch.length % 2 === 0 && /^[A-F0-9]+$/i.test(repo.branch)) ||
    repo.branch === "master" ||
    repo.branch === "main"
  );
  if (possiblyCDN) {
    const result = await fetchFromCDN(repo, target_dir);
    if (result) {
      return result;
    }
  }
  return await fetchFromGithub(repo, target_dir);
}

export async function saveWorkplaceToMotoko(files: Record<string, string>) {
  const Motoko = await loadMoc();
  for (const [name, code] of Object.entries(files)) {
    if (!name.endsWith("mo")) continue;
    Motoko.saveFile(name, code);
  }
}

const isValidFile = (path: string) => {
  const validFiles =
    /\.(mo|md|js|ts|json|txt|png|jpg|jpeg|gif|svg|ico|css|html|tsx|jsx)$/;
  return validFiles.test(path); // && !path.includes("/declarations/");
};
const isBinaryFile = (path: string) => {
  const binaryFiles = /\.(png|jpg|jpeg|gif|ico|wasm)$/;
  return binaryFiles.test(path);
};

async function fetchFromCDN(
  repo: RepoInfo,
  target_dir = "",
): Promise<Record<string, string | Uint8Array> | undefined> {
  const Motoko = await loadMoc();
  const meta_url = `https://data.jsdelivr.com/v1/package/gh/${repo.repo}@${repo.branch}/flat`;
  const base_url = `https://cdn.jsdelivr.net/gh/${repo.repo}@${repo.branch}`;
  const response = await fetch(meta_url);
  const json = await response.json();
  if (!json.hasOwnProperty("files")) {
    return;
  }
  const promises: any[] = [];
  const files = {};
  for (const f of json.files) {
    if (f.name.startsWith(`/${repo.dir}/`) && isValidFile(f.name)) {
      const promise = (async () => {
        const response = await fetch(base_url + f.name);
        const stripped =
          target_dir + f.name.slice(repo.dir ? repo.dir.length + 1 : 0);
        let content: string | Uint8Array;
        if (isBinaryFile(f.name)) {
          content = new Uint8Array(await response.arrayBuffer());
        } else {
          content = await response.text();
          if (f.name.endsWith(".mo")) {
            Motoko.saveFile(stripped, content);
          }
        }
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

async function fetchFromGithub(
  repo: RepoInfo,
  target_dir = "",
): Promise<Record<string, string | Uint8Array> | undefined> {
  const Motoko = await loadMoc();
  const meta_url = `https://api.github.com/repos/${repo.repo}/git/trees/${repo.branch}?recursive=1`;
  const base_url = `https://raw.githubusercontent.com/${repo.repo}/${repo.branch}/`;
  const response = await fetch(meta_url);
  const json = await response.json();
  if (!json.hasOwnProperty("tree")) {
    return;
  }
  const promises: any[] = [];
  const files = {};
  for (const f of json.tree) {
    if (
      f.path.startsWith(repo.dir ? `${repo.dir}/` : "") &&
      f.type === "blob" &&
      isValidFile(f.path)
    ) {
      const promise = (async () => {
        const response = await fetch(base_url + f.path);
        const stripped =
          target_dir +
          (target_dir ? "/" : "") +
          f.path.slice(repo.dir ? repo.dir.length + 1 : 0);
        let content: string | Uint8Array;
        if (isBinaryFile(f.path)) {
          content = new Uint8Array(await response.arrayBuffer());
        } else {
          content = await response.text();
          if (f.path.endsWith(".mo")) {
            Motoko.saveFile(stripped, content);
          }
        }
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
