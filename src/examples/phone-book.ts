import { ExampleProject, FileContent } from "./types";

const readme: FileContent = `
# Phone Book

This example demonstrates a phone book service.

## Overview

As is common, the \`Main.mo\` file declares a single actor (See https://sdk.dfinity.org/docs/language-guide/actors-async.html).

The first few declarations declare local types that the actor uses to represent a PhoneBook.

State is maintained using an \`AssocList\` from the Motoko Base Library-- one of many data structures you can choose from without having to implement your own.
* Read more about \`AssocList\` at https://sdk.dfinity.org/docs/base-libraries/assoclist

\`var phonebook\` is initialized using the result of a call to \`List.nil\`. This works because \`AssocList\` is a specific kind of \`List\`, and these types correspond based on Motoko's rules of structural typing. \`List.nil\` is documented at https://sdk.dfinity.org/docs/base-libraries/list.

The application provides an interface that exposes the following methods:

*  \`insert\`, which adds a name and entry to the phonebook
  * This function modifies the private \`phonebook\` variable using \`AssocList.replace\` function documented at https://sdk.dfinity.org/docs/base-libraries/assoclist#replace.

*  \`lookup\`, which accepts a name and returns the corresponding Entry (if present)
  * Because the provided name may not be present in the PhoneBook, this method returns an Option type, which can represent either \`null\` or an Entry. For more on Option types, see:
    * Motoko Base Library functions for woring with Option types: https://sdk.dfinity.org/docs/base-libraries/option
    * https://sdk.dfinity.org/docs/language-guide/errors.html#_error_reporting_with_option
  * The implementation of this function makes use of \`AssocList.find\`, which is documented at https://sdk.dfinity.org/docs/base-libraries/assoclist#find

`.trim()

const main: FileContent = `
import AssocList "mo:base/AssocList";
import List "mo:base/List";
import Text "mo:base/Text";

actor {

  type Name = Text;
  type Phone = Text;

  type Entry = {
    desc: Text;
    phone: Phone;
  };

  type PhoneBookMap = AssocList.AssocList<Name, Entry>;

  var phonebook: PhoneBookMap = List.nil<(Name, Entry)>();

  public func insert(name : Name, entry : Entry): async () {
    phonebook := AssocList.replace<Name, Entry>(
      phonebook,
      name,
      Text.equal,
      ?entry
    ).0;
  };

  public query func lookup(name : Name) : async ?Entry {
    return AssocList.find<Name, Entry>(phonebook, name, Text.equal);
  };
};
`.trim();

const project: ExampleProject = {
    name: "Phone Book",
    directory: {
        "README": readme,
        "Main.mo": main,
    }
};

export default project;
