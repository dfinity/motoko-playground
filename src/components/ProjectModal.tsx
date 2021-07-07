import styled from "styled-components";
import { useState } from "react";
import { Modal } from "./shared/Modal";
import { ExampleProject } from "../examples/types";
import { MotokoLabLogo } from "./shared/MotokoLabLogo";
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
  margin: 1rem 0 0.5rem;
  font-size: 1.6rem;
  font-weight: 500;
`;

const CancelButton = styled(Button)`
  width: 24rem;
  margin-top: 3rem;
`;

interface ProjectModalProps {
  isOpen: boolean;
  chooseExampleProject: (project: ExampleProject) => void;
  importCode: (files: Record<string, string>) => void;
  close: () => void;
  exampleProjects: ExampleProject[];
  isFirstOpen: boolean;
}

export function ProjectModal({
  isOpen,
  close,
  chooseExampleProject,
  importCode,
  exampleProjects,
  isFirstOpen,
}: ProjectModalProps) {
  const [importOpen, setImportOpen] = useState(false);
  function handleSelectProjectAndClose(project: ExampleProject) {
    chooseExampleProject(project);
    close();
  }

  const welcomeCopy = (
    <p>
      Welcome to the Motoko Lab... Lorem ipsum dolor sit amet, consectetur
      adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
      magna aliqua. <a href="#learn-more">Learn more</a>
    </p>
  );
  const switchProjectCopy = (
    <>
      <p>
        <strong>Warning:</strong> Any edits you've made will be lost when
        switching to a new project.
      </p>
      <p>
        Press <kbd>Esc</kbd> or the "Cancel" button below to go back.
      </p>
    </>
  );
  const labelCopy = isFirstOpen
    ? "Select a project to get started"
    : "Select a project to continue";

  return (
    <Modal
      isOpen={isOpen}
      close={close}
      label="Welcome to Motoko Lab"
      shouldCloseOnEsc={!isFirstOpen}
    >
      <ModalContainer>
        <MotokoLabLogo />
        {isFirstOpen ? welcomeCopy : switchProjectCopy}
        <SelectLabel>{labelCopy}</SelectLabel>
        {!importOpen?(<SelectList height="18rem">
          {exampleProjects.map((project) => (
            <ProjectButton
              key={project.name}
              onClick={() => handleSelectProjectAndClose(project)}
            >
              {project.name}
            </ProjectButton>
          ))}
          <ProjectButton onClick={() => setImportOpen(true)}>Import from Github...</ProjectButton>
        </SelectList>):
        (<ImportGitHub importCode={importCode} close={close} back={() => setImportOpen(false)}></ImportGitHub>)}
        {!isFirstOpen && <CancelButton onClick={close}>Cancel</CancelButton>}
      </ModalContainer>
    </Modal>
  );
}
