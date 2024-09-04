import React from "react";
import ReactDOM from "react-dom";
import { App } from "./App";
import { Stats } from "./Stats";
import { ProvideLogging } from "./components/Logger";
import "./assets/styles/reboot.css";
import "./assets/styles/variables.css";
import "./assets/fonts/CircularXX.css";

if (window.location.pathname === "/stats") {
  ReactDOM.render(
    <React.StrictMode>
      <Stats />
    </React.StrictMode>,
    document.getElementById("root"),
  );
} else {
  // TODO: if I use the new createRoot API, base library will not load properly, and there is no log of `moc` being loaded.
  ReactDOM.render(
    <React.StrictMode>
      <ProvideLogging>
        <App />
      </ProvideLogging>
    </React.StrictMode>,
    document.getElementById("root"),
  );
}
