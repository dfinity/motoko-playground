import { fileURLToPath, URL } from "url";
import { resolve } from "path";
import { readFileSync, existsSync } from "node:fs";
import {
  defineConfig,
  loadEnv,
  Plugin,
  createFilter,
  transformWithEsbuild,
} from "vite";
import react from "@vitejs/plugin-react";
import setupProxy from "./src/setupProxy";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import environment from "vite-plugin-environment";
import dotenv from "dotenv";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    build: {
      outDir: "build",
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: [
              "react",
              "react-dom",
              "react-markdown",
              "prettier-plugin-motoko",
            ],
            xterm: ["@xterm/xterm", "@xterm/addon-fit"],
            agent: [
              "@dfinity/agent",
              "@dfinity/candid",
              "@dfinity/principal",
              "@dfinity/identity",
            ],
          },
        },
      },
    },
    plugins: [
      react(),
      environment("all", { prefix: "CANISTER_" }),
      environment("all", { prefix: "DFX_" }),
      wasm(),
      topLevelAwait(),
      devServerPlugin(),
      svgrPlugin(),

      setupProxyPlugin(),
    ],
    define: {
      global: "globalThis",
    },
    worker: {
      format: "es",
    },
    publicDir: "public",
    resolve: {
      alias: [
        {
          find: "declarations",
          replacement: fileURLToPath(
            new URL("./src/declarations", import.meta.url),
          ),
        },
      ],
    },
  };
});

// Setup HOST, SSL, PORT
// Migration guide: Follow the guides below
// https://vitejs.dev/config/server-options.html#server-host
// https://vitejs.dev/config/server-options.html#server-https
// https://vitejs.dev/config/server-options.html#server-port
function devServerPlugin(): Plugin {
  return {
    name: "dev-server-plugin",
    config(_, { mode }) {
      const { HOST, PORT, HTTPS, SSL_CRT_FILE, SSL_KEY_FILE } = loadEnv(
        mode,
        ".",
        ["HOST", "PORT", "HTTPS", "SSL_CRT_FILE", "SSL_KEY_FILE"],
      );
      const https = HTTPS === "true";
      return {
        server: {
          host: HOST || "0.0.0.0",
          port: parseInt(PORT || "3000", 10),
          open: true,
          ...(https &&
            SSL_CRT_FILE &&
            SSL_KEY_FILE && {
              https: {
                cert: readFileSync(resolve(SSL_CRT_FILE)),
                key: readFileSync(resolve(SSL_KEY_FILE)),
              },
            }),
        },
      };
    },
  };
}

// In Create React App, SVGs can be imported directly as React components. This is achieved by svgr libraries.
// https://create-react-app.dev/docs/adding-images-fonts-and-files/#adding-svgs
function svgrPlugin(): Plugin {
  const filter = createFilter("**/*.svg");
  const postfixRE = /[?#].*$/s;

  return {
    name: "svgr-plugin",
    async transform(code, id) {
      if (filter(id)) {
        const { transform } = await import("@svgr/core");
        const { default: jsx } = await import("@svgr/plugin-jsx");

        const filePath = id.replace(postfixRE, "");
        const svgCode = readFileSync(filePath, "utf8");

        const componentCode = await transform(svgCode, undefined, {
          filePath,
          caller: {
            previousExport: code,
            defaultPlugins: [jsx],
          },
        });

        const res = await transformWithEsbuild(componentCode, id, {
          loader: "jsx",
        });

        return {
          code: res.code,
          map: null,
        };
      }
    },
  };
}

// Configuring the Proxy Manually
// https://create-react-app.dev/docs/proxying-api-requests-in-development/#configuring-the-proxy-manually
// https://vitejs.dev/guide/api-plugin.html#configureserver
// Migration guide: Follow the guide below and remove src/setupProxy
// https://vitejs.dev/config/server-options.html#server-proxy
function setupProxyPlugin(): Plugin {
  return {
    name: "setup-proxy-plugin",
    config() {
      return {
        server: { proxy: {} },
      };
    },
    configureServer(server) {
      setupProxy(server.middlewares);
    },
  };
}
