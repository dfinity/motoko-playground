import styled from "styled-components";
import { MouseEvent, ReactNode } from "react";

const StyledButton = styled("button")<{
  small?: boolean;
  kind?: "primary" | "secondary";
  onClick?: (ev: MouseEvent<HTMLButtonElement>) => void,
  width?: string;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem 1.6rem;
  font-size: 1.4rem;
  font-weight: bold;
  height: ${(props) => (props.small ? "3.3rem" : "4.5rem")};
  min-width: ${(props) => (props.small ? "5.6rem" : "7.8rem")};
  ${(props) => (props.width ? `width: ${props.width}` : "")};
  background-color: ${(props) =>
    props.kind
      ? props.kind === "primary"
        ? "var(--primaryColor)"
        : "white"
      : "var(--lightBorderColor)"};
  color: ${(props) =>
    props.kind === "primary"
      ? "white"
      : props.kind === "secondary"
      ? "var(--lightTextColor)"
      : "var(--buttonTextColor)"};
  border: ${(props) =>
    props.kind === "secondary" ? "1px solid var(--darkBorderColor)" : "none"};
  border-radius: ${(props) => (props.small ? "1.7rem" : "2.3rem")};

  > :not(:last-child) {
    margin-right: 0.8rem;
  }

  img {
    max-width: 2.5rem;
  }
`;

interface ButtonProps {
  small?: boolean;
  kind?: "primary" | "secondary";
  onClick?: (ev: MouseEvent<HTMLButtonElement>) => void,
  width?: string;
  children: ReactNode;
}

export function Button({ small = false, kind, onClick, width, children }: ButtonProps) {
  return (
    <StyledButton small={small} kind={kind} onClick={onClick} width={width}>
      {children}
    </StyledButton>
  );
}
