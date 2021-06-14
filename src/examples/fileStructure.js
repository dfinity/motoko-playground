import { main, fac, test, types, pub, sub } from "./fileContents";

export const files = [
  { filepath: "src/actors/pub.mo", body: pub },
  { filepath: "src/actors/sub.mo", body: sub },
  { filepath: "src/utilities/fac.mo", body: fac },
  { filepath: "src/utilities/types.mo", body: types },
  { filepath: "src/utilities/tests/test.mo", body: test },
  { filepath: "src/main.mo", body: main },
];

// =========
// Ideation for future versions:
// =========

const possibleStructure = [
  { id: 0, type: "dir", name: "actors", parent: null, body: null },
  { id: 1, type: "file", name: "pub.mo", parent: 0, body: pub },
  { id: 2, type: "file", name: "sub.mo", parent: 0, body: sub },
  { id: 3, type: "dir", name: "utilities", parent: null, body: null },
  { id: 4, type: "file", name: "fac.mo", parent: 3, body: fac },
  { id: 5, type: "file", name: "types.mo", parent: 3, body: types },
  { id: 6, type: "dir", name: "tests", parent: 3, body: null },
  { id: 7, type: "file", name: "test.mo", parent: 6, body: test },
  { id: 8, type: "file", name: "main.mo", parent: null, body: main },
];

function possibleParseFileStructure(files) {
  const someStructure = files.reduce((result, item) => {
    if (item.body === null) {
      if (item.parent === null) {
        result.push({ [item.name]: [] });
      } else {
      }
    }
    return result;
  }, []);

  return someStructure;
}

const possibleExpectedOutput = [
  {
    actors: [
      { name: "pub.mo", body: pub },
      { name: "sub.mo", body: sub },
    ],
  },
  {
    utilities: [
      { name: "fac.mo", body: fac },
      { name: "types.mo", body: types },
      { tests: [{ name: "test.mo", body: test }] },
    ],
  },
  { name: "main.mo", body: main },
];
