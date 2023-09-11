import { useState, useEffect } from "react";
import { backend } from "./config/actor";
import { Chart } from "./components/Chart";

function extract_slice(raw, prefix) {
  const len = prefix.length;
  return raw
    .filter(([name, _]) => name.startsWith(prefix))
    .map(([name, n]) => [name.slice(len), Number(n)]);
}
function join_slice(left, right) {
  const l = Object.fromEntries(left);
  const r = Object.fromEntries(right);
  const full_key = [
    ...new Set(
      left.map(([name, _]) => name).concat(right.map(([name, _]) => name))
    ),
  ];
  return full_key.map((name) => [name, l[name] || 0, r[name] || 0]);
}
function two_metric(canisters, installs, title, prefix) {
  const new_canister = extract_slice(canisters, prefix);
  const wasm = extract_slice(installs, prefix);
  return [[title, "Canister", "Wasm"]].concat(join_slice(new_canister, wasm));
}
function one_metric(map, title, prefix) {
  const slice = extract_slice(map, prefix);
  return [[title, "Count"]].concat(slice);
}

export function Stats() {
  const [example, setExample] = useState([]);
  const [moc, setMoc] = useState([]);

  useEffect(async () => {
    const [_, canisters, installs] = await backend.getStats();
    setExample(two_metric(canisters, installs, "Example", "example:"));
    setMoc(one_metric(installs, "Moc", "moc:"));
  }, []);

  return (
    <>
      <Chart title="Example" data={example} />
      <Chart title="Moc" data={moc} />
    </>
  );
}
