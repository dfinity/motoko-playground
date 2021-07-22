import styled from "styled-components";
import { useState } from "react";
import { Modal } from "./shared/Modal";
import { Button } from "./shared/Button";
import { ListButton, SelectList } from "./shared/SelectList";
import iconCaretRight from "../assets/images/icon-caret-right.svg";
import { ImportGitHub } from "./ImportGithub";
import packageSet from "../config/package-set.json";
import { PackageInfo } from "../workers/file";

const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 46rem;
  font-size: 1.4rem;
`;

const ProjectButtonContents = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

function ProjectButton({ onClick, children }) {
  return (
    <ListButton onClick={onClick}>
      <ProjectButtonContents>
      <span style={{whiteSpace: "nowrap", overflowX: "hidden"}}>{children}</span>
        <img src={iconCaretRight} alt="Continue" />
      </ProjectButtonContents>
    </ListButton>
  );
}

const SelectLabel = styled.span`
  margin: 1rem 0 2rem;
  font-size: 1.6rem;
  font-weight: 500;
`;

const CancelButton = styled(Button)`
  width: 24rem;
  margin-top: 3rem;
`;

interface PackageModalProps {
  worker: any;
  isOpen: boolean;
  close: () => void;
  loadPackage: (info: PackageInfo) => void;
}

export function PackageModal({
  worker,
  isOpen,
  close,
  loadPackage,
}: PackageModalProps) {
  const [importOpen, setImportOpen] = useState(false);
  async function handleSelectPackage(pack: PackageInfo) {
    if (await worker.fetchPackage(pack)) {
      await loadPackage(pack);
      await close();
    } else {
      throw new Error(`Fail to load package ${pack.name}`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      close={close}
      label="Load package"
      shouldCloseOnEsc={true}
    >
      <ModalContainer>
        <SelectLabel>Select a Motoko package</SelectLabel>
        {!importOpen?(<SelectList height="24rem">
          {packageSet.map((pack) => (
            <ProjectButton
              key={pack.name}
              onClick={() => handleSelectPackage(pack)}
            >
              {pack.name} {pack.description?`-- ${pack.description}`:""}
            </ProjectButton>
          ))}
          <ProjectButton onClick={() => setImportOpen(true)}>Import from Github...</ProjectButton>
        </SelectList>):
         (<ImportGitHub worker={worker} isPackageModal={true} importCode={loadPackage} close={close} back={() => setImportOpen(false)}></ImportGitHub>)}
        <CancelButton onClick={close}>Cancel</CancelButton>
      </ModalContainer>
    </Modal>
  );
}
