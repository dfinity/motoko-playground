import styled from "styled-components";
import { useState, useRef, useEffect, isValidElement } from "react";
import { PanelHeader } from "./shared/PanelHeader";
import { RightContainer } from "./shared/RightContainer";
import { useLogging } from "./Logger";
import iconCaretDown from "../assets/images/icon-caret-down.svg";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

const LogHeader = styled(PanelHeader)`
  padding: 0 1rem;
  height: 2.4rem;
  border-top: 1px solid var(--grey300);
`;
const LogContent = styled.div`
  flex: 1;
  height: var(--consoleHeight);
  overflow: auto;
  padding-left: 0.5rem;
`;
const Button = styled.button`
  background: none;
  border: none;
  box-shadow: none;
`;
const CollapseIcon = styled.img<{ isExpanded: boolean }>`
  ${(props) => (!props.isExpanded ? "transform: rotate(180deg);" : "")}
`;
const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid var(--grey300);
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  background: ${(props) => (props.active ? "var(--grey200)" : "transparent")};
  border: none;
  cursor: pointer;
`;

const TerminalContainer = styled.div<{ isActive: boolean }>`
  height: calc(var(--consoleHeight) - 2.4rem);
  padding: 0.5rem;
  margin-left: 1rem;
  display: ${(props) => (props.isActive ? "block" : "none")};
`;

export function Console({ setConsoleHeight, terminal }) {
  const [activeTab, setActiveTab] = useState("terminal");
  const terminalRef = useRef<HTMLDivElement>(null);

  const [isExpanded, setIsExpanded] = useState(true);
  const lastRef = useRef<HTMLInputElement>(null);
  const logger = useLogging();
  useEffect(() => {
    if (
      terminalRef.current &&
      terminal &&
      !terminalRef.current.querySelector(".xterm")
    ) {
      terminal.open(terminalRef.current);
    }
  }, [terminal]);
  useEffect(() => {
    if (lastRef && lastRef.current) {
      lastRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logger.logLines.length]);
  useEffect(() => {
    const newSize = isExpanded ? "24rem" : "3rem";
    setConsoleHeight(newSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  return (
    <>
      <LogHeader>
        Log
        <RightContainer>
          <Button onClick={() => setIsExpanded(!isExpanded)}>
            <CollapseIcon
              isExpanded={isExpanded}
              src={iconCaretDown}
              alt="Caret icon"
            />
          </Button>
        </RightContainer>
      </LogHeader>
      <TabContainer>
        <Tab active={activeTab === "log"} onClick={() => setActiveTab("log")}>
          Log
        </Tab>
        <Tab
          active={activeTab === "terminal"}
          onClick={() => setActiveTab("terminal")}
        >
          Terminal
        </Tab>
      </TabContainer>
      <LogContent style={{ display: activeTab === "log" ? "block" : "none" }}>
        {logger.logLines.map((line, index) => (
          <div
            key={index}
            ref={index === logger.logLines.length - 1 ? lastRef : null}
          >
            {isValidElement(line) ? (
              line
            ) : (
              <pre style={{ whiteSpace: "normal", margin: 0 }}>
                {String(line)}
              </pre>
            )}
          </div>
        ))}
      </LogContent>
      <TerminalContainer
        ref={terminalRef}
        isActive={activeTab === "terminal"}
      />
    </>
  );
}
