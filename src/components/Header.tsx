import styled from "styled-components";
import { Button } from "./shared/Button";
import { RightContainer } from "./shared/RightContainer";
import motokoLabLogo from "../assets/images/motoko-lab-logo.png";
import motokoLabWordmark from "../assets/images/motoko-lab-wordmark.svg";
import iconSun from "../assets/images/icon-sun.svg";
import iconPlus from "../assets/images/icon-plus.svg";

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

const Logo = styled.img`
  margin: -1.6rem;
  margin-left: -1.2rem;
  width: 10.9rem;
`;

const WordMark = styled.img`
  margin-left: 2.4rem;
  height: 2.4rem;
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
`;

export function Header({ openTutorial, darkMode = false }) {
  return (
    <StyledHeader darkMode={darkMode}>
      <BrandContainer>
        <Logo src={motokoLabLogo} alt="Motoko Ghost Logo in wireframe" />
        <WordMark src={motokoLabWordmark} alt="Motoko Lab" />
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
        <Button width="7.8rem">
          <img src={iconSun} alt="Sun icon" />
        </Button>
        <Button width="16.4rem" onClick={openTutorial}>
          <img src={iconPlus} alt="Plus icon" />
          <p>Open Tutorial</p>
        </Button>
      </ButtonContainer>
    </StyledHeader>
  );
}
