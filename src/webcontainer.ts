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
              scripts: {
                build: "vite build",
                dev: "vite",
              },
            }),
          },
        },
        "index.html": {
          file: {
            contents: "<p>Hello Vite!</p>",
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
  let container = await loadContainer();
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
