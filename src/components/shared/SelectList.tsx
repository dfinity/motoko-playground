import styled from "styled-components";

export const ListButton = styled("button")<{ isActive?: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  height: 4rem;
  padding: 0 1.6rem;
  font-family: "CircularXX", sans-serif;
  font-size: 1.4rem;
  color: ${(props) =>
    props.isActive ? "var(--colorPrimaryDark)" : "var(--grey600)"};
  border: none;
  background-color: ${(props) =>
    props.isActive ? "var(--colorPrimaryLight)" : "var(--grey100)"};
  border-bottom: 1px solid var(--grey300);

  > p {
    margin: 0;
  }

  > *:not(:last-child) {
    margin-right: 0.8rem;
  }

  &:hover {
    color: var(--colorPrimary);
  }

  &[disabled] {
    cursor: default;

    &:hover {
      color: var(--grey600);
    }
  }
`;

const ListContainer = styled("div")<{ height: string; width: string }>`
  height: ${(props) => props.height};
  width: ${(props) => props.width};
  border: 1px solid var(--grey300);
  border-radius: 0.8rem;
  overflow: hidden;
`;

const List = styled("div")<{ height: string; width: string }>`
  height: ${(props) => props.height};
  width: ${(props) => props.width};
  overflow-y: auto;
  border-radius: 0.8rem;

  > ${ListButton} {
    background-color: white;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background-color: var(--grey100);
    }
  }
`;

export function SelectList({ height = "auto", width = "100%", children }) {
  return (
    <ListContainer width={width} height={height}>
      <List width={width} height={height}>
        {children}
      </List>
    </ListContainer>
  );
}
