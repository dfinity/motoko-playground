import { useCallback, useEffect, useReducer, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";

import { CandidUI } from "./components/CandidUI";
import { Editor } from "./components/Editor";
import { Explorer } from "./components/Explorer";
import { Header } from "./components/Header";
import { addPackage, saveWorkplaceToMotoko } from "./file";
import { useLogging } from "./components/Logger";
import {
  workplaceReducer,
  WorkplaceDispatchContext,
} from "./contexts/WorkplaceState";
import { ProjectModal } from "./components/ProjectModal";
import { exampleProjects } from "./examples";

const GlobalStyles = createGlobalStyle`
  :root {
    font-family: "CircularXX", sans-serif;
    font-size: 10px;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-size: 1.6rem;
    color: var(--grey700);
  }

  button {
    cursor: pointer;

    &:active {
      filter: brightness(0.85);
    }
  }
`;

const AppContainer = styled.div`
  display: flex;
  height: var(--appHeight);
  overflow-y: hidden;
  border-top: 1px solid var(--grey400);
`;

export function App() {
  const [workplaceState, workplaceDispatch] = useReducer(
    workplaceReducer.reduce,
    {},
    workplaceReducer.init
  );
  const [motokoIsLoaded, setMotokoIsLoaded] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const logger = useLogging();

  function closeProjectModal() {
    setIsProjectModalOpen(false);
    if (isFirstVisit) {
      // The modal takes 500ms to animate out, so we wait to set isFirstVisit.
      setTimeout(() => setIsFirstVisit(false), 500);
    }
  }

  const selectFile = (selectedFile: string) => {
    workplaceDispatch({
      type: "selectFile",
      payload: {
        path: selectedFile,
      },
    });
  };

  const saveWorkplace = (newCode: string) => {
    if (!workplaceState.selectedFile) {
      console.warn("Called saveWorkplace with no selectedFile");
      return;
    }
    workplaceDispatch({
      type: "saveFile",
      payload: {
        path: workplaceState.selectedFile,
        contents: newCode,
      },
    });
  };

  const chooseExampleProject = useCallback(
    (project) => {
      console.log(`App:104 (anon)`, { project });
      workplaceDispatch({
        type: "loadExampleProject",
        payload: {
          project,
        },
      });
    },
    [workplaceDispatch]
  );

  // Add the Motoko package to allow for compilation / checking
  useEffect(() => {
    const script = document.createElement("script");
    script.addEventListener("load", () => {
      setMotokoIsLoaded(true);
      addPackage("base", "dfinity/motoko-base", "dfx-0.6.16", "src", logger);
      logger.log("Compiler loaded.");
    });
    script.src =
      "https://download.dfinity.systems/motoko/0.5.3/js/moc-0.5.3.js";
    document.body.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!motokoIsLoaded) {
      // saving won't work until the Motoko global is loaded
      return;
    }
    saveWorkplaceToMotoko(workplaceState.files);
  }, [workplaceState.files, motokoIsLoaded]);

  return (
    <main>
      <GlobalStyles />
      <Header openTutorial={() => setIsProjectModalOpen(true)} />
      <WorkplaceDispatchContext.Provider value={workplaceDispatch}>
        <ProjectModal
          exampleProjects={exampleProjects}
          isOpen={isProjectModalOpen}
          chooseExampleProject={chooseExampleProject}
          close={closeProjectModal}
          isFirstOpen={isFirstVisit}
        />
        <AppContainer>
          <Explorer
            workplace={workplaceState.files}
            selectedFile={workplaceState.selectedFile}
            onSelectFile={selectFile}
          />
          <Editor
            fileCode={
              workplaceState.selectedFile
                ? workplaceState.files[workplaceState.selectedFile]
                : ""
            }
            fileName={workplaceState.selectedFile}
            onSave={saveWorkplace}
          />
          <CandidUI />
        </AppContainer>
      </WorkplaceDispatchContext.Provider>
    </main>
  );
}
