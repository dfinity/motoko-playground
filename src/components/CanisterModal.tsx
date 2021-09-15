import styled from "styled-components";
import { useState, useEffect, useContext } from "react";
import { Modal } from "./shared/Modal";
import { Button } from "./shared/Button";
import { Principal } from "@dfinity/principal";

import {
  WorkerContext,
  WorkplaceDispatchContext,
} from "../contexts/WorkplaceState";
import { fetchCandidInterface, didjs } from "../config/actor";
import { CanisterInfo } from "../build";
import { canisterSet } from "../config/canister-set";
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
const Title = styled.div`
  margin: 1rem 0;
`;
const FormContainer = styled.div`
  margin-top: 2rem;
  padding: 0 2rem;
  width: 100%;
`;
const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 3rem;
`;

const MyButton = styled(Button)`
  width: 10rem;
`;

export function CanisterModal({ isOpen, close }) {
  const [canisterName, setCanisterName] = useState("");
  const [canisterId, setCanisterId] = useState("");
  const [candid, setCandid] = useState("");
  const [uploadDid, setUploadDid] = useState(false);
  const [error, setError] = useState("");
  const [genBinding, setGenBinding] = useState(false);
  const worker = useContext(WorkerContext);
  const dispatch = useContext(WorkplaceDispatchContext);

  useEffect(() => {
    setUploadDid(false);
  }, [canisterId]);

  async function validateAndSetId(e) {
    const id = e.target.value;
    await setCanisterId(id);
    let candid;
    try {
      const cid = Principal.fromText(id);
      if (canisterSet.hasOwnProperty(id)) {
        const canister = canisterSet[id];
        setCanisterName(canister.name);
        candid = canister.candid;
      }
      if (!candid) {
        candid = await fetchCandidInterface(cid);
      }
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
      isExternal: true,
      name: canisterName,
      candid,
    };
    await worker.Moc({
      type: "save",
      file: `idl/${canisterId}.did`,
      content: candid,
    });
    await dispatch({ type: "deployWorkplace", payload: { canister: info } });
    if (genBinding) {
      const file = canisterName + ".mo";
      const content = (await didjs.binding(candid, "mo"))[0];
      await worker.Moc({ type: "save", file, content });
      await dispatch({
        type: "saveFile",
        payload: { path: file, contents: content },
      });
    }
    await close();
  }

  function handleFileUpload(e) {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        setCandid(reader.result);
      }
    });
    reader.readAsText(e.target.files[0]);
  }

  return (
    <Modal
      isOpen={isOpen}
      close={close}
      label="Import canister"
      shouldCloseOnEsc
      shouldCloseOnOverlayClick
    >
      <ModalContainer>
        <Title>Import an external canister</Title>
        <FormContainer>
          <Field
            type="text"
            labelText="Canister ID"
            list="canisters"
            value={canisterId}
            onChange={validateAndSetId}
          />
          <datalist id="canisters">
            {Object.entries(canisterSet).map(([id, info]) => (
              <option value={id}>{info.name}</option>
            ))}
          </datalist>
          <Field
            type="text"
            labelText="Canister name"
            value={canisterName}
            onChange={(e) => setCanisterName(e.target.value)}
          />
          <Field
            type="checkbox"
            labelText="Generate Motoko binding"
            checked={genBinding}
            onChange={(e) => setGenBinding(e.target.checked)}
          />
          {error && <Title>{error}</Title>}
          {uploadDid && (
            <Field
              type="file"
              labelText="Upload .did file"
              accept=".did"
              onChange={handleFileUpload}
            />
          )}
        </FormContainer>
        <ButtonContainer>
          <MyButton variant="primary" onClick={addCanister}>
            Add
          </MyButton>
          <MyButton onClick={close}>Cancel</MyButton>
        </ButtonContainer>
      </ModalContainer>
    </Modal>
  );
}
