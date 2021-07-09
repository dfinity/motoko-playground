import styled from "styled-components";
import { useState } from "react";
import { Button } from "./shared/Button";
import { fetchGithub, fetchPackage, PackageInfo } from "../file";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  border: 1px solid var(--grey300);
  border-radius: 0.8rem;
  padding: 1rem;
  margin-top: 1rem;
  font-size: 1.6rem;
  font-weight: 500;
`;
const Item = styled.div`
  margin: 1rem;
`;
const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;
const MyButton = styled(Button)`
  margin: 1rem;
`;

export function ImportGitHub({ importCode, close, back, isPackageModal=false }) {
  const [repo, setRepo] = useState("dfinity/examples");
  const [branch, setBranch] = useState("master");
  const [dir, setDir] = useState("motoko/counter/src");
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  async function fetchCode() {
    const files = await fetchGithub(repo, branch, dir);
    if (files) {
      setError("");
      importCode(files);
      close();
    } else {
      setError(`Cannot find repo or the directory contains no ".mo" files.`);
    }
  }
  async function fetchPackageCode() {
    if (!name) {
      setError('Package name cannot be empty');
      return;
    }
    const info : PackageInfo = {
      repo: `https://github.com/${repo}.git`,
      version: branch,
      name,
      dir,
    };
    if (await fetchPackage(info)) {
      setError("");
      importCode(info);
      close();
    } else {
      setError(`Cannot find repo or the directory contains no ".mo" files.`);
    }
  }

  return (
      <Container>
      {isPackageModal && (<Item>Package name &nbsp;
       <input type="text" value={name} onChange={(e) => setName(e.target.value)} /></Item>)}
      <Item>Github repo &nbsp;
      <input type="text" value={repo} onChange={(e) => setRepo(e.target.value)} /></Item>
      <Item>Branch &nbsp;
      <input type="text" value={branch} onChange={(e) => setBranch(e.target.value)} /></Item>      
      <Item>Directory &nbsp;
      <input type="text" value={dir} onChange={(e) => setDir(e.target.value)} /></Item>
      <Item>{error}</Item>
      <ButtonContainer>
        <MyButton onClick={isPackageModal?fetchPackageCode:fetchCode}>Import</MyButton>
        <MyButton onClick={back}>Back</MyButton>
      </ButtonContainer>
      </Container>
  );
}
