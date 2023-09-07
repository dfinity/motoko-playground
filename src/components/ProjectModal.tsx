import { useContext } from "react";
import styled from "styled-components";

import { Modal } from "./shared/Modal";
import { MotokoLabLogo } from "./shared/MotokoLabLogo";
import { Button } from "./shared/Button";
import { ListButton, SelectList } from "./shared/SelectList";
import { Tab, Tabs } from "./shared/Tabs";

import { ImportGitHub } from "./ImportGithub";
import { fetchExample, exampleProjects, ExampleProject } from "../examples";
import {
  WorkerContext,
  WorkplaceDispatchContext,
} from "../contexts/WorkplaceState";
import iconCaretRight from "../assets/images/icon-caret-right.svg";

const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 40rem;
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

interface ProjectModalProps {
  isOpen: boolean;
  importCode: (files: Record<string, string>) => void;
  close: () => void;
  isFirstOpen: boolean;
}

export function ProjectModal({
  isOpen,
  close,
  importCode,
  isFirstOpen,
}: ProjectModalProps) {
  const worker = useContext(WorkerContext);
  const dispatch = useContext(WorkplaceDispatchContext);
  async function handleSelectProjectAndClose(project: ExampleProject) {
    const files = await fetchExample(worker, project);
    if (files) {
      await importCode(files);
      close();
    }
    await dispatch({
      type: "setOrigin",
      payload: { origin: `playground:example:${project.name}` },
    });
  }
  async function emptyProject() {
    await importCode({ "Main.mo": "" });
    close();
    await dispatch({
      type: "setOrigin",
      payload: { origin: `playground:new` },
    });
  }

  const welcomeText = (
    <p>
      Welcome to the Motoko Playground! Explore Motoko, the native language of
      the Internet Computer, right in the browser without having to download the
      SDK. See our open source repository to{" "}
      <a
        target="_blank"
        rel="noreferrer"
        href="https://github.com/dfinity/motoko-playground"
      >
        learn more
      </a>
      .
    </p>
  );
  const switchProjectText = (
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
  const labelText = isFirstOpen
    ? "Select a project to get started"
    : "Select a project to continue";

  return (
    <Modal
      isOpen={isOpen}
      close={close}
      label="Welcome to Motoko Lab"
      shouldCloseOnEsc={!isFirstOpen}
      shouldCloseOnOverlayClick={!isFirstOpen}
    >
      <ModalContainer>
        <MotokoLabLogo />
        {isFirstOpen ? welcomeText : switchProjectText}
        <SelectLabel>{labelText}</SelectLabel>
        <Tabs width="39rem">
          <Tab label="Example Projects">
            <SelectList height="28.95rem">
              <ProjectButton onClick={emptyProject}>
                New Motoko project
              </ProjectButton>
              {exampleProjects.map((project) => (
                <ProjectButton
                  key={project.name}
                  onClick={() => handleSelectProjectAndClose(project)}
                >
                  {project.name}
                </ProjectButton>
              ))}
            </SelectList>
          </Tab>
          <Tab label="Import from Github">
            <ImportGitHub importCode={importCode} close={close} />
          </Tab>
        </Tabs>
        {!isFirstOpen && <CancelButton onClick={close}>Cancel</CancelButton>}
      </ModalContainer>
    </Modal>
  );
}
