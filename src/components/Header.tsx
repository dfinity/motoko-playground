import styled from "styled-components";
import motokoLabLogo from "../assets/images/motoko-lab-logo.png";
import motokoLabWordmark from "../assets/images/motoko-lab-wordmark.png";

const StyledHeader = styled.header`
  width: 100%;
  height: var(--headerHeight);
  padding: 1.6rem;
  background-color: white;
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

export function Header() {
  return (
    <StyledHeader>
      <BrandContainer>
        <Logo src={motokoLabLogo} alt="Motoko Ghost Logo in wireframe" />
        <WordMark src={motokoLabWordmark} alt="Motoko Lab" />
      </BrandContainer>
    </StyledHeader>
  );
}
