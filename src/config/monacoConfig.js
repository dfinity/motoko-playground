import { configure } from "motoko/contrib/monaco";
import prettier from "prettier";

const errorCodes = require("motoko/contrib/generated/errorCodes.json");

export const configureMonaco = (monaco) => {
  configure(monaco, {
    snippets: true,
  });

  // Asynchronously load WASM
  import("prettier-plugin-motoko/lib/environments/web")
    .then((motokoPlugin) => {
      monaco.languages.registerDocumentFormattingEditProvider("motoko", {
        provideDocumentFormattingEdits(model, options, token) {
          const source = model.getValue();
          const formatted = prettier.format(source, {
            plugins: [motokoPlugin],
            filepath: "*.mo",
          });
          return [
            {
              range: model.getFullModelRange(),
              text: formatted,
            },
          ];
        },
      });
    })
    .catch((err) => console.error(err));

  const isInDiagnosticRange = (position, diag) => {
    if (
      position.lineNumber < diag.startLineNumber ||
      position.lineNumber > diag.endLineNumber
    ) {
      return false;
    }
    if (
      position.lineNumber === diag.startLineNumber &&
      position.column < diag.startColumn
    ) {
      return false;
    }
    if (
      position.lineNumber === diag.endLineNumber &&
      position.column >= diag.endColumn
    ) {
      return false;
    }
    return true;
  };

  monaco.languages.registerHoverProvider("motoko", {
    provideHover(model, position) {
      for (const diag of monaco.editor.getModelMarkers()) {
        const explanation = errorCodes[diag.code];
        if (explanation && isInDiagnosticRange(position, diag)) {
          return {
            contents: [
              {
                value: explanation,
              },
            ],
          };
        }
      }
    },
  });
};
