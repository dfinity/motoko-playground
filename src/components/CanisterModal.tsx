import styled from "styled-components";
import { useState, useEffect, useContext } from "react";
import { Modal } from "./shared/Modal";
import { Button } from "./shared/Button";
import { Principal } from "@dfinity/principal";
import { IDL } from "@dfinity/candid";

import {
  WorkerContext,
  WorkplaceDispatchContext,
} from "../contexts/WorkplaceState";
import { fetchCandidInterface, didjs, didToJs } from "../config/actor";
import { CanisterInfo } from "../build";
import { canisterSet } from "../config/canister-set";
import { Field } from "./shared/Field";
import { Tab, Tabs } from "./shared/Tabs";

const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 36rem;
  font-size: 1.6rem;
  font-weight: 500;
`;
const Title = styled.div`
  margin: 2rem 0;
`;
const Error = styled.div`
  width: 100%;
  background-color: var(--colorWarning);
  border-radius: 1.5rem;
  margin-top: 1rem;
  padding: 1rem 2rem;
  font-size: 1.4rem;
`;
const FormContainer = styled.div`
  padding: 0 2rem;
  width: 100%;
  height: 30rem;
  position: relative;
`;
const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  position: absolute;
  bottom: 0;
`;

const MyButton = styled(Button)`
  width: 10rem;
`;

export function CanisterModal({ isOpen, close, deploySetter }) {
  const [canisterName, setCanisterName] = useState("");
  const [canisterId, setCanisterId] = useState("");
  const [candid, setCandid] = useState("");
  const [wasm, setWasm] = useState(undefined);
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

  async function deployWasm() {
    if (!candid || !wasm) return;
    const candidJS = await didToJs(candid);
    const init = candidJS.init({ IDL });
    await close();
    await deploySetter.setWasm(wasm);
    await deploySetter.setInitTypes(init);
    await deploySetter.setCandidCode(candid);
    await deploySetter.setShowDeployModal(true);
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

  function handleDidUpload(e) {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        setCandid(reader.result);
      }
    });
    reader.readAsText(e.target.files[0]);
  }
  function handleWasmUpload(e) {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setWasm(new Uint8Array(reader.result));
    });
    const file = e.target.files[0];
    if (file.size > 2097152) {
      setError("Wasm size should be less than 2MB");
      return;
    } else {
      setError("");
    }
    deploySetter.setMainFile(file.name);
    reader.readAsArrayBuffer(file);
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
        <Title>Add a canister</Title>
        <Tabs width="34rem">
          <Tab label="Import canister">
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
              {error && <Error>{error}</Error>}
              {uploadDid && (
                <Field
                  type="file"
                  labelText="Upload did file"
                  accept=".did"
                  onChange={handleDidUpload}
                />
              )}
              <ButtonContainer>
                <MyButton variant="primary" onClick={addCanister}>
                  Import
                </MyButton>
                <MyButton onClick={close}>Cancel</MyButton>
              </ButtonContainer>
            </FormContainer>
          </Tab>
          <Tab label="Deploy Wasm">
            <FormContainer>
              <Field
                type="file"
                labelText="Upload Wasm module"
                accept=".wasm"
                onChange={handleWasmUpload}
              />
              <Field
                type="file"
                labelText="Upload did file"
                accept=".did"
                onChange={handleDidUpload}
              />
              {error && <Error>{error}</Error>}
              <ButtonContainer>
                <MyButton variant="primary" onClick={deployWasm}>
                  Deploy
                </MyButton>
                <MyButton onClick={close}>Cancel</MyButton>
              </ButtonContainer>
            </FormContainer>
          </Tab>
        </Tabs>
      </ModalContainer>
    </Modal>
  );
}
