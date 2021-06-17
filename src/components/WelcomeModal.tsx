import styled from "styled-components";
import { Modal } from "./shared/Modal";
import { SelectList, ListButton } from "./shared/SelectList";
import motokoLabLogo from "../assets/images/motoko-lab-logo.png";
import motokoLabWordmark from "../assets/images/motoko-lab-wordmark.svg";
import iconCaretRight from "../assets/images/icon-caret-right.svg";
import { ExampleProject } from "../examples/types";
import React from "react";

const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 34rem;
  font-size: 1.4rem;
`;

const ButtonContent = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

function Button({ onClick, children }) {
  return (
    <ListButton onClick={onClick}>
      <ButtonContent>
        <span>{children}</span>
        <img src={iconCaretRight} alt="Continue" />
      </ButtonContent>
    </ListButton>
  );
}

export function WelcomeModal(props: {
  isOpen: boolean;
  chooseExampleProject: (project: ExampleProject) => void;
  close: () => void;
  exampleProjects: ExampleProject[];
}) {
  const { isOpen = true, close = () => {}, exampleProjects } = props;
  function chooseAndCloseClickHandler(choice: ExampleProject) {
    return (event: React.MouseEvent) => {
      props.chooseExampleProject(choice);
      close();
    }
  }
  return (
    <Modal
      isOpen={isOpen}
      close={close}
      label="Welcome to Motoko Lab"
      shouldCloseOnEsc={false}
    >
      <ModalContainer>
        <img
          src={motokoLabLogo}
          alt="Motoko ghost logo in wireframe"
          width={165}
        />
        <img src={motokoLabWordmark} alt="Motoko Lab" width={215} />
        <br />
        <p>
          Welcome to the Motoko Lab... Lorem ipsum dolor sit amet, consectetur
          adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
          magna aliqua. <a href="#learn-more">Learn more</a>
        </p>
        <p style={{ fontSize: "1.6rem" }}>Select a project to get started</p>
        <SelectList height="18rem">
          {exampleProjects.map(
            (project) => <>
              <Button onClick={chooseAndCloseClickHandler(project)}>{project.name}</Button>
            </>
          )}
        </SelectList>
      </ModalContainer>
    </Modal>
  );
}
