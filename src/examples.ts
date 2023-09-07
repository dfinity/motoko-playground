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

export const exampleProjects: ExampleProject[] = [
  {
    name: "Hello, world",
    repo: { dir: "motoko/echo/src", ...example },
    readme: `${readmeURL}/echo/README.md`,
  },
  {
    name: "Counter",
    repo: { dir: "motoko/counter/src", ...example },
    readme: `${readmeURL}/counter/README.md`,
  },
  {
    name: "Calculator",
    repo: { dir: "motoko/calc/src", ...example },
    readme: `${readmeURL}/calc/README.md`,
  },
  {
    name: "Who am I?",
    repo: { dir: "motoko/whoami/src", ...example },
    readme: `${readmeURL}/whoami/README.md`,
  },
  {
    name: "Phone Book",
    repo: { dir: "motoko/phone-book/src/phone-book", ...example },
    readme: `${readmeURL}/phone-book/README.md`,
  },
  {
    name: "Super Heroes",
    repo: { dir: "motoko/superheroes/src/superheroes", ...example },
    readme: `${readmeURL}/superheroes/README.md`,
  },
  {
    name: "Random Maze",
    repo: { dir: "motoko/random_maze/src/random_maze", ...example },
    readme: `${readmeURL}/random_maze/README.md`,
  },
  {
    name: "Game of Life",
    repo: { dir: "motoko/life", ...example },
    readme: `${readmeURL}/life/README.md`,
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
];

export async function fetchExample(
  worker,
  proj: ExampleProject
): Promise<Record<string, string> | undefined> {
  let files = await worker.fetchGithub(proj.repo);
  if (files && proj.readme) {
    const content = await (await fetch(proj.readme)).text();
    files = { README: content, ...files };
  }
  return files;
}
