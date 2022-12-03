import { configure } from "motoko/contrib/monaco";
import prettier from "prettier";

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
};
