import { WebContainer } from "@webcontainer/api";

import packageJson from "./node/package.json?raw";
import uploadAsset from "./node/uploadAsset.js?raw";

let containerPromise: Promise<WebContainer> | null = null;

export const loadContainer = async () => {
  if (!containerPromise) {
    containerPromise = (async () => {
      let container = await WebContainer.boot();
      let files = {
        etc: {
          directory: {
            hosts: {
              file: {
                contents: "127.0.0.1 mylocalhost.com",
              },
            },
          },
        },
        "package.json": {
          file: {
            contents: packageJson,
          },
        },
        "index.html": {
          file: {
            contents: "<p>Hello World</p>",
          },
        },
        "uploadAsset.js": {
          file: {
            contents: uploadAsset,
          },
        },
      };
      await container.mount(files);
      return container;
    })();
  }
  return containerPromise;
};

export async function run_cmd(terminal, cmd: string, args: string[]) {
  const container = await loadContainer();
  terminal.writeln(`$ ${cmd} ${args}`);
  const installProcess = await container.spawn(cmd, args);
  installProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        terminal.write(data);
        terminal.scrollToBottom();
      },
    }),
  );
  const exitCode = await installProcess.exit;
  terminal.writeln(`\r\nexited with code ${exitCode}`);
}
