import styled, { css } from "styled-components";
import { ListButton } from "./shared/SelectList";
import folderIcon from "../assets/images/icon-folder.svg";
import fileIcon from "../assets/images/icon-file.svg";
import pencilIcon from "../assets/images/icon-pencil.svg";
import closeIcon from "../assets/images/icon-close.svg";

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

const FolderContainer = styled.details`
  width: 100%;
  font-size: 1.4rem;
  background-color: var(--grey100);
`;

interface DepthProp {
  nestDepth: number;
}

const handleLongText = css`
  text-align: unset;

  > p {
    width: 100%;
    margin: unset;
    overflow-x: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
`;

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

  ${handleLongText}
`;

const FileFunctions = styled.span`
  display: none;
  position: absolute;
  top: 0;
  right: 0;
  padding: 0.1rem 0 0 0.5rem;
  height: calc(100% + 0.2rem);
  background-image: linear-gradient(90deg, transparent 0%, var(--grey100) 15%);
`;

const FileButton = styled(ListButton)<DepthProp>`
  position: relative;
  padding-left: calc(${({ nestDepth }) => nestDepth + 1} * 1.6rem);
  border-bottom: none;
  height: 3rem;
  user-select: none;

  &:hover ${FileFunctions} {
    display: inline;
  }

  ${handleLongText}
`;

const FileFunctionButton = styled.button`
  padding: 0.5rem 0.4rem 0.5rem 0.6rem;
  width: 2.7rem;
  border-radius: 50%;
  line-height: 1;
  background-color: transparent;

  &:hover {
    background-color: var(--grey300);
  }
`;

const Icon = styled.img`
  width: 1.6rem;
  margin-right: 0.8rem;
`;

interface SharedProps {
  activeFile: string | null;
  onSelectFile: (filepath: string) => void;
  onRenameFile: (e, filepath: string) => void;
  onDeleteFile: (e, filepath: string) => void;
}

type RenderOptions = SharedProps & {
  folderStructure: FoldersJson;
  nestDepth?: number;
};

function renderFolderStructure(options: RenderOptions) {
  const { folderStructure, activeFile, nestDepth = 0, ...functions } = options;
  const { onSelectFile, onRenameFile, onDeleteFile } = functions;

  const finalStructure = Object.entries(folderStructure.folders).map(
    ([folderName, contents]) => (
      <FolderContainer key={folderName} open>
        <StyledFolder nestDepth={nestDepth} title={folderName}>
          <Icon src={folderIcon} alt="" />
          <p>{folderName}</p>
        </StyledFolder>
        {renderFolderStructure({
          folderStructure: contents,
          nestDepth: nestDepth + 1,
          activeFile,
          ...functions,
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
        title={fileName}
        nestDepth={nestDepth}
        onClick={() => onSelectFile(filePath)}
        isActive={isActive}
        disabled={isActive}
        aria-label="File"
      >
        <Icon src={fileIcon} alt="" />
        <p>{fileName}</p>
        <FileFunctions>
          <FileFunctionButton onClick={(e) => onRenameFile(e, filePath)}>
            <Icon src={pencilIcon} alt="Rename file" title="Rename file" />
          </FileFunctionButton>
          <FileFunctionButton onClick={(e) => onDeleteFile(e, filePath)}>
            <Icon src={closeIcon} alt="Delete file" title="Delete file" />
          </FileFunctionButton>
        </FileFunctions>
      </FileButton>
    );
  });

  return <>{finalStructure}</>;
}

type Folders = SharedProps & {
  filePaths: Array<string>;
};

export function FolderStructure({ filePaths, ...passProps }: Folders) {
  const folderStructure = structureFolders(filePaths);

  return renderFolderStructure({ folderStructure, ...passProps });
}
