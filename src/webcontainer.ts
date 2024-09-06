import { WebContainer } from "@webcontainer/api";

let containerPromise;

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

export async function npmRun(logCallback: (line: string) => void) {
  let container = await loadContainer();
  const installProcess = await container.spawn("npm", ["install"]);
  installProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        logCallback(data);
        //console.log(data);
      },
    }),
  );
  return new Promise<void>((resolve) => {
    installProcess.exit.then((exitCode) => {
      logCallback(`npm install exited with code ${exitCode}`);
      resolve();
    });
  });
}
