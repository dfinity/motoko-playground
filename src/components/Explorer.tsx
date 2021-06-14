import styled from "styled-components";
import { files } from "../examples/fileStructure";

const StyledExplorer = styled.div`
  width: var(--explorerWidth);
  padding: var(--gutterWidth);
  background-color: #b4d9ff;
`;

const CategoryTitle = styled.summary`
  height: 2.4rem;
`;

const CategoryContents = styled.details``;

const FileButton = styled.button`
  width: 100%;
  height: 4rem;
`;

export function Explorer({ selectedFile = "filepath" }) {
  return (
    <StyledExplorer>
      <CategoryContents>
        <CategoryTitle>Files</CategoryTitle>
        {files.map(({ filepath, body }) => (
          <FileButton onClick={() => console.log("handleClickWithBody" + body)}>
            {filepath}
          </FileButton>
        ))}
      </CategoryContents>
    </StyledExplorer>
  );
}
