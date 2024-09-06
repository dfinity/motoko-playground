import { WebContainer } from "@webcontainer/api";
import Convert from "ansi-to-html";
import React from "react";

let containerPromise: Promise<WebContainer> | null = null;
const convert = new Convert();

export const loadContainer = async () => {
  if (!containerPromise) {
    containerPromise = (async () => {
      let container = await WebContainer.boot();
      let files = {
        "package.json": {
          file: {
            contents: JSON.stringify({
              name: "test",
              dependencies: {
                vite: "^4.0.4",
              },
            }),
          },
        },
      };
      await container.mount(files);
      return container;
    })();
  }
  return containerPromise;
};

export async function npmRun(
  logCallback: (line: string | React.ReactNode) => void,
) {
  let container = await loadContainer();
  const installProcess = await container.spawn("npm", ["install"]);
  installProcess.output.pipeTo(
    new WritableStream({
      write(text) {
        text.split("\n").forEach((line) => {
          if (line.trim() !== "") {
            // Convert ANSI to HTML
            const htmlLine = convert.toHtml(line);
            const htmlElement = React.createElement("pre", {
              dangerouslySetInnerHTML: { __html: htmlLine },
            });
            logCallback(htmlElement);
          }
        });
      },
    }),
  );
  const exitCode = await installProcess.exit;
  logCallback(`npm install exited with code ${exitCode}`);
}
