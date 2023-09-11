import { useState, useEffect } from "react";
import { backend } from "./config/actor";
import { Chart, Pie } from "./components/Chart";

function extract_slice(raw, cond) {
  const res = raw
    .filter(([name, _]) => cond(name))
    .map(([name, n]) => [name, Number(n)]);
  res.sort((a, b) => b[1] - a[1]);
  return res;
}
function join_slice(left, right) {
  const l = Object.fromEntries(left);
  const r = Object.fromEntries(right);
  const full_key = [
    ...new Set(
      left.map(([name, _]) => name).concat(right.map(([name, _]) => name))
    ),
  ];
  const res = full_key.map((name) => [name, l[name] || 0, r[name] || 0]);
  res.sort((a, b) => b[2] - a[2]);
  return res;
}
function two_metric(canisters, installs, title, cond) {
  const new_canister = extract_slice(canisters, cond);
  const wasm = extract_slice(installs, cond);
  return [[title, "Canister", "Wasm"]].concat(join_slice(new_canister, wasm));
}
function one_metric(map, title, cond) {
  const slice = extract_slice(map, cond);
  return [[title, "Wasm"]].concat(slice);
}

export function Stats() {
  const [example, setExample] = useState([]);
  const [moc, setMoc] = useState([]);
  const [ref, setRef] = useState([]);
  const [origin, setOrigin] = useState([]);
  const [imports, setImports] = useState([]);
  const [wasm, setWasm] = useState([]);
  const [mode, setMode] = useState([]);
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    async function doit() {
      // eslint-disable-next-line
      const [_, canisters, installs] = await backend.getStats();
      setExample(
        two_metric(
          canisters,
          installs,
          "Example",
          (name) => name.startsWith("example:") || name.startsWith("file:new")
        )
      );
      setRef(
        two_metric(canisters, installs, "Reference link", (name) =>
          name.startsWith("ref:")
        )
      );
      setOrigin(
        two_metric(canisters, installs, "Origin", (name) =>
          name.startsWith("origin:")
        )
      );
      setImports(
        two_metric(
          canisters,
          installs,
          "Playground imports",
          (name) =>
            name.startsWith("post:") ||
            name.startsWith("git:") ||
            name.startsWith("tag:") ||
            name.startsWith("upload:wasm")
        )
      );
      setMoc(one_metric(installs, "Moc", (name) => name.startsWith("moc:")));
      setWasm(one_metric(installs, "Wasm", (name) => name.startsWith("wasm:")));
      setMode(
        one_metric(installs, "Install mode", (name) => name.startsWith("mode:"))
      );
      setPackages(
        one_metric(installs, "Imports", (name) => name.startsWith("import:"))
      );
    }
    doit();
  }, []);

  return (
    <>
      <Pie title="Install mode" data={mode} />
      <Chart title="Example" data={example} />
      <Chart title="Reference link" data={ref} />
      <Chart title="Origin" data={origin} />
      <Chart title="Playground code imports" data={imports} />
      <Chart title="External package/canister imports" data={packages} />
      <Chart title="Moc" data={moc} />
      <Chart title="Wasm" data={wasm} />
    </>
  );
}
