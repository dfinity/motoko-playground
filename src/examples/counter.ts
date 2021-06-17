import { ExampleProject, FileContent } from "./types";

const counterReadme: FileContent = `
# Counter

This example demonstrates a counter application. It uses an orthogonally persistent stable \`counter\` variable to store a natural number that represents the current value of the counter.

By using the Motoko keyword \`stable\` when declaring the \`counter\` variable,
the value of this variable will automatically be preserved whenever your canister code is
upgraded. Without the \`stable\` keyword, a variable is deemed \`flexible\`, and its value
is reinitialized on every canister upgrade, i.e. whenever new code is deployed to the canister.

To learn more about these features of Motoko, see:
* https://sdk.dfinity.org/docs/language-guide/motoko.html#_orthogonal_persistence
* https://sdk.dfinity.org/docs/language-guide/upgrades.html#_declaring_stable_variables

## Overview

The application provides an interface that exposes the following methods:

*  \`get\`, which gets the value of the counter by returning the value of the actor's private \`counter\` variable.

*  \`set\`, which sets the value of the counter by assigning a new value to the private \`counter\` variable.

*  \`inc\`, which increments the value of the counter by one

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
