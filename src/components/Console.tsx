import { useState, useEffect } from "react";
import styled from "styled-components";

import iconCaretDown from "../assets/images/icon-caret-down.svg";
import { PanelHeader } from "./shared/PanelHeader";
import { RightContainer } from "./shared/RightContainer";
import { useLogging } from "./Logger";

const LogContainer = styled.div`
  height: 10rem;
`;

const LogHeader = styled(PanelHeader)`
  padding: 0 1rem;
  height: 2.4rem;
  border-top: 1px solid var(--borderColor);
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
        {logger.logLines.map(line => (
          <pre>{line}</pre>
        ))}
      </LogContainer>
  )
}
