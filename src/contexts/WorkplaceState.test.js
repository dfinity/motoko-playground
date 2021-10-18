import { workplaceReducer } from "./WorkplaceState";

describe("WorkplaceState reducer", () => {
  const defaultState = workplaceReducer.init({});

  const newFileState = {
    ...defaultState,
    files: {
      ...defaultState.files,
      "New.mo": "Hello there!",
    },
  };

  it("initializes correctly", () => {
    expect(defaultState.canisters).toEqual({});
    expect(defaultState.selectedCanister).toBe(null);
    expect(defaultState.files).toEqual({ "Main.mo": "" });
    expect(defaultState.selectedFile).toBe("Main.mo");
    expect(defaultState.packages).toEqual({});
  });

  it("adds files", () => {
    const withNewFile = workplaceReducer.reduce(defaultState, {
      type: "saveFile",
      payload: {
        path: "New.mo",
        contents: "Hello there!",
      },
    });

    expect(withNewFile).toEqual(newFileState);
  });

  it("selects files", () => {
    const withSelectedFile = workplaceReducer.reduce(newFileState, {
      type: "selectFile",
      payload: {
        path: "New.mo",
      },
    });

    expect(withSelectedFile.selectedFile).toBe("New.mo");
  });

  it("removes files", () => {
    const withFileRemoved = workplaceReducer.reduce(newFileState, {
      type: "deleteFile",
      payload: {
        path: "Main.mo",
      },
    });

    expect(withFileRemoved.files).toEqual({ "New.mo": "Hello there!" });
    expect(withFileRemoved.selectedFile).toBe("New.mo");
  });

  it("renames files", () => {
    const withRenamedFile = workplaceReducer.reduce(defaultState, {
      type: "renameFile",
      payload: {
        path: "Main.mo",
        newPath: "Renamed.mo",
      },
    });

    expect(withRenamedFile.files).toEqual({ "Renamed.mo": "" });
    expect(withRenamedFile.selectedFile).toBe("Renamed.mo");
  });
});
