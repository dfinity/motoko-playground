import styled from "styled-components";

const StyledExplorer = styled.div`
  width: var(--explorerWidth);
  padding: var(--gutterWidth);
  background-color: #b4d9ff;
`;

const CategoryTitle = styled.summary`
  height: 2.4rem;
`;

const CategoryContents = styled.details``;

const FileButton = styled("button")<{ isActive: boolean }>`
  width: 100%;
  height: 4rem;
  ${(props) => (props.isActive ? "background-color: white;" : "")}
`;

// @ts-ignore
export function Explorer({ workplace = {}, selectedFile, onSelectFile } = {}) {
  return (
    <StyledExplorer>
      <CategoryContents open>
        <CategoryTitle>Files</CategoryTitle>
        {Object.keys(workplace).map((filename) => (
          <FileButton
            key={filename}
            // @ts-ignore
            isActive={selectedFile === filename}
            onClick={() => onSelectFile(filename)}
          >
            {filename}
          </FileButton>
        ))}
      </CategoryContents>
    </StyledExplorer>
  );
}
