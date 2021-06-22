import styled from "styled-components";
import { PanelHeader } from "./shared/PanelHeader";
import iconCollapse from "../assets/images/icon-collapse.svg";
import iconOpen from "../assets/images/icon-open.svg";
import { uiCanisterUrl } from "../config/actor";

const CandidPanel = styled.div`
  width: 40%;
  max-width: 60rem;
  width: var(--candidWidth);
`;

const CandidFrame = styled.iframe`
  height: calc(var(--appHeight) - var(--sectionHeaderHeight));
  border: none;
  width: var(--candidWidth);
`;

const CollapseIcon = styled("img")`
  width: 1.4rem;
  margin-right: 1rem;
`;

const OpenIcon = styled("img")`
  width: 2.2rem;
  margin-left: auto;
`;

const CANDID_UI_CANISTER_URL = uiCanisterUrl;

export function CandidUI({
  canisterId = "",
}) {
  return (
    <CandidPanel >
      <PanelHeader>
        <CollapseIcon
          src={iconCollapse}
          alt="Collapse icon"
          onClick={() => {}}
        />
        CANDID UI
        <OpenIcon src={iconOpen} />
      </PanelHeader>
      <CandidFrame src={`${CANDID_UI_CANISTER_URL}/?id=${canisterId}`} />
    </CandidPanel>
  );
}
