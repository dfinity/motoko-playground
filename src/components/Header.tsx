import styled from "styled-components";
import { Button } from "./shared/Button";
import motokoLabLogo from "../assets/images/motoko-lab-logo.png";
import motokoLabWordmark from "../assets/images/motoko-lab-wordmark.png";
import iconArrowDown from "../assets/images/icon-arrow-down.svg";
import iconPlus from "../assets/images/icon-plus.svg";
import iconMoon from "../assets/images/icon-moon.svg";

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

const Logo = styled("img")<{ darkMode?: boolean }>`
  margin: -1.6rem;
  margin-left: -1.2rem;
  width: 10.9rem;
  ${(props) => (props.darkMode ? "filter: brightness(1.7) saturate(0.9);" : "")}
`;

const WordMark = styled("img")<{ darkMode?: boolean }>`
  margin-left: 2.4rem;
  height: 2.4rem;
  ${(props) =>
    props.darkMode
      ? "filter: brightness(3) saturate(0.75) hue-rotate(-14deg);"
      : ""}
`;

const RightContainer = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: flex-end;

  > *:not(:last-child) {
    margin-right: 1.8rem;
  }
`;

const HeaderLink = styled.a`
  font-size: 1.8rem;
  padding: 1rem 1.6rem;
`;

export function Header({ darkMode = false }) {
  return (
    <StyledHeader darkMode={darkMode}>
      <BrandContainer>
        <Logo
          darkMode={darkMode}
          src={motokoLabLogo}
          alt="Motoko Ghost Logo in wireframe"
        />
        <WordMark
          darkMode={darkMode}
          src={motokoLabWordmark}
          alt="Motoko Lab"
        />
      </BrandContainer>
      <RightContainer>
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
          <img src={iconMoon} alt="Moon icon" />
        </Button>
        <Button width="16.4rem">
          <img src={iconArrowDown} alt="Down arrow icon" />
          <p>Save & Share</p>
        </Button>
        <Button width="16.4rem">
          <img src={iconPlus} alt="Plus icon" />
          <p>New Project</p>
        </Button>
      </RightContainer>
    </StyledHeader>
  );
}
