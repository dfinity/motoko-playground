import { ExampleProject, FileContent } from "./types";

const readme: FileContent = `
# Who Am I?

This example demonstrates how a canister can identify its caller and itself.
`.trim()

const main: FileContent = `
import Principal "mo:base/Principal";

shared (install) actor class WhoAmI(someone : Principal) =
  this { // Bind the optional \`this\` argument (any name will do)

  // Return the principal identifier of the wallet canister that installed this
  // canister.
  public query func installer() : async Principal {
    return install.caller;
  };

  // Return the principal identifier that was provided as an installation
  // argument to this canister.
  public query func argument() : async Principal {
    return someone;
  };

  // Return the principal identifier of the caller of this method.
  public shared (message) func whoami() : async Principal {
    return message.caller;
  };

  // Return the principal identifier of this canister.
  public func id() : async Principal {
    return await whoami();
  };

  // Return the principal identifier of this canister via the optional \`this\` binding.
  // This is much quicker than \`id()\` above, since it avoids the latency of \`await whoami()\`.
  public func idQuick() : async Principal {
    return Principal.fromActor(this);
  };
};
`.trim();

const dfxJson: FileContent = `

{
  "canisters": {
    "whoami": {
      "main": "Main.mo"
    }
  }
}
`.trim()

const project: ExampleProject = {
    name: "Who Am I?",
    directory: {
        "README": readme,
        "Main.mo": main,
				"dfx.json": dfxJson,
    }
};

export default project;
