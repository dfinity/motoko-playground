import { configure } from "motoko/contrib/monaco";
import prettier from "prettier";
import snippets from "./snippets.json"; // TODO: share with VS Code extension

export const configureMonaco = (monaco) => {
  configure(monaco);

  // Add code snippets
  monaco.languages.registerCompletionItemProvider("motoko", {
    provideCompletionItems() {
      return {
        suggestions: Object.entries(snippets).map(([name, snippet]) => {
          return {
            label:
              typeof snippet.prefix === "string"
                ? snippet.prefix
                : snippet.prefix[0],
            detail: name,
            insertText:
              typeof snippet.body === "string"
                ? snippet.body
                : snippet.body.join("\n"),
            // insert as snippet (https://microsoft.github.io/monaco-editor/api/enums/monaco.languages.CompletionItemInsertTextRule.html)
            insertTextRules: 4,
            // snippet completion (https://microsoft.github.io/monaco-editor/api/enums/monaco.languages.CompletionItemKind.html)
            kind: 27,
          };
        }),
      };
    },
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
};
