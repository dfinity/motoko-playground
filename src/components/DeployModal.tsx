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
import { WorkerContext } from "../contexts/WorkplaceState";
import { didjs } from "../config/actor";
import { Field } from "./shared/Field";
import { Confirm } from "./shared/Confirm";
import "../assets/styles/candid.css";

const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: 46rem;
`;

const FormContainer = styled.div`
  width: 100%;
  margin-top: 2rem;
  padding: 0 4rem;
`;

const InitContainer = styled.div`
  width: 100%;
  border: 1px solid var(--grey300);
  border-radius: 0.8rem;
  overflow: auto;
  padding: 1rem;
  margin-top: 1rem;
`;

const WarningContainer = styled.div`
  width: 100%;
  background-color: var(--colorWarning);
  border-radius: 1.5rem;
  margin-top: 2rem;
  padding: 1rem 2rem;
  font-size: 1.4rem;

  ul {
    padding-left: 1.4rem;
  }
`;

const WarningLabel = styled.strong`
  display: block;
  text-align: center;
  font-size: 1.6rem;
  margin-bottom: 1rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 3rem;
`;

const MyButton = styled(Button)`
  width: 12rem;
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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [upgradeWarning, setUpgradeWarning] = useState("");
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

  async function handleDeploy(mode: string) {
    const args = parse();
    if (args === undefined) {
      return;
    }
    let candid_src = candid;
    if (initTypes.length) {
      candid_src = (await didjs.binding(candid, "installed_did"))[0];
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
  }

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
            // logger.log("Warning: upgrade is not backward compatible:\n" + err);
            setUpgradeWarning(err);
            setIsConfirmOpen(true);
            return;
          }
        }
      }
      await handleDeploy(mode);
    } catch (err) {
      isDeploy(false);
      throw err;
    }
  };

  const welcomeText = <p>Deploy your canister to the IC</p>;

  const Warnings = (
    <WarningContainer>
      <WarningLabel>Note:</WarningLabel>
      <ul>
        {exceedsLimit && (
          <li>
            You can deploy at most {MAX_CANISTERS} canisters at the same time.
          </li>
        )}
        <li>Cycle transfer instructions are silently ignored by the system.</li>
        <li>
          Deployed canister expires after{" "}
          {(ttl / BigInt(60_000_000_000)).toString()} minutes.
        </li>
      </ul>
    </WarningContainer>
  );
  const deployLabelText = "Select a canister name";
  const newDeploy = (
    <>
      <Field
        type="text"
        labelText={deployLabelText}
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
    <Field
      required
      type="select"
      labelText={deployLabelText}
      value={canisterName}
      onChange={(e) => setCanisterName(e.target.value)}
    >
      {Object.keys(canisters).map((canister) => (
        <option value={canister}>{canister}</option>
      ))}
    </Field>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        close={close}
        label="Deploy Canister"
        shouldCloseOnEsc
        shouldCloseOnOverlayClick
      >
        <ModalContainer>
          {welcomeText}
          <FormContainer>
            {exceedsLimit ? selectDeploy : newDeploy}
            {initTypes.length > 0 && (
              <InitContainer>
                <p>
                  This service requires the following installation arguments:
                </p>
                <p>({initTypes.map((arg) => arg.name).join(", ")})</p>
                <div className="InitArgs" ref={initArgs} />
              </InitContainer>
            )}
            <Field
              type="checkbox"
              labelText="Enable profiling (experimental)"
              checked={profiling}
              onChange={(e) => setProfiling(e.target.checked)}
            />
          </FormContainer>
          {Warnings}
          <ButtonContainer>
            {canisters.hasOwnProperty(canisterName) ? (
              <>
                <MyButton
                  variant="primary"
                  onClick={() => deployClick("upgrade")}
                >
                  Upgrade
                </MyButton>
                <MyButton onClick={() => deployClick("reinstall")}>
                  Reinstall
                </MyButton>
              </>
            ) : (
              <MyButton
                variant="primary"
                onClick={() => deployClick("install")}
              >
                Install
              </MyButton>
            )}
            <MyButton onClick={close}>Cancel</MyButton>
          </ButtonContainer>
        </ModalContainer>
      </Modal>
      <Confirm
        isOpen={isConfirmOpen}
        close={() => setIsConfirmOpen(false)}
        onConfirm={() => handleDeploy("upgrade")}
      >
        <h3 style={{ width: "100%", textAlign: "center" }}>Warning</h3>
        <WarningContainer>
          <strong>Upgrade is not backward compatible:</strong> {upgradeWarning}
        </WarningContainer>
        <p style={{ fontSize: "1.4rem", marginTop: "2rem" }}>
          Press "Continue" to upgrade canister anyway.
        </p>
      </Confirm>
    </>
  );
}
