import styled from "styled-components";
import { PanelHeader } from "./shared/PanelHeader";
import iconCollapse from "../assets/images/icon-collapse.svg";
import iconOpen from "../assets/images/icon-open.svg";
import { uiCanisterUrl } from "../config/actor";

const CandidPanel = styled.div<{ isOpen: boolean }>`
  width: 40%;
  max-width: 60rem;
  ${(props) => (props.isOpen ? "visibility: inherit;" : "visibility: hidden;")}
`;

const CandidFrame = styled.iframe`
  height: calc(var(--appHeight) - var(--sectionHeaderHeight));
  width: 100%;
  border: none;
`;

const CollapseIcon = styled("img")<{ isOpen: boolean }>`
  width: 1.4rem;
  ${(props) => (props.isOpen ? "" : "transform: scaleX(-1);")}
  margin-right: 1rem;
`;

const OpenIcon = styled("img")`
  width: 2.2rem;
  margin-left: auto;
`;

const CANDID_UI_CANISTER_URL = uiCanisterUrl;

export function CandidUI({
  canisterId = "",
  isOpen = false,
}) {
  return (
    <CandidPanel isOpen={isOpen}>
      <PanelHeader>
        <CollapseIcon
          src={iconCollapse}
          alt="Collapse icon"
          isOpen={isOpen}
          onClick={() => {}}
        />
        CANDID UI
        <OpenIcon src={iconOpen} />
      </PanelHeader>
      <CandidFrame src={`${CANDID_UI_CANISTER_URL}/?id=${canisterId}`} />
    </CandidPanel>
  );
}
