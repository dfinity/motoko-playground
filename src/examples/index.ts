import helloWorld from "./hello-world";
import { ExampleProject } from "./types";
import firstExample from "./firstExample";
import counter from "./counter";
import calculator from "./calculator";
import phonebook from "./phone-book";
import todo from "./simple-to-do";
import whoami from "./whoami";

export const emptyProject: ExampleProject = {
    name: '',
    directory: {},
}

export const exampleProjects: ExampleProject[] = [
    firstExample,
    helloWorld,
    counter,
    calculator,
    phonebook,
    todo,
    whoami,
]
