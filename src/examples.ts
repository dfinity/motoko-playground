import { RepoInfo, fetchGithub } from "./file";

export interface ExampleProject {
  repo: RepoInfo;
  readme?: string;
}

const example = {
  repo: "dfinity/examples",
  branch: "master",
};
const readmeURL = "https://raw.githubusercontent.com/dfinity/examples/master/motoko";

export const exampleProjects: Record<string, ExampleProject> = {
  "Hello, world": {
    repo: {dir: "motoko/echo/src", ...example},
    readme: `${readmeURL}/echo/README.md`,
  },
  "Counter": {
    repo: {dir: "motoko/counter/src", ...example},
    readme: `${readmeURL}/counter/README.md`,    
  },
  "Calculator": {
    repo: {dir: "motoko/calc/src", ...example},
    readme: `${readmeURL}/calc/README.md`,
  },
  "Who am I?": {
    repo: {dir: "motoko/whoami/src", ...example},
    readme: `${readmeURL}/whoami/README.md`,    
  },
  "Phone Book": {
    repo: {dir: "motoko/phone-book/src/phone-book", ...example},
    readme: `${readmeURL}/phone-book/README.md`,    
  },
  "Super Heroes": {
    repo: {dir: "motoko/superheroes/src/superheroes", ...example},
    readme: `${readmeURL}/superheroes/README.md`,
  },
  "Random Maze": {
    repo: {dir: "motoko/random_maze/src/random_maze", ...example},
    readme: `${readmeURL}/random_maze/README.md`,    
  },
  "Game of Life": {
    repo: {dir: "motoko/life", ...example},
    readme: `${readmeURL}/life/README.md`,    
  },
  "Publisher and Subscriber": {
    repo: {dir: "motoko/pub-sub/src", ...example},
    readme: `${readmeURL}/pub-sub/README.md`,
  },
};

export async function fetchExample(proj: ExampleProject) : Promise<Record<string, string>|undefined> {
  let files = await fetchGithub(proj.repo);
  if (files && proj.readme) {
    const content = await (await fetch(proj.readme)).text();
    files = { "README":content, ...files };
  }
  return files;
}
