import styled from "styled-components";

import motokoLabLogo from "../../assets/images/motoko-lab-logo.png";
import motokoLabWordmark from "../../assets/images/motoko-lab-wordmark.svg";

const Logo = styled("img")<{ horizontal: boolean }>`
  ${(props) =>
    props.horizontal
      ? `
  width: 10.9rem;
  margin: -1.6rem;
  margin-left: -1.2rem;
`
      : `
  width: 16.5rem;
  margin: -1.8rem 0 0.5rem;
`}
`;

const WordMark = styled("img")<{ horizontal: boolean }>`
  ${(props) =>
    props.horizontal
      ? `
  margin-left: 2.4rem;
  height: 2.4rem;
`
      : `
  width: 21.5rem;
  margin-bottom: 4rem;
`}
`;

export function MotokoLabLogo({ horizontal = false }) {
  return (
    <>
      <Logo
        src={motokoLabLogo}
        horizontal={horizontal}
        alt="Motoko Ghost Logo in wireframe"
      />
      <WordMark
        src={motokoLabWordmark}
        horizontal={horizontal}
        alt="Motoko Lab"
      />
    </>
  );
}
