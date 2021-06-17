import styled from "styled-components";

import { PanelHeader } from "./shared/PanelHeader";
import { RightContainer } from "./shared/RightContainer";
import { useLogging } from "./Logger";
import iconCaretDown from "../assets/images/icon-caret-down.svg";

const LogContainer = styled.div`
  height: 10rem;
`;

const LogHeader = styled(PanelHeader)`
  padding: 0 1rem;
  height: 2.4rem;
  border-top: 1px solid var(--grey300);
`;

export function Console() {
  const logger = useLogging();
  return (
    <LogContainer>
      <LogHeader>
        Log
        <RightContainer>
          <img src={iconCaretDown} alt="Caret icon" />
        </RightContainer>
      </LogHeader>
      {/*
         // @ts-ignore */}
      {logger.logLines.map((line, index) => (
        <pre key={index}>{line}</pre>
      ))}
    </LogContainer>
  );
}
