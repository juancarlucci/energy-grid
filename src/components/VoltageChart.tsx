import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import annotationPlugin from "chartjs-plugin-annotation";
import { GridEntry } from "../hooks/useGridData";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin
);

const observable10Colors = [
  "#4E79A7",
  "#F28E2B",
  "#E15759",
  "#76B7B2",
  "#59A14F",
  "#EDC948",
  "#B07AA1",
  "#FF9DA7",
  "#9C755F",
  "#BAB0AC",
];

const getRandomColor = () =>
  observable10Colors[Math.floor(Math.random() * observable10Colors.length)];

interface VoltageChartProps {
  history: GridEntry[];
}

export const VoltageChart = ({ history }: VoltageChartProps) => {
  const chartRef = useRef<ChartJS<"line", (number | null)[], string> | null>(
    null
  );

  const labels = Array.from(new Set(history.map((entry) => entry.timestamp)))
    .sort()
    .map((ts) => new Date(ts).toLocaleTimeString());

  const chartData = {
    labels,
    datasets: Array.from(new Set(history.map((entry) => entry.id))).map(
      (nodeId) => {
        const nodeData = history.filter((entry) => entry.id === nodeId);
        const firstEntry = nodeData.reduce((earliest, current) =>
          new Date(current.timestamp) < new Date(earliest.timestamp)
            ? current
            : earliest
        );
        const firstTimestamp = firstEntry.timestamp;
        let lastVoltage: number | null = null;
        const data = labels.map((label) => {
          const timestamp = history.find(
            (e) => new Date(e.timestamp).toLocaleTimeString() === label
          )?.timestamp;
          const entry = nodeData.find((e) => e.timestamp === timestamp);
          if (entry) lastVoltage = entry.voltage;
          return timestamp && new Date(timestamp) < new Date(firstTimestamp)
            ? null
            : lastVoltage;
        });
        const pointColors = labels.map((label) => {
          const timestamp = history.find(
            (e) => new Date(e.timestamp).toLocaleTimeString() === label
          )?.timestamp;
          const entry = nodeData.find((e) => e.timestamp === timestamp);
          const voltage = entry ? entry.voltage : lastVoltage;
          return voltage && voltage >= 223 && voltage <= 237
            ? "#2ecc71"
            : "#f39c12";
        });

        return {
          label: `Node ${nodeId}`,
          data,
          borderColor: getRandomColor(),
          backgroundColor: "transparent",
          pointBackgroundColor: pointColors,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.3,
          fill: false,
        };
      }
    ),
  };

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const uniqueTimestamps = Array.from(
      new Set(history.map((entry) => entry.timestamp))
    ).sort();
    const newLabels = uniqueTimestamps.map((ts) =>
      new Date(ts).toLocaleTimeString()
    );
    const nodes = Array.from(new Set(history.map((entry) => entry.id)));

    chart.data.labels = newLabels;

    chart.data.datasets = chart.data.datasets.filter((dataset) =>
      nodes.includes(dataset.label!.split(" ")[1])
    );

    nodes.forEach((nodeId) => {
      const nodeData = history.filter((entry) => entry.id === nodeId);
      const firstEntry = nodeData.reduce((earliest, current) =>
        new Date(current.timestamp) < new Date(earliest.timestamp)
          ? current
          : earliest
      );
      const firstTimestamp = firstEntry.timestamp;
      const datasetIndex = chart.data.datasets.findIndex(
        (d) => d.label === `Node ${nodeId}`
      );
      let dataset = chart.data.datasets[datasetIndex];

      if (datasetIndex === -1) {
        let lastVoltage: number | null = null;
        const data = newLabels.map((label) => {
          const timestamp = uniqueTimestamps[newLabels.indexOf(label)];
          const entry = nodeData.find((e) => e.timestamp === timestamp);
          if (entry) lastVoltage = entry.voltage;
          return new Date(timestamp) < new Date(firstTimestamp)
            ? null
            : lastVoltage;
        });
        const pointColors = newLabels.map((label) => {
          const timestamp = uniqueTimestamps[newLabels.indexOf(label)];
          const entry = nodeData.find((e) => e.timestamp === timestamp);
          const voltage = entry ? entry.voltage : lastVoltage;
          return voltage && voltage >= 223 && voltage <= 237
            ? "#2ecc71"
            : "#f39c12";
        });
        dataset = {
          label: `Node ${nodeId}`,
          data,
          borderColor: getRandomColor(),
          backgroundColor: "transparent",
          pointBackgroundColor: pointColors,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.3,
          fill: false,
        };
        chart.data.datasets.push(dataset);
      } else {
        let lastVoltage: number | null =
          dataset.data[dataset.data.length - 1] || null;
        const newData = newLabels.map((label) => {
          const timestamp = uniqueTimestamps[newLabels.indexOf(label)];
          const entry = nodeData.find((e) => e.timestamp === timestamp);
          if (entry) lastVoltage = entry.voltage;
          return new Date(timestamp) < new Date(firstTimestamp)
            ? null
            : lastVoltage;
        });
        const newPointColors = newLabels.map((label) => {
          const timestamp = uniqueTimestamps[newLabels.indexOf(label)];
          const entry = nodeData.find((e) => e.timestamp === timestamp);
          const voltage = entry ? entry.voltage : lastVoltage;
          return voltage && voltage >= 223 && voltage <= 237
            ? "#2ecc71"
            : "#f39c12";
        });
        dataset.data = newData;
        dataset.pointBackgroundColor = newPointColors;
      }
    });

    chart.update({ duration: 500 });
  }, [history]);

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    plugins: {
      legend: {
        position: "top",
        labels: { color: "#e2e8f0", font: { size: 14 } },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#e2e8f0",
        callbacks: {
          label: (context) => {
            const dataset = context.dataset;
            const index = context.dataIndex;
            const timestamp = history.find(
              (e) =>
                new Date(e.timestamp).toLocaleTimeString() === context.label
            )?.timestamp;
            const entry = history.find(
              (e) =>
                e.id === dataset.label.split(" ")[1] &&
                e.timestamp === timestamp
            );
            return entry
              ? `Node ${entry.id}: ${entry.voltage}V at ${new Date(
                  entry.timestamp
                ).toLocaleString()}`
              : `Node ${dataset.label.split(" ")[1]}: ${
                  context.raw
                }V (interpolated)`;
          },
        },
      },
      annotation: {
        annotations: {
          safeLow: {
            type: "box",
            yMin: 210,
            yMax: 223,
            backgroundColor: "rgba(255, 99, 71, 0.1)",
            borderColor: "rgba(255, 99, 71, 0.5)",
            borderWidth: 1,
          },
          safeHigh: {
            type: "box",
            yMin: 237,
            yMax: 250,
            backgroundColor: "rgba(255, 99, 71, 0.1)",
            borderColor: "rgba(255, 99, 71, 0.5)",
            borderWidth: 1,
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Time", color: "#a0aec0" },
        ticks: { color: "#a0aec0", maxTicksLimit: 10 },
        grid: { color: "#4a5568" },
      },
      y: {
        title: { display: true, text: "Voltage (V)", color: "#a0aec0" },
        ticks: { color: "#a0aec0" },
        grid: { color: "#4a5568" },
        min: 210,
        max: 250,
      },
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
  };

  return (
    <div className="w-full h-[400px] bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
};
