import { useState, useEffect } from "react";
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
export function Explorer({ state, ttl, onSelectFile, onCanister } = {}) {
  const [timeLeft, setTimeLeft] = useState<Array<string>>([]);
  const [isExpired, setIsExpired] = useState<Record<string, boolean>>({})

  const calcTimeLeft = (timestamp: bigint) => {
    const now = BigInt(Date.now()) * BigInt(1_000_000);
    const left = Number((ttl - (now - timestamp)) / BigInt(1_000_000_000));
    return left;
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(Object.values(state.canisters).map((info) => {
        const left = calcTimeLeft((info as any).timestamp);
        if (left <= 0) {
          setIsExpired(prev => ({ ...prev, [(info as any).name]: true }));
        }
        const minute = Math.floor(left / 60);
        const second = left % 60;
        return ` ${minute}:${second}`;
      }));
    }, 1000);
    // Clear timeout if the component is unmounted
    return () => clearTimeout(timer);
  }, [state.canisters, timeLeft]);
  useEffect(() => {
    Object.keys(isExpired).forEach((canister) => {
      onCanister(canister, "delete");
    });
    setIsExpired({});
  }, [isExpired]);
  
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
      {Object.keys(state.canisters).map((canister, i) => (
        <ListButton
        key={canister}
        isActive={state.selectedCanister === canister}
        disabled={state.selectedCanister === canister}
        onClick={() => onCanister(canister, 'select')}
        >
          <img src={iconCanister} alt="Canister icon"/>
          {canister}
          <div style={{marginLeft:"auto"}}>{timeLeft[i]}</div>
          <CloseButton onClick={() => onCanister(canister, 'delete')}>
          <img src={iconClose} alt="Close icon" />
          </CloseButton>
        </ListButton>
      ))}
    </StyledExplorer>
  );
}
