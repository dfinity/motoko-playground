import { WorkplaceReducerAction } from "../contexts/WorkplaceState";
import ALLOWED_ORIGINS from "./allowedOrigins";
import { PackageInfo } from "../workers/file";

type EditorIntegrationHooks = {
  deploy: () => Promise<void>;
};

type EditorIntegrationRequest = {
  type: "workplace";
  acknowledge: number;
  actions?: [WorkplaceReducerAction];
  packages?: [PackageInfo];
  deploy?: boolean;
};

type EditorIntegrationResponse = {
  acknowledge: number;
};

export interface EditorIntegrationResult {
  origin: string;
  files: Record<string, string>;
}

export const INTEGRATION_HOOKS: Partial<EditorIntegrationHooks> = {};

// Cached return value to ensure at most one initialization
let previousResult;

/**
 * Enables a cross-origin editor integration.
 *
 * @param editorKey A unique editor identifier (forward-compatibility with parallel editor integrations)
 * @param dispatch Workspace action dispatch function
 * @param worker Motoko compiler worker
 * @returns Initial workspace files
 */
export async function setupEditorIntegration(
  editorKey: string,
  dispatch: (WorkplaceReducerAction) => void,
  worker // MocWorker
): Promise<EditorIntegrationResult | undefined> {
  if (previousResult) {
    return previousResult;
  }

  // Handle JSON messages from the external editor
  const handleMessage = async (message: EditorIntegrationRequest) => {
    if (message.type === "workplace") {
      if (message.actions) {
        message.actions.forEach((action) => {
          dispatch(action);
        });
      }
      if (message.packages) {
        await Promise.all(
          message.packages.map(async (packageInfo) => {
            await worker.fetchPackage(packageInfo);
            dispatch({
              type: "loadPackage",
              payload: {
                name: packageInfo.name,
                package: packageInfo,
              },
            });
          })
        );
      }
      if (message.deploy) {
        await INTEGRATION_HOOKS.deploy?.();
      }
    }
  };

  // Listen for external messages from allowed origins
  window.addEventListener(
    "message",
    async ({ origin, source, data }) => {
      try {
        // Ensure the message is from an allowed origin
        if (
          !ALLOWED_ORIGINS.some((allowed) =>
            allowed instanceof RegExp
              ? allowed.test(origin)
              : allowed === origin
          )
        ) {
          return;
        }

        // Validate and parse integration message (example: `CustomEditor{"type":"workplace","actions":[...]}`)
        if (typeof data === "string" && data.startsWith(editorKey)) {
          const message = JSON.parse(data.substring(editorKey.length));
          if (process.env.NODE_ENV === "development") {
            console.log("Received integration message:", message);
          }
          await handleMessage(message);
          if (!(source instanceof MessagePort)) {
            // Send response (example: `CustomEditor{"acknowledge":123}`)
            const response: EditorIntegrationResponse = {
              acknowledge: message.acknowledge,
            };
            source?.postMessage(`${editorKey}${JSON.stringify(response)}`, {
              targetOrigin: origin,
            });
          }
        }
      } catch (e) {
        console.error("Error in editor integration message listener:");
        console.error(e);
      }
    },
    false
  );

  // Load a default empty project
  previousResult = {
    origin,
    files: {
      "Main.mo": "",
    },
  };
  return previousResult;
}
