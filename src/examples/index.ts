import helloWorld from "./hello-world";
import { ExampleProject } from "./types";
import firstExample from "./firstExample";
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
    firstExample,
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
