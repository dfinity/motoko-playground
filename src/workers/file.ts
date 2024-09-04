import { loadMoc } from "./mocShim";

interface ExtraFile {
  match: RegExp;
  resolveName(results: RegExpExecArray): string;
}

const extraFiles: ExtraFile[] = [
  {
    match: /^readme\.md$/i,
    resolveName: () => "README",
  },
];

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
  target_dir = ""
): Promise<Record<string, string> | undefined> {
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

async function fetchFromCDN(
  repo: RepoInfo,
  target_dir = ""
): Promise<Record<string, string> | undefined> {
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
    const extraFileName = extraFiles.flatMap(({ match, resolveName }) => {
      const results = match.exec(f.path);
      return results ? [resolveName(results)] : [];
    })[0];
    if (
      f.name.startsWith(`/${repo.dir}/`) &&
      (extraFileName || /\.mo$/i.test(f.name))
    ) {
      const promise = (async () => {
        const content = await (await fetch(base_url + f.name)).text();
        const stripped =
          extraFileName ||
          target_dir + f.name.slice(repo.dir ? repo.dir.length + 1 : 0);
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

async function fetchFromGithub(
  repo: RepoInfo,
  target_dir = ""
): Promise<Record<string, string> | undefined> {
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
    const extraFileName = extraFiles.flatMap(({ match, resolveName }) => {
      const results = match.exec(f.path);
      return results ? [resolveName(results)] : [];
    })[0];
    if (
      f.path.startsWith(repo.dir ? `${repo.dir}/` : "") &&
      f.type === "blob" &&
      (extraFileName || /\.mo$/i.test(f.path))
    ) {
      const promise = (async () => {
        const content = await (await fetch(base_url + f.path)).text();
        const stripped =
          extraFileName ||
          target_dir +
            (target_dir ? "/" : "") +
            f.path.slice(repo.dir ? repo.dir.length + 1 : 0);
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
