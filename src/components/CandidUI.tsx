import styled from "styled-components";
import { PanelHeader } from "./shared/PanelHeader";
import iconCollapse from "../assets/images/icon-collapse.svg";
import iconOpen from "../assets/images/icon-open.svg";
import { uiCanisterUrl } from "../config/actor";
import React, { useEffect, useState } from "react";

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

export function CandidUI({ canisterId, candid, setCandidWidth, forceUpdate }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const didParam = candid ? `&did=${encodeURIComponent(btoa(candid))}` : "";

  useEffect(() => {
    const newSize = isExpanded ? "30vw" : "fit-content";
    setCandidWidth(newSize);
  }, [isExpanded, setCandidWidth]);
  useEffect(() => {
    setIsExpanded(true);
  }, [canisterId, candid, forceUpdate]);

  const url =
    `${CANDID_UI_CANISTER_URL}/?id=${canisterId}&tag=${forceUpdate}` + didParam;
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
      {isExpanded ? <CandidFrame src={url} /> : null}
    </CandidPanel>
  );
}
