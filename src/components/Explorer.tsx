import styled from "styled-components";

export const Container = styled.div`
  width: var(--explorerWidth);
  padding: var(--gutterWidth);
  border-right: 1px solid #333;
`;

// @ts-ignore
function Explorer({ workplace = {}, onSelectFile} = {}) {
  return (
    <Container>
      {/*
      // @ts-ignore */}
      {Object.entries(workplace).map(([fileName, _]) => (
        <div onClick={() => onSelectFile(fileName)} key={fileName}>
          {fileName}
        </div>
      ))}
    </Container>
  )
}

export default Explorer;
