import { ExampleProject, FileContent } from "./types";

const counterReadme: FileContent = `
# Counter

This example demonstrates a counter application. It uses an [orthogonally
persistent](https://sdk.dfinity.org/docs/language-guide/motoko.html#_orthogonal_persistence)
[stable](https://sdk.dfinity.org/docs/language-guide/upgrades.html) \`counter\` variable to store an arbitrary precision natural number
that represents the current value of the counter.

## Introduction

The application provides an interface that exposes the following methods:

*  \`set\`, which sets the value of the counter;

*  \`inc\`, which increments the value of the counter; and

*  \`get\`, which gets the value of the counter.
`.trim()

const counterMain: FileContent = `
actor Counter {
	stable var counter = 0;

	// Get the value of the counter.
	public query func get() : async Nat {
		return counter;
	};
		
	// Set the value of the counter.
	public func set(n: Nat) {
		counter := n;
	};
	
	// Increment the value of the counter.
	public func inc() {
		counter += 1;
	};
};
`.trim();

const counterExampleProject: ExampleProject = {
    name: "Counter",
    directory: {
        "README": counterReadme,
        "Main.mo": counterMain,
    }
};

export default counterExampleProject;
