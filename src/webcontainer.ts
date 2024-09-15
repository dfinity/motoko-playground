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
      this.container = await WebContainer.boot({
        coep: "credentialless",
        workdirName: "playground",
      });
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
  async writeFile(
    path: string,
    contents: string | Uint8Array,
    options?:
      | string
      | {
          encoding?: string;
        },
  ) {
    await this.init();
    await this.container!.fs.writeFile(path, contents, options);
  }
  async mkdir(
    path: string,
    options?: {
      recursive?: boolean;
    },
  ) {
    await this.init();
    await this.container!.fs.mkdir(path, options);
  }
  private async spawn(cmd: string, args: string[], options?: SpawnOptions) {
    const new_options = {
      ...options,
      terminal: {
        cols: this.terminal.cols,
        rows: this.terminal.rows,
      },
    };
    const process = await this.container!.spawn(cmd, args, new_options);
    return process;
  }
  async start_shell() {
    await this.init();
    const process = await this.spawn("jsh", []);
    process.output.pipeTo(
      new WritableStream({
        write: (data) => {
          if (data.includes("command not found: moc")) {
            this.terminal.writeln("haha, you called moc!");
          } else {
            this.terminal.write(data);
          }
        },
      }),
    );
    const input = process.input.getWriter();
    this.terminal.onData((data) => {
      input.write(data);
    });
    return process;
  }
  async run_cmd(cmd: string, args: string[], options?: SpawnOptions) {
    await this.init();
    if (options?.output ?? true) {
      this.terminal.writeln(`/${options?.cwd ?? ""}$ ${cmd} ${args.join(" ")}`);
    }
    const process = await this.spawn(cmd, args, options);
    process.output.pipeTo(
      new WritableStream({
        write: (data) => {
          this.terminal.write(data);
        },
      }),
    );
    const exitCode = await process.exit;
    if (exitCode !== 0) {
      this.terminal.writeln(`\r\nexited with code ${exitCode}`);
      throw new Error(`Command failed with code ${exitCode}`);
    }
  }
}
