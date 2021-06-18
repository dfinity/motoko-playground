import { ExampleProject, FileContent } from "./types";

const readme: FileContent = `
# Calculator

This example demonstrates a four-function calculator application. It uses an
orthogonally persistent \`cell\` variable to store an arbitrary precision integer
that represents the result of the most recent calculation.

## Overview

The application provides an interface that exposes the following methods:

*  \`add\`, which accepts input and performs addition

*  \`sub\`, which accepts input and performs subtraction

*  \`mul\`, which accepts input and performs multiplication

*  \`div\`, which accepts input, performs division, and returns an optional type to guard against division by zero
  * For more on Option types, see:
	* Motoko Base Library functions for woring with Option types: https://sdk.dfinity.org/docs/base-libraries/option
	* https://sdk.dfinity.org/docs/language-guide/errors.html#_error_reporting_with_option

*  \`clearall\`, which clears the \`cell\` variable by setting its value to zero.

Many of these methods modify the \`cell: Int\` using operators documented at https://sdk.dfinity.org/docs/developers-guide/basic-syntax-rules.html#_numbers_text_and_operators.

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
