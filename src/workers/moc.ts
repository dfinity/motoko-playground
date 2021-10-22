// @ts-ignore
importScripts("./moc-0.6.12.js");

export * from "./pow";
export * from "./file";

declare var Motoko: any;

export type MocAction =
  | { type: "save"; file: string; content: string }
  | { type: "remove"; file: string }
  | { type: "rename"; old: string; new: string }
  | { type: "ls"; path: string }
  | { type: "check"; file: string }
  | { type: "compile"; file: string }
  | { type: "candid"; file: string }
  | { type: "addPackage"; name: string; path: string }
  | { type: "setActorAliases"; list: Array<[string, string]> };

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
    case "ls":
      return Motoko.readDir(action.file);
    case "check":
      return Motoko.check(action.file);
    case "compile":
      return Motoko.compileWasm("ic", action.file);
    case "candid":
      return Motoko.candid(action.file);
    case "addPackage":
      return Motoko.addPackage(action.name, action.path);
    case "setActorAliases":
      return Motoko.setActorAliases(action.list);
  }
}

Motoko.saveFile("Main.mo", "");
