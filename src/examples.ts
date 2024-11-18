import { RepoInfo } from "./workers/file";

export interface ExampleProject {
  name: string;
  repo: RepoInfo;
  readme?: string;
}

const example = {
  repo: "dfinity/examples",
  branch: "master",
};
const readmeURL =
  "https://raw.githubusercontent.com/dfinity/examples/master/motoko";
const readmeArchiveURL =
  "https://raw.githubusercontent.com/dfinity/examples/master/archive/motoko";

export const exampleProjects: ExampleProject[] = [
  {
    name: "Hello, world",
    repo: { dir: "archive/motoko/echo/src", ...example },
    readme: `${readmeArchiveURL}/echo/README.md`,
  },
  {
    name: "Counter (full stack)",
    repo: { dir: "motoko/minimal-counter-dapp", ...example },
  },
  {
    name: "Who am I?",
    repo: { dir: "motoko/whoami/src", ...example },
    readme: `${readmeURL}/whoami/README.md`,
  },
  {
    name: "Super Heroes (full stack)",
    repo: { dir: "motoko/superheroes", ...example },
  },
  {
    name: "Random Maze (full stack)",
    repo: { dir: "motoko/random_maze", ...example },
  },
  {
    name: "Game of Life (full stack)",
    repo: { dir: "motoko/life", ...example },
  },
  {
    name: "Publisher and Subscriber",
    repo: { dir: "motoko/pub-sub/src", ...example },
    readme: `${readmeURL}/pub-sub/README.md`,
  },
  {
    name: "Actor Classes",
    repo: { dir: "motoko/classes/src", ...example },
    readme: `${readmeURL}/classes/README.md`,
  },
  {
    name: "Basic DAO",
    repo: { dir: "motoko/basic_dao/src", ...example },
    readme: `${readmeURL}/basic_dao/README.md`,
  },
  {
    name: "Http Outcall",
    repo: { dir: "motoko/send_http_get/src/send_http_get_backend", ...example },
    readme: `${readmeURL}/send_http_get/README.md`,
  },
  {
    name: "Threshold ECDSA",
    repo: {
      dir: "motoko/threshold-ecdsa/src/ecdsa_example_motoko",
      ...example,
    },
    readme: `${readmeURL}/threshold-ecdsa/README.md`,
  },
];

export async function fetchExample(
  worker,
  proj: ExampleProject,
): Promise<Record<string, string> | undefined> {
  let files = await worker.fetchGithub(proj.repo);
  if (files && proj.readme) {
    const content = await (await fetch(proj.readme)).text();
    files = { README: content, ...files };
  }
  files = rewritePackageJson(files);
  return files;
}

function rewritePackageJson(files: Record<string, string>) {
  // Find all package.json files in any directory
  Object.entries(files).forEach(([path, content]) => {
    if (path.endsWith("package.json")) {
      try {
        const json = JSON.parse(content);
        if (json.scripts) {
          // Remove dfx commands from scripts
          Object.entries(json.scripts).forEach(([key, value]) => {
            if (typeof value === "string" && value.startsWith("dfx")) {
              json.scripts[key] = "";
            }
          });
          files[path] = JSON.stringify(json, null, 2);
        }
      } catch (e) {
        console.warn(`Failed to parse package.json at ${path}:`, e);
      }
    }
  });
  return files;
}
