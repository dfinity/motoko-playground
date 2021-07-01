import { useState, useEffect } from "react";
import styled from "styled-components";
import iconPackage from "../assets/images/icon-package.svg";
import iconCanister from "../assets/images/icon-canister.svg";
import iconClose from "../assets/images/icon-close.svg";
import { ListButton } from "./shared/SelectList";
import { WorkplaceState } from "../contexts/WorkplaceState";

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

interface ExplorerProps {
  state: WorkplaceState;
  ttl: bigint;
  onSelectFile: (string) => void;
  onCanister: (name: string, action:string) => void;
}

export function Explorer({ state, ttl, onSelectFile, onCanister }: ExplorerProps) {
  const [timeLeft, setTimeLeft] = useState<Array<string>>([]);
  const [isExpired, setIsExpired] = useState<Array<string>>([])

  const calcTimeLeft = (timestamp: bigint) : number => {
    const now = BigInt(Date.now()) * BigInt(1_000_000);
    const left = Number((ttl - (now - timestamp)) / BigInt(1_000_000_000));
    return left;
  };
  useEffect(() => {
    if (Object.keys(state.canisters).length === 0) {
      return;
    }
    const timer = setTimeout(() => {
      const times: Array<[string, number]> = Object.values(state.canisters).map((info) => {
        return [info.name!, calcTimeLeft(info.timestamp)];
      });
      const expired = times.filter(([_, left]) => left <= 0).map(([name, _]) => name);
      // Guard setIsExpired because of shallow equality
      if (expired.length > 0 && JSON.stringify(isExpired) !== JSON.stringify(expired)) {
        setIsExpired(expired);
      }
      setTimeLeft(times.map(([_, left]) => {
        if (left > 0) {
          const minute = Math.floor(left / 60);
          const second = left % 60;
          return `${minute}:${second}  `;
        } else {
          return "Expired  ";
        }
      }));
    }, 1000);
    // Clear timeout if the component is unmounted
    return () => clearTimeout(timer);
  }, [state.canisters, timeLeft]);
  useEffect(() => {
    isExpired.forEach((canister) => {
      onCanister(canister, "delete");
    });
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
          <CloseButton onClick={() => onCanister(canister, 'delete')}>
          {timeLeft[i]}
          <img src={iconClose} alt="Close icon" />
          </CloseButton>
        </ListButton>
      ))}
    </StyledExplorer>
  );
}
