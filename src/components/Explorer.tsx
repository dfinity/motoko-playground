import { useState, useEffect } from "react";
import styled from "styled-components";
import iconPackage from "../assets/images/icon-package.svg";
import iconCanister from "../assets/images/icon-canister.svg";
import iconClose from "../assets/images/icon-close.svg";
import iconPlus from "../assets/images/icon-plus.svg";
import { ListButton } from "./shared/SelectList";
import { WorkplaceState, WorkplaceReducerAction } from "../contexts/WorkplaceState";
import { PackageModal } from "./PackageModal";
import { PackageInfo } from "../file";
import { ILoggingStore } from './Logger';
import { deleteCanister } from "../build";

const StyledExplorer = styled.div`
  width: var(--explorerWidth);
  overflow-y: auto;
  overflow-wrap: anywhere;
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
`;
const MyButton = styled.button`
  background: none;
  border: none;
  box-shadow: none;
  margin-left: auto;
`;

interface ExplorerProps {
  state: WorkplaceState;
  ttl: bigint;
  logger: ILoggingStore;
  dispatch: (action: WorkplaceReducerAction) => void;
}

export function Explorer({ state, ttl, dispatch, logger }: ExplorerProps) {
  const [timeLeft, setTimeLeft] = useState<Array<string>>([]);
  const [isExpired, setIsExpired] = useState<Array<string>>([])
  const [showPackage, setShowPackage] = useState(false);

  const onSelectFile = (selectedFile: string) => {
    dispatch({
      type: "selectFile",
      payload: {
        path: selectedFile,
      },
    });
  };
  const loadPackage = (pack: PackageInfo) => {
    dispatch({
      type: "loadPackage",
      payload: {
        name: pack.name,
        package: pack,
      },
    });
  };
  const onCanister = async (selectedCanister: string, action: string) => {
    switch (action) {
      case "select":
        return dispatch({
          type: "selectCanister",
          payload: {
            name: selectedCanister,
          },
        });
      case "delete":
      case "expired": {
        if (action === "delete") {
          const canisterInfo = state.canisters[selectedCanister];
          logger.log(`Deleting canister ${selectedCanister} with id ${canisterInfo.id.toText()}...`);
          await deleteCanister(canisterInfo);
          logger.log('Canister deleted');
        } else {
          logger.log(`Canister ${selectedCanister} expired`);
        }
        return dispatch({
          type: "deleteCanister",
          payload: {
            name: selectedCanister,
          },
        });
      }
      default:
        throw new Error(`unknown action ${action}`)
    }
  };

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
          return `${minute}:${second.toString().padStart(2, '0')}`;
        } else {
          return "Expired";
        }
      }));
    }, 1000);
    // Clear timeout if the component is unmounted
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.canisters, timeLeft]);
  useEffect(() => {
    isExpired.forEach((canister) => {
      onCanister(canister, "expired");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpired]);
  
  return (
    <StyledExplorer>
      <PackageModal
        isOpen={showPackage}
        close={() => setShowPackage(false)}
        loadPackage={loadPackage}
      />
      <CategoryTitle>Files</CategoryTitle>
      {Object.keys(state.files).sort().map((filename) => (
        <ListButton
          key={filename}
          isActive={state.selectedFile === filename}
          disabled={state.selectedFile === filename}
          onClick={() => onSelectFile(filename)}
        >
          {filename}
        </ListButton>
      ))}
      <CategoryTitle>Packages
      <MyButton onClick={() => setShowPackage(true)}><img style={{width:"1.6rem"}} src={iconPlus} alt="Add package"/></MyButton>
      </CategoryTitle>
      {Object.entries(state.packages).map(([_, info]) => (
          <ListButton
             onClick={() => { window.open(info.homepage!, "_blank") }}
             disabled={info.homepage?false:true}
          >
          <img src={iconPackage} alt="Package icon" />
          <p>mo:{info.name}</p>
          </ListButton>
      ))}
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
          <div style={{marginLeft: "auto"}}>{timeLeft[i]}</div>
          <MyButton onClick={() => onCanister(canister, 'delete')}>
          <img src={iconClose} alt="Close icon" />
          </MyButton>
        </ListButton>
      ))}
    </StyledExplorer>
  );
}
