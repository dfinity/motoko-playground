import {useContext} from "react";
import styled from "styled-components";
import { WorkplaceDispatchContext } from "../contexts/WorkplaceState";
import { exampleProjects } from "../examples";
import { ExampleProject } from "../examples/types";
import iconPackage from "../assets/images/icon-package.svg";
import { ListButton } from "./shared/SelectList";

const StyledExplorer = styled.div`
  width: var(--explorerWidth);
`;

const CategoryTitle = styled.div`
  display: flex;
  align-items: center;
  padding-left: 1rem;
  height: 2.4rem;
  font-size: 1.2rem;
  font-weight: bold;
  border-bottom: 1px solid var(--grey300);
  text-transform: uppercase;
  pointer-events: none;
`;

function ExampleProjectChooser(props: {
  choices: ExampleProject[];
}) {
  const dispatch = useContext(WorkplaceDispatchContext)
  return <>
    {props.choices.map((item, index) => <>
      <ListButton onClick={() => dispatch({
        type: 'loadExampleProject',
        payload: {
          project: item
        },
      })}>
        {item.name}
      </ListButton>
    </>)}
  </>
}

// @ts-ignore
export function Explorer({ workplace = {}, selectedFile, onSelectFile } = {}) {
  return (
    <StyledExplorer>
      <CategoryTitle>Files</CategoryTitle>
      {Object.keys(workplace).map((filename) => (
        <ListButton
          key={filename}
          isActive={selectedFile === filename}
          disabled={selectedFile === filename}
          onClick={() => onSelectFile(filename)}
        >
          {filename}
        </ListButton>
      ))}
      <CategoryTitle>Packages</CategoryTitle>
      <ListButton disabled>
        <img src={iconPackage} alt="Package icon" />
        <p>mo:base</p>
      </ListButton>
      <CategoryTitle>Canisters</CategoryTitle>
      <CategoryTitle>Example Projects</CategoryTitle>
      <ExampleProjectChooser
        choices={exampleProjects}
        />
    </StyledExplorer>
  );
}
