import styled from "styled-components";

export const PanelHeader = styled.header`
  display: flex;
  align-items: center;
  width: 100%;
  flex-shrink: 0;
  height: var(--sectionHeaderHeight);
  padding: 0 1.2rem;
  font-size: 1.2rem;
  font-weight: bold;
  border-bottom: 1px solid var(--grey300);
  text-transform: uppercase;
`;
