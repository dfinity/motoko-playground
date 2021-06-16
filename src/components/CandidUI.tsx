import styled from "styled-components";
import { PanelHeader } from "./shared/PanelHeader";
import { Button } from "./shared/Button";
import iconCollapse from "../assets/images/icon-collapse.svg";
import iconTime from "../assets/images/icon-time.svg";
import iconRefresh from "../assets/images/icon-refresh.svg";

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
  ${(props) => (props.isOpen ? "transform: scaleX(-1);" : "")}
  margin-right: 1rem;
`;

const RightContainer = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: flex-end;

  > *:not(:last-child) {
    margin-right: 1rem;
  }
`;

const CountdownTimer = styled.p`
  color: var(--lightTextColor);
  font-size: 1.4rem;
`;

const CANDID_UI_CANISTER_URL =
  "https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.ic0.app";

function formatRemainingTime(timeRemaining) {
  const minutes = `${Math.floor(timeRemaining / 60)}`.padStart(2, "0");
  const seconds = `${timeRemaining % 60}`.padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function CandidUI({
  canisterId = "eiom4-baaaa-aaaad-qageq-cai",
  timeRemaining = 1799,
  isOpen = false,
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
        <RightContainer>
          <img src={iconTime} alt="Time icon" width="18px" />
          <CountdownTimer>{formatRemainingTime(timeRemaining)}</CountdownTimer>
          <Button kind="secondary" small>
            <img src={iconRefresh} alt="Refresh icon" width="18px" />
            <p>Options</p>
          </Button>
        </RightContainer>
      </PanelHeader>
      <CandidFrame src={`${CANDID_UI_CANISTER_URL}/?id=${canisterId}`} />
    </CandidPanel>
  );
}
