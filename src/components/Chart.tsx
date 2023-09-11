import { Chart as GChart } from "react-google-charts";

export function Chart({ title, data }) {
  const height = 100 * (data.length - 1);
  const options = {
    title,
    chartArea: { width: "50%" },
    hAxis: { minValue: 0 },
    bars: "horizontal",
  };
  return (
    <GChart
      chartType="BarChart"
      data={data}
      options={options}
      width="80%"
      height="{height}px"
      legendToggle
    />
  );
}
