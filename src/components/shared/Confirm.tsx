import styled from "styled-components";
import { Modal } from "./Modal";
import { Button } from "./Button";

const ConfirmContainer = styled.div`
  width: 40rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

const MyButton = styled(Button)`
  margin-top: 2rem;
  width: 14rem;
`;

export function Confirm({
  isOpen,
  close,
  onConfirm,
  onCancel = () => {},
  children,
}) {
  function handleConfirm() {
    onConfirm();
    close();
  }

  function handleCancel() {
    onCancel();
    close();
  }

  return (
    <Modal isOpen={isOpen} close={close} label="Confirm">
      <ConfirmContainer>
        {children}
        <ButtonContainer>
          <MyButton variant="primary" onClick={handleConfirm}>
            Continue
          </MyButton>
          <MyButton onClick={handleCancel}>Cancel</MyButton>
        </ButtonContainer>
      </ConfirmContainer>
    </Modal>
  );
}
