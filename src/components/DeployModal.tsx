import { useState, useCallback, useEffect, useContext } from "react";
import styled from "styled-components";
import { IDL, renderInput, InputBox } from "@dfinity/candid";
import { Ed25519KeyIdentity } from "@dfinity/identity";

import { Modal } from "./shared/Modal";
import {
  CanisterInfo,
  getCanisterName,
  deploy,
  compileWasm,
  getBaseDeps,
} from "../build";
import { ILoggingStore } from "./Logger";
import { Button } from "./shared/Button";
import {
  WorkerContext,
  WorkplaceDispatchContext,
  WorkplaceState,
  ContainerContext,
  Origin,
} from "../contexts/WorkplaceState";
import { didjs, backend } from "../config/actor";
import { Field } from "./shared/Field";
import { Confirm } from "./shared/Confirm";
import "../assets/styles/candid.css";

const assetWasmHash =
  "3a533f511b3960b4186e76cf9abfbd8222a2c507456a66ec55671204ee70cae3";

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

const CodeBlock = styled("pre")`
  display: block;
  border-radius: 12px;
  padding: 12px;
  background-color: rgba(255, 255, 255, 0.5);
`;

export interface DeploySetter {
  setMainFile: (name: string) => void;
  setCandidCode: (code: string) => void;
  setInitTypes: (args: Array<IDL.Type>) => void;
  setShowDeployModal: (arg: boolean) => void;
  setShowFrontendDeployModal: (arg: boolean) => void;
  setWasm: (file: Uint8Array | undefined) => void;
}

interface DeployModalProps {
  state: WorkplaceState;
  isOpen: boolean;
  close: () => void;
  onDeploy: (string) => void;
  isDeploy: (tag: boolean) => void;
  canisters: Record<string, CanisterInfo>;
  ttl: bigint;
  fileName: string;
  wasm: Uint8Array | undefined;
  candid: string;
  initTypes: Array<IDL.Type>;
  logger: ILoggingStore;
  origin: Origin;
}

const MAX_CANISTERS = 3;

export function DeployModal({
  state,
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
  origin,
}: DeployModalProps) {
  const [canisterName, setCanisterName] = useState("");
  const [inputs, setInputs] = useState<InputBox[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [candidWarning, setCandidWarning] = useState("");
  const [stableWarning, setStableWarning] = useState("");
  const [profiling, setProfiling] = useState(false);
  const [hasStartPage, setHasStartPage] = useState(false);
  const [forceGC, setForceGC] = useState(false);
  const [gcMethod, setGCMethod] = useState("incremental");
  const [compileResult, setCompileResult] = useState({ wasm: undefined });
  const [deployMode, setDeployMode] = useState("");
  const [startDeploy, setStartDeploy] = useState(false);
  const [bindingDir, setBindingDir] = useState("src/declarations");
  const worker = useContext(WorkerContext);
  const dispatch = useContext(WorkplaceDispatchContext);

  const exceedsLimit = Object.keys(canisters).length >= MAX_CANISTERS;
  const isMotoko = wasm ? false : true;
  const hasFrontend = "package.json" in state.files;

  useEffect(() => {
    if (!exceedsLimit) {
      setCanisterName(getCanisterName(fileName));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileName]);

  useEffect(() => {
    setCanisterName(canisterName.replaceAll(/[-\s]/g, "_"));
    if (hasFrontend) {
      setBindingDir(`src/declarations/${canisterName}`);
    }
  }, [hasFrontend, canisterName]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    [inputs],
  );

  const parse = () => {
    if (!initTypes.length) {
      return IDL.encode(initTypes, []);
    }
    const args = inputs.map((arg) => arg.parse());
    const isReject = inputs.some((arg) => arg.isRejected());
    if (isReject) {
      return undefined;
    }
    return IDL.encode(initTypes, args);
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
        const err = result.diagnostics
          .map((d) => `[${d.code}] ${d.message}`)
          .join("\n");
        await setStableWarning(err);
        if (err) {
          hasWarning = true;
          for (const warn of result.diagnostics) {
            await dispatch({
              type: "addSessionTag",
              payload: `moc:warn:${warn.code}`,
            });
          }
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
          "pre-upgrade interface",
        );
        await setCandidWarning(err);
        if (err) {
          hasWarning = true;
          await dispatch({ type: "addSessionTag", payload: `moc:warn:candid` });
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

  async function addTags() {
    if (initTypes.length > 0) {
      await dispatch({ type: "addSessionTag", payload: "wasm:init_args" });
    }
    if (forceGC) {
      await dispatch({ type: "addSessionTag", payload: "moc:gc:force" });
    }
    if (gcMethod !== "incremental") {
      await dispatch({ type: "addSessionTag", payload: `moc:gc:${gcMethod}` });
    }
    for (const pack of Object.values(state.packages)) {
      if (pack.name !== "base") {
        let repo = pack.repo;
        if (
          pack.repo.startsWith("https://github.com/") &&
          pack.repo.endsWith(".git")
        ) {
          repo = pack.repo.slice(19, -4);
        }
        await dispatch({
          type: "addSessionTag",
          payload: `import:package:${repo}`,
        });
      }
    }
    for (const canister of Object.values(state.canisters)) {
      if (canister.isExternal) {
        await dispatch({
          type: "addSessionTag",
          payload: `import:canister:${canister.id}`,
        });
      }
    }
    try {
      const pkgs = await getBaseDeps(worker, fileName);
      for (const pkg of pkgs) {
        await dispatch({
          type: "addSessionTag",
          payload: `import:base:${pkg}`,
        });
      }
    } catch (err) {}
  }

  async function handleDeploy(mode: string) {
    const args = parse();
    await addTags();
    console.log(origin);
    try {
      await isDeploy(true);
      const info = await deploy(
        worker,
        canisterName,
        canisters[canisterName],
        args,
        mode,
        compileResult.wasm,
        false,
        profiling,
        hasStartPage,
        logger,
        origin,
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
        if (hasFrontend && compileResult.candid) {
          const js = (await didjs.did_to_js(compileResult.candid))[0];
          const ts = (await didjs.binding(compileResult.candid, "ts"))[0];
          const name = `${bindingDir}/${info.name!}.did`;
          await dispatch({
            type: "saveFile",
            payload: { path: `${name}.js`, contents: js },
          });
          await dispatch({
            type: "saveFile",
            payload: { path: `${name}.d.ts`, contents: ts },
          });
          logger.log(`Generated frontend bindings at ${name}.js`);
        }
        onDeploy(info);
      }
      setCompileResult({ wasm: undefined });
      await dispatch({ type: "clearSessionTags" });
    } catch (err) {
      isDeploy(false);
      await dispatch({ type: "clearSessionTags" });
      throw err;
    }
  }

  const deployClick = async (mode: string) => {
    const args = parse();
    if (args === undefined) {
      return;
    }
    await close();
    await dispatch({ type: "clearSessionTags" });
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
        await worker.Moc({
          type: "setPublicMetadata",
          list: ["candid:service", "candid:args", "motoko:stable-types"],
        });
        const result = await compileWasm(worker, fileName, logger);
        if (!result) {
          throw new Error("syntax error");
        }
        await setCompileResult(result[0]);
        for (const warn of result[1]) {
          await dispatch({
            type: "addSessionTag",
            payload: `moc:warn:${warn}`,
          });
        }
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
        <li>
          Canister can use at most 1GB of stable memory and 1GB of heap memory.
        </li>
        <li>
          Canister can call management canister to manage itself without being
          the controller.
        </li>
        <li>
          Deployed canister expires after{" "}
          {(ttl / BigInt(60_000_000_000)).toString()} minutes.
        </li>
      </ul>
    </WarningContainer>
  );
  const RegionCode = `import Region "mo:base/Region";
actor {
  stable let profiling = do {
    let r = Region.new();
    ignore Region.grow(r, 32);
    r
  };
  ...
`;
  const RegionNotes = (
    <WarningContainer>
      <WarningLabel>Note on Profiling</WarningLabel>
      <ul>
        <li>
          If you do not need to profile canister upgrade and the canister code
          doesn't access stable memory, you do not need to do anything else.
        </li>
        <li>
          Otherwise, you need to check the "Reserved the first region in stable
          memory for profiling" checkbox, and add the following code at the top
          of the actor: (see{" "}
          <a
            target="_blank"
            rel="noreferrer"
            href="https://github.com/dfinity/ic-wasm#working-with-upgrades-and-stable-memory"
          >
            this doc
          </a>{" "}
          for more background)
        </li>
      </ul>
      <CodeBlock>{RegionCode}</CodeBlock>
      <ul>
        <li>
          We cannot check if you have added the above code in your canister, but
          if you don't, the profiling may not work properly.
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
        {Object.keys(canisters).map((canister, i) => (
          <option key={`${canister}${i}`}>{canister}</option>
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
          <div style={{ maxHeight: 680, overflowY: "auto", width: "100%" }}>
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
              {hasFrontend && (
                <Field
                  type="text"
                  labelText="Output JS Binding directory"
                  value={bindingDir}
                  onChange={(e) => setBindingDir(e.target.value)}
                />
              )}
              <Field
                type="checkbox"
                labelText="Enable profiling (experimental)"
                checked={profiling}
                onChange={(e) => setProfiling(e.target.checked)}
              />
              {profiling ? (
                <Field
                  type="checkbox"
                  labelText="Reserved the first region in stable memory for profiling"
                  checked={hasStartPage}
                  onChange={(e) => setHasStartPage(e.target.checked)}
                />
              ) : null}
              {isMotoko ? (
                <InitContainer>
                  <Field
                    type="select"
                    labelText="GC strategy"
                    value={gcMethod}
                    onChange={(e) => setGCMethod(e.target.value)}
                  >
                    <option value="incremental">
                      Incremental GC (default)
                    </option>
                    <option value="copying">Copying GC</option>
                    <option value="marking">Marking GC</option>
                    <option value="generational">Generational GC</option>
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
            {profiling ? <>{RegionNotes}</> : null}
            {Warnings}
          </div>
          {canisterName ? (
            <ButtonContainer>
              {canisters.hasOwnProperty(canisterName) ? (
                <>
                  {!profiling || (profiling && hasStartPage) ? (
                    <MyButton
                      variant="primary"
                      onClick={() => deployClick("upgrade")}
                    >
                      Upgrade
                    </MyButton>
                  ) : null}
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
          ) : null}
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
