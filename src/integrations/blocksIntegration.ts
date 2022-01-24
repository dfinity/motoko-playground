import { WorkplaceReducerAction } from "../contexts/WorkplaceState";

type BlocksIntegrationHooks = {
  deploy: () => Promise<void>;
};

type BlocksIntegrationMessage = {
  type: "workplace";
  acknowledge: number;
  actions: [WorkplaceReducerAction];
  deploy?: boolean;
};

const ALLOWED_ORIGIN_PREFIXES = [
  "http://localhost",
  "https://blocks-editor.github.io",
];

export const BLOCKS_INTEGRATION_HOOKS: Partial<BlocksIntegrationHooks> = {};

const MESSAGE_PREFIX = "blocks:";

let previousResult;

/**
 * Enables the [Blocks Editor](https://blocks-editor.github.io/blocks/) workspace integration.
 *
 * @param dispatch Workspace action dispatch function
 * @returns Initial workspace files
 */
export async function startBlocksIntegration(
  dispatch: (WorkplaceReducerAction) => void
): Promise<Record<string, string> | undefined> {
  if (previousResult) {
    return previousResult;
  }

  // Handle integration-specific JSON messages
  const handleMessage = async (message: BlocksIntegrationMessage) => {
    if (message.type == "workplace") {
      message.actions.forEach((action) => {
        dispatch(action);
      });
      if (message.deploy) {
        // Allow text to render before deploying
        setTimeout(() => {
          BLOCKS_INTEGRATION_HOOKS.deploy?.();
        });
      }
    }
  };

  // Listen for external messages from allowed origins
  window.addEventListener(
    "message",
    async ({ origin, source, data }) => {
      try {
        if (
          !ALLOWED_ORIGIN_PREFIXES.some((prefix) => origin.startsWith(prefix))
        ) {
          return;
        }

        // Validate and parse integration message
        if (typeof data === "string" && data.startsWith(MESSAGE_PREFIX)) {
          const message = JSON.parse(data.substring(MESSAGE_PREFIX.length));
          if (process.env.NODE_ENV === "development") {
            console.log("Received integration message:", message);
          }
          await handleMessage(message);
          if (!(source instanceof MessagePort)) {
            // Send acknowledgement
            source?.postMessage(
              `${MESSAGE_PREFIX}acknowledge:${message.acknowledge}`,
              origin
            );
          }
        }
      } catch (e) {
        console.error("Error in Blocks integration message listener:");
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
