import { WebContainer, FileSystemTree, SpawnOptions } from "@webcontainer/api";
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
    const utilsFiles: FileSystemTree = Object.entries(nodeFiles).reduce(
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
    const files: FileSystemTree = {
      utils: {
        directory: utilsFiles,
      },
      user: {
        directory: {},
      },
      etc: {
        directory: {
          hosts: {
            file: {
              contents: "127.0.0.1 mylocalhost.com",
            },
          },
        },
      },
    };
    await this.container!.mount(files);
  }

  async run_cmd(cmd: string, args: string[], options?: SpawnOptions) {
    await this.init();
    if (options?.output ?? true) {
      this.terminal.writeln(`/${options?.cwd ?? ""}$ ${cmd} ${args.join(" ")}`);
    }
    const installProcess = await this.container!.spawn(cmd, args, options);
    installProcess.output.pipeTo(
      new WritableStream({
        write: (data) => {
          this.terminal.write(data);
        },
      }),
    );
    const exitCode = await installProcess.exit;
    if (exitCode !== 0) {
      this.terminal.writeln(`\r\nexited with code ${exitCode}`);
      throw new Error(`Command failed with code ${exitCode}`);
    }
  }
}