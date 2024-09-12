import { useState, useCallback, useEffect, useContext } from "react";
import styled from "styled-components";
import { Ed25519KeyIdentity } from "@dfinity/identity";
import { IDL } from "@dfinity/candid";

import { Modal } from "./shared/Modal";
import { CanisterInfo, deploy } from "../build";
import { ILoggingStore } from "./Logger";
import { Button } from "./shared/Button";
import {
  WorkerContext,
  WorkplaceState,
  ContainerContext,
  Origin,
  generateNonMotokoFilesToWebContainer,
} from "../contexts/WorkplaceState";
import { didjs, backend } from "../config/actor";
import { Field } from "./shared/Field";

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

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 3rem;
`;

const MyButton = styled(Button)`
  width: 12rem;
`;
interface FrontendDeployModalProps {
  state: WorkplaceState;
  isOpen: boolean;
  close: () => void;
  onDeploy: (info: CanisterInfo) => void;
  isDeploy: (tag: boolean) => void;
  canisters: Record<string, CanisterInfo>;
  logger: ILoggingStore;
  origin: Origin;
}
const MAX_CANISTERS = 3;

function guessBuildDir(src: string | undefined): string[] {
  try {
    const dfx = JSON.parse(src!);
    const asset: any = Object.values(dfx["canisters"]).find(
      (desc: any) => desc["type"] === "assets",
    );
    return asset["source"];
  } catch (e) {
    return ["dist"];
  }
}
export function FrontendDeployModal({
  state,
  isOpen,
  close,
  onDeploy,
  isDeploy,
  canisters,
  logger,
  origin,
}: FrontendDeployModalProps) {
  const [canisterName, setCanisterName] = useState("frontend");
  const [buildDir, setBuildDir] = useState<string[]>(["dist"]);
  const worker = useContext(WorkerContext);
  const container = useContext(ContainerContext);

  useEffect(() => {
    setBuildDir(guessBuildDir(state.files["dfx.json"] as string));
  }, [state.files["dfx.json"]]);

  const exceedsLimit = Object.keys(canisters).length >= MAX_CANISTERS;

  async function deployClick(mode: string) {
    try {
      await close();
      await isDeploy(true);
      logger.log("Building frontend... (see logs in the terminal tab)");
      const { files, env } = generateNonMotokoFilesToWebContainer(state);
      // strange that console.log(env) is needed to correctly pass in env to run_cmd
      console.log(env);
      await container.container!.mount(files, { mountPoint: "user" });
      await container.run_cmd("npm", ["install"], { cwd: "user" });
      await container.run_cmd("npm", ["run", "build"], { cwd: "user", env });
      var info: CanisterInfo | undefined = canisters[canisterName];
      if (mode !== "upgrade") {
        const module_hash = assetWasmHash
          .match(/.{2}/g)!
          .map((byte) => parseInt(byte, 16));
        info = await deploy(
          worker,
          canisterName,
          canisters[canisterName],
          new Uint8Array(IDL.encode([], [])),
          mode,
          new Uint8Array(module_hash),
          true,
          false,
          false,
          logger,
          origin,
        );
        const identity = Ed25519KeyIdentity.generate();
        const principal = identity.getPrincipal();
        const args = IDL.encode([IDL.Principal], [principal]);
        await backend.callForward(info!, "authorize", args);
        await container.container!.fs.writeFile(
          "utils/identity.json",
          JSON.stringify(identity.toJSON()),
        );
        logger.log(`Authorized asset canister with ${principal}`);
      }
      logger.log(`Uploading frontend...`);
      const dirs = buildDir.map((dir) => `../user/${dir}`).join(",");
      await container.run_cmd(
        "node",
        ["uploadAsset.js", info!.id.toText(), dirs],
        { cwd: "utils" },
      );
      logger.log(`Frontend uploaded`);
      info!.isFrontend = true;
      onDeploy(info!);
      await isDeploy(false);
    } catch (err) {
      logger.log(err.message);
      await isDeploy(false);
      throw err;
    }
  }
  const welcomeText = <p>Deploy your frontend to the IC</p>;
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
              <Field
                type="text"
                labelText="Build directory"
                value={buildDir}
                onChange={(e) => setBuildDir(e.target.value)}
              />
            </FormContainer>
          </div>
          {canisterName ? (
            <ButtonContainer>
              {canisters.hasOwnProperty(canisterName) ? (
                <>
                  <MyButton
                    variant="primary"
                    onClick={() => deployClick("upgrade")}
                  >
                    Update
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
          ) : null}
        </ModalContainer>
      </Modal>
    </>
  );
}
