import { useState, useEffect, Children, ReactNode, ReactElement } from "react";
import styled from "styled-components";

interface TabLabel {
  isActive: boolean;
  onClick: () => void;
}

interface TabProps {
  children: ReactNode;
  label: string;
  tabIndex?: number;
  isActive?: boolean;
}

interface TabsProps {
  children: Array<ReactElement<TabProps>>;
  onTabSelect?: (tabIndex: number) => void;
  activeTab?: number;
  width?: string;
  height?: string;
}

const TabsContainer = styled.div<{
  dimensions?: { height?: string; width?: string };
}>`
  ${({ dimensions }) =>
    dimensions
      ? `
        width: ${dimensions?.width ?? "auto"};
        height: ${dimensions?.height ?? "auto"};
      `
      : ""}
  display: flex;
  flex-direction: column;
`;

const TabPane = styled.div`
  padding: 1.5rem;
  flex: 1;
  border: 1px solid var(--grey400);
  border-top: none;
  border-radius: 0 0 1.5rem 1.5rem;
`;

const TabsRow = styled.div`
  display: flex;
  justify-content: space-evenly;
`;

const TabButton = styled.button<TabLabel>`
  display: flex;
  flex-grow: 1;
  justify-content: center;
  align-items: center;
  padding: 1.5rem;
  border: 1px solid var(--grey400);
  border-radius: 0.8rem 0.8rem 0 0;

  &:not(:last-child) {
    margin-right: -1px;
  }

  ${({ isActive }) =>
    isActive
      ? `
        background-color: white;
        color: var(--grey700);
        border-bottom-color: transparent;`
      : `
        background-color: var(--grey100);
        color: var(--grey600);`}
`;

const TabsContent = styled.div`
  flex-grow: 1;
`;

export function Tabs({
  children,
  onTabSelect = () => {},
  activeTab: initialActiveTab = 0,
  height,
  width,
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const handleTabSelect = (tabIndex) => {
    onTabSelect(tabIndex);
    setActiveTab(tabIndex);
  };

  // Keep local `activeTab` in sync with `props.activeTab` if provided
  useEffect(() => {
    setActiveTab(initialActiveTab);
  }, [initialActiveTab]);

  const tabLabels: Array<ReactElement<TabLabel>> = [];
  const tabPanes: Array<ReactElement> = [];

  // Convert children into tabs and panes
  Children.forEach(children, (child, index) => {
    const {
      children: grandChildren,
      label,
      isActive = activeTab === index,
    } = child.props;

    const handleClick = () => handleTabSelect(index);

    tabLabels.push(
      <TabButton key={index} isActive={isActive} onClick={handleClick}>
        {label}
      </TabButton>
    );

    tabPanes.push(<TabPane key={index}>{grandChildren}</TabPane>);
  });

  return (
    <TabsContainer dimensions={{ height, width }}>
      <TabsRow>{tabLabels}</TabsRow>
      <TabsContent>{tabPanes[activeTab] ?? null}</TabsContent>
    </TabsContainer>
  );
}

export function Tab(props: TabProps) {
  return null;
}
