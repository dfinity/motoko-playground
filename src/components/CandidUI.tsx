import styled from "styled-components";
import { PanelHeader } from "./shared/PanelHeader";
import iconCollapse from "../assets/images/icon-collapse.svg";

const CandidPanel = styled.div`
  width: 40%;
  max-width: 60rem;
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

const CANDID_UI_CANISTER_URL =
  "https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.ic0.app";

export function CandidUI({
  canisterId = "eiom4-baaaa-aaaad-qageq-cai",
  isOpen = true,
}) {
  return (
    <CandidPanel>
      <PanelHeader>
        <CollapseIcon
          src={iconCollapse}
          alt="Collapse icon"
          isOpen={isOpen}
          onClick={() => {}}
        />
        CANDID UI
      </PanelHeader>
      <CandidFrame src={`${CANDID_UI_CANISTER_URL}/?id=${canisterId}`} />
    </CandidPanel>
  );
}
