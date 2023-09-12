import React from "react";
import ReactDOM from "react-dom";
import { App } from "./App";
import { Stats } from "./Stats";
import reportWebVitals from "./reportWebVitals";
import { ProvideLogging } from "./components/Logger";
import "./assets/styles/reboot.css";
import "./assets/styles/variables.css";
import "./assets/fonts/CircularXX.css";

if (window.location.pathname === "/stats") {
  ReactDOM.render(
    <React.StrictMode>
      <Stats />
    </React.StrictMode>,
    document.getElementById("root")
  );
} else {
  ReactDOM.render(
    <React.StrictMode>
      <ProvideLogging>
        <App />
      </ProvideLogging>
    </React.StrictMode>,
    document.getElementById("root")
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
