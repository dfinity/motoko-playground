import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { Stats } from "./Stats";
import { ProvideLogging } from "./components/Logger";
import "./assets/styles/reboot.css";
import "./assets/styles/variables.css";
import "./assets/fonts/CircularXX.css";

const DeprecationBanner = () => {
  return (
    <a
      href="https://icp.ninja"
      style={{
        background: "linear-gradient(90deg, #ff4500, #ff0000)",
        padding: "1rem",
        textAlign: "center",
        color: "white",
        fontWeight: "bold",
        flexShrink: 0,
        textDecoration: "none", // Remove default underline from the whole link
        display: "block", // Ensure it takes full width like a div
      }}
      onMouseOver={(e) => (e.currentTarget.style.color = "#f0f0f0")}
      onMouseOut={(e) => (e.currentTarget.style.color = "white")}
    >
      The Motoko Playground is deprecated, please{" "}
      <span style={{ textDecoration: "underline" }}>use ICP Ninja instead</span>
      . This site will stop being accessible from April 12th, 2025 onwards.
    </a>
  );
};

if (window.location.pathname === "/stats") {
  createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <Stats />
    </React.StrictMode>,
  );
} else {
  createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <ProvideLogging>
        <DeprecationBanner />
        <App />
      </ProvideLogging>
    </React.StrictMode>,
  );
}
