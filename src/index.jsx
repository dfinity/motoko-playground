import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { Stats } from "./Stats";
import { ProvideLogging } from "./components/Logger";
import "./assets/styles/reboot.css";
import "./assets/styles/variables.css";
import "./assets/fonts/CircularXX.css";

if (window.location.pathname === "/stats") {
  createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <Stats />
    </React.StrictMode>,
  );
} else {
  // TODO: if I use the new createRoot API, base library will not load properly, and there is no log of `moc` being loaded.
  createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <ProvideLogging>
        <App />
      </ProvideLogging>
    </React.StrictMode>,
  );
}
