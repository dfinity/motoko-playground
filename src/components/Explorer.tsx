import styled from "styled-components";
import iconPackage from "../assets/images/icon-package.svg";
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

// @ts-ignore
export function Explorer({ state, onSelectFile } = {}) {
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
        >
          {canister}
        </ListButton>
      ))}      
    </StyledExplorer>
  );
}
