import styled from "styled-components";
import { useRef, useEffect } from "react";
import { PanelHeader } from "./shared/PanelHeader";
import { RightContainer } from "./shared/RightContainer";
import { useLogging } from "./Logger";
import iconCaretDown from "../assets/images/icon-caret-down.svg";

const LogContainer = styled.div`
  height: 40rem;
  overflow: auto;
`;

const LogHeader = styled(PanelHeader)`
  padding: 0 1rem;
  height: 2.4rem;
  border-top: 1px solid var(--grey300);
`;

export function Console() {
  const lastRef = useRef<HTMLInputElement>(null);
  const logger = useLogging();
  useEffect(() => {
    if (lastRef && lastRef.current) {
      lastRef.current.scrollIntoView({behavior: "smooth"});
    }
  }, [logger.logLines.length]);

  return (
    <LogContainer>
      <LogHeader>
        Log
        <RightContainer>
          <img src={iconCaretDown} alt="Caret icon" />
        </RightContainer>
      </LogHeader>
      {logger.logLines.map((line, index) => (
          <pre key={index} ref={lastRef}>{line}</pre>
      ))}
    </LogContainer>
  );
}
