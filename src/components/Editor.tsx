import { useEffect, useState, useContext } from "react";
import styled from "styled-components";
import MonacoEditor, { useMonaco } from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import debounce from "lodash.debounce";
import { IDL } from "@dfinity/candid";

import { Button } from "./shared/Button";
import { PanelHeader } from "./shared/PanelHeader";
import { RightContainer } from "./shared/RightContainer";
import { configureMonaco } from "../config/monacoConfig";
import { Console } from "./Console";
import iconRabbit from "../assets/images/icon-rabbit.png";
import iconSpin from "../assets/images/icon-spin.gif";
import {
  getActorAliases,
  WorkerContext,
  WorkplaceDispatchContext,
} from "../contexts/WorkplaceState";
import { compileCandid } from "../build";
import { didToJs } from "../config/actor";

const EditorColumn = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: var(--appHeight);
  border: 1px solid var(--grey300);
  border-top: none;
  border-bottom: none;
  max-width: calc(100vw - var(--explorerWidth) - var(--candidWidth));
`;

const EditorContainer = styled.div<{ isHidden: boolean }>`
  height: calc(var(--editorHeight) - var(--consoleHeight) - 2.4rem);

  .margin {
    background-color: var(--grey200) !important;
    width: 5.5ch !important;
  }
  ${(props) => (props.isHidden ? "display: none;" : "")}
`;
const MarkdownContainer = styled(EditorContainer)`
  overflow: auto;
  padding: 2rem;
`;

function setMarkers(diags, codeModel, monaco, fileName) {
  const markers = [];
  diags.forEach((d) => {
    if (d.source !== fileName) {
      // possible if the error comes from external packages
      return;
    }
    const severity =
      d.severity === 1
        ? monaco.MarkerSeverity.Error
        : monaco.MarkerSeverity.Warning;
    const marker = {
      startLineNumber: d.range.start.line + 1,
      startColumn: d.range.start.character + 1,
      endLineNumber: d.range.end.line + 1,
      endColumn: d.range.end.character + 1,
      message: d.message,
      severity,
    };
    // Okay to push error for current file only, because we run checkFile when selectedFile changes
    // @ts-ignore
    markers.push(marker);
  });

  monaco.editor.setModelMarkers(codeModel, "moc", markers);
}

export function Editor({
  state,
  logger,
  setConsoleHeight,
  deploySetter,
  isDeploying,
}) {
  const worker = useContext(WorkerContext);
  const dispatch = useContext(WorkplaceDispatchContext);

  const fileName = state.selectedFile;
  const fileCode = fileName ? state.files[fileName] : "";
  // TODO
  const mainFile = fileName.endsWith(".mo")
    ? fileName
    : state.files["Main.mo"]
    ? "Main.mo"
    : "";

  const monaco = useMonaco();
  const checkFileAddMarkers = async () => {
    if (!fileName || !fileName.endsWith("mo")) return;
    const check = await worker.Moc({ type: "check", file: fileName });
    const diags = check.diagnostics;
    setMarkers(
      diags,
      // @ts-ignore
      monaco?.editor.getModel(`file:///${fileName}`),
      monaco,
      fileName
    );
  };
  const saveChanges = async (newValue) => {
    dispatch({
      type: "saveFile",
      payload: {
        path: fileName,
        contents: newValue,
      },
    });
    if (!fileName.endsWith("mo")) return;
    await worker.Moc({ type: "save", file: fileName, content: newValue });
    await checkFileAddMarkers();
  };

  const debouncedSaveChanges = debounce(saveChanges, 1000, { leading: false });

  const onEditorChange = (newValue) => {
    debouncedSaveChanges(newValue);
  };
  const deployClick = async () => {
    const aliases = getActorAliases(state.canisters);
    await worker.saveWorkplaceToMotoko(state.files);
    await worker.Moc({ type: "setActorAliases", list: aliases });
    if (!mainFile) {
      logger.log("Select a main entry file to deploy");
    }
    const candid = await compileCandid(worker, mainFile, logger);
    if (candid) {
      const candidJS = await didToJs(candid);
      const init = candidJS.init({ IDL });
      await deploySetter.setInitTypes(init);
      await deploySetter.setCandidCode(candid);
      await deploySetter.setWasm(undefined);
      await deploySetter.setMainFile(mainFile);
      await deploySetter.setShowDeployModal(true);
    }
  };

  useEffect(() => {
    if (!monaco) return;
    checkFileAddMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monaco, state]);

  return (
    <EditorColumn>
      <PanelHeader>
        Editor
        <RightContainer>
          <Button
            onClick={deployClick}
            disabled={isDeploying}
            variant="primary"
            small
          >
            <img src={isDeploying ? iconSpin : iconRabbit} alt="Rabbit icon" />
            <p>{isDeploying ? "Deploying..." : "Deploy"}</p>
          </Button>
        </RightContainer>
      </PanelHeader>
      <MarkdownContainer isHidden={fileName !== "README"}>
        <ReactMarkdown linkTarget="_blank">
          {fileName === "README" ? fileCode : ""}
        </ReactMarkdown>
      </MarkdownContainer>
      <EditorContainer isHidden={fileName === "README"}>
        <MonacoEditor
          defaultLanguage={"motoko"}
          value={fileName === "README" ? "" : fileCode}
          path={fileName}
          onChange={onEditorChange}
          beforeMount={configureMonaco}
          options={{
            minimap: { enabled: false },
            wordWrap: "on",
            wrappingIndent: "indent",
            scrollBeyondLastLine: false,
            fontSize: 16,
          }}
        />
      </EditorContainer>
      <Console setConsoleHeight={setConsoleHeight} />
    </EditorColumn>
  );
}
