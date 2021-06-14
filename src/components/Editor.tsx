import { useEffect, useState, useCallback } from "react";
import styled from "styled-components";

import Editor, { useMonaco } from "@monaco-editor/react";
import { registerMotoko } from '../motoko';

declare var Motoko: any;

export const Container = styled.div`
  flex: 1;
  padding: var(--gutterWidth);
`;


function setMarkers(diags, codeModel, monaco) {
  const markers = {};
  // Object.keys(files).forEach(f => {
  //   markers[f] = [];
  // });
  diags.forEach(d => {
    if (!markers[d.source]) {
      // possible if the error comes from external packages
      return;
    }
    const severity = d.severity === 1 ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning;
    const marker = {
      startLineNumber: d.range.start.line+1,
      startColumn: d.range.start.character+1,
      endLineNumber: d.range.end.line+1,
      endColumn: d.range.end.character+1,
      message: d.message,
      severity,
    };
    markers[d.source].push(marker);
  });
  Object.entries(markers).forEach(([file, marks]) => {
    monaco.editor.setModelMarkers(codeModel, 'moc', marks);
  });
}

// @ts-ignore
function OurEditor({ fileCode = "", fileName, onSave } = {}) {
  const monaco = useMonaco();
  const [editorCode, setEditorCode] = useState(fileCode);
  const [codeModel, setCodeModel] = useState();


  useEffect(() => {
    if (monaco) {
      registerMotoko(monaco);
    }
  }, [monaco]);

  // When you load a new file
  useEffect(() => {
    setEditorCode(fileCode);
    const model = monaco?.editor.createModel(fileName, 'motoko');
    // @ts-ignore
    setCodeModel(model);
  }, [fileCode]);

  const onEditorChange = (newValue, ev) => {
    setEditorCode(newValue);
    onSave();
    const diags = Motoko.check(fileName).diagnostics;
    setMarkers(diags, codeModel, monaco);
  }

  return (
    <Container>
      <Editor
        height="50vh"
        defaultLanguage="motoko"
        defaultValue={fileCode}
        value={editorCode}
        onChange={onEditorChange}
      />
    </Container>
  )
}

export default OurEditor;
