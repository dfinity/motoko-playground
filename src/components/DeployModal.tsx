import styled from "styled-components";
import { useState, useCallback } from "react";
import { IDL, renderInput, blobFromUint8Array, InputBox } from "@dfinity/candid";

import { Modal } from "./shared/Modal";
import { CanisterInfo, getCanisterName, deploy } from "../build";
import { ILoggingStore } from './Logger';
import { Button } from "./shared/Button";
import { ListButton, SelectList } from "./shared/SelectList";
import iconCaretRight from "../assets/images/icon-caret-right.svg";

const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 50rem;
`;

const ProjectButtonContents = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;
const InitContainer = styled.div`
  width: 100%;
  border: 1px solid var(--grey300);
  border-radius: 0.8rem;
  overflow: auto;
  padding: 1rem;
  margin-top: 1rem;
`;

function ProjectButton({ onClick, children }) {
  return (
    <ListButton onClick={onClick}>
      <ProjectButtonContents>
        <span>{children}</span>
        <img src={iconCaretRight} alt="Continue" />
      </ProjectButtonContents>
    </ListButton>
  );
}

const SelectLabel = styled.div`
  margin: 1rem 0 0.5rem;
  font-size: 1.6rem;
  font-weight: 500;
  width: 100%;
`;

const MyButton = styled(Button)`
  width: 14rem;
  margin-top: 3rem;
  margin-right: 1.5rem;
`;

interface DeployModalProps {
  isOpen: boolean;
  close: () => void;
  onDeploy: (string) => void;
  canisters: Record<string, CanisterInfo>;
  fileName: string;
  candid: string;
  initTypes: Array<IDL.Type>;
  logger: ILoggingStore;
}

export function DeployModal({
  isOpen,
  close,
  onDeploy,
  canisters,
  fileName,
  candid,
  initTypes,
  logger,
}: DeployModalProps) {
  const [canisterName, setCanisterName] = useState(getCanisterName(fileName));
  const [inputs, setInputs] = useState([]);

  const initArgs = useCallback((node) => {
    if (node) {
      const args = initTypes.map((arg) => renderInput(arg));
      setInputs(args as any);
      args.forEach((arg) => arg.render(node));
    }
  }, [initTypes]);
  const parse = () => {
    const args = inputs.map(arg => (arg as InputBox).parse());
    const isReject = inputs.some(arg => (arg as InputBox).isRejected());
    if (isReject) {
      return undefined;
    }
    return blobFromUint8Array(IDL.encode(initTypes, args));
  };
  
  const deployClick = async (mode: string) => {
    const args = parse();
    if (args === undefined) {
      return;
    }
    close();
    const info = await deploy(canisterName, canisters[canisterName], args, mode, fileName, logger);
    if (info) {
      info.candid = candid;
      onDeploy(info);
    }
  };

  const welcomeCopy = (
      <>
      <p>Deploy your canister to the IC.</p>
    </>
  );
  const ttlWarning = (
      <><p style={{fontSize: "1.4rem", marginTop: "2rem"}}>
        <strong>Warning:</strong> Deployed canister expires after 10 minutes.
      </p></>
  );

  return (
    <Modal
      isOpen={isOpen}
      close={close}
      label="Deploy Canister"
      shouldCloseOnEsc={true}
    >
      <ModalContainer>
        {welcomeCopy}
      <SelectLabel>Select a canister name &nbsp;
        <input type="text" list="canisters" value={canisterName} onChange={(e) => setCanisterName(e.target.value)} />
        <datalist id="canisters">
        {Object.keys(canisters).map((canister) => (
          <option>{canister}</option>
        ))}
        </datalist>
      {initTypes.length > 0 ? (
          <InitContainer>
          <p>This service requires the following installation arguments:</p><p>({initTypes.map(arg => arg.name).join(", ")})</p>
          <div ref={initArgs}></div>
          </InitContainer>)
       : null}
    </SelectLabel>
      {ttlWarning}
      <ProjectButtonContents>
      {canisters.hasOwnProperty(canisterName)?(<>
          <MyButton onClick={() => deployClick("upgrade")}>Upgrade</MyButton>
          <MyButton onClick={() => deployClick("reinstall")}>Reinstall</MyButton></>):(<>
          <MyButton onClick={() => deployClick("install")}>Install</MyButton></>
      )}
          <MyButton onClick={close}>Cancel</MyButton>
        </ProjectButtonContents>
      </ModalContainer>
    </Modal>
  );
}
