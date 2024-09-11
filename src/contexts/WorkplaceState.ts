import * as React from "react";
import { CanisterInfo } from "../build";
import { PackageInfo } from "../workers/file";
import { Container } from "../webcontainer";

export interface Origin {
  origin: string;
  tags: Array<string>;
  // only added for install_code, and will be clear after each deploy
  session_tags?: Array<string>;
}
export interface WorkplaceState {
  files: Record<string, string | Uint8Array>;
  selectedFile: string | null;
  canisters: Record<string, CanisterInfo>;
  selectedCanister: string | null;
  packages: Record<string, PackageInfo>;
  origin: Origin;
}
export function getActorAliases(
  canisters: Record<string, CanisterInfo>,
): Array<[string, string]> {
  return Object.entries(canisters).map(([name, info]) => [
    name,
    (info as any).id.toText(),
  ]);
}
export function getExternalCanisters(
  canisters: Record<string, CanisterInfo>,
): Record<string, CanisterInfo> {
  return Object.fromEntries(
    Object.entries(canisters).filter(([_, info]) => info.isExternal),
  );
}
export function getDeployedCanisters(
  canisters: Record<string, CanisterInfo>,
): Record<string, CanisterInfo> {
  return Object.fromEntries(
    Object.entries(canisters).filter(([_, info]) => !info.isExternal),
  );
}
export function getShareableProject(state: WorkplaceState) {
  const files = Object.entries(state.files)
    .filter(([name, _]) => name.endsWith(".mo"))
    .map(([name, content]) => {
      return { name, content };
    });
  const packages = [
    Object.entries(state.packages)
      .filter(([name, _]) => name !== "base")
      .map(([_, info]) => {
        return {
          name: info.name,
          repo: info.repo,
          version: info.version,
          dir: info.dir ? [info.dir] : [],
          homepage: info.homepage ? [info.homepage] : [],
        };
      }),
  ];
  const canisters = [
    Object.values(state.canisters)
      .filter((info) => info.isExternal && info.name && info.candid)
      .map((info) => {
        return { id: info.id, name: info.name, candid: info.candid };
      }),
  ];
  return { files, packages, canisters };
}
export function generateNonMotokoFilesToWebContainer(state: WorkplaceState) {
  const { env, canister_ids } = generateEnv(state);
  const files = Object.entries(state.files)
    .filter(([path]) => !path.endsWith(".mo"))
    .reduce((acc, [path, content]) => {
      const parts = path.split("/");
      let current = acc;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = { directory: {} };
        }
        current = current[parts[i]].directory;
      }
      current[parts[parts.length - 1]] = {
        file: {
          contents: content,
        },
      };
      return acc;
    }, {});
  files["canister_ids.json"] = {
    file: { contents: JSON.stringify(canister_ids, null, 2) },
  };
  files[".env"] = {
    file: {
      contents: Object.entries(env)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n"),
    },
  };
  return { files, env };
}
function generateEnv(state: WorkplaceState) {
  const env: Record<string, string> = {
    DFX_NETWORK: "ic",
    NODE_ENV: "production",
  };
  const canister_ids = {};
  Object.entries(state.canisters).forEach(([name, info]) => {
    if (info.name && info.candid && !info.isFrontend) {
      env[`CANISTER_ID_${name.toUpperCase()}`] = info.id.toString();
      canister_ids[name] = { ic: info.id.toString() };
    }
  });
  if (Object.keys(canister_ids).length === 0) {
    throw new Error("Please deploy at least one backend canister first.");
  }
  return { env, canister_ids };
}

export type WorkplaceReducerAction =
  /**
   * Call to replace all current files with files from an ExampleProject
   */
  | {
      type: "loadProject";
      payload: {
        files: Record<string, string | Uint8Array>;
      };
    }
  | {
      type: "loadPackage";
      payload: {
        name: string;
        package: PackageInfo;
      };
    }
  /**
   * Call to reset all state to initial values.
   * Files are reset to an empty project.
   */
  | { type: "reset"; payload: {} }
  /**
   * Call to set a new file path as the currently selected file
   */
  | {
      type: "selectFile";
      payload: {
        /** path of file that is now selected. Should correspond to a property in state.files */
        path: string;
      };
    }
  | {
      type: "selectCanister";
      payload: {
        name: string;
      };
    }
  | {
      type: "deleteCanister";
      payload: {
        name: string;
      };
    }
  /**
   * Call to update the contents of a specific file in the current files
   */
  | {
      type: "saveFile";
      payload: {
        /** path of file that should be updated. Should correspond to a property in state.files */
        path: string;
        /** new contents of file */
        contents: string;
      };
    }
  | {
      type: "deployWorkplace";
      payload: {
        /** path of file that should be updated. Should correspond to a property in state.files */
        canister: CanisterInfo;
        do_not_select?: boolean;
        /** new contents of file */
      };
    }
  | {
      type: "setOrigin";
      payload: Origin;
    }
  | {
      type: "addSessionTag";
      payload: string;
    }
  | {
      type: "clearSessionTags";
    };

function selectFirstFile(files: Record<string, string>): string | null {
  if ("README" in files) {
    return "README";
  }
  if ("README.md" in files) {
    return "README.md";
  }
  if ("Main.mo" in files) {
    return "Main.mo";
  }
  const fileNames = Object.keys(files);
  if (!fileNames.length) {
    return null;
  }
  const mainFile = fileNames.find((name) => name.endsWith("Main.mo"));
  return mainFile || fileNames[0];
}

/**
 * Reducer to reduce actions that modify state about the Editor 'Workplace'.
 * Meant to be used with `React.useReducer` or similar.
 */
export const workplaceReducer = {
  /** Create initial state */
  init(props: {}): WorkplaceState {
    const files = { "Main.mo": "" };
    const selectedFile = "Main.mo";
    const canisters = {};
    return {
      files,
      selectedFile,
      canisters,
      selectedCanister: null,
      packages: {},
      origin: { origin: "playground", tags: [], session_tags: [] },
    };
  },
  /** Return updated state based on an action */
  reduce(
    state: WorkplaceState,
    action: WorkplaceReducerAction,
  ): WorkplaceState {
    switch (action.type) {
      case "loadProject":
        return {
          ...state,
          files: action.payload.files,
          selectedFile: selectFirstFile(action.payload.files),
        };
      case "loadPackage":
        return {
          ...state,
          packages: {
            ...state.packages,
            [action.payload.name]: action.payload.package,
          },
        };
      case "reset":
        return this.init(action.payload);
      case "selectFile":
        return {
          ...state,
          selectedFile: action.payload.path,
        };
      case "selectCanister":
        return {
          ...state,
          selectedCanister: action.payload.name,
        };
      case "deleteCanister": {
        const name = action.payload.name;
        delete state.canisters[name];
        return {
          ...state,
          selectedCanister:
            state.selectedCanister === name ? null : state.selectedCanister,
        };
      }
      case "saveFile":
        return {
          ...state,
          files: {
            ...state.files,
            [action.payload.path]: action.payload.contents,
          },
        };
      case "deployWorkplace": {
        const name = action.payload.canister.name!;
        return {
          ...state,
          selectedCanister: action.payload.do_not_select
            ? state.selectedCanister
            : name,
          canisters: {
            ...state.canisters,
            [name]: action.payload.canister,
          },
        };
      }
      case "setOrigin": {
        let refer =
          document.referrer || (window.opener && "(opener)") || undefined;
        if (refer) {
          action.payload.tags.push(`ref:${refer}`);
        }
        return {
          ...state,
          origin: action.payload,
        };
      }
      case "addSessionTag": {
        if (state.origin.session_tags) {
          state.origin.session_tags.push(action.payload);
        } else {
          state.origin.session_tags = [action.payload];
        }
        return state;
      }
      case "clearSessionTags": {
        return {
          ...state,
          origin: {
            origin: state.origin.origin,
            tags: state.origin.tags,
            session_tags: [],
          },
        };
      }
      default:
        // this should never be reached. If there is a type error here, add a 'case'
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let x: never = action;
    }
    return state;
  },
};

/**
 * Context used to access `dispatch` to update WorkplaceState.
 * You can use this instead of passing callbacks all the way down the component tree.
 * Recommended as good practice in larger trees by
 *  https://reactjs.org/docs/hooks-faq.html#how-to-avoid-passing-callbacks-down.
 */
export const WorkplaceDispatchContext = React.createContext<
  React.Dispatch<WorkplaceReducerAction>
>(() => {
  console.warn(
    "using default WorkplaceDispathcContext. Make sure to Provide one in your component tree",
  );
});
export const WorkerContext = React.createContext<any>(() => {
  console.warn("provide a value for worker");
});
export const ContainerContext = React.createContext<Container>(() => {
  console.warn("provide a value for web container");
});
