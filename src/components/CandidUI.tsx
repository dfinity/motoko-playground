import styled from "styled-components";
import { useState } from "react";

const CandidFrame = styled.iframe`
  flex: 1;
  border: none;
  background-color: #ffb8c1;
`;

const CANDID_UI_CANISTER_URL =
  "https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.ic0.app";

export function CandidUI({ selectedFile = "filepath" }) {
  const [loadedCanister, setLoadedCanister] = useState(
    "eiom4-baaaa-aaaad-qageq-cai"
  );

  return (
    <CandidFrame src={`${CANDID_UI_CANISTER_URL}/?id=${loadedCanister}`}>
      CandidUI loaded from web
    </CandidFrame>
  );
}
