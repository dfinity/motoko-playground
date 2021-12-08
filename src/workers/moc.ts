// @ts-ignore
importScripts("./moc.js");

export * from "./pow";
export * from "./file";

declare var Motoko: any;

export type MocAction =
  | { type: "save"; file: string; content: string }
  | { type: "remove"; file: string }
  | { type: "rename"; old: string; new: string }
  | { type: "check"; file: string }
  | { type: "compile"; file: string }
  | { type: "stableCheck"; pre: string; post: string }
  | { type: "addPackage"; name: string; path: string }
  | { type: "setActorAliases"; list: Array<[string, string]> }
  | { type: "gcFlags"; option: string };

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
    case "stableCheck":
      return Motoko.stableCompatible(action.pre, action.post);
    case "addPackage":
      return Motoko.addPackage(action.name, action.path);
    case "setActorAliases":
      return Motoko.setActorAliases(action.list);
    case "gcFlags":
      return Motoko.gcFlags(action.option);
  }
}

Motoko.saveFile("Main.mo", "");
