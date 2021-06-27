import styled from "styled-components";
import iconPackage from "../assets/images/icon-package.svg";
import iconCanister from "../assets/images/icon-canister.svg";
import iconClose from "../assets/images/icon-close.svg";
import { ListButton } from "./shared/SelectList";

const StyledExplorer = styled.div`
  width: var(--explorerWidth);
`;

const CategoryTitle = styled.div`
  display: flex;
  align-items: center;
  padding-left: 1rem;
  height: 2.4rem;
  font-size: 1.2rem;
  font-weight: bold;
  border-bottom: 1px solid var(--grey300);
  text-transform: uppercase;
  pointer-events: none;
`;
const CloseButton = styled.button`
  background: none;
  border: none;
  box-shadow: none;
  margin-left: auto;
`;

// @ts-ignore
export function Explorer({ state, onSelectFile, onCanister } = {}) {
  return (
    <StyledExplorer>
      <CategoryTitle>Files</CategoryTitle>
      {Object.keys(state.files).map((filename) => (
        <ListButton
          key={filename}
          isActive={state.selectedFile === filename}
          disabled={state.selectedFile === filename}
          onClick={() => onSelectFile(filename)}
        >
          {filename}
        </ListButton>
      ))}
      <CategoryTitle>Packages</CategoryTitle>
      <ListButton disabled>
        <img src={iconPackage} alt="Package icon" />
        <p>mo:base</p>
      </ListButton>
      <CategoryTitle>Canisters</CategoryTitle>
      {Object.keys(state.canisters).map((canister) => (
        <ListButton
        key={canister}
        isActive={state.selectedCanister == canister}
        disabled={state.selectedCanister == canister}
        onClick={() => onCanister(canister, 'select')}
        >
          <img src={iconCanister}/>
          {canister}
          <CloseButton onClick={() => onCanister(canister, 'delete')}>
          <img src={iconClose} alt="Close icon" />
          </CloseButton>
        </ListButton>
      ))}
    </StyledExplorer>
  );
}
