import { pow } from "../pow";
// @ts-ignore
importScripts("https://download.dfinity.systems/motoko/0.6.2/js/moc-0.6.2.js");

declare var Motoko: any;

export type MocAction =
  | { type: "save", file: string, contents: string }
  | { type: "check", file: string }

// Export as you would in a normal module:
export function Moc(action: MocAction) {
  if (typeof Motoko === 'undefined') return;
  switch (action.type) {
    case "save":
      return Motoko.saveFile(action.file, action.contents);
    case "check":
      return Motoko.check(action.file);
  }
}

export function generateNonce(timestamp: bigint) {
  return pow(timestamp);
}
