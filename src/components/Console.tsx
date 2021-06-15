import { useState, useEffect } from "react";
import styled from "styled-components";

import { useLogging } from "./Logger";

const LogContainer = styled.div`
  height: 10ch;
  white-space: pre;
`;

export function Console() {
  const logger = useLogging();
  return (
      <LogContainer>
        {/*
         // @ts-ignore */}
        {logger.logLines.map(line => (
          <pre>{line}</pre>
        ))}
      </LogContainer>
  )
}
