import styled from "styled-components";
import { PanelHeader } from "./shared/PanelHeader";
import iconCollapse from "../assets/images/icon-collapse.svg";
import iconOpen from "../assets/images/icon-open.svg";
import { uiCanisterUrl } from "../config/actor";
import React, { useEffect, useState, useRef } from "react";

const CandidPanel = styled.div<{ isExpanded: boolean }>`
  width: 40%;
  max-width: 60rem;
  width: var(--candidWidth);
`;

const CandidFrame = styled.iframe`
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
  forceUpdate?: any;
  onMessage?: (event: { origin: string; source: Window; message: any }) => void;
}

export function CandidUI({
  canisterId,
  candid,
  setCandidWidth,
  forceUpdate,
  onMessage,
}: PropTypes) {
  const [isExpanded, setIsExpanded] = useState(true);
  const candidFrameRef = useRef<HTMLIFrameElement>(null);
  const didParam =
    candid && candid.length < 2048
      ? `&did=${encodeURIComponent(btoa(candid))}`
      : "";

  const url =
    `${CANDID_UI_CANISTER_URL}/?id=${canisterId}&tag=${forceUpdate}` + didParam;

  useEffect(() => {
    const newSize = isExpanded ? "30vw" : "fit-content";
    setCandidWidth?.(newSize);
  }, [isExpanded, setCandidWidth]);
  useEffect(() => {
    setIsExpanded(true);
  }, [canisterId, candid, forceUpdate]);
  useEffect(() => {
    const handleMessage = ({ origin, source, data }) => {
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
                `(Expected: ${CANDID_UI_CANISTER_URL})`
              );
              return;
            }
            const message = JSON.parse(
              data.substring(CANDID_UI_MESSAGE_PREFIX.length)
            );
            onMessage?.({ origin, source, message });
          }
        } catch (e) {
          console.error("Error while processing Candid UI message:");
          console.error(e);
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onMessage, url]);

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
          {isExpanded ? "CANDID UI" : null}
        </Button>
        {isExpanded ? (
          <Button
            onClick={() => {
              window.open(url, "_blank");
            }}
          >
            <OpenIcon src={iconOpen} />
          </Button>
        ) : null}
      </PanelHeader>
      {isExpanded ? <CandidFrame ref={candidFrameRef} src={url} /> : null}
    </CandidPanel>
  );
}
