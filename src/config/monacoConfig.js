import { configure } from "motoko/contrib/monaco";
import prettier from "prettier";

const motokoPlugin = import("prettier-plugin-motoko");

export const configureMonaco = (monaco) => {
  configure(monaco, {
    snippets: true,
  });

  motokoPlugin
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
