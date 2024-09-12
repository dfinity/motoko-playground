import styled from "styled-components";
import { PanelHeader } from "./shared/PanelHeader";
import iconCollapse from "../assets/images/icon-collapse.svg";
import iconOpen from "../assets/images/icon-open.svg";
import { uiCanisterUrl } from "../config/actor";
import React, { useEffect, useState, useRef, useCallback } from "react";

const CandidPanel = styled.div<{ isExpanded: boolean }>`
  width: 40%;
  max-width: 60rem;
  width: var(--candidWidth);
`;

const CandidFrame = styled.iframe.attrs({
  sandbox: "allow-scripts allow-same-origin allow-forms allow-popups",
})`
  height: calc(var(--appHeight) - var(--sectionHeaderHeight));
  border: none;
  width: var(--candidWidth);
`;

const CollapseIcon = styled("img")<{ isExpanded: boolean }>`
  width: 1.4rem;
  margin-right: 1rem;
  ${(props) => (!props.isExpanded ? "transform: rotate(180deg);" : "")}
`;

const OpenIcon = styled("img")`
  width: 2.2rem;
  margin-left: auto;
`;

const Button = styled.button`
  background: none;
  border: none;
  box-shadow: none;
`;

const CANDID_UI_CANISTER_URL = uiCanisterUrl;
const CANDID_UI_MESSAGE_PREFIX = "CandidUI";

interface PropTypes {
  canisterId: string;
  candid?: string | null | undefined;
  setCandidWidth?: (width: string) => void;
  isFrontend: boolean;
  forceUpdate?: any;
  onMessage?: (event: { origin: string; source: Window; message: any }) => void;
}

export function CandidUI({
  canisterId,
  candid,
  setCandidWidth,
  forceUpdate,
  isFrontend,
  onMessage,
}: PropTypes) {
  const [isExpanded, setIsExpanded] = useState(true);
  const candidFrameRef = useRef<HTMLIFrameElement>(null);
  const didParam =
    candid && candid.length < 2000
      ? `&did=${encodeURIComponent(btoa(candid))}`
      : "&external-config";

  const url = isFrontend
    ? `https://${canisterId}.raw.icp0.io`
    : `${CANDID_UI_CANISTER_URL}/?id=${canisterId}&tag=${forceUpdate}` +
      didParam;

  // Handle incoming messages from iframe
  const handleMessage = useCallback(
    ({ origin, source, data }) => {
      const frame = candidFrameRef.current;
      if (frame) {
        try {
          // Validate and parse message (example: `CandidUI{"key":"value",...}`)
          if (
            typeof data === "string" &&
            data.startsWith(CANDID_UI_MESSAGE_PREFIX)
          ) {
            // Ensure the message is from Candid UI
            if (origin !== CANDID_UI_CANISTER_URL) {
              console.warn(
                "Received Candid UI message from unexpected origin:",
                origin,
                `(Expected: ${CANDID_UI_CANISTER_URL})`,
              );
              return;
            }
            const message = JSON.parse(
              data.substring(CANDID_UI_MESSAGE_PREFIX.length),
            );
            onMessage?.({ origin, source, message });
          }
        } catch (e) {
          console.error("Error while processing Candid UI message:");
          console.error(e);
        }
      }
    },
    [onMessage],
  );

  useEffect(() => {
    const newSize = isExpanded ? "30vw" : "fit-content";
    setCandidWidth?.(newSize);
  }, [isExpanded, setCandidWidth]);
  useEffect(() => {
    setIsExpanded(true);
  }, [canisterId, candid, forceUpdate]);
  useEffect(() => {
    if (isFrontend) {
      return;
    }
    window.addEventListener("message", handleMessage, false);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage, onMessage, url]);

  const handleLoadFrame = (event) => {
    sendConfigMessage(event.target.contentWindow, null); // use `null` for acknowledge key
  };

  const handleOpenTab = () => {
    const newWindow = window.open(url, "_blank");
    if (!newWindow) {
      console.warn("Unable to open new tab for Candid UI");
      return;
    }
    if (isFrontend) {
      return;
    }

    // Limit number of message attempts
    let remainingAttempts = 20;
    const ack = setInterval(() => {
      if (--remainingAttempts === 0) {
        clearInterval(ack);
      }
      sendConfigMessage(newWindow, ack);
    }, 500);

    // End attempts on receive message
    const acknowledgeListener = (event) => {
      const { origin, source, data } = event;
      if (
        source === newWindow &&
        origin === CANDID_UI_CANISTER_URL &&
        typeof data === "string" &&
        data.startsWith(CANDID_UI_MESSAGE_PREFIX)
      ) {
        clearInterval(ack);
        window.removeEventListener("message", acknowledgeListener);
      }
    };
    window.addEventListener("message", acknowledgeListener, false);
  };

  const sendConfigMessage = (newWindow: Window, acknowledge: any) => {
    if (isFrontend) {
      return;
    }
    console.log("Sending config message to Candid UI");

    // Configure candid using iframe message
    const message = {
      type: "config",
      config: {
        candid: candid ? btoa(candid) : undefined,
        // TODO: add more configuration options?
      },
      acknowledge,
    };
    newWindow.postMessage(
      `${CANDID_UI_MESSAGE_PREFIX}${JSON.stringify(message)}`,
      CANDID_UI_CANISTER_URL,
    );
  };

  return (
    <CandidPanel isExpanded={isExpanded}>
      <PanelHeader>
        <Button
          onClick={() => {
            setIsExpanded(!isExpanded);
          }}
        >
          <CollapseIcon
            isExpanded={isExpanded}
            src={iconCollapse}
            alt="Collapse icon"
          />
          {isExpanded ? (isFrontend ? "FRONTEND" : "CANDID UI") : null}
        </Button>
        {isExpanded ? (
          <Button onClick={handleOpenTab}>
            <OpenIcon src={iconOpen} />
          </Button>
        ) : null}
      </PanelHeader>
      {isExpanded ? (
        <CandidFrame ref={candidFrameRef} src={url} onLoad={handleLoadFrame} />
      ) : null}
    </CandidPanel>
  );
}
