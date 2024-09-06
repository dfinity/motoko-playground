import { WebContainer } from "@webcontainer/api";

let containerPromise: Promise<WebContainer> | null = null;

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

export async function npmRun(terminal) {
  let container = await loadContainer();
  const installProcess = await container.spawn("npm", ["install"]);
  installProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        terminal.write(data);
      },
    }),
  );
  const exitCode = await installProcess.exit;
  terminal.writeln(`\r\nnpm install exited with code ${exitCode}`);
}
