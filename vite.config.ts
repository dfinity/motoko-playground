import { fileURLToPath, URL } from 'url';
import { resolve } from "path";
import { readFileSync, existsSync } from "node:fs";
import { defineConfig, loadEnv, Plugin, createFilter, transformWithEsbuild } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import setupProxy from "./src/setupProxy";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import environment from 'vite-plugin-environment';
import dotenv from 'dotenv';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  setEnv(mode);
  return {
	build: {
		outDir: "build",
		emptyOutDir: true,
		rollupOptions: {
			input: {
			  main: resolve(__dirname, 'index.html'),
			  moc: resolve(__dirname, 'src/workers/moc.ts'),
			},
			external: ["/moc.js"],
		},		
	},
    plugins: [
      react(),
	  environment("all", { prefix: "CANISTER_" }),
	  environment("all", { prefix: "DFX_" }),
      wasm(),
      topLevelAwait(),	  
      tsconfigPaths(),
      devServerPlugin(),
      sourcemapPlugin(),
      htmlPlugin(mode),
      svgrPlugin(),
      
      setupProxyPlugin(),
    ],
	worker: {
		format: "es",
	},
	publicDir: 'public',
    optimizeDeps: {
		esbuildOptions: {
			define: {
			  global: "globalThis",
			},
		},		
		exclude: ["prettier-plugin-motoko", "src/workers/moc.ts", "src/workers/mocShim.js"],
	},
	resolve: {
		alias: [
		  {
			find: "declarations",
			replacement: fileURLToPath(
			  new URL("./src/declarations", import.meta.url)
			),
		  },
		],
	},
  };
});

function setEnv(mode: string) {
	Object.assign(
		process.env,
		loadEnv(mode, ".", ["REACT_APP_", "NODE_ENV", "PUBLIC_URL"]),
	);
	process.env.NODE_ENV ||= mode;
	const { homepage } = JSON.parse(readFileSync("package.json", "utf-8"));
	process.env.PUBLIC_URL ||= homepage
		? `${
				homepage.startsWith("http") || homepage.startsWith("/")
					? homepage
					: `/${homepage}`
			}`.replace(/\/$/, "")
		: "";
}

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

// Migration guide: Follow the guide below
// https://vitejs.dev/config/build-options.html#build-sourcemap
function sourcemapPlugin(): Plugin {
	return {
		name: "sourcemap-plugin",
		config(_, { mode }) {
			const { GENERATE_SOURCEMAP } = loadEnv(mode, ".", [
				"GENERATE_SOURCEMAP",
			]);
			return {
				build: {
					sourcemap: GENERATE_SOURCEMAP === "true",
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

// Replace %ENV_VARIABLES% in index.html
// https://vitejs.dev/guide/api-plugin.html#transformindexhtml
// Migration guide: Follow the guide below, you may need to rename your environment variable to a name that begins with VITE_ instead of REACT_APP_
// https://vitejs.dev/guide/env-and-mode.html#html-env-replacement
function htmlPlugin(mode: string): Plugin {
	const env = loadEnv(mode, ".", ["REACT_APP_", "NODE_ENV", "PUBLIC_URL"]);
	return {
		name: "html-plugin",
		transformIndexHtml: {
			order: "pre",
			handler(html) {
				return html.replace(/%(.*?)%/g, (match, p1) => env[p1] ?? match);
			},
		},
	};
}
