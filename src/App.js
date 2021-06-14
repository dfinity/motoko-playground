import { useEffect, useState, useCallback } from "react";
// Import the canister actor and give it a meaningful name
import { getActor } from "./config/actor";

import Editor from "./components/Editor";
import Explorer from "./components/Explorer";
import * as workplaceFiles from "./examples/main";

const defaultWorkplace = {
  "main.mo": workplaceFiles.prog,
  "types.mo": workplaceFiles.type,
  "pub.mo": workplaceFiles.pub,
  "sub.mo": workplaceFiles.sub,
  "fac.mo": workplaceFiles.fac,
  "test.mo": workplaceFiles.matchers,
};

function App() {
  const [workplace, setWorkplace] = useState(defaultWorkplace);
  const [selectedFile, setSelectedFile] = useState("main.mo");

  const selectFile = (selectedFile) => {
    setSelectedFile(selectedFile);
  };

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
      </header>
      <main>
        <Editor fileCode={workplace[selectedFile]} />
        <Explorer workplace={workplace} onSelectFile={selectFile} />
      </main>
    </div>
  );
}

export default App;
