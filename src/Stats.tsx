import { useState, useEffect } from "react";
import { backend } from "./config/actor";
import { Chart, Pie } from "./components/Chart";

/*
Taxonomy of tags
(*) indicates server side tags

origin:
  origin:playground
    code source
      example:{name}
      file:new
      git:{repo}
      tag:{id}
      post:{url}
      upload:wasm
  origin:dfx
    wasm:asset     (*)
  origin:vscode
  origin:spawned

install mode:
  mode:install     (*)
  mode:reinstall   (*)
  mode:upgrde      (*)

playground:
  wasm property
    wasm:profiling (*)
    wasm:profiling:stable (*)
    wasm:init_args
  project imports
    import:package:{repo}
    import:canister:{id}
    import:base:{pkg}
  moc flags
    moc:gc:force
    moc:gc:{method}
    moc:warn:{code}
    moc:warn:candid
  ref:{url}
*/

function extract_slice(raw, cond) {
  const res = raw
    .filter(([name, n]) => cond(name) && Number(n) > 1)
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
function aggregate_slice(raw, prefix) {
  const res = raw
    .filter(([name, _]) => name.startsWith(prefix))
    .reduce((acc, [_, n]) => acc + Number(n), 0);
  return res;
}
function generateCodeSourceData(map) {
  const res = [
    ["Code source", "Wasm"],
    ["file:new", aggregate_slice(map, "file:new")],
    ["example", aggregate_slice(map, "example:")],
    ["tag", aggregate_slice(map, "tag:")],
    ["git", aggregate_slice(map, "git:")],
    ["post", aggregate_slice(map, "post:")],
    ["wasm", aggregate_slice(map, "upload:wasm")],
  ];
  return res;
}

export function Stats() {
  const [canisters, setCanisters] = useState([]);
  const [installs, setInstalls] = useState([]);

  useEffect(() => {
    async function doit() {
      // eslint-disable-next-line
      const [_, canisters, installs] = await backend.getStats();
      setCanisters(canisters);
      setInstalls(installs);
    }
    doit();
  }, []);

  return (
    <>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ margin: 0 }}>Motoko Playground</h1>
        <h2 style={{ opacity: 0.5 }}>Usage Statistics</h2>
      </div>
      <Pie
        title="Install mode"
        data={one_metric(installs, "Install mode", (name) =>
          name.startsWith("mode:")
        )}
      />
      <Pie
        title="Playground code source"
        data={generateCodeSourceData(installs)}
      />
      <Chart
        title="Origin"
        data={two_metric(canisters, installs, "Origin", (name) =>
          name.startsWith("origin:")
        )}
      />
      <Chart
        title="Example"
        data={two_metric(
          canisters,
          installs,
          "Example",
          (name) => name.startsWith("example:") || name.startsWith("file:new")
        )}
      />
      <Chart
        title="Playground code imports"
        data={two_metric(
          canisters,
          installs,
          "Playground imports",
          (name) =>
            name.startsWith("post:") ||
            name.startsWith("git:") ||
            name.startsWith("tag:") ||
            name.startsWith("upload:wasm")
        )}
      />
      <Chart
        title="Reference link"
        data={two_metric(canisters, installs, "Reference link", (name) =>
          name.startsWith("ref:")
        )}
      />
      <Chart
        title="Project imports"
        data={one_metric(installs, "Imports", (name) =>
          name.startsWith("import:")
        )}
      />
      <Chart
        title="Moc flags"
        data={one_metric(installs, "Moc", (name) => name.startsWith("moc:"))}
      />
      <Chart
        title="Wasm properties"
        data={one_metric(installs, "Wasm", (name) => name.startsWith("wasm:"))}
      />
    </>
  );
}
