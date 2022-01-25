import { WorkplaceReducerAction } from "../contexts/WorkplaceState";
import ALLOWED_ORIGIN_PREFIXES from "./allowedOriginPrefixes";

type EditorIntegrationHooks = {
  deploy: () => Promise<void>;
};

type EditorIntegrationMessage = {
  type: "workplace";
  acknowledge: number;
  actions: [WorkplaceReducerAction];
  deploy?: boolean;
};

export const INTEGRATION_HOOKS: Partial<EditorIntegrationHooks> = {};

// Cached return value to ensure at most one initialization
let previousResult;

/**
 * Enables a cross-origin editor integration.
 *
 * @param editorKey A unique editor identifier (forward-compatibility with parallel editor integrations)
 * @param dispatch Workspace action dispatch function
 * @returns Initial workspace files
 */
export async function setupEditorIntegration(
  editorKey: string,
  dispatch: (WorkplaceReducerAction) => void
): Promise<Record<string, string> | undefined> {
  if (previousResult) {
    return previousResult;
  }
  const messagePrefix = `editor_${editorKey}:`;

  // Handle JSON messages from the external editor
  const handleMessage = async (message: EditorIntegrationMessage) => {
    if (message.type == "workplace") {
      message.actions.forEach((action) => {
        dispatch(action);
      });
      if (message.deploy) {
        // Allow text to render before deploying
        setTimeout(() => {
          INTEGRATION_HOOKS.deploy?.();
        });
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
          !ALLOWED_ORIGIN_PREFIXES.some((prefix) => origin.startsWith(prefix))
        ) {
          return;
        }

        // Validate and parse integration message
        if (typeof data === "string" && data.startsWith(messagePrefix)) {
          const message = JSON.parse(data.substring(messagePrefix.length));
          if (process.env.NODE_ENV === "development") {
            console.log("Received integration message:", message);
          }
          await handleMessage(message);
          if (!(source instanceof MessagePort)) {
            // Send acknowledgement
            source?.postMessage(
              `${messagePrefix}acknowledge:${message.acknowledge}`,
              origin
            );
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
    "Main.mo": "",
  };
  return previousResult;
}
