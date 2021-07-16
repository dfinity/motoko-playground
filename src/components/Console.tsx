import styled from "styled-components";
import { useState, useRef, useEffect } from "react";
import { PanelHeader } from "./shared/PanelHeader";
import { RightContainer } from "./shared/RightContainer";
import { useLogging } from "./Logger";
import iconCaretDown from "../assets/images/icon-caret-down.svg";

const LogHeader = styled(PanelHeader)`
  padding: 0 1rem;
  height: 2.4rem;
  border-top: 1px solid var(--grey300);
`;
const LogContent = styled.div`
  height: var(--consoleHeight);
  overflow: auto;
`;
const Button = styled.button`
  background: none;
  border: none;
  box-shadow: none;
`;
const CollapseIcon = styled("img")<{ isExpanded: boolean }>`
  ${(props) => (!props.isExpanded ? "transform: rotate(180deg);" : "")}
`;

export function Console({ setConsoleHeight }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const lastRef = useRef<HTMLInputElement>(null);
  const logger = useLogging();
  useEffect(() => {
    if (lastRef && lastRef.current) {
      lastRef.current.scrollIntoView({behavior: "smooth"});
    }
  }, [logger.logLines.length]);
  useEffect(() => {
    const newSize = isExpanded ? "24rem" : "3rem";
    setConsoleHeight(newSize);
  }, [isExpanded]);

  return (
    <div>
      <LogHeader>
        Log
        <RightContainer>
      <Button onClick={() => setIsExpanded(!isExpanded)}>
      <CollapseIcon isExpanded={isExpanded} src={iconCaretDown} alt="Caret icon" />
      </Button>
        </RightContainer>
      </LogHeader>
      <LogContent>
      {logger.logLines.map((line, index) => (
          <pre key={index} ref={lastRef}>{line}</pre>
      ))}
      </LogContent>
    </div>
  );
}
