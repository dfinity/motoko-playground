import * as React from "react";
import { emptyProject, selectFirstFile } from "../examples";
import { ExampleProject } from "../examples/types";


export interface WorkplaceState {
  files: Record<string,string>;
  selectedFile: string|null;
}

export type WorkplaceReducerAction =
| { type: 'loadExampleProject',
    payload: {
      project: ExampleProject
    }
  }
| { type: 'reset', payload: {} }
| { type: 'selectFile',
    payload: {
      path: string
    }
  }
| { type: 'saveFile',
    payload: {
      path: string;
      contents: string;
    },
  }
;

export const workplaceReducer = {
  init(props: {}): WorkplaceState {
    const files = {...emptyProject.directory}
    const selectedFile = selectFirstFile(emptyProject)
    return {
      files,
      selectedFile,
    }
  },
  reduce(state: WorkplaceState, action: WorkplaceReducerAction): WorkplaceState {
    switch (action.type) {
      case 'loadExampleProject':
        const newProjectFiles = {...action.payload.project.directory};
        return {
          ...state,
          files: newProjectFiles,
          selectedFile: selectFirstFile(action.payload.project),
        }
      case 'reset':
        return this.init(action.payload);
      case 'selectFile':
        return {
          ...state,
          selectedFile: action.payload.path
        };
      case 'saveFile':
        return {
          ...state,
          files: {
            ...state.files,
            [action.payload.path]: action.payload.contents
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

// https://reactjs.org/docs/hooks-faq.html#how-to-avoid-passing-callbacks-down
export const WorkplaceDispatchContext = React.createContext<React.Dispatch<WorkplaceReducerAction>>(() => {
  console.warn('using default WorkplaceDispathcContext. Make sure to Provide one in your component tree')
})
