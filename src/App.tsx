import { useEffect, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { CandidUI } from "./components/CandidUI";
import { Editor } from "./components/Editor";
import { Explorer } from "./components/Explorer";
import { Header } from "./components/Header";
import { files } from "./examples/firstExample/fileStructure";
import { addPackage, saveWorkplaceToMotoko } from "./file";
import { useLogging } from "./components/Logger";
import { WelcomeModal } from "./components/WelcomeModal";

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

export function App() {
  const [isModalOpen, setIsModalOpen] = useState(true);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main>
      <GlobalStyles />
      <WelcomeModal isOpen={isModalOpen} close={() => setIsModalOpen(false)} />
      <Header openTutorial={() => setIsModalOpen(true)} />
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
