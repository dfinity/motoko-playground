import {
  useState,
  useEffect,
  Children,
  ReactElement,
  ReactChildren,
} from "react";
import styled from "styled-components";

const TabsPane = styled.div``;

const TabsRow = styled.div`
  display: flex;
`;

const TabsContent = styled.div``;

const TabLink = styled.div``;

type TabsProps = {
  children: ReactChildren;
  onTabSelect: (tabIndex: number) => void;
  activeTab: number;
};

export function Tabs({
  children,
  onTabSelect,
  activeTab: initialActiveTab = 0,
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

  const tabLabels: Array<ReactElement> = [];
  const tabPanes: Array<ReactElement> = [];

  // Convert children into tabs and panes
  Children.forEach(children, (child, index) => {
    const maybeChild = child as unknown;
    const {
      type: Child,
      props: { children: grandChildren, ...props },
    } = maybeChild as ReactElement;

    tabLabels.push(
      <Child
        key={index}
        {...props}
        isActive={activeTab === index}
        handleTabSelect={handleTabSelect}
        tabIndex={index}
      />
    );

    tabPanes.push(
      <TabsPane key={index} tabId={index}>
        {grandChildren}
      </TabsPane>
    );
  });

  return (
    <>
      <TabsRow>{tabLabels}</TabsRow>
      <TabsContent activeTab={activeTab}>{tabPanes}</TabsContent>
    </>
  );
}

type TabProps = {
  label: string;
  tabIndex: number;
  isActive: boolean;
  handleTabSelect: (tabIndex: number) => void;
};

export function Tab({ label, tabIndex, isActive, handleTabSelect }: TabProps) {
  const handleSelectTab = () => handleTabSelect(tabIndex);

  return (
    <TabLink className={isActive ? "active" : ""} onClick={handleSelectTab}>
      {label}
    </TabLink>
  );
}
