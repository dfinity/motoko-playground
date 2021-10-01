import styled, { css } from "styled-components";
import { ListButton } from "./shared/SelectList";
import { isNumber } from "util";

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

const folderIcon = iconBefore("folder");
const fileIcon = iconBefore("file");

const FolderContainer = styled.details`
  width: 100%;
  font-size: 1.4rem;
  background-color: var(--grey100);
`;

interface DepthProp {
  nestDepth: number;
}

const StyledFolder = styled.summary<DepthProp>`
  display: flex;
  align-items: center;
  height: 3rem;
  padding-left: calc(${({ nestDepth }) => nestDepth + 1} * 1.6rem);
  cursor: pointer;
  user-select: none;

  &:hover {
    color: var(--colorPrimary);
  }

  ${folderIcon}
`;

const FileButton = styled(ListButton)<DepthProp>`
  padding-left: calc(${({ nestDepth }) => nestDepth + 1} * 1.6rem);
  border-bottom: none;
  height: 3rem;
  user-select: none;

  ${fileIcon}
`;

interface RenderOptions {
  folderStructure: FoldersJson;
  onSelectFile: (folder: string) => void;
  activeFile: string | null;
  nestDepth?: number;
}

function renderFolderStructure(options: RenderOptions) {
  const { folderStructure, onSelectFile, activeFile, nestDepth = 0 } = options;

  const finalStructure = Object.entries(folderStructure.folders).map(
    ([folderName, contents]) => (
      <FolderContainer key={folderName} open>
        <StyledFolder nestDepth={nestDepth}>{folderName}</StyledFolder>
        {renderFolderStructure({
          folderStructure: contents,
          onSelectFile,
          activeFile,
          nestDepth: nestDepth + 1,
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
        nestDepth={nestDepth}
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
