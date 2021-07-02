import styled from "styled-components";
import { Button } from "./shared/Button";
import { RightContainer } from "./shared/RightContainer";
import iconPlus from "../assets/images/icon-plus.svg";
import { MotokoLabLogo } from "./shared/MotokoLabLogo";

const StyledHeader = styled("header")<{ darkMode?: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  height: var(--headerHeight);
  padding: 0 1.6rem;
  background-color: ${(props) => (props.darkMode ? "black" : "white")};
`;

const BrandContainer = styled.div`
  display: flex;
  align-items: center;
  width: fit-content;
  height: 6.4rem;
`;

const ButtonContainer = styled(RightContainer)`
  > *:not(:last-child) {
    margin-right: 1.8rem;
  }
`;

const HeaderLink = styled.a`
  letter-spacing: 0.04rem;
  font-size: 1.8rem;
  font-weight: 500;
  padding: 1rem 1.6rem;
  color: var(--grey600);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export function Header({ openTutorial, darkMode = false }) {
  return (
    <StyledHeader darkMode={darkMode}>
      <BrandContainer>
        <MotokoLabLogo horizontal />
      </BrandContainer>
      <ButtonContainer>
        <HeaderLink
          href="https://sdk.dfinity.org/docs/language-guide/motoko.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          Motoko Docs
        </HeaderLink>
        <HeaderLink
          href="https://sdk.dfinity.org/docs/quickstart/quickstart-intro.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          Internet Computer SDK
        </HeaderLink>
        <Button width="16.4rem" onClick={openTutorial}>
          <img src={iconPlus} alt="Plus icon" />
          <p>Open Tutorial</p>
        </Button>
      </ButtonContainer>
    </StyledHeader>
  );
}
