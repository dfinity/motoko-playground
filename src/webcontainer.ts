import { WebContainer, FileSystemTree } from "@webcontainer/api";
import { Terminal } from "@xterm/xterm";

export class Container {
  public container: WebContainer | null = null;
  private terminal: Terminal;

  constructor(terminal: Terminal) {
    this.terminal = terminal;
  }

  async init() {
    if (!this.container) {
      this.container = await WebContainer.boot();
    }
    return this.container;
  }

  async initFiles() {
    await this.init();
    const nodeFiles = import.meta.glob("./node/*", {
      query: "?raw",
      import: "default",
      eager: true,
    });
    const files: FileSystemTree = Object.entries(nodeFiles).reduce(
      (acc, [key, value]) => {
        const fileName = key.replace("./node/", "");
        acc[fileName] = {
          file: {
            contents: value,
          },
        };
        return acc;
      },
      {},
    );
    files["etc"] = {
      directory: {
        hosts: {
          file: {
            contents: "127.0.0.1 mylocalhost.com",
          },
        },
      },
    };
    files["index.html"] = {
      file: {
        contents: "<p>Hello World</p>",
      },
    };
    await this.container!.mount(files);
  }

  async run_cmd(cmd: string, args: string[]) {
    await this.init();
    this.terminal.writeln(`$ ${cmd} ${args.join(" ")}`);
    const installProcess = await this.container!.spawn(cmd, args);
    installProcess.output.pipeTo(
      new WritableStream({
        write: (data) => {
          this.terminal.write(data);
        },
      }),
    );
    const exitCode = await installProcess.exit;
    this.terminal.writeln(`\r\nexited with code ${exitCode}`);
  }
}
