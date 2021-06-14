import styled from "styled-components";
import MonacoEditor from "@monaco-editor/react";
import { configureMonaco } from "../config/monacoConfig";
import { main } from "../examples/fileContents";

const EditorColumn = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: var(--appHeight);
`;

const EditorHeader = styled.header`
  display: flex;
  align-items: center;
  height: 4.8rem;
`;

const EditorContainer = styled.div`
  flex: 1;
  max-height: calc(var(--appHeight) - 10rem);
`;

const LogContainer = styled.div`
  height: 10ch;
  white-space: pre;
`;

export function Editor() {
  return (
    <EditorColumn>
      <EditorHeader>Editor</EditorHeader>
      <EditorContainer>
        <MonacoEditor
          defaultLanguage="motoko"
          defaultValue={main}
          beforeMount={configureMonaco}
          options={{
            minimap: { enabled: false },
            wordWrap: "on",
            wrappingIndent: "indent",
          }}
        />
      </EditorContainer>
      <LogContainer>
        {`public shared(msg) func bump() : async Nat {
    assert (owner == msg.caller);
    count := 1;
    count;
};`}
      </LogContainer>
    </EditorColumn>
  );
}
