import { useEffect, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { CandidUI } from "./components/CandidUI";
import { Editor } from "./components/Editor";
import { Explorer } from "./components/Explorer";
import { Header } from "./components/Header";
import { files } from "./examples/fileStructure";
import { addPackage, saveWorkplaceToMotoko } from "./file";
import { useLogging } from "./components/Logger";

const GlobalStyles = createGlobalStyle`
  :root {
    --headerHeight: 9.6rem;
    --appHeight: calc(100vh - var(--headerHeight));
    --explorerWidth: max(200px, 15%);
    --editorWidth: calc(100vw - var(--explorerWidth));
    --gutterWidth: 15px;
    --sectionHeaderHeight: 40px;
    --editorHeight: calc(
            var(--appHeight) - (var(--gutterWidth) * 2) - var(--sectionHeaderHeight)
    );
    font-family: "Roboto", sans-serif;
    font-size: 10px;
  }
  * {
    box-sizing: border-box;
  }
  body {
    margin: 0;
  }
`;

const AppContainer = styled.div`
  display: flex;
  height: var(--appHeight);
`;

export function App() {
  const [workplace, setWorkplace] = useState(files);
  const [selectedFile, setSelectedFile] = useState("main.mo");
  const logger = useLogging();

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
      addPackage("base", "dfinity/motoko-base", "dfx-0.6.16", "src", logger);
      logger.log("Compiler loaded.");
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
