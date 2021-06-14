import { useEffect, useState, useCallback } from "react";
// Import the canister actor and give it a meaningful name
import { getActor } from "./config/actor";

import Editor from "./components/Editor";
import Explorer from "./components/Explorer";
import * as workplaceFiles from "./examples/main";
import { addPackage } from "./file";
import { saveWorkplaceToMotoko } from "./file";

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

  const saveWorkplace = () => {
    saveWorkplaceToMotoko(workplace);
  };

  // Add the Motoko package to allow for compilation / checking
  useEffect(() => {
    const script = document.createElement("script");
    document.body.appendChild(script);
    script.addEventListener("load", () => {
      addPackage("base", "dfinity/motoko-base", "dfx-0.6.16", "src");
    });
    script.src =
      "https://download.dfinity.systems/motoko/0.5.3/js/moc-0.5.3.js";
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
      </header>
      <main>
        <Editor
          fileCode={workplace[selectedFile]}
          fileName={selectedFile}
          onSave={saveWorkplace}
        />
        <Explorer workplace={workplace} onSelectFile={selectFile} />
      </main>
    </div>
  );
}

export default App;
