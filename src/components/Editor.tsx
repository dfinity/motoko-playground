import { useEffect, useState, useCallback } from "react";
import styled from "styled-components";

import Editor, { useMonaco } from "@monaco-editor/react";
import { registerMotoko } from '../motoko';

export const Container = styled.div`
  flex: 1;
  padding: var(--gutterWidth);
`;

function OurEditor({ fileCode = "" } = {}) {
  const monaco = useMonaco();
  const [editorCode, setEditorCode] = useState(fileCode);

  useEffect(() => {
    if (monaco) {
      registerMotoko(monaco);
    }
  }, [monaco]);

  // When you load a new file
  useEffect(() => {
    setEditorCode(fileCode);
  }, [fileCode]);

  const onEditorChange = (newValue, ev) => {
    ev.preventDefault();
    setEditorCode(newValue);
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
