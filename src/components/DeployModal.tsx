import { useState, useCallback, useEffect, useContext } from "react";
import styled from "styled-components";
import {
  IDL,
  renderInput,
  blobFromUint8Array,
  InputBox,
  BinaryBlob,
} from "@dfinity/candid";

import { Modal } from "./shared/Modal";
import { CanisterInfo, getCanisterName, deploy, compileWasm } from "../build";
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
`;

const InitContainer = styled.div`
  border: 1px solid var(--grey400);
  border-radius: 1.5rem;
  padding: 1rem calc(2rem - 1px);
  margin: 1rem 0 2rem;

  input {
    width: 100%;
    color: var(--grey700);
    border: 1px solid var(--grey500);
    padding: 0.3rem 1rem;
    border-radius: 0;

    + span {
      font-size: 1.4rem;
      margin: -0.5rem 0 0.5rem;
    }
  }
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
const PreContainer = styled.pre`
  white-space: pre-wrap;
  overflow-wrap: break-word;
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

export interface DeploySetter {
  setMainFile: (name: string) => void;
  setCandidCode: (code: string) => void;
  setInitTypes: (args: Array<IDL.Type>) => void;
  setShowDeployModal: (boolean) => void;
  setWasm: (file: BinaryBlob | undefined) => void;
}

interface DeployModalProps {
  isOpen: boolean;
  close: () => void;
  onDeploy: (string) => void;
  isDeploy: (tag: boolean) => void;
  canisters: Record<string, CanisterInfo>;
  ttl: bigint;
  fileName: string;
  wasm: BinaryBlob | undefined;
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
  wasm,
  candid,
  initTypes,
  logger,
}: DeployModalProps) {
  const [canisterName, setCanisterName] = useState("");
  const [inputs, setInputs] = useState<InputBox[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [candidWarning, setCandidWarning] = useState("");
  const [stableWarning, setStableWarning] = useState("");
  const [profiling, setProfiling] = useState(false);
  const [forceGC, setForceGC] = useState(false);
  const [gcMethod, setGCMethod] = useState("copying");
  const [compileResult, setCompileResult] = useState({ wasm: undefined });
  const [deployMode, setDeployMode] = useState("");
  const [startDeploy, setStartDeploy] = useState(false);
  const worker = useContext(WorkerContext);

  const exceedsLimit = Object.keys(canisters).length >= MAX_CANISTERS;
  const isMotoko = wasm ? false : true;

  useEffect(() => {
    if (!exceedsLimit) {
      setCanisterName(getCanisterName(fileName));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileName]);

  useEffect(() => {
    // This code is very tricky...compileResult takes time to set, so we need useEffect.
    // We also need to prevent handleDeploy being called multiple times.
    if (deployMode && compileResult.wasm) {
      if (deployMode === "upgrade" && !startDeploy) {
        checkUpgrade();
        return;
      }
      if (startDeploy) {
        handleDeploy(deployMode);
      }
    }
  }, [compileResult, startDeploy, deployMode]);

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

  async function checkUpgrade() {
    let hasWarning = false;
    if (canisters[canisterName].stableSig && compileResult.stable) {
      await worker.Moc({
        type: "save",
        file: "pre.most",
        content: canisters[canisterName].stableSig,
      });
      await worker.Moc({
        type: "save",
        file: "post.most",
        content: compileResult.stable,
      });
      const result = await worker.Moc({
        type: "stableCheck",
        pre: "pre.most",
        post: "post.most",
      });
      if (result.diagnostics) {
        const err = result.diagnostics.map((d) => d.message).join("\n");
        await setStableWarning(err);
        if (err) {
          hasWarning = true;
        }
      } else {
        await setStableWarning("");
      }
    }
    if (canisters[canisterName].candid && compileResult.candid) {
      const old = canisters[canisterName].candid;
      const result = await didjs.subtype(compileResult.candid, old);
      if (result.hasOwnProperty("Err")) {
        const err = result.Err.replaceAll(
          "expected type",
          "pre-upgrade interface"
        );
        await setCandidWarning(err);
        if (err) {
          hasWarning = true;
        }
      } else {
        await setCandidWarning("");
      }
    }
    if (!hasWarning) {
      setStartDeploy(true);
    } else {
      setIsConfirmOpen(true);
    }
  }

  async function handleDeploy(mode: string) {
    const args = parse();

    await isDeploy(true);
    const info = await deploy(
      worker,
      canisterName,
      canisters[canisterName],
      args,
      mode,
      compileResult.wasm,
      profiling,
      logger
    );
    await isDeploy(false);
    if (info) {
      info.candid = compileResult.candid;
      info.stableSig = compileResult.stable;
      await worker.Moc({
        type: "save",
        file: `idl/${info.id}.did`,
        content: compileResult.candid,
      });
      onDeploy(info);
    }
    setCompileResult({ wasm: undefined });
  }

  const deployClick = async (mode: string) => {
    const args = parse();
    if (args === undefined) {
      return;
    }
    await close();
    try {
      setStartDeploy(false);
      setDeployMode(mode);
      if (!wasm) {
        if (forceGC) {
          await worker.Moc({ type: "gcFlags", option: "force" });
        } else {
          await worker.Moc({ type: "gcFlags", option: "scheduling" });
        }
        await worker.Moc({ type: "gcFlags", option: gcMethod });
        const result = await compileWasm(worker, fileName, logger);
        if (!result) {
          throw new Error("syntax error");
        }
        await setCompileResult(result);
      } else {
        await setCompileResult({ wasm: wasm, candid: candid });
      }
      if (mode !== "upgrade") {
        setStartDeploy(true);
      }
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
        <li>Canister can use at most 1GB of stable memory.</li>
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
            {isMotoko ? (
              <InitContainer>
                <Field
                  type="select"
                  labelText="GC strategy"
                  value={gcMethod}
                  onChange={(e) => setGCMethod(e.target.value)}
                >
                  <option value="copying">Copying GC (default)</option>
                  <option value="marking">Marking GC</option>
                </Field>
                <Field
                  type="checkbox"
                  labelText="Force garbage collection (only if you want to test GC)"
                  checked={forceGC}
                  onChange={(e) => setForceGC(e.target.checked)}
                />
              </InitContainer>
            ) : null}
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
        onConfirm={() => setStartDeploy(true)}
      >
        <h3 style={{ width: "100%", textAlign: "center" }}>Warning</h3>

        {stableWarning ? (
          <WarningContainer>
            <strong>Incompatible stable signature will cause data loss:</strong>
            <PreContainer>{stableWarning}</PreContainer>
          </WarningContainer>
        ) : null}

        {candidWarning ? (
          <WarningContainer>
            <strong>Upgrade is not backward compatible:</strong>{" "}
            <PreContainer>{candidWarning}</PreContainer>
          </WarningContainer>
        ) : null}

        <p style={{ fontSize: "1.4rem", marginTop: "2rem" }}>
          Press "Continue" to upgrade canister anyway.
        </p>
      </Confirm>
    </>
  );
}
