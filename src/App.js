import { useEffect, useState, useCallback } from 'react'
// Import functions to setup canister interactions:
import { Actor, HttpAgent } from '@dfinity/agent'
// Import canister interface and id:
import { idlFactory, canisterId } from 'dfx-generated/motoko_app'

import './App.css'

const agent = new HttpAgent()
const canister = Actor.createActor(idlFactory, { agent, canisterId })

function App() {
  const [value, setValue] = useState()

  useEffect(() => {
    // Call a public function defined in the canister
    canister.getValue().then((response) => {
      // Since the response is a BigNumber we need to stringify it
      setValue(response.toString())
    })
  }, [])

  const onIncrement = useCallback(async () => {
    // Call another public function
    await canister.increment()
    // Get latest value from canister again
    const newValue = await canister.getValue()
    setValue(newValue.toString())
  }, [])

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
    </div>
  )
}

export default App
