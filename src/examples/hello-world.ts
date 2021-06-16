import { ExampleProject, FileContent } from "./types";

const helloWorldExampleProjectReadme: FileContent = `
# Hello, world

This example demonstrates a canister called hello_world, which exports a method called main, which prints Hello World! to the console.
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