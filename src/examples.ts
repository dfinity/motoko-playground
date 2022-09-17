import { RepoInfo } from "./workers/file";

export interface ExampleProject {
  repo: RepoInfo;
  readme?: string;
  dfxJson?: string;
}

const example = {
  repo: "dfinity/examples",
  branch: "master",
};
const readmeURL =
  "https://raw.githubusercontent.com/dfinity/examples/master/motoko";

export const exampleProjects: Record<string, ExampleProject> = {
  "Hello, world": {
    repo: { dir: "motoko/echo/src", ...example },
    readme: `${readmeURL}/echo/README.md`,
    dfxJson: `${readmeURL}/echo/dfx.json`,
  },
  Counter: {
    repo: { dir: "motoko/counter/src", ...example },
    readme: `${readmeURL}/counter/README.md`,
    dfxJson: `${readmeURL}/counter/dfx.json`,
  },
  Calculator: {
    repo: { dir: "motoko/calc/src", ...example },
    readme: `${readmeURL}/calc/README.md`,
    dfxJson: `${readmeURL}/calc/dfx.json`,
  },
  "Who am I?": {
    repo: { dir: "motoko/whoami/src", ...example },
    readme: `${readmeURL}/whoami/README.md`,
    dfxJson: `${readmeURL}/whoami/dfx.json`,
  },
  "Phone Book": {
    repo: { dir: "motoko/phone-book/src/phone-book", ...example },
    readme: `${readmeURL}/phone-book/README.md`,
    dfxJson: `${readmeURL}/phone-book/dfx.json`,
  },
  "Super Heroes": {
    repo: { dir: "motoko/superheroes/src/superheroes", ...example },
    readme: `${readmeURL}/superheroes/README.md`,
    dfxJson: `${readmeURL}/superheores/dfx.json`,
  },
  "Random Maze": {
    repo: { dir: "motoko/random_maze/src/random_maze", ...example },
    readme: `${readmeURL}/random_maze/README.md`,
    dfxJson: `${readmeURL}/random_maze/dfx.json`,
  },
  "Game of Life": {
    repo: { dir: "motoko/life", ...example },
    readme: `${readmeURL}/life/README.md`,
    dfxJson: `${readmeURL}/life/dfx.json`,
  },
  "Publisher and Subscriber": {
    repo: { dir: "motoko/pub-sub/src", ...example },
    readme: `${readmeURL}/pub-sub/README.md`,
    dfxJson: `${readmeURL}/pub-sub/dfx.json`,
  },
  "Actor Classes": {
    repo: { dir: "motoko/classes/src", ...example },
    readme: `${readmeURL}/classes/README.md`,
    dfxJson: `${readmeURL}/classes/dfx.json`,
  },
};

export async function fetchExample(
  worker,
  proj: ExampleProject
): Promise<Record<string, string> | undefined> {
  let files = await worker.fetchGithub(proj.repo);
  if (files) {
    if (proj.readme) {
      const content = await (await fetch(proj.readme)).text();
      files = { README: content, ...files };
    }
    if (proj.dfxJson) {
      const content = await (await fetch(proj.dfxJson)).text();
      files = { "dfx.json": content, ...files };
    }
  }
  return files;
}
