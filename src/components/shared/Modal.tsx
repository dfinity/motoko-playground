import styled, { createGlobalStyle } from "styled-components";
import ReactModal from "react-modal";

const TIMING = 750;

const StyleOverrides = createGlobalStyle`
  .ReactModal__Content {
    opacity: 0;
    transform: translateY(-10rem);
    transition: transform ${TIMING}ms ease, opacity ${TIMING / 1.2}ms;
  }
  .ReactModal__Content--after-open {
    opacity: 1;
    transform: translateY(0px);
  }
  .ReactModal__Content--before-close {
    opacity: 0;
    transform: translateY(-10rem);
  }
  
  .ReactModal__Overlay {
    opacity: 0;
    transition: all ${TIMING / 1.2}ms ease-in-out;
  }

  .ReactModal__Overlay--after-open {
    opacity: 1;
  }

  .ReactModal__Overlay--before-close {
    opacity: 0;
  }
`;

// Tell ReactModal to which element it should attach its Portal/overlay.
ReactModal.setAppElement("#root");
// Override ReactModal's inline styles...
ReactModal.defaultStyles = {
  ...ReactModal.defaultStyles,
  overlay: {
    ...ReactModal.defaultStyles.overlay,
    backgroundColor: "#000c",
  },
  content: {
    ...ReactModal.defaultStyles.content,
    display: "flex",
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    inset: "initial",
    background: "transparent",
    padding: "0",
    border: "none",
  },
};

const StyledModal = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  background-color: white;
  border-radius: 2.4rem;
`;

export function Modal({
  isOpen = false,
  label = "Dialog",
  close,
  children,
  ...props
}) {
  return (
    <ReactModal
      isOpen={isOpen}
      contentLabel={label}
      onRequestClose={close}
      closeTimeoutMS={TIMING}
      {...props}
    >
      <StyleOverrides />
      <StyledModal>{children}</StyledModal>
    </ReactModal>
  );
}
