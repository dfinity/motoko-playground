const trimContent = (s) => s.trim() + "\n";

const mainMo = trimContent(`
actor {
  public query func main() : async Nat {
    123
  }
}
`);

const libMo = trimContent(`
module {
  
}
`);

const dfxJson = trimContent(`
{
  "canisters": {
    "backend": {
      "type": "motoko",
      "main": "Main.mo"
    }
  }
}
`);

export const defaultFiles = {
  "Main.mo": mainMo,
  "Lib.mo": libMo,
  "dfx.json": dfxJson,
};
