import styled from "styled-components";
import { useState, useContext } from "react";
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

export function FileModal({ isOpen, close }) {
  const [fileName, setFileName] = useState("");
  const worker = useContext(WorkerContext);
  const dispatch = useContext(WorkplaceDispatchContext);

  async function tryAddFile() {
    if (!fileName) {
      return;
    }
    const name = fileName.endsWith(".mo") ? fileName : `${fileName}.mo`;
    await worker.Moc({ type: "save", file: name, content: "" });
    await dispatch({ type: "saveFile", payload: { path: name, contents: "" } });
    await dispatch({ type: "selectFile", payload: { path: name } });
    await close();
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
        <p style={{ marginBottom: "2rem" }}>Add a new file</p>
        <Field
          type="text"
          labelText="Filename"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && tryAddFile()}
          autoFocus
        />
        <ButtonContainer>
          <Button variant="primary" onClick={tryAddFile}>
            Add
          </Button>
          <Button onClick={close}>Cancel</Button>
        </ButtonContainer>
      </ModalContainer>
    </Modal>
  );
}
