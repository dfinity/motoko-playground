import styled, { css } from "styled-components";
import { ListButton } from "./shared/SelectList";

interface FoldersJson {
  files: Array<string>;
  folders: {
    [folderName: string]: FoldersJson;
  };
}

export function structureFolders(filePaths: Array<string>) {
  return filePaths.reduce(
    (result, filePath) => {
      const folders = filePath.split("/").slice(0, -1);

      let currentFolder = result;

      for (const folder of folders) {
        if (!(folder in currentFolder.folders)) {
          currentFolder.folders[folder] = { files: [], folders: {} };
        }
        currentFolder = currentFolder.folders[folder];
      }

      currentFolder.files.push(filePath);

      return result;
    },
    { files: [], folders: {} } as FoldersJson
  );
}

function iconBefore(icon) {
  const iconSize = `1.5rem`;
  const { PUBLIC_URL } = process.env;

  return css`
    &::before {
      display: block;
      content: " ";
      background-image: url("${PUBLIC_URL}/images/icon-${icon}.svg");
      background-size: ${iconSize} ${iconSize};
      height: ${iconSize};
      width: ${iconSize};
      margin-right: 0.8rem;
    }
  `;
}

const StyledFolder = styled.summary`
  display: flex;
  align-items: center;
  height: 4rem;
  cursor: pointer;
  border-bottom: 1px solid var(--grey300);

  ${iconBefore("folder")}
`;

const FileButton = styled(ListButton)`
  padding-left: 1.6rem;

  &:last-child {
    border-bottom: none;
  }

  ${iconBefore("file")}
`;

const FolderContainer = styled.details`
  width: 100%;
  font-size: 1.4rem;
  padding-left: 1.6rem;
  background-color: var(--grey200);
  border-bottom: 1px solid var(--grey300);

  > ${this}[open] {
    border-left: 1px dashed var(--grey300);

    > summary {
      margin-left: -1px;
    }
  }

  &:not([open]) > ${StyledFolder}, &:last-child {
    margin-bottom: -1px;
  }
`;

interface RenderOptions {
  folderStructure: FoldersJson;
  onSelectFile: (folder: string) => void;
  activeFile: string | null;
}

function renderFolderStructure(options: RenderOptions) {
  const { folderStructure, onSelectFile, activeFile } = options;

  const finalStructure = Object.entries(folderStructure.folders).map(
    ([folderName, contents]) => (
      <FolderContainer key={folderName} open>
        <StyledFolder>{folderName}</StyledFolder>
        {renderFolderStructure({
          folderStructure: contents,
          onSelectFile,
          activeFile,
        })}
      </FolderContainer>
    )
  );

  folderStructure.files.forEach((filePath) => {
    const fileName = filePath.split("/").pop();
    const isActive = activeFile === filePath;

    finalStructure.push(
      <FileButton
        key={fileName}
        onClick={() => onSelectFile(filePath)}
        isActive={isActive}
        disabled={isActive}
        aria-label="File"
      >
        {fileName}
      </FileButton>
    );
  });

  return <>{finalStructure}</>;
}

interface Folders {
  filePaths: Array<string>;
  onSelectFile: (folder: string) => void;
  activeFile: string | null;
}

export function FolderStructure({
  filePaths,
  onSelectFile,
  activeFile,
}: Folders) {
  const folderStructure = structureFolders(filePaths);

  return (
    <>{renderFolderStructure({ folderStructure, onSelectFile, activeFile })}</>
  );
}
