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
          width="80%"
          height="{100 * (data.length - 1)}px"
          legendToggle
        />
      ) : null}
    </>
  );
}
