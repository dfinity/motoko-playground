import styled from "styled-components";
import { useState, useCallback, useEffect, useContext } from "react";
import {
  IDL,
  renderInput,
  blobFromUint8Array,
  InputBox,
} from "@dfinity/candid";

import { Modal } from "./shared/Modal";
import { CanisterInfo, getCanisterName, deploy } from "../build";
import { ILoggingStore } from "./Logger";
import { Button } from "./shared/Button";
import "../assets/styles/candid.css";
import { WorkerContext } from "../contexts/WorkplaceState";
import { didjs } from "../config/actor";

const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 50rem;
`;

const ProjectButtonContents = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;
const InitContainer = styled.div`
  width: 100%;
  border: 1px solid var(--grey300);
  border-radius: 0.8rem;
  overflow: auto;
  padding: 1rem;
  margin-top: 1rem;
`;

const SelectLabel = styled.div`
  margin: 1rem 0 0.5rem;
  font-size: 1.6rem;
  font-weight: 500;
  width: 100%;
`;

const MyButton = styled(Button)`
  width: 14rem;
  margin-top: 3rem;
  margin-right: 1.5rem;
`;

interface DeployModalProps {
  isOpen: boolean;
  close: () => void;
  onDeploy: (string) => void;
  isDeploy: (tag: boolean) => void;
  canisters: Record<string, CanisterInfo>;
  ttl: bigint;
  fileName: string;
  candid: string;
  initTypes: Array<IDL.Type>;
  logger: ILoggingStore;
}

const MAX_CANISTERS = 3;

export function DeployModal({
  isOpen,
  close,
  onDeploy,
  isDeploy,
  canisters,
  ttl,
  fileName,
  candid,
  initTypes,
  logger,
}: DeployModalProps) {
  const [canisterName, setCanisterName] = useState("");
  const [inputs, setInputs] = useState<InputBox[]>([]);
  const [profiling, setProfiling] = useState(false);
  const worker = useContext(WorkerContext);

  const exceedsLimit = Object.keys(canisters).length >= MAX_CANISTERS;

  useEffect(() => {
    if (!exceedsLimit) {
      setCanisterName(getCanisterName(fileName));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileName]);

  useEffect(() => {
    const args = initTypes.map((arg) => renderInput(arg));
    setInputs(args);
  }, [initTypes]);

  const initArgs = useCallback(
    (node) => {
      if (node) {
        inputs.forEach((arg) => arg.render(node));
      }
    },
    [inputs]
  );
  const parse = () => {
    if (!initTypes.length) {
      return blobFromUint8Array(IDL.encode(initTypes, []));
    }
    const args = inputs.map((arg) => arg.parse());
    const isReject = inputs.some((arg) => arg.isRejected());
    if (isReject) {
      return undefined;
    }
    return blobFromUint8Array(IDL.encode(initTypes, args));
  };

  const deployClick = async (mode: string) => {
    const args = parse();
    if (args === undefined) {
      return;
    }
    await close();
    try {
      logger.clearLogs();
      let candid_src = candid;
      if (initTypes.length) {
        candid_src = (await didjs.binding(candid, "installed_did"))[0];
      }
      if (mode === "upgrade") {
        // TODO subtype check for init args
        if (canisters[canisterName].candid) {
          const old = canisters[canisterName].candid;
          const result = await didjs.subtype(candid_src, old);
          if (result.hasOwnProperty("Err")) {
            const err = result.Err.replaceAll(
              "expected type",
              "pre-upgrade interface"
            );
            logger.log("Warning: upgrade is not backward compatible:\n" + err);
            // TODO show the warning modal
          }
        }
      }
      await isDeploy(true);
      const info = await deploy(
        worker,
        canisterName,
        canisters[canisterName],
        args,
        mode,
        fileName,
        profiling,
        logger
      );
      await isDeploy(false);
      if (info) {
        info.candid = candid_src;
        await worker.Moc({
          type: "save",
          file: `idl/${info.id}.did`,
          content: candid_src,
        });
        onDeploy(info);
      }
    } catch (err) {
      isDeploy(false);
      throw err;
    }
  };

  const welcomeCopy = (
    <>
      <p>Deploy your canister to the IC.</p>
    </>
  );
  const Warnings = (
    <>
      <p style={{ fontSize: "1.4rem", marginTop: "2rem" }}>
        {exceedsLimit ? (
          <p>
            <strong>Warning:</strong> You can deploy at most {MAX_CANISTERS}{" "}
            canisters at the same time.
          </p>
        ) : null}
        <p>
          <strong>Warning:</strong> Cycle transfer instructions are silently
          ignored by the system.
        </p>
        <p>
          <strong>Warning:</strong> Deployed canister expires after{" "}
          {(ttl / BigInt(60_000_000_000)).toString()} minutes.
        </p>
      </p>
    </>
  );
  const newDeploy = (
    <>
      <input
        type="text"
        list="canisters"
        value={canisterName}
        onChange={(e) => setCanisterName(e.target.value)}
      />
      <datalist id="canisters">
        {Object.keys(canisters).map((canister) => (
          <option>{canister}</option>
        ))}
      </datalist>
    </>
  );
  const selectDeploy = (
    <>
      <select
        value={canisterName}
        onChange={(e) => setCanisterName(e.target.value)}
      >
        {Object.keys(canisters).map((canister) => (
          <option value={canister}>{canister}</option>
        ))}
      </select>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      close={close}
      label="Deploy Canister"
      shouldCloseOnEsc={true}
    >
      <ModalContainer>
        {welcomeCopy}
        <SelectLabel>
          Select a canister name &nbsp;
          {exceedsLimit ? selectDeploy : newDeploy}
          {initTypes.length > 0 ? (
            <InitContainer>
              <p>This service requires the following installation arguments:</p>
              <p>({initTypes.map((arg) => arg.name).join(", ")})</p>
              <div className="InitArgs" ref={initArgs}></div>
            </InitContainer>
          ) : null}
        </SelectLabel>
        <p>
          <input
            type="checkbox"
            checked={profiling}
            onChange={(e) => setProfiling(e.target.checked)}
          />{" "}
          Enable profiling (experimental)
        </p>
        {Warnings}
        <ProjectButtonContents>
          {canisters.hasOwnProperty(canisterName) ? (
            <>
              <MyButton onClick={() => deployClick("upgrade")}>
                Upgrade
              </MyButton>
              <MyButton onClick={() => deployClick("reinstall")}>
                Reinstall
              </MyButton>
            </>
          ) : (
            <>
              <MyButton onClick={() => deployClick("install")}>
                Install
              </MyButton>
            </>
          )}
          <MyButton onClick={close}>Cancel</MyButton>
        </ProjectButtonContents>
      </ModalContainer>
    </Modal>
  );
}
