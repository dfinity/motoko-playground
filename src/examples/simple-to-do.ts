import { ExampleProject, FileContent } from "./types";

const readme: FileContent = `
# Simple To-Do

This example illustrates how to create a simple to-do checklist application.

## Introduction

The application is built from the following Motoko source code files:

*  \`Main.mo\`, which contains the actor definition and methods exposed by this
   canister.
  * this file accesses values from the \`module\` declarations in the other files via \`import\` declaration. For more on modules and imports, see https://sdk.dfinity.org/docs/language-guide/modules-and-imports.html#_importing_local_files

*  \`Utils.mo\`, which contains the core functions for adding, completing, and
   removing to-do checklist items;
  * Several of these utility functions make use of methods on the \`Array\` module from the Motoko Base Library, which is documented at https://sdk.dfinity.org/docs/base-libraries/array

*  \`Types.mo\`, which contains the type definition of a to-do checklist item;
   and

`.trim()

const main: FileContent = `
import Types "Types";
import Utils "Utils";

// Define the actor
actor Assistant {

  type ToDo = Types.ToDo;

  var todos : [ToDo] = [];
  var nextId : Nat = 1;

  public query func getTodos() : async [ToDo] {
    return todos;
  };

  public func addTodo(description : Text) : async () {
    todos := Utils.add(todos, description, nextId);
    nextId += 1;
  };

  public func completeTodo(id : Nat) : async () {
    todos := Utils.complete(todos, id);
  };

  public query func showTodos() : async Text {
    return Utils.show(todos);
  };

  public func clearCompleted() : async () {
    todos := Utils.clear(todos);
  };
};
`.trim();

const types: FileContent = `
module Types {
  // Define to-do item properties
  public type ToDo = {
    id: Nat;
    description: Text;
    completed: Bool;
  };
};
`.trim();

const utils: FileContent = `
// Import standard libraries
import Array "mo:base/Array";
import Nat "mo:base/Nat";

// Import the 'ToDo' type definition
import Types "Types";

module Utils {

  type ToDo = Types.ToDo;

  // Add to-do item utility
  public func add(todos : [ToDo], desc : Text, nextId : Nat) : [ToDo] {
    let todo : ToDo = {
      id = nextId;
      description = desc;
      completed = false;
    };
    Array.append<ToDo>([todo], todos)
  };

  // Complete to-do item utility
  public func complete(todos : [ToDo], id : Nat) : [ToDo] {
    Array.map<ToDo,ToDo>(todos, func (todo : ToDo) : ToDo {
      if (todo.id == id) {
        return {
          id = todo.id;
          description = todo.description;
          completed = true;
        };
      };
      todo
    })
  };

  // Show to-do item utility
  public func show(todos : [ToDo]) : Text {
    var output : Text = "\\n___TO-DOs___";
    for (todo : ToDo in todos.vals()) {
      output #= "\\n(" # Nat.toText(todo.id) # ") " # todo.description;
      if (todo.completed) { output #= " ✔"; };
    };
    output
  };

  // Clear to-do item utility
  public func clear(todos: [ToDo]) : [ToDo] {
    var updated : [ToDo] = [];
    for (todo : ToDo in todos.vals()) {
      if (not todo.completed) {
        updated := Array.append<ToDo>(updated, [todo]);
      };
    };
    updated
  };
};
`.trim();

const project: ExampleProject = {
    name: "Simple To-Do",
    directory: {
        "README": readme,
        "Main.mo": main,
        "Types.mo": types,
        "Utils.mo": utils,
    }
};

export default project;
