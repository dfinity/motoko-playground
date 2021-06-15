import styled from "styled-components";
import motokoLabLogo from "../assets/images/motoko-lab-logo.png";
import motokoLabWordmark from "../assets/images/motoko-lab-wordmark.png";

const StyledHeader = styled("header")<{ darkMode?: boolean }>`
  width: 100%;
  height: var(--headerHeight);
  padding: 1.6rem;
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
    </StyledHeader>
  );
}
