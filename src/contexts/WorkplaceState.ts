import * as React from "react";
import { emptyProject, selectFirstFile, withOnlyUserVisibleFiles } from "../examples";
import { ExampleProject } from "../examples/types";
import { CanisterInfo } from "../build";
import { PackageInfo } from "../file";


export interface WorkplaceState {
  files: Record<string,string>;
  selectedFile: string|null;
  canisters: Record<string, CanisterInfo>;
  selectedCanister: string|null;
  packages: Record<string, PackageInfo>;
}

export type WorkplaceReducerAction =
/**
 * Call to replace all current files with files from an ExampleProject
 */
| { type: 'loadExampleProject',
    payload: {
      project: ExampleProject
    }
  }
  | { type: 'loadProject',
      payload: {
        files: Record<string, string>;
      }
    }
  | { type: 'loadPackage',
      payload: {
        name: string,
        package: PackageInfo,
      }
    }
/**
 * Call to reset all state to initial values.
 * Files are reset to an empty project.
 */
| { type: 'reset', payload: {} }
/**
 * Call to set a new file path as the currently selected file
 */
| { type: 'selectFile',
    payload: {
      /** path of file that is now selected. Should correspond to a property in state.files */
      path: string
    }
  }
| { type: 'selectCanister',
    payload: {
      name: string
    }
  }
| { type: 'deleteCanister',
    payload: {
      name: string
    }
  }
/**
 * Call to update the contents of a specific file in the current files
 */
| { type: 'saveFile',
    payload: {
      /** path of file that should be updated. Should correspond to a property in state.files */
      path: string;
      /** new contents of file */
      contents: string;
    },
  }
| { type: 'deployWorkplace',
    payload: {
      /** path of file that should be updated. Should correspond to a property in state.files */
      canister: CanisterInfo
      /** new contents of file */
    },
  }
;

/**
 * Reducer to reduce actions that modify state about the Editor 'Workplace'.
 * Meant to be used with `React.useReducer` or similar.
 */
export const workplaceReducer = {
  /** Create initial state */
  init(props: {}): WorkplaceState {
    const files = {...emptyProject.directory}
    const selectedFile = selectFirstFile(emptyProject)
    const canisters = {};
    return {
      files,
      selectedFile,
      canisters,
      selectedCanister: null,
      packages: {},
    }
  },
  /** Return updated state based on an action */
  reduce(state: WorkplaceState, action: WorkplaceReducerAction): WorkplaceState {
    switch (action.type) {
      case 'loadExampleProject':
        const newProjectFiles = withOnlyUserVisibleFiles(action.payload.project.directory);
        return {
          ...state,
          files: newProjectFiles,
          selectedFile: selectFirstFile(action.payload.project),
        }
      case 'loadProject':
        return {
          ...state,
          files: action.payload.files,
          selectedFile: 'Main.mo',
        }
      case 'loadPackage':
        return {
          ...state,
          packages: {
            ...state.packages,
            [action.payload.name]: action.payload.package
          }
        }
      case 'reset':
        return this.init(action.payload);
      case 'selectFile':
        return {
          ...state,
          selectedFile: action.payload.path
        };
      case 'selectCanister':
        return {
          ...state,
          selectedCanister: action.payload.name
        };
      case 'deleteCanister': {
        const name = action.payload.name;
        delete state.canisters[name];
        return {
          ...state,
          selectedCanister: state.selectedCanister === name ? null : state.selectedCanister
        };
      }
      case 'saveFile':
        return {
          ...state,
          files: {
            ...state.files,
            [action.payload.path]: action.payload.contents
          }
        }
      case 'deployWorkplace': {
        const name = action.payload.canister.name!;
        return {
          ...state,
          selectedCanister: name,
          canisters: {
            ...state.canisters,
            [name]: action.payload.canister
          }
        }
      }
      default:
        // this should never be reached. If there is a type error here, add a 'case'
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let x: never = action
    }
    return state;
  }
}

/**
 * Context used to access `dispatch` to update WorkplaceState.
 * You can use this instead of passing callbacks all the way down the component tree.
 * Recommended as good practice in larger trees by
 *  https://reactjs.org/docs/hooks-faq.html#how-to-avoid-passing-callbacks-down.
 */
export const WorkplaceDispatchContext = React.createContext<React.Dispatch<WorkplaceReducerAction>>(() => {
  console.warn('using default WorkplaceDispathcContext. Make sure to Provide one in your component tree')
})
