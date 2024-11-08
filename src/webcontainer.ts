import { WebContainer, FileSystemTree, SpawnOptions } from "@webcontainer/api";
import { Terminal } from "@xterm/xterm";

export class Container {
  public container: WebContainer | null = null;
  public isDummy = false;
  private terminal: Terminal;

  constructor(terminal: Terminal) {
    this.terminal = terminal;
  }

  async init() {
    if (this.isDummy) {
      return;
    }
    if (!this.container) {
      try {
        this.container = await WebContainer.boot({
          coep: "credentialless",
          workdirName: "playground",
        });
      } catch (err) {
        this.isDummy = true;
        console.error(err);
      }
    }
    return this.container;
  }

  async initFiles() {
    await this.init();
    if (this.isDummy) {
      return;
    }
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
  async mount(files: FileSystemTree, options?: { mountPoint?: string }) {
    await this.init();
    if (this.isDummy) {
      return;
    }
    await this.container!.mount(files, options);
  }
  async rm(path: string, options?: { recursive?: boolean; force?: boolean }) {
    await this.init();
    if (this.isDummy) {
      return;
    }
    await this.container!.fs.rm(path, options);
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
    if (this.isDummy) {
      return;
    }
    await this.container!.fs.writeFile(path, contents, options);
  }
  async mkdir(
    path: string,
    options?: {
      recursive?: boolean;
    },
  ) {
    await this.init();
    if (this.isDummy) {
      return;
    }
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
    if (this.isDummy) {
      this.terminal.writeln(
        "WebContainer fails to initialize. Frontend build is disabled.",
      );
      return;
    }
    const userAgent = navigator.userAgent.toLowerCase();
    // TODO: double check the browsers listed here indeed works
    const isChromiumBased = [
      "chrome",
      "edge",
      "brave",
      "opera",
      "duckduckgo",
      "vivaldi",
    ].some((browser) => userAgent.indexOf(browser) > -1);
    const isMobile =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent,
      );
    if (!isChromiumBased || isMobile) {
      this.terminal.writeln(
        `You are using ${isMobile ? "a mobile browser" : userAgent}.
Some terminal commands may not work. Please consider using a desktop Chromium-based browser like Chrome, Edge, or Brave.`,
      );
    }
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
    if (this.isDummy) {
      return;
    }
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
