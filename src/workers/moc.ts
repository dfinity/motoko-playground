import { pow } from "./pow";
// @ts-ignore
importScripts("https://download.dfinity.systems/motoko/0.6.2/js/moc-0.6.2.js");

declare var Motoko: any;

export type MocAction =
  | { type: "save", file: string, content: string }
  | { type: "check", file: string }
  | { type: "compile", file: string }

// Export as you would in a normal module:
export function Moc(action: MocAction) {
  if (typeof Motoko === 'undefined') return;
  switch (action.type) {
    case "save":
      return Motoko.saveFile(action.file, action.content);
    case "check":
      return Motoko.check(action.file);
    case "compile":
      return Motoko.compileWasm("dfinity", action.file);
  }
}

export function saveWorkplaceToMotoko({files, aliases}) {
  for (const [name, code] of Object.entries(files)) {
    if (!name.endsWith('mo')) continue;
    Motoko.saveFile(name, code);
  }
  Motoko.setActorAliases(aliases);
}

export function generateNonce(timestamp: bigint) {
  return pow(timestamp);
}
