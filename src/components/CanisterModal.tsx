import styled from "styled-components";
import { useState, useEffect, useContext } from "react";
import { Modal } from "./shared/Modal";
import { Button } from "./shared/Button";
import { Principal } from "@dfinity/principal";

import { WorkerContext, WorkplaceDispatchContext } from "../contexts/WorkplaceState";
import { fetchCandidInterface } from "../config/actor";
import { CanisterInfo } from "../build";

const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 40rem;
  font-size: 1.6rem;
  font-weight: 500;
`;
const Item = styled.div`
  margin: 1rem;
`;
const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;
const MyButton = styled(Button)`
  margin: 2rem 2rem 0 0;
`;

export function CanisterModal({ isOpen, close }) {
  const [canisterName, setCanisterName] = useState("");
  const [canisterId, setCanisterId] = useState("");
  const [candid, setCandid] = useState("");
  const [uploadDid, setUploadDid] = useState(false);
  const [error, setError] = useState("");
  const worker = useContext(WorkerContext);
  const dispatch = useContext(WorkplaceDispatchContext);

  useEffect(() => {
    setUploadDid(false);
  }, [canisterId]);
  
  async function validateAndSetId(e) {
    const id = e.target.value;
    await setCanisterId(id);
    try {
      const cid = Principal.fromText(id);
      const candid = await fetchCandidInterface(cid);
      setCandid(candid);
      setError("");
    } catch (err) {
      if (/no query method/.test(err)) {
        setCandid("");
        setUploadDid(true);
        setError("");
      } else if (/not found/.test(err)) {
        setError("Canister id not found");
      } else if (/valid checksum/.test(err)) {
        setError("Not a valid principal");
      } else {
        setError(err.message);
      }
    }
  }
  
  async function addCanister() {
    if (error || !canisterName || !canisterId || !candid) {
      return;
    }
    const id = Principal.fromText(canisterId);
    const info: CanisterInfo = {
      id,
      name: canisterName,
      candid,
    };
    await worker.Moc({ type: "save", file: `idl/${canisterId}.did`, content: candid });
    await dispatch({ type: "deployWorkplace", payload: { canister: info } });
    await close();
  }
  
  return (
      <Modal isOpen={isOpen} close={close} label="Import canister" shouldCloseOnEsc={true}>
      <ModalContainer>
      <Item>Import an external canister</Item>
      <Item>Canister name &nbsp;
      <input type="text" value={canisterName} onChange={(e) => setCanisterName(e.target.value)} /></Item>
      <Item>Canister ID &nbsp;
      <input type="text" value={canisterId} onChange={validateAndSetId} /></Item>
      {error ? (<Item>{error}</Item>) : null}
      {uploadDid ? (
          <Item>Upload did file &nbsp;
          <input type="file" style={{width: "25rem"}} accept=".did" onChange={(e) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
              setCandid(reader.result);
            });
            reader.readAsText(e.target.files[0]);
          }} /></Item>)
       : null}
      <ButtonContainer>
      <MyButton onClick={addCanister}>Add</MyButton>
      <MyButton onClick={close}>Cancel</MyButton>
      </ButtonContainer>
      </ModalContainer>
      </Modal>
  );
}
