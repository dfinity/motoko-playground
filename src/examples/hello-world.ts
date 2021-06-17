import { ExampleProject, FileContent } from "./types";

const helloWorldExampleProjectReadme: FileContent = `
# Hello, world

This example demonstrates a canister called hello_world, which exports a method called main, which prints Hello World! to the console.

The example consists of a single file, \`Main.mo\`.

The first line imports the Debug module from the Motoko Base Library.
This provides a \`print\` method that can be used to print to the console, which can
be useful for debugging.

See:
* https://sdk.dfinity.org/docs/language-guide/modules-and-imports.html#_importing_from_the_motoko_base_library
* https://sdk.dfinity.org/docs/base-libraries/debug

Next, the file declares a single \`actor\`:
> An actor is similar to an object, but is different in that its state is completely isolated, its interactions with the world are entirely through asynchronous messaging, and its messages are processed one-at-a-time, even when issued in parallel by concurrent actors.

For more on Motoko Actors, read:
* https://sdk.dfinity.org/docs/language-guide/actors-async.html

This actor makes available a single, public function named \`main\`.
When called, this function makes use of the \`Debug.print\` method imported at the top of the file,
which logs a string to the console.
`.trim()

const helloWorldMainFileContents: FileContent = `
import Debug "mo:base/Debug"

actor HelloWorld {
	public func main() {
		Debug.print("Hello World!")
	}
}
`.trim();

const helloWorldExampleProject: ExampleProject = {
    name: "Hello, world",
    directory: {
			"README": helloWorldExampleProjectReadme,
			"Main.mo": helloWorldMainFileContents,
    }
}

export default helloWorldExampleProject