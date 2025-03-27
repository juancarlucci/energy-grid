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
} from "chart.js";
import { GridEntry } from "../App";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface VoltageChartProps {
  history: GridEntry[];
}

export function VoltageChart({ history }: VoltageChartProps) {
  // Prepare chart data
  const chartData = {
    labels: history.map((entry) =>
      new Date(entry.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    ),
    datasets: [
      {
        label: "Voltage (V)",
        data: history.map((entry) => entry.voltage),
        borderColor: "#328232",
        backgroundColor: "rgba(50, 130, 50, 0.2)",
        fill: true,
        tension: 0.1, // Slight curve
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Voltage Trends" },
    },
    scales: {
      y: {
        min: 210, // Slightly below range for visibility
        max: 250, // Slightly above
        title: { display: true, text: "Voltage (V)" },
      },
      x: { title: { display: true, text: "Time" } },
    },
  };

  return <Line data={chartData} options={options} />;
}
