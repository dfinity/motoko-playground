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
const examplesURL =
  "https://raw.githubusercontent.com/dfinity/examples/master/motoko";

export const exampleProjects: Record<string, ExampleProject> = {
  "Hello, world": {
    repo: { dir: "motoko/echo/src", ...example },
    readme: `${examplesURL}/echo/README.md`,
  },
  Counter: {
    repo: { dir: "motoko/counter/src", ...example },
    readme: `${examplesURL}/counter/README.md`,
  },
  Calculator: {
    repo: { dir: "motoko/calc/src", ...example },
    readme: `${examplesURL}/calc/README.md`,
  },
  "Who am I?": {
    repo: { dir: "motoko/whoami/src", ...example },
    readme: `${examplesURL}/whoami/README.md`,
  },
  "Phone Book": {
    repo: { dir: "motoko/phone-book/src/phone-book", ...example },
    readme: `${examplesURL}/phone-book/README.md`,
  },
  "Super Heroes": {
    repo: { dir: "motoko/superheroes/src/superheroes", ...example },
    readme: `${examplesURL}/superheroes/README.md`,
  },
  "Random Maze": {
    repo: { dir: "motoko/random_maze/src/random_maze", ...example },
    readme: `${examplesURL}/random_maze/README.md`,
    // dfxJson: `${examplesURL}/random_maze/dfx.json`,
  },
  "Game of Life": {
    repo: { dir: "motoko/life", ...example },
    readme: `${examplesURL}/life/README.md`,
    dfxJson: `${examplesURL}/life/dfx.json`,
  },
  "Publisher and Subscriber": {
    repo: { dir: "motoko/pub-sub", ...example },
    readme: `${examplesURL}/pub-sub/README.md`,
    dfxJson: `${examplesURL}/pub-sub/dfx.json`,
  },
  "Actor Classes": {
    repo: { dir: "motoko/classes", ...example },
    readme: `${examplesURL}/classes/README.md`,
    dfxJson: `${examplesURL}/classes/dfx.json`,
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
