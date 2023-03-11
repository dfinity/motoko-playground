import { useCallback, useEffect, useReducer, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";

// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
import MocWorker from "comlink-loader!./workers/moc";

import { CandidUI } from "./components/CandidUI";
import { Editor } from "./components/Editor";
import { Explorer } from "./components/Explorer";
import { Header } from "./components/Header";
import { CanisterInfo } from "./build";
import { useLogging } from "./components/Logger";
import {
  workplaceReducer,
  WorkplaceDispatchContext,
  WorkerContext,
  getActorAliases,
  getDeployedCanisters,
  getShareableProject,
} from "./contexts/WorkplaceState";
import { ProjectModal } from "./components/ProjectModal";
import { DeployModal, DeploySetter } from "./components/DeployModal";
import { backend, saved } from "./config/actor";
import { setupEditorIntegration } from "./integrations/editorIntegration";

const MOC_VERSION = "0.8.4";

const GlobalStyles = createGlobalStyle`
  :root {
    font-family: "CircularXX", sans-serif;
    font-size: 10px;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-size: 1.6rem;
    color: var(--grey700);
  }

  button {
    cursor: pointer;

    &:active {
      filter: brightness(0.85);
    }
  }
`;

const AppContainer = styled.div<{ candidWidth: string; consoleHeight: string }>`
  display: flex;
  height: var(--appHeight);
  overflow: hidden;

  width: 100vw;
  border-top: 1px solid var(--grey400);
  --candidWidth: ${(props) => props.candidWidth ?? 0};
  --consoleHeight: ${(props) => props.consoleHeight ?? 0};
`;

const worker = new MocWorker();
const urlParams = new URLSearchParams(window.location.search);
const hasUrlParams = !!(
  urlParams.get("git") ||
  urlParams.get("tag") ||
  urlParams.get("post")
);
async function fetchFromUrlParams(
  dispatch: (WorkplaceReducerAction) => void
): Promise<Record<string, string> | undefined> {
  const git = urlParams.get("git");
  const tag = urlParams.get("tag");
  const editorKey = urlParams.get("post");
  if (editorKey) {
    return setupEditorIntegration(editorKey, dispatch, worker);
  }
  if (git) {
    const repo = {
      repo: git,
      branch: urlParams.get("branch") || "main",
      dir: urlParams.get("dir") || "",
    };
    return await worker.fetchGithub(repo);
  }
  if (tag) {
    const opt = await saved.getProject(BigInt(tag));
    if (opt.length === 1) {
      const project = opt[0].project;
      const files = Object.fromEntries(
        project.files.map((file) => {
          worker.Moc({ type: "save", file: file.name, content: file.content });
          return [file.name, file.content];
        })
      );
      if (project.packages.length) {
        for (const pack of project.packages[0]) {
          const info = {
            name: pack.name,
            repo: pack.repo,
            version: pack.version,
            dir: pack.dir.length ? pack.dir[0] : undefined,
            homepage: pack.homepage.length ? pack.homepage[0] : undefined,
          };
          if (await worker.fetchPackage(info)) {
            await dispatch({
              type: "loadPackage",
              payload: { name: info.name, package: info },
            });
          }
        }
      }
      if (project.canisters.length) {
        for (const canister of project.canisters[0]) {
          const info = {
            id: canister.id,
            isExternal: true,
            name: canister.name,
            candid: canister.candid,
          };
          await worker.Moc({
            type: "save",
            file: `idl/${info.id}.did`,
            content: info.candid,
          });
          await dispatch({
            type: "deployWorkplace",
            payload: { canister: info },
          });
        }
      }
      return files;
    }
  }
}

export function App() {
  const [workplaceState, workplaceDispatch] = useReducer(
    workplaceReducer.reduce,
    {},
    workplaceReducer.init
  );
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(!hasUrlParams);
  const [isFirstVisit, setIsFirstVisit] = useState(!hasUrlParams);
  const [showCandidUI, setShowCandidUI] = useState(false);
  const [candidWidth, setCandidWidth] = useState("0");
  const [consoleHeight, setConsoleHeight] = useState("3rem");
  const [TTL, setTTL] = useState(BigInt(0));
  const [forceUpdate, setForceUpdate] = useReducer((x) => (x + 1) % 10, 0);

  // States for deploy modal
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [candidCode, setCandidCode] = useState("");
  const [initTypes, setInitTypes] = useState([]);
  const [mainFile, setMainFile] = useState("");
  const [wasm, setWasm] = useState(undefined);
  const deploySetter: DeploySetter = {
    setMainFile,
    setInitTypes,
    setCandidCode,
    setShowDeployModal,
    setWasm,
  };

  const logger = useLogging();

  function closeProjectModal() {
    setIsProjectModalOpen(false);
    if (isFirstVisit) {
      // The modal takes 750ms to animate out, so we wait to set isFirstVisit.
      setTimeout(() => setIsFirstVisit(false), 750);
    }
  }
  async function shareProject() {
    logger.log("Sharing project code...");
    const project = getShareableProject(workplaceState);
    const hash = await saved.putProject(project);
    logger.log(
      `Use this link to access the code:\n${
        window.location.origin
      }/?tag=${hash.toString()}`
    );
  }

  const deployWorkplace = (info: CanisterInfo) => {
    setForceUpdate();
    workplaceDispatch({
      type: "deployWorkplace",
      payload: {
        canister: info,
      },
    });
  };

  const importCode = useCallback(
    (files: Record<string, string>) => {
      workplaceDispatch({
        type: "loadProject",
        payload: {
          files,
        },
      });
    },
    [workplaceDispatch]
  );

  // Add the Motoko package to allow for compilation / checking
  useEffect(() => {
    const baseInfo = {
      name: "base",
      repo: "https://github.com/dfinity/motoko-base.git",
      dir: "src",
      version: `moc-${MOC_VERSION}`,
      homepage: "https://sdk.dfinity.org/docs/base-libraries/stdlib-intro.html",
    };
    (async () => {
      await worker.fetchPackage(baseInfo);
      await workplaceDispatch({
        type: "loadPackage",
        payload: {
          name: "base",
          package: baseInfo,
        },
      });
      logger.log(`moc version ${MOC_VERSION}`);
      logger.log(`base library version ${baseInfo.version}`);
      // fetch code after loading base library
      if (hasUrlParams) {
        const files = await fetchFromUrlParams(workplaceDispatch);
        if (files) {
          importCode(files);
        } else {
          logger.log(`Failed to fetch files from "${window.location.search}"`);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    (async () => {
      setTTL((await backend.getInitParams()).canister_time_to_live);
    })();
  }, []);

  useEffect(() => {
    worker.Moc({
      type: "setActorAliases",
      list: getActorAliases(workplaceState.canisters),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workplaceState.canisters]);

  useEffect(() => {
    // Show Candid UI iframe if there are canisters
    const isCandidReady =
      workplaceState.selectedCanister &&
      workplaceState.canisters[workplaceState.selectedCanister];
    setShowCandidUI(isCandidReady);
    setCandidWidth(isCandidReady ? "30vw" : "0");
  }, [workplaceState.canisters, workplaceState.selectedCanister]);

  return (
    <main>
      <GlobalStyles />
      <Header
        shareProject={shareProject}
        openTutorial={() => setIsProjectModalOpen(true)}
      />
      <WorkplaceDispatchContext.Provider value={workplaceDispatch}>
        <WorkerContext.Provider value={worker}>
          <ProjectModal
            isOpen={isProjectModalOpen}
            importCode={importCode}
            close={closeProjectModal}
            isFirstOpen={isFirstVisit}
          />
          <DeployModal
            isOpen={showDeployModal}
            close={() => setShowDeployModal(false)}
            onDeploy={deployWorkplace}
            isDeploy={setIsDeploying}
            canisters={getDeployedCanisters(workplaceState.canisters)}
            ttl={TTL}
            fileName={mainFile}
            wasm={wasm}
            candid={candidCode}
            initTypes={initTypes}
            logger={logger}
          />
          <AppContainer candidWidth={candidWidth} consoleHeight={consoleHeight}>
            <Explorer
              state={workplaceState}
              ttl={TTL}
              logger={logger}
              deploySetter={deploySetter}
            />
            <Editor
              state={workplaceState}
              logger={logger}
              deploySetter={deploySetter}
              isDeploying={isDeploying}
              setConsoleHeight={setConsoleHeight}
            />
            {showCandidUI ? (
              <CandidUI
                setCandidWidth={setCandidWidth}
                canisterId={workplaceState.canisters[
                  workplaceState.selectedCanister!
                ]?.id.toString()}
                candid={
                  workplaceState.canisters[workplaceState.selectedCanister!]
                    ?.candid
                }
                forceUpdate={forceUpdate}
                onMessage={({ origin, source, message }) => {
                  if (!message.caller) return;
                  // We have to check children for all canisters in workplaceState,
                  // because message.caller can call other canisters to spawn new children.
                  const nameMap = Object.fromEntries(
                    Object.entries(workplaceState.canisters).map(
                      ([name, info]) => [info.id, name]
                    )
                  );
                  Object.entries(workplaceState.canisters).forEach(
                    async ([_, info]) => {
                      if (!info.timestamp || info.isExternal) {
                        return;
                      }
                      const subtree = await backend.getSubtree(info);
                      subtree.reverse().forEach(([parentId, children]) => {
                        const parentName = nameMap[parentId];
                        // Assume children is sorted by timestamp
                        children.reverse().forEach((child, i) => {
                          child.name = `${parentName}_${i}`;
                          child.isExternal = false;
                          nameMap[child.id] = child.name;
                          workplaceDispatch({
                            type: "deployWorkplace",
                            payload: { canister: child, do_not_select: true },
                          });
                        });
                      });
                    }
                  );
                }}
              />
            ) : null}
          </AppContainer>
        </WorkerContext.Provider>
      </WorkplaceDispatchContext.Provider>
    </main>
  );
}
