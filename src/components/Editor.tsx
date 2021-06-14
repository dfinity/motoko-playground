import { useEffect, useState, useCallback } from "react";
import styled from "styled-components";

import Editor, { useMonaco } from "@monaco-editor/react";
import { registerMotoko } from '../motoko';

export const Container = styled.div`
  flex: 1;
  padding: var(--gutterWidth);
`;

function OurEditor() {
  const monaco = useMonaco();
  const [editorCode, setEditorCode] = useState("// def");

  useEffect(() => {
    if (monaco) {
      registerMotoko(monaco);
    }
  }, [monaco]);

  const onEditorChange = (newValue, ev) => {
    ev.preventDefault();
    setEditorCode(newValue);
  }

  return (
    <Container>
      <Editor
        height="90vh"
        defaultLanguage="motoko"
        defaultValue="// some comment"
        value={editorCode}
        onChange={onEditorChange}
      />
    </Container>
  )
}

export default OurEditor;
