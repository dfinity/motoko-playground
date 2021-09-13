import styled, { css } from "styled-components";

const Label = styled.label<{ type: string }>`
  display: flex;
  flex-direction: ${({ type }) =>
    type === "checkbox" ? "row-reverse" : "column"};
  width: 100%;
  margin: 0 0 2rem;
  align-items: flex-start;
  justify-content: flex-end;
  ${({ type }) => type === "checkbox" && "line-height: 1;"}

  &:last-child,
  &:only-child {
    margin-bottom: 3rem;
  }
`;

const LabelText = styled.p<{ type: string }>`
  margin: ${({ type }) => (type === "checkbox" ? "0 0 0 1.5rem" : "0")};
  padding: 0;
  font-size: 1.3rem;
  font-weight: 500;
`;

const Required = styled.span`
  &::after {
    content: "*";
    color: var(--colorError);
  }
`;

const inputStyles = css`
  width: 100%;
  color: var(--grey700);
  border: 1px solid var(--grey500);
`;

const StyledInput = styled.input`
  ${inputStyles};
  padding: 0.3rem 1rem;

  &[type="checkbox"] {
    width: unset;
  }
`;

const StyledSelect = styled.select`
  ${inputStyles};
  padding: 0.5rem 0.6rem;
`;

function Input({ type, ...props }) {
  if (type === "select") {
    return <StyledSelect {...props} />;
  } else {
    return <StyledInput {...{ type, ...props }} />;
  }
}

export function Field({
  labelText,
  type = "text",
  required = false,
  ...props
}) {
  return (
    <Label aria-label={props["aria-label"] ?? labelText} type={type}>
      <LabelText type={type}>
        {labelText}
        {required && <Required title="Required" />}
      </LabelText>
      <Input type={type} name={labelText} aria-required={required} {...props} />
    </Label>
  );
}
