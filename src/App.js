import { useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { CandidUI } from "./components/CandidUI";
import { Editor } from "./components/Editor";
import { Explorer } from "./components/Explorer";
import { Header } from "./components/Header";
// Import the canister actor and give it a meaningful name
// import { actor as MotokoCanister } from "./config/actor";

const GlobalStyles = createGlobalStyle`
  
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
  const [selectedFile, setSelectedFile] = useState(null);

  return (
    <div>
      <GlobalStyles />
      <Header />
      <AppContainer>
        <Explorer />
        <Editor />
        <CandidUI />
      </AppContainer>
    </div>
  );
}
