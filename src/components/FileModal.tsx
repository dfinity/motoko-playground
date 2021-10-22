import styled from "styled-components";
import { useState, useContext, useEffect } from "react";
import { Modal } from "./shared/Modal";
import { Button } from "./shared/Button";

import {
  WorkerContext,
  WorkplaceDispatchContext,
} from "../contexts/WorkplaceState";
import { Field } from "./shared/Field";

const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 34rem;
  font-size: 1.6rem;
  font-weight: 500;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 3rem;
`;

const MyButton = styled(Button)`
  width: 14rem;
`;

export function FileModal({ isOpen, close, filename: initialFilename = "" }) {
  const [fileName, setFileName] = useState(initialFilename);

  // Make sure local fileName stays in sync with whatever was passed in
  useEffect(() => {
    if (initialFilename !== fileName) {
      setFileName(initialFilename);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilename]);

  const worker = useContext(WorkerContext);
  const dispatch = useContext(WorkplaceDispatchContext);

  const isRename = Boolean(initialFilename);
  const name = fileName.endsWith(".mo") ? fileName : `${fileName}.mo`;

  async function addFile() {
    await worker.Moc({ type: "save", file: name, content: "" });
    await dispatch({ type: "saveFile", payload: { path: name, contents: "" } });
    await dispatch({ type: "selectFile", payload: { path: name } });
    close();
  }

  async function renameFile() {
    if (initialFilename !== fileName) {
      await dispatch({
        type: "renameFile",
        payload: { path: initialFilename, newPath: name },
      });
      await worker.Moc({ type: "rename", old: initialFilename, new: name });
      await dispatch({ type: "selectFile", payload: { path: name } });
    }
    close();
  }

  return (
    <Modal
      isOpen={isOpen}
      close={close}
      label="Add file"
      shouldCloseOnEsc
      shouldCloseOnOverlayClick
    >
      <ModalContainer>
        <p style={{ marginBottom: "2rem" }}>
          {isRename ? (
            <>
              Rename <code>{initialFilename}</code>
            </>
          ) : (
            "Add a new file"
          )}
        </p>
        <Field
          type="text"
          labelText="Filename"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          autoFocus
        />
        <ButtonContainer>
          {isRename ? (
            <MyButton variant="primary" onClick={renameFile}>
              Rename
            </MyButton>
          ) : (
            <MyButton variant="primary" onClick={addFile}>
              Add
            </MyButton>
          )}
          <MyButton onClick={close}>Cancel</MyButton>
        </ButtonContainer>
      </ModalContainer>
    </Modal>
  );
}
