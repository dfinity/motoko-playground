import styled from "styled-components";
import { useState, useContext } from "react";
import { Modal } from "./shared/Modal";
import { Button } from "./shared/Button";
import { ListButton, SelectList } from "./shared/SelectList";
import iconCaretRight from "../assets/images/icon-caret-right.svg";
import { ImportGitHub } from "./ImportGithub";
import packageSet from "../config/package-set.json";
import { PackageInfo } from "../workers/file";
import { WorkerContext } from "../contexts/WorkplaceState";
import { Tab, Tabs } from "./shared/Tabs";

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
        <span style={{ whiteSpace: "nowrap", overflowX: "hidden" }}>
          {children}
        </span>
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
  isOpen: boolean;
  close: () => void;
  loadPackage: (info: PackageInfo) => void;
}

export function PackageModal({
  isOpen,
  close,
  loadPackage,
}: PackageModalProps) {
  const worker = useContext(WorkerContext);
  async function handleSelectPackage(pack: PackageInfo) {
    if (await worker.fetchPackage(pack)) {
      await loadPackage(pack);
      await close();
    } else {
      throw new Error(`Fail to load package ${pack.name}`);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      close={close}
      label="Load package"
      shouldCloseOnEsc
      shouldCloseOnOverlayClick
    >
      <ModalContainer>
        <SelectLabel>Select a Motoko package</SelectLabel>
        <Tabs width="44rem">
          <Tab label="Vessel packages">
            <SelectList height="36.1rem">
              {packageSet.map((pack) => (
                <ProjectButton
                  key={pack.name}
                  onClick={() => handleSelectPackage(pack)}
                >
                  {pack.name} {pack.description ? `-- ${pack.description}` : ""}
                </ProjectButton>
              ))}
            </SelectList>
          </Tab>
          <Tab label="Import from Github">
            <ImportGitHub
              isPackageModal={true}
              importCode={loadPackage}
              close={close}
            />
          </Tab>
        </Tabs>
        <CancelButton onClick={close}>Cancel</CancelButton>
      </ModalContainer>
    </Modal>
  );
}
