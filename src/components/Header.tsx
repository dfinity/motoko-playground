import styled from "styled-components";

const StyledHeader = styled.div`
  width: 100%;
  height: var(--headerHeight);
  background-color: #6d8cbb;
`;

export function Header() {
  return <StyledHeader>Motoko Logo and Buttons</StyledHeader>;
}
