import styled from "styled-components";
import { useState } from "react";
import { Button } from "./shared/Button";
import { fetchGithub } from "../file";

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

export function ImportGitHub({ importCode, close }) {
  const [repo, setRepo] = useState("dfinity/examples");
  const [branch, setBranch] = useState("main");
  const [dir, setDir] = useState("motoko/counter/src");
  async function fetchCode() {
    const files = await fetchGithub(repo, branch, dir);
    if (files) {
      importCode(files);
      close();
    }
  }

  return (
      <Container>
      <Item>Github repo &nbsp;
      <input type="text" value={repo} onChange={(e) => setRepo(e.target.value)} /></Item>
      <Item>Branch &nbsp;
      <input type="text" value={branch} onChange={(e) => setRepo(e.target.value)} /></Item>      
      <Item>Directory &nbsp;
      <input type="text" value={dir} onChange={(e) => setDir(e.target.value)} /></Item>
      <Item><Button onClick={fetchCode}>Import</Button></Item>
      </Container>
  );
}
