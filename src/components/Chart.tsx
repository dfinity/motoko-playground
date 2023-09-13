import { Chart as GChart } from "react-google-charts";

export function Chart({ title, data }) {
  const options = {
    title,
    chartArea: { width: "50%" },
    hAxis: { minValue: 0 },
    bars: "horizontal",
  };
  return (
    <>
      {data.length > 1 ? (
        <GChart
          chartType="BarChart"
          data={data}
          options={options}
          width="100%"
          height={`${80 * (data.length - 1)}px`}
          legendToggle
        />
      ) : null}
    </>
  );
}

export function Pie({ title, data }) {
  const options = {
    title,
    pieHole: 0.3,
    is3D: false,
  };
  return (
    <>
      {data.length > 1 ? (
        <GChart
          chartType="PieChart"
          data={data}
          options={options}
          width="100%"
          height="300px"
        />
      ) : null}
    </>
  );
}
