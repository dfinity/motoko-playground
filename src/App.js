import { useEffect, useState, useCallback } from "react";
// Import the canister actor and give it a meaningful name
import { getActor } from "./config/actor";

import Editor from "./components/Editor";

function App() {
  const [value, setValue] = useState();

  useEffect(() => {
    // Call a public function defined in the canister
    getActor().then((actor) => {
      actor.getValue().then((response) => {
        // Since the response is a BigInt we need to stringify it
        setValue(response);
      });
    });
  }, []);

  const onIncrement = useCallback(async () => {
    // Call another public function
    await (await getActor()).increment();
    // Get latest value from canister again
    const newValue = await (await getActor()).getValue();
    setValue(newValue);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img
          src={`${process.env.PUBLIC_URL}/logo512.png`}
          className="App-logo"
          alt="logo"
        />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://dfinity.org/developers"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn How to Develop on the Internet Computer
        </a>
        <h2>Value received from IC canister: {value}</h2>
        <button onClick={onIncrement}>Increment</button>
      </header>
      <main>
        <Editor />
      </main>
    </div>
  );
}

export default App;
