import { ExampleProject, FileContent } from "./types";

const readme: FileContent = `
# Calculator

This example demonstrates a four-function calculator application. It uses an
[orthogonally persistent](https://sdk.dfinity.org/docs/language-guide/motoko.html#_orthogonal_persistence) \`cell\` variable to store an arbitrary precision integer
that represents the result of the most recent calculation.

## Introduction

The application provides an interface that exposes the following methods:

*  \`add\`, which accepts input and performs addition;

*  \`sub\`, which accepts input and performs subtraction;

*  \`mul\`, which accepts input and performs multiplication;

*  \`div\`, which accepts input, performs division, and returns an optional type
   to guard against division by zero; and

*  \`clearall\`, which clears the \`cell\` variable by setting its value to zero.
`.trim()

const main: FileContent = `
actor Calc {
	var cell : Int = 0;
  
	// Add.
	public func add(n : Int) : async Int {
	  cell += n;
	  return cell;
	};
  
	// Subtract.
	public func sub(n : Int) : async Int {
	  cell -= n;
	  return cell;
	};
  
	// Multiply.
	public func mul(n : Int) : async Int {
	  cell *= n;
	  return cell;
	};
  
	// Divide.
	public func div(n : Int) : async ?Int {
	  if (n == 0) {
		// 'null' encodes the division by zero error.
		return null;
	  } else {
		cell /= n;
		return ?cell;
	  };
	};
  
	// Clear the calculator and reset its cell to zero.
	public func clearall() : async () {
	  cell := 0;
	};
};
`.trim();

const exampleProject: ExampleProject = {
    name: "Calculator",
    directory: {
        "README": readme,
        "Main.mo": main,
    }
};

export default exampleProject;
