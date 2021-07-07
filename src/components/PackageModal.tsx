import styled from "styled-components";
import { useState } from "react";
import { Modal } from "./shared/Modal";
import { Button } from "./shared/Button";
import { ListButton, SelectList } from "./shared/SelectList";
import iconCaretRight from "../assets/images/icon-caret-right.svg";
import { ImportGitHub } from "./ImportGithub";

const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 34rem;
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
        <span>{children}</span>
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
}

export function PackageModal({
  isOpen,
  close,
}: PackageModalProps) {
  const [importOpen, setImportOpen] = useState(false);
  const packages = [
  {
    "dependencies": [],
    "name": "base",
    "repo": "https://github.com/dfinity/motoko-base.git",
    "version": "927119e172964f4038ebc7018f9cc1b688544bfa"
  },
  {
    "dependencies": [
      "base"
    ],
    "name": "crud",
    "repo": "https://github.com/matthewhammer/motoko-crud.git",
    "version": "c9bc6acbb6da81fc20d8ffec8063d9f6b4d01efd"
  },
  {
    "dependencies": [
      "base"
    ],
    "name": "matchers",
    "repo": "https://github.com/kritzcreek/motoko-matchers.git",
    "version": "v1.1.0"
  },    
  ];
  function handleSelectPackage(pack) {
    //importPackage(pack)
    close();
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
        {!importOpen?(<SelectList height="18rem">
          {packages.map((pack) => (
            <ProjectButton
              key={pack.name}
              onClick={() => handleSelectPackage(pack)}
            >
              {pack.name}
            </ProjectButton>
          ))}
          <ProjectButton onClick={() => setImportOpen(true)}>Import from Github...</ProjectButton>
        </SelectList>):
         (<ImportGitHub importCode={() => {}} close={close} back={() => setImportOpen(false)}></ImportGitHub>)}
        <CancelButton onClick={close}>Cancel</CancelButton>
      </ModalContainer>
    </Modal>
  );
}
