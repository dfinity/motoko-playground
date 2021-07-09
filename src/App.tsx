import { useCallback, useEffect, useReducer, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";

import { CandidUI } from "./components/CandidUI";
import { Editor } from "./components/Editor";
import { Explorer } from "./components/Explorer";
import { Header } from "./components/Header";
import { saveWorkplaceToMotoko, PackageInfo, fetchPackage } from "./file";
import { deleteCanister, CanisterInfo } from "./build";
import { useLogging } from "./components/Logger";
import {
  workplaceReducer,
  WorkplaceDispatchContext,
} from "./contexts/WorkplaceState";
import { ProjectModal } from "./components/ProjectModal";
import { exampleProjects } from "./examples";
import { getActor } from "./config/actor";

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

const AppContainer = styled.div<{candidWidth: string}>`
  display: flex;
  height: var(--appHeight);
  overflow: hidden;

  width: 100vw;
  border-top: 1px solid var(--grey400);
  --candidWidth: ${props=>props.candidWidth ?? 0};
`;

export function App() {
  const [workplaceState, workplaceDispatch] = useReducer(
    workplaceReducer.reduce,
    {},
    workplaceReducer.init
    );
  const [motokoIsLoaded, setMotokoIsLoaded] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [showCandidUI, setShowCandidUI] = useState(false);
  const [candidWidth, setCandidWidth] = useState("0");
  const [TTL, setTTL] = useState(BigInt(0));
  const [forceUpdate, setForceUpdate] = useReducer(x => (x+1)%10, 0);
  
  const logger = useLogging();

  function closeProjectModal() {
    setIsProjectModalOpen(false);
    if (isFirstVisit) {
      // The modal takes 750ms to animate out, so we wait to set isFirstVisit.
      setTimeout(() => setIsFirstVisit(false), 750);
    }
  }

  const selectFile = (selectedFile: string) => {
    workplaceDispatch({
      type: "selectFile",
      payload: {
        path: selectedFile,
      },
    });
  };
  const loadPackage = (pack: PackageInfo) => {
    workplaceDispatch({
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
        return workplaceDispatch({
          type: "selectCanister",
          payload: {
            name: selectedCanister,
          },
        });
      case "delete":
      case "expired": {
        if (action === "delete") {
          const canisterInfo = workplaceState.canisters[selectedCanister];
          logger.log(`Deleting canister ${selectedCanister} with id: ${canisterInfo.id.toText()}...`);
          await deleteCanister(canisterInfo);
          logger.log('Canister deleted');
        }
        return workplaceDispatch({
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

  const saveWorkplace = (newCode: string) => {
    if (!workplaceState.selectedFile) {
      console.warn("Called saveWorkplace with no selectedFile");
      return;
    }
    workplaceDispatch({
      type: "saveFile",
      payload: {
        path: workplaceState.selectedFile,
        contents: newCode,
      },
    });
  };

  const deployWorkplace = (info: CanisterInfo) => {
    setForceUpdate();
    workplaceDispatch({
      type: 'deployWorkplace',
      payload: {
        canister: info,
      }
    });
  }

  const chooseExampleProject = useCallback(
    (project) => {
      workplaceDispatch({
        type: "loadExampleProject",
        payload: {
          project,
        },
      });
    },
    [workplaceDispatch]
  );
  const importCode = useCallback(
    (files: Record<string,string>) => {
      workplaceDispatch({
        type: "loadProject",
        payload: {
          files,
        },
      });
    }, [workplaceDispatch]
  );

  // Add the Motoko package to allow for compilation / checking
  useEffect(() => {
    const script = document.createElement("script");
    script.addEventListener("load", async () => {
      await setMotokoIsLoaded(true);
      const baseInfo = {
        name: "base",
        repo: "https://github.com/dfinity/motoko-base.git",
        dir: "src",
        version: "dfx-0.7.0",
        homepage: "https://sdk.dfinity.org/docs/base-libraries/stdlib-intro.html",
      };
      await fetchPackage(baseInfo);
      await workplaceDispatch({
        type: "loadPackage",
        payload: {
          name: "base",
          package: baseInfo,
        },
      });
      logger.log("Compiler loaded.");
    });
    script.src =
      "https://download.dfinity.systems/motoko/0.6.2/js/moc-0.6.2.js";
    document.body.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    (async () => {
      const backend = await getActor();
      setTTL((await backend.getInitParams()).canister_time_to_live);
    })();
  }, []);

  useEffect(() => {
    if (!motokoIsLoaded) {
      // saving won't work until the Motoko global is loaded
      return;
    }
    saveWorkplaceToMotoko(workplaceState);
  }, [workplaceState.canisters, motokoIsLoaded]);

  useEffect(()=>{
    // Show Candid UI iframe if there are canisters
    const isCandidReady = workplaceState.selectedCanister !== null;
    setShowCandidUI(isCandidReady);
    setCandidWidth(isCandidReady? "30vw" : "0");
  }, [workplaceState.canisters, workplaceState.selectedCanister])

  return (
    <main>
      <GlobalStyles />
      <Header openTutorial={() => setIsProjectModalOpen(true)} />
      <WorkplaceDispatchContext.Provider value={workplaceDispatch}>
        <ProjectModal
          exampleProjects={exampleProjects}
          isOpen={isProjectModalOpen}
          chooseExampleProject={chooseExampleProject}
          importCode={importCode}
          close={closeProjectModal}
          isFirstOpen={isFirstVisit}
        />
        <AppContainer candidWidth={candidWidth}>
          <Explorer
            state={workplaceState}
            ttl={TTL}
            loadPackage={loadPackage}
            onSelectFile={selectFile}
            onCanister={onCanister}
          />
          <Editor
            state={workplaceState}
            ttl={TTL}
            onSave={saveWorkplace}
            onDeploy={deployWorkplace}
            logger={logger}
          />
          {showCandidUI ?
          <CandidUI
           setCandidWidth={setCandidWidth}
           canisterId={workplaceState.canisters[workplaceState.selectedCanister!]?.id.toString()}
           forceUpdate={forceUpdate}
          /> : null
        }
        </AppContainer>
      </WorkplaceDispatchContext.Provider>
    </main>
  );
}
