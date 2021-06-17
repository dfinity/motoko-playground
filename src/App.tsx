import { useCallback, useEffect, useReducer, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { CandidUI } from "./components/CandidUI";
import { Editor } from "./components/Editor";
import { Explorer } from "./components/Explorer";
import { Header } from "./components/Header";
import { addPackage, saveWorkplaceToMotoko } from "./file";
import { deploy } from "./build";
import { useLogging } from "./components/Logger";
import { workplaceReducer, WorkplaceDispatchContext } from "./contexts/WorkplaceState";
import { WelcomeModal } from "./components/WelcomeModal";
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

  a {
    color: var(--grey600);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
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

const defaultMainFile = "main.mo";

export function App(props) {
  const [workplaceState, workplaceDispatch] = useReducer(
    workplaceReducer.reduce,
    {},
    workplaceReducer.init);
  const [motokoIsLoaded, setMotokoIsLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const logger = useLogging();

  const selectFile = (selectedFile: string) => {
    workplaceDispatch({
      type: 'selectFile',
      payload: {
        path: selectedFile
      }
    })
  };

  const saveWorkplace = (newCode: string) => {
    if ( ! workplaceState.selectedFile) {
      console.warn('Called saveWorkplace with no selectedFile')
      return;
    }
    workplaceDispatch({
      type: 'saveFile',
      payload: {
        path: workplaceState.selectedFile,
        contents: newCode
      }
    });
  };

  const deployWorkplace = async () => {
    saveWorkplaceToMotoko(workplace);
    await deploy(defaultMainFile, logger);
    // TODO set canister information after deploy succeeds
  }

  const chooseExampleProject = useCallback(
    (project) => workplaceDispatch({
      type: 'loadExampleProject',
      payload: {
        project,
      }
    }),
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

  useEffect(
    () => {
      if ( ! motokoIsLoaded) {
        // saving won't work until the Motoko global is loaded
        return;
      }
      saveWorkplaceToMotoko(workplaceState.files);
    },
    [workplaceState.files, motokoIsLoaded]
  )

  return (
    <WorkplaceDispatchContext.Provider value={workplaceDispatch}>
    <main>
      <GlobalStyles />
      <WelcomeModal
        exampleProjects={exampleProjects}
        isOpen={isModalOpen}
        chooseExampleProject={chooseExampleProject}
        close={() => setIsModalOpen(false)}
        />
      <Header openTutorial={() => setIsModalOpen(true)} />
      <AppContainer>
        <Explorer
          workplace={workplaceState.files}
          selectedFile={workplaceState.selectedFile}
          onSelectFile={selectFile}
        />
        <Editor
          fileCode={workplaceState.selectedFile
            ? workplaceState.files[workplaceState.selectedFile]
            : ""}
          fileName={workplaceState.selectedFile}
          onSave={saveWorkplace}
          onDeploy={deployWorkplace}
        />
        <CandidUI />
      </AppContainer>
    </main>
    </WorkplaceDispatchContext.Provider>
  );
}
