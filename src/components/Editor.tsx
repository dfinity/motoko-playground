import { useState, useEffect } from "react";
import styled from "styled-components";
import MonacoEditor, { useMonaco } from "@monaco-editor/react";
import { Button } from "./shared/Button";
import { configureMonaco } from "../config/monacoConfig";
import iconRabbit from "../assets/images/icon-rabbit.png";
import iconCaretDown from "../assets/images/icon-caret-down.svg";

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

export const PanelHeader = styled.header`
  display: flex;
  align-items: center;
  width: 100%;
  flex-shrink: 0;
  height: var(--sectionHeaderHeight);
  padding: 0 1.2rem;
  font-size: 1.2rem;
  font-weight: bold;
  border-bottom: 1px solid var(--borderColor);
  text-transform: uppercase;
`;

const EditorContainer = styled.div`
  height: calc(var(--editorHeight) - 10rem);

  .margin {
    background-color: #ececec !important;
    width: 5.5ch !important;
  }
`;

const LogContainer = styled.div`
  height: 15rem;
`;

const LogHeader = styled(PanelHeader)`
  padding: 0 1rem;
  height: 2.4rem;
  border-top: 1px solid var(--borderColor);
`;

const RightContainer = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: flex-end;
`;

function setMarkers(diags, codeModel, monaco) {
  const markers = {};
  // Object.keys(files).forEach(f => {
  //   markers[f] = [];
  // });
  diags.forEach((d) => {
    if (!markers[d.source]) {
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
    markers[d.source].push(marker);
  });
  Object.entries(markers).forEach(([, marks]) => {
    monaco.editor.setModelMarkers(codeModel, "moc", marks);
  });
}

// @ts-ignore
export function Editor({ fileCode = "", fileName, onSave } = {}) {
  const monaco = useMonaco();
  const [editorCode, setEditorCode] = useState(fileCode);
  const [codeModel, setCodeModel] = useState();

  // When you load a new file
  useEffect(() => {
    setEditorCode(fileCode);
    const model = monaco?.editor.createModel(fileName, "motoko");
    // @ts-ignore
    setCodeModel(model);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileCode]);

  const onEditorChange = (newValue, ev) => {
    setEditorCode(newValue);
    onSave(newValue);
    const diags = Motoko.check(fileName).diagnostics;
    setMarkers(diags, codeModel, monaco);
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
          value={editorCode}
          onChange={onEditorChange}
          beforeMount={configureMonaco}
          options={{
            minimap: { enabled: false },
            wordWrap: "on",
            wrappingIndent: "indent",
          }}
        />
      </EditorContainer>
      <LogContainer>
        <LogHeader>
          Log
          <RightContainer>
            <img src={iconCaretDown} alt="Caret icon" />
          </RightContainer>
        </LogHeader>
        <pre
          style={{
            height: "100%",
            margin: 0,
            padding: "1rem 1.6rem",
            backgroundColor: "#efefef",
          }}
        >
          {`public shared(msg) func bump() : async Nat {
    assert (owner == msg.caller);
    count := 1;
    count;
};`}
        </pre>
      </LogContainer>
    </EditorColumn>
  );
}
