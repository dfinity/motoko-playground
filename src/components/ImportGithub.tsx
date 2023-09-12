import styled from "styled-components";
import { useState, useContext } from "react";
import { Button } from "./shared/Button";
import { PackageInfo } from "../workers/file";
import {
  WorkerContext,
  WorkplaceDispatchContext,
} from "../contexts/WorkplaceState";
import { Field } from "./shared/Field";

const Container = styled.div`
  width: 100%;
  margin-top: 1rem;
  font-size: 1.6rem;
  font-weight: 500;
`;
const Error = styled.div`
  margin: 1rem 0;
  font-size: 1.4rem;
  color: var(--colorError);
`;
const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  padding-top: 2rem;
  width: 100%;
`;
const MyButton = styled(Button)`
  width: 12rem;
`;

export function ImportGitHub({ importCode, close, isPackageModal = false }) {
  const [repo, setRepo] = useState("dfinity/examples");
  const [branch, setBranch] = useState("master");
  const [dir, setDir] = useState("motoko/counter/src");
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const worker = useContext(WorkerContext);
  const dispatch = useContext(WorkplaceDispatchContext);
  async function fetchCode() {
    const files = await worker.fetchGithub({ repo, branch, dir });
    if (files) {
      setError("");
      importCode(files);
      close();
      await dispatch({
        type: "setOrigin",
        payload: { origin: "playground", tags: [`git:${repo}`] },
      });
    } else {
      setError(`Cannot find repo or the directory contains no ".mo" files.`);
    }
  }
  async function fetchPackageCode() {
    if (!name) {
      setError("Package name cannot be empty");
      return;
    }
    const info: PackageInfo = {
      repo: `https://github.com/${repo}.git`,
      version: branch,
      name,
      dir,
    };
    if (await worker.fetchPackage(info)) {
      setError("");
      importCode(info);
      close();
    } else {
      setError(`Cannot find repo or the directory contains no ".mo" files.`);
    }
  }

  return (
    <Container>
      {isPackageModal && (
        <Field
          type="text"
          labelText="Package name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      )}
      <Field
        type="text"
        labelText="Github repo"
        value={repo}
        onChange={(e) => setRepo(e.target.value)}
      />
      <Field
        type="text"
        labelText="Branch"
        value={branch}
        onChange={(e) => setBranch(e.target.value)}
      />
      <Field
        type="text"
        labelText="Directory"
        value={dir}
        onChange={(e) => setDir(e.target.value)}
      />
      <Error>{error}</Error>
      <ButtonContainer>
        <MyButton
          onClick={isPackageModal ? fetchPackageCode : fetchCode}
          variant="primary"
        >
          Import
        </MyButton>
      </ButtonContainer>
    </Container>
  );
}
