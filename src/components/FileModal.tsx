import styled from "styled-components";
import { useState, useContext } from "react";
import { Modal } from "./shared/Modal";
import { Button } from "./shared/Button";

import { WorkerContext, WorkplaceDispatchContext } from "../contexts/WorkplaceState";

const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 25rem;
  font-size: 1.6rem;
  font-weight: 500;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;
const MyButton = styled(Button)`
  margin: 2rem 2rem 0 0;
`;

export function FileModal({ isOpen, close }) {
  const [fileName, setFileName] = useState("");
  const worker = useContext(WorkerContext);
  const dispatch = useContext(WorkplaceDispatchContext);

  async function addFile() {
    const name = fileName.endsWith(".mo") ? fileName : `${fileName}.mo`;
    await worker.Moc({ type: "save", file: name, content: "" });
    await dispatch({ type: "saveFile", payload: { path: name, contents: "" } });
    await dispatch({ type: "selectFile", payload: { path: name } });
    await close();
  }
  
  return (
      <Modal isOpen={isOpen} close={close} label="Add file" shouldCloseOnEsc={true}>
      <ModalContainer>
      <p>Add a new file name</p>
      <input type="text" value={fileName} autoFocus={true} onChange={(e) => setFileName(e.target.value)} />
      <ButtonContainer>
      <MyButton onClick={addFile}>Add</MyButton>
      <MyButton onClick={close}>Cancel</MyButton>      
      </ButtonContainer>
      </ModalContainer>
      </Modal>
  );
}
