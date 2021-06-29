import { useEffect, useState } from "react";
import styled from "styled-components";
import MonacoEditor, { useMonaco } from "@monaco-editor/react";
import debounce from "lodash.debounce";

import { Button } from "./shared/Button";
import { PanelHeader } from "./shared/PanelHeader";
import { RightContainer } from "./shared/RightContainer";
import { configureMonaco } from "../config/monacoConfig";
import { Console } from "./Console";
import iconRabbit from "../assets/images/icon-rabbit.png";
import { DeployModal } from "./DeployModal";
import { saveWorkplaceToMotoko } from "../file";

declare var Motoko: any;

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

const EditorContainer = styled.div`
  height: calc(var(--editorHeight) - 10rem);

  .margin {
    background-color: var(--grey200) !important;
    width: 5.5ch !important;
  }
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
    // TODO we're currently only saving marks for current file is that OK?
    // @ts-ignore
    markers.push(marker);
  });

  monaco.editor.setModelMarkers(codeModel, "moc", markers);
}

// @ts-ignore
export function Editor({ state, onSave, onDeploy, logger } = {}) {
  const [showModal, setShowModal] = useState(false);

  const fileName = state.selectedFile;
  const fileCode = fileName?state.files[fileName]:"";
  const mainFile = fileName.endsWith('.mo')?fileName:"Main.mo";
  const monaco = useMonaco();
  const checkFileAddMarkers = () => {
    if (!fileName.endsWith('mo') || !Motoko) return;
    const check = Motoko.check(fileName);
    const diags = check.diagnostics;
    setMarkers(
      diags,
      // @ts-ignore
      monaco?.editor.getModel(`file:///${fileName}`),
      monaco,
      fileName
    );
  }
  const saveChanges = (newValue) => {
    onSave(newValue);
    if (!fileName.endsWith('mo') || !Motoko) return;
    // This has to happen sync so the check Motoko has updated file when checking.
    Motoko.saveFile(fileName, newValue);
    checkFileAddMarkers();
  };

  const debouncedSaveChanges = debounce(saveChanges, 1000, { leading: false });

  const onEditorChange = (newValue) => {
    debouncedSaveChanges(newValue);
  };
  const deployClick = () => {
    // TODO don't pass readme non-mo files to motoko    
    saveWorkplaceToMotoko(state.files);
    // TODO candid
    setShowModal(true);
  };

  useEffect(() => {
    if (!monaco) return;
    checkFileAddMarkers();
  }, [monaco, fileName]);

  return (
    <EditorColumn>
      <DeployModal
        isOpen={showModal}
        close={() => setShowModal(false)}
        onDeploy={onDeploy}
        canisters={state.canisters}
        fileName={mainFile}
        logger={logger}
      />
      <PanelHeader>
        Editor
        <RightContainer>
        <Button onClick={deployClick} kind="primary" small>
            <img src={iconRabbit} alt="Rabbit icon" />
            <p>Deploy</p>
          </Button>
        </RightContainer>
      </PanelHeader>
      <EditorContainer>
        <MonacoEditor
          defaultLanguage="motoko"
          language={fileName === "README" ? "markdown" : "motoko"}
          value={fileCode}
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
      <Console />
    </EditorColumn>
  );
}
