import { useState } from "react";
import styled from "styled-components";
import { PanelHeader } from "./Editor";

const CandidPanel = styled.div`
  flex: 1;
`;

const CandidFrame = styled.iframe`
  height: calc(var(--appHeight) - var(--sectionHeaderHeight) - 0.4rem);
  width: 100%;
  border: none;
`;

const CANDID_UI_CANISTER_URL =
  "https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.ic0.app";

export function CandidUI({ selectedFile = "filepath" }) {
  const [loadedCanister, setLoadedCanister] = useState(
    "eiom4-baaaa-aaaad-qageq-cai"
  );

  return (
    <CandidPanel>
      <PanelHeader>CANDID UI</PanelHeader>
      <CandidFrame src={`${CANDID_UI_CANISTER_URL}/?id=${loadedCanister}`} />
    </CandidPanel>
  );
}
