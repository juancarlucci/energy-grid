import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
} from "chart.js";
import { GridEntry } from "../App";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type VoltageChartProps = {
  history: GridEntry[];
};

export const VoltageChart = ({ history }: VoltageChartProps) => {
  // Define safe voltage range
  const SAFE_MIN = 223;
  const SAFE_MAX = 237;

  // Get unique timestamps and sort them
  const timestamps = Array.from(
    new Set(history.map((entry) => entry.timestamp))
  ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  // Define stable node IDs and their colors
  const nodeColors: { [key: string]: string } = {
    "1": "white",
    "2": "lightblue",
    "3": "orange",
    // Add more IDs if needed (e.g., for dynamically added nodes)
  };

  // Get unique node IDs from history, ensuring consistent order
  const nodes = Array.from(new Set(history.map((entry) => entry.id))).sort(); // Sort for stability

  const datasets = nodes.map((id) => {
    const nodeHistory = history.filter((entry) => entry.id === id);
    const data = timestamps.map((ts) => {
      const entry = nodeHistory.find((e) => e.timestamp === ts);
      return entry ? entry.voltage : null; // null for gaps
    });

    // Dynamic point colors based on safe range
    const pointColors = data.map((voltage) =>
      voltage === null
        ? "gray"
        : voltage < SAFE_MIN || voltage > SAFE_MAX
        ? "red"
        : "green"
    );

    return {
      label: `Node ${id}`,
      data,
      borderColor: nodeColors[id] || "purple", // Stable line color per ID, fallback to purple
      pointBackgroundColor: pointColors,
      pointBorderColor: pointColors,
      fill: false,
      tension: 0.1,
      spanGaps: true, // Connect lines across null gaps
    };
  });

  const data = {
    labels: timestamps.map((ts) => new Date(ts).toLocaleTimeString()),
    datasets,
  };

  const options = {
    responsive: true,
    animation: false as const,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Voltage Over Time" },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<"line">) => {
            const voltage = context.parsed.y;
            return `${context.dataset.label}: ${voltage}V${
              voltage < SAFE_MIN || voltage > SAFE_MAX ? " (Out of Range)" : ""
            }`;
          },
        },
      },
    },
    scales: {
      y: { min: 215, max: 245 },
    },
  };

  return <Line data={data} options={options} />;
};
