import { configure } from "motoko/contrib/monaco";
import prettier from "prettier";
import * as motokoPlugin from "prettier-plugin-motoko/src/environments/web";
import errorCodes from "motoko/contrib/generated/errorCodes.json";

export const configureMonaco = (monaco) => {
  configure(monaco, {
    snippets: true,
  });

  monaco.languages.registerDocumentFormattingEditProvider("motoko", {
    async provideDocumentFormattingEdits(model, options, token) {
      const source = model.getValue();
      const formatted = await prettier.format(source, {
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

  monaco.languages.registerHoverProvider("motoko", {
    provideHover(model, position, ...args) {
      for (const diag of monaco.editor.getModelMarkers()) {
        const range = new monaco.Range(
          diag.startLineNumber,
          diag.startColumn,
          diag.endLineNumber,
          diag.endColumn,
        );
        const explanation = errorCodes[diag.code];
        if (explanation && range.containsPosition(position)) {
          return {
            range,
            contents: [
              {
                value: `\`\`\`text\n${diag.message}\n\`\`\``,
              },
              {
                // Remove Markdown heading from explanation
                value: explanation.replace(/^# M[0-9]+\s+/, ""),
              },
            ],
          };
        }
      }
    },
  });
};
