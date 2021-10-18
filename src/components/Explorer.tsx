import { useState, useEffect, useContext } from "react";
import styled from "styled-components";
import {
  WorkplaceState,
  WorkplaceDispatchContext,
} from "../contexts/WorkplaceState";

import { ListButton } from "./shared/SelectList";
import { PackageModal } from "./PackageModal";
import { FileModal } from "./FileModal";
import { CanisterModal } from "./CanisterModal";
import { FolderStructure } from "./FolderStructure";
import { Confirm } from "./shared/Confirm";

import { PackageInfo } from "../workers/file";
import { ILoggingStore } from "./Logger";
import { deleteCanister } from "../build";
import iconPackage from "../assets/images/icon-package.svg";
import iconCanister from "../assets/images/icon-canister.svg";
import iconClose from "../assets/images/icon-close.svg";
import iconPlus from "../assets/images/icon-plus.svg";

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
const CloseButton = styled(MyButton)`
  padding: 0;
  margin-right: -1.1rem;
  margin-left: -0.3rem;
`;
const ConfirmText = styled.p`
  margin-bottom: 2rem;
`;

interface ExplorerProps {
  state: WorkplaceState;
  ttl: bigint;
  logger: ILoggingStore;
}

type TimeStatus = {
  status?: "Active" | "Expired";
  minutes?: string;
  seconds?: string;
};

export function Explorer({ state, ttl, logger }: ExplorerProps) {
  const [timeLeft, setTimeLeft] = useState<Array<TimeStatus>>([]);
  const [isExpired, setIsExpired] = useState<Array<string>>([]);
  const [showPackage, setShowPackage] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showCanisterModal, setShowCanisterModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fileToModify, setFileToModify] = useState("");
  const dispatch = useContext(WorkplaceDispatchContext);

  function handleRenameClick(e, selectedFile: string) {
    e.stopPropagation();
    setFileToModify(selectedFile);
    setShowFileModal(true);
  }
  function handleDeleteClick(e, selectedFile: string) {
    e.stopPropagation();
    setFileToModify(selectedFile);
    setShowDeleteConfirm(true);
  }

  function onSelectFile(selectedFile: string) {
    dispatch({
      type: "selectFile",
      payload: {
        path: selectedFile,
      },
    });
  }
  function loadPackage(pack: PackageInfo) {
    dispatch({
      type: "loadPackage",
      payload: {
        name: pack.name,
        package: pack,
      },
    });
  }
  function onDeleteFile() {
    dispatch({
      type: "deleteFile",
      payload: {
        path: fileToModify,
      },
    });
    setFileToModify("");
  }

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
        if (state.canisters[selectedCanister].timestamp) {
          if (action === "delete") {
            const canisterInfo = state.canisters[selectedCanister];
            logger.log(
              `Deleting canister ${selectedCanister} with id ${canisterInfo.id.toText()}...`
            );
            await deleteCanister(canisterInfo);
            logger.log("Canister deleted");
          } else {
            logger.log(`Canister ${selectedCanister} expired`);
          }
        }
        return dispatch({
          type: "deleteCanister",
          payload: {
            name: selectedCanister,
          },
        });
      }
      default:
        throw new Error(`unknown action ${action}`);
    }
  };

  const calcTimeLeft = (timestamp: bigint | undefined): number | undefined => {
    if (timestamp) {
      const now = BigInt(Date.now()) * BigInt(1_000_000);
      const left = Number((ttl - (now - timestamp)) / BigInt(1_000_000_000));
      return left;
    }
  };
  useEffect(() => {
    if (Object.keys(state.canisters).length === 0) {
      return;
    }
    const timer = setTimeout(() => {
      const times: Array<[string, number | undefined]> = Object.values(
        state.canisters
      ).map((info) => {
        return [info.name!, calcTimeLeft(info.timestamp)];
      });
      const expired = times
        .filter(([_, left]) => left && left <= 0)
        .map(([name, _]) => name);
      // Guard setIsExpired because of shallow equality
      if (
        expired.length > 0 &&
        JSON.stringify(isExpired) !== JSON.stringify(expired)
      ) {
        setIsExpired(expired);
      }
      setTimeLeft(
        times.map(([_, left]) => {
          if (!left) {
            return {};
          }
          if (left > 0) {
            const minute = Math.floor(left / 60);
            const second = left % 60;
            return {
              status: "Active",
              minutes: minute.toString(),
              seconds: second.toString().padStart(2, "0"),
            };
          } else {
            return { status: "Expired" };
          }
        })
      );
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
      <FileModal
        isOpen={showFileModal}
        close={() => {
          setShowFileModal(false);
          setFileToModify("");
        }}
        filename={fileToModify}
      />
      <PackageModal
        isOpen={showPackage}
        close={() => {
          setShowPackage(false);
        }}
        loadPackage={loadPackage}
      />
      <CanisterModal
        isOpen={showCanisterModal}
        close={() => setShowCanisterModal(false)}
      />
      <Confirm
        isOpen={showDeleteConfirm}
        onConfirm={onDeleteFile}
        close={() => {
          setShowDeleteConfirm(false);
          setFileToModify("");
        }}
      >
        <ConfirmText>
          Are you sure you want to delete the file <code>{fileToModify}</code>?
        </ConfirmText>
      </Confirm>
      <CategoryTitle>
        Files
        <MyButton onClick={() => setShowFileModal(true)} aria-label="Add file">
          <img style={{ width: "1.6rem" }} src={iconPlus} alt="" />
        </MyButton>
      </CategoryTitle>
      <FolderStructure
        filePaths={Object.keys(state.files).sort()}
        activeFile={state.selectedFile}
        onSelectFile={onSelectFile}
        onRenameFile={handleRenameClick}
        onDeleteFile={handleDeleteClick}
      />
      <CategoryTitle style={{ borderTop: "1px solid var(--grey300)" }}>
        Packages
        <MyButton onClick={() => setShowPackage(true)} aria-label="Add package">
          <img style={{ width: "1.6rem" }} src={iconPlus} alt="" />
        </MyButton>
      </CategoryTitle>
      {Object.values(state.packages).map((info) => (
        <ListButton
          onClick={() => {
            window.open(info.homepage!, "_blank");
          }}
          disabled={!!info.homepage}
          aria-label="Select motoko package"
        >
          <img src={iconPackage} alt="" />
          <p>mo:{info.name}</p>
        </ListButton>
      ))}
      <CategoryTitle>
        Canisters
        <MyButton
          onClick={() => setShowCanisterModal(true)}
          aria-label="Add canister"
        >
          <img style={{ width: "1.6rem" }} src={iconPlus} alt="" />
        </MyButton>
      </CategoryTitle>
      {Object.keys(state.canisters).map((canister, i) => (
        <ListButton
          key={canister}
          isActive={state.selectedCanister === canister}
          disabled={state.selectedCanister === canister}
          onClick={() => onCanister(canister, "select")}
          aria-label="Select canister"
        >
          <img src={iconCanister} alt="" />
          canister:{canister}
          {timeLeft[i]?.status === "Active" && (
            <div style={{ marginLeft: "auto" }}>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {timeLeft[i]?.minutes}
              </span>
              :
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {timeLeft[i]?.seconds}
              </span>
            </div>
          )}
          <CloseButton
            onClick={() => onCanister(canister, "delete")}
            aria-label={`Delete canister ${canister}`}
          >
            <img src={iconClose} alt="" />
          </CloseButton>
        </ListButton>
      ))}
    </StyledExplorer>
  );
}
