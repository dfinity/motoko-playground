import helloWorld from "./hello-world";
import { ExampleProject } from "./types";
import counter from "./counter";
import calculator from "./calculator";
import phonebook from "./phone-book";
import todo from "./simple-to-do";
import whoami from "./whoami";

export const emptyProject: ExampleProject = {
    name: 'Empty Project',
    directory: {
        "Main.mo": "",
    },
}

export const exampleProjects: ExampleProject[] = [
    helloWorld,
    counter,
    calculator,
    phonebook,
    todo,
    whoami,
];

/**
 * Select the first file to show when loading a project.
 * If there is a README, use that.
 * If no best file can be determined, choose one at random.
 * If there are no files, return null
 */
export function selectFirstFile(project: ExampleProject): string | null {
    const files = project.directory;
    if ('README' in files) {
        return 'README'
    }
    const fileNames = Object.keys(files);
    if (fileNames.length > 0) { return fileNames[0]; }
    return null;
}

/**
 * Given project files, return a subset that should be shown to end-users
 * of the Motoko Playground.
 * e.g. no 'dfx.json'
 */
export function withOnlyUserVisibleFiles(files: ExampleProject['directory']): ExampleProject['directory'] {
    const entries = Object.entries(files);
    return Object.fromEntries(entries.filter(([path, value]) => {
        if (path === 'dfx.json') { return false; }
        return true;
    }));
}
