import styled from "styled-components";
import { MouseEvent } from "react";

export const Button = styled("button")<{
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
  font-weight: 500;
  height: ${(props) => (props.small ? "3.3rem" : "4.5rem")};
  min-width: ${(props) => (props.small ? "5.6rem" : "7.8rem")};
  ${(props) => (props.width ? `width: ${props.width}` : "")};
  background-color: ${(props) =>
    props.kind
      ? props.kind === "primary"
        ? "var(--colorPrimary)"
        : "white"
      : "var(--grey200)"};
  color: ${(props) =>
    props.kind === "primary"
      ? "white"
      : props.kind === "secondary"
      ? "var(--grey500)"
      : "var(--grey600)"};
  border: ${(props) =>
    props.kind === "secondary" ? "1px solid var(--grey400)" : "none"};
  border-radius: ${(props) => (props.small ? "1.7rem" : "2.3rem")};

  > :not(:last-child) {
    margin-right: 0.8rem;
  }

  > p {
    margin: 0;
  }

  &:hover {
    background-color: ${(props) =>
      props.kind === "primary" ? "var(--colorPrimaryDark)" : "var(--grey100)"};
    ${(props) =>
      !props.kind
        ? `color: var(--colorPrimary);
           border: 1px solid var(--grey300);

           > svg * {
             fill: var(--colorPrimary);
           }
           `
        : ""};
  }

  img {
    max-width: 2.5rem;
  }
`;
