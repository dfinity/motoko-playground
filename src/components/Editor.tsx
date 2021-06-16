import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import MonacoEditor, { useMonaco } from "@monaco-editor/react";
import throttle from "lodash.throttle";
import debounce from "lodash.debounce";

import { Button } from "./shared/Button";
import { PanelHeader } from "./shared/PanelHeader";
import { RightContainer } from "./shared/RightContainer";
import { configureMonaco } from "../config/monacoConfig";
import { Console } from "./Console";
import iconRabbit from "../assets/images/icon-rabbit.png";

declare var Motoko: any;

const EditorColumn = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: var(--appHeight);
  border: 1px solid var(--borderColor);
  border-top: none;
  border-bottom: none;
`;

const EditorContainer = styled.div`
  height: calc(var(--editorHeight) - 10rem);

  .margin {
    background-color: #ececec !important;
    width: 5.5ch !important;
  }
`;


function setMarkers(diags, codeModel, monaco, editor, fileName) {
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
    // @ts-ignore
    markers.push(marker);
  });
  markers.forEach(marks => {
    monaco.editor.setModelMarkers(codeModel, "moc", marks);
    console.log('marker set', codeModel);
  });
}

// @ts-ignore
export function Editor({ fileCode = "", fileName, onSave } = {}) {
  const monaco = useMonaco();
  const editorRef = useRef(null);

  const onMount = (editor, monaco) => {
    editorRef.current = editor;
  }

  const saveChanges = (newValue) => {
    onSave(newValue);
    // if (!codeModel) codeModel = monaco?.editor.getModel();
    // @ts-ignore
    const check = Motoko.check(fileName);
    const diags = check.diagnostics;
    // console.log('after check', diags)
    // @ts-ignore
    setMarkers(diags, editorRef.current?.getModel(), monaco, editorRef.current, fileName);
    console.log('after marks', editorRef);
    console.log('after marks', monaco);
  }

  const debouncedSaveChanges = debounce(saveChanges, 1000, { leading: false });

  const onEditorChange = (newValue, ev) => {
    debouncedSaveChanges(newValue);
  };

  return (
    <EditorColumn>
      <PanelHeader>
        Editor
        <RightContainer>
          <Button kind="primary" small>
            <img src={iconRabbit} alt="Rabbit icon" />
            <p>Deploy</p>
          </Button>
        </RightContainer>
      </PanelHeader>
      <EditorContainer>
        <MonacoEditor
          defaultLanguage="motoko"
          defaultValue={fileCode}
          path={fileName}
          value={fileCode}
          onChange={onEditorChange}
          beforeMount={configureMonaco}
          onMount={onMount}
          options={{
            minimap: { enabled: false },
            wordWrap: "on",
            wrappingIndent: "indent",
          }}
        />
      </EditorContainer>
      <Console />
    </EditorColumn>
  );
}
