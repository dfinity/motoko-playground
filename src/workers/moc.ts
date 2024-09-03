import * as Comlink from "comlink";

declare global {
  var Motoko: any;
}
const loadMoc = async () => {
  const MotokoModule = await import("./mocShim.js");
  return MotokoModule.default;
};

export * from "./pow";
export * from "./file";

//declare var Motoko: any;

export type MocAction =
  | { type: "save"; file: string; content: string }
  | { type: "remove"; file: string }
  | { type: "rename"; old: string; new: string }
  | { type: "check"; file: string }
  | { type: "compile"; file: string }
  | { type: "candid"; file: string }
  | { type: "stableCheck"; pre: string; post: string }
  | { type: "addPackage"; name: string; path: string }
  | { type: "setActorAliases"; list: Array<[string, string]> }
  | { type: "setPublicMetadata"; list: Array<string> }
  | { type: "gcFlags"; option: string }
  | { type: "printDeps"; file: string };

// Export as you would in a normal module:
export function Moc(action: MocAction) {
  if (typeof Motoko === "undefined") return;
  switch (action.type) {
    case "save":
      return Motoko.saveFile(action.file, action.content);
    case "remove":
      return Motoko.removeFile(action.file);
    case "rename":
      return Motoko.renameFile(action.old, action.new);
    case "check":
      return Motoko.check(action.file);
    case "compile":
      return Motoko.compileWasm("ic", action.file);
    case "candid":
      return Motoko.candid(action.file);
    case "stableCheck":
      return Motoko.stableCompatible(action.pre, action.post);
    case "addPackage":
      return Motoko.addPackage(action.name, action.path);
    case "setActorAliases":
      return Motoko.setActorAliases(action.list);
    case "setPublicMetadata":
      return Motoko.setPublicMetadata(action.list);
    case "gcFlags":
      return Motoko.gcFlags(action.option);
    case "printDeps":
      return Motoko.printDeps(action.file);
  }
}

loadMoc().then((Motoko) => {
  Motoko.saveFile("Main.mo", "");
  Comlink.expose(Moc);
});
