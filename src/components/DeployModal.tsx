import styled from "styled-components";
import { useState } from "react";

import { Modal } from "./shared/Modal";
import { CanisterInfo, getCanisterName, deploy } from "../build";
import { ILoggingStore } from './Logger';
import { ExampleProject } from "../examples/types";
import { Button } from "./shared/Button";
import { ListButton, SelectList } from "./shared/SelectList";
import iconCaretRight from "../assets/images/icon-caret-right.svg";

const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 50rem;
  font-size: 1.4rem;
`;

const ProjectButtonContents = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
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
  logger: ILoggingStore;
}

export function DeployModal({
  isOpen,
  close,
  onDeploy,
  canisters,
  fileName,
  logger,
}: DeployModalProps) {
  const [canisterName, setCanisterName] = useState(getCanisterName(fileName));
  const deployClick = async (mode: string) => {
    close();
    const info = await deploy(canisterName, canisters[canisterName], fileName, logger);
    if (info) {
      onDeploy(info);
    }
  };

  const welcomeCopy = (
      <>
      <p>Deploy your canister to the IC.</p>
      <p>
        <strong>Warning:</strong> Deployed canister expires after 10 minutes.
      </p>
      <p>
        Press <kbd>Esc</kbd> or the "Cancel" button below to go back.
      </p>
    </>
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
      </SelectLabel>
        <SelectList height="18rem">
        </SelectList>
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
