import { useEffect, useReducer, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { CandidUI } from "./components/CandidUI";
import { Editor } from "./components/Editor";
import { Explorer } from "./components/Explorer";
import { Header } from "./components/Header";
import { addPackage, saveWorkplaceToMotoko } from "./file";
import { useLogging } from "./components/Logger";
import { workplaceReducer, WorkplaceDispatchContext } from "./contexts/WorkplaceState";

const GlobalStyles = createGlobalStyle`
  :root {
    --headerHeight: 9.6rem;
    --appHeight: calc(100vh - var(--headerHeight));
    --sectionHeaderHeight: 4.8rem;
    --editorHeight: calc(var(--appHeight) - var(--sectionHeaderHeight));
    --explorerWidth: max(200px, 15%);
    
    --defaultColor: #818284;
    --primaryColor: #387ff7;
    
    --lightTextColor: #818284;
    --buttonTextColor: #555659;
    --textColor: #3f4043;
    --darkTextColor: #292a2e;
    
    --lightBorderColor: #efefef;
    --borderColor: #d9d9da;
    --darkBorderColor: #c3c3c4;
    
    font-family: "CircularXX", sans-serif;
    font-size: 10px;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-size: 1.6rem;
    color: var(--textColor);
  }
  
  a {
    color: var(--buttonTextColor);
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  button {
    cursor: pointer;
    
    &:hover {
      filter: brightness(0.95);
    }
    &:active {
      filter: brightness(0.85);
    }
  }
`;

const AppContainer = styled.div`
  display: flex;
  height: var(--appHeight);
  overflow-y: hidden;
  border-top: 1px solid var(--darkBorderColor);
`;

export function App(props) {
  const [workplaceState, workplaceDispatch] = useReducer(
    workplaceReducer.reduce,
    {},
    workplaceReducer.init);
  console.log('workplaceState', workplaceState)
  const [motokoIsLoaded, setMotokoIsLoaded] = useState(false);
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
      <Header />
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
        />
        <CandidUI />
      </AppContainer>
    </main>
    </WorkplaceDispatchContext.Provider>
  );
}
