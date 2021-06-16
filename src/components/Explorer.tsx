import styled from "styled-components";

const StyledExplorer = styled.div`
  width: var(--explorerWidth);
`;

const CategoryTitle = styled.summary`
  padding-left: 1rem;
  height: 2.4rem;
  line-height: 2.4rem;
  font-size: 1.2rem;
  font-weight: bold;
  border-bottom: 1px solid var(--borderColor);
  text-transform: uppercase;
`;

const CategoryContents = styled.details``;

const FileButton = styled("button")<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  height: 4rem;
  padding-left: 1.6rem;
  font-family: "CircularXX", sans-serif;
  font-size: 1.4rem;
  color: ${(props) =>
    props.isActive ? "var(--textColor)" : "var(--lightTextColor)"};
  border: none;
  background-color: ${(props) => (props.isActive ? "#ebf0fa" : "#f5f5f5")};
  border-bottom: 1px solid var(--borderColor);
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
            isActive={selectedFile === filename}
            onClick={() => onSelectFile(filename)}
          >
            {filename}
          </FileButton>
        ))}
      </CategoryContents>
      <CategoryContents>
        <CategoryTitle>Packages</CategoryTitle>
      </CategoryContents>
      <CategoryContents>
        <CategoryTitle>Canisters</CategoryTitle>
      </CategoryContents>
    </StyledExplorer>
  );
}
