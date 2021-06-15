import { useEffect, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { CandidUI } from "./components/CandidUI";
import { Editor } from "./components/Editor";
import { Explorer } from "./components/Explorer";
import { Header } from "./components/Header";
import { files } from "./examples/fileStructure";
import { addPackage, saveWorkplaceToMotoko } from "./file";

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
`;

const AppContainer = styled.div`
  display: flex;
  height: var(--appHeight);
  overflow-y: hidden;
  border-top: 1px solid var(--darkBorderColor);
`;

export function App() {
  const [workplace, setWorkplace] = useState(files);
  const [selectedFile, setSelectedFile] = useState("main.mo");

  const selectFile = (selectedFile) => {
    setSelectedFile(selectedFile);
  };

  const saveWorkplace = (newCode) => {
    // Resave workplace files with new code changes
    const updatedWorkplace = { ...workplace };
    updatedWorkplace[selectedFile] = newCode;
    setWorkplace(updatedWorkplace);
    saveWorkplaceToMotoko(updatedWorkplace);
  };

  // Add the Motoko package to allow for compilation / checking
  useEffect(() => {
    const script = document.createElement("script");
    script.addEventListener("load", () => {
      addPackage("base", "dfinity/motoko-base", "dfx-0.6.16", "src");
    });
    script.src =
      "https://download.dfinity.systems/motoko/0.5.3/js/moc-0.5.3.js";
    document.body.appendChild(script);
  }, []);

  return (
    <main>
      <GlobalStyles />
      <Header />
      <AppContainer>
        <Explorer
          workplace={workplace}
          selectedFile={selectedFile}
          onSelectFile={selectFile}
        />
        <Editor
          fileCode={workplace[selectedFile]}
          fileName={selectedFile}
          onSave={saveWorkplace}
        />
        <CandidUI />
      </AppContainer>
    </main>
  );
}
