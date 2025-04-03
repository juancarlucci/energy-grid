import { useEffect, useRef, useMemo, useCallback } from "react";
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

//* Register ChartJS components - Set up chart functionality
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

//* Constants - Define color palette for node lines
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
  history: GridEntry[]; // e.g., [{ id: "1", voltage: 237, timestamp: "2025-03-29T10:00:00Z" }, ...]
  onLegendClick?: (nodeId: string) => void; //* Callback to handle legend toggle
  hiddenNodes?: Set<string>;
}

//* VoltageChart Component - Renders a line chart of voltage history for grid nodes
export const VoltageChart = ({
  history,
  onLegendClick,
  hiddenNodes,
}: VoltageChartProps) => {
  //* Ref - Hold reference to ChartJS instance
  const chartRef = useRef<ChartJS<"line", (number | null)[], string> | null>(
    null
  );
  const nodeColors = useRef<Map<string, string>>(new Map()); //* Persist colors per node, e.g., Map<"1", "#4E79A7">

  //* Callback - Assign or retrieve persistent color for each node
  const getNodeColor = useCallback((nodeId: string) => {
    if (!nodeColors.current.has(nodeId)) {
      nodeColors.current.set(nodeId, getRandomColor()); // e.g., set "1" -> "#4E79A7"
    }
    return nodeColors.current.get(nodeId)!; // e.g., "#4E79A7"
  }, []);

  //* Computed Data - Transform history into chart-friendly format
  const chartData = useMemo(() => {
    //* Labels - Unique timestamps as x-axis labels
    const labels = Array.from(new Set(history.map((entry) => entry.timestamp)))
      .sort()
      .map((ts) => new Date(ts).toLocaleTimeString()); // e.g., ["10:00:00", "10:00:03", ...]

    return {
      labels,
      datasets: Array.from(new Set(history.map((entry) => entry.id))).map(
        (nodeId) => {
          //* Node Data - Filter history for this node
          const nodeData = history.filter((entry) => entry.id === nodeId); // e.g., [{ id: "1", voltage: 237, ... }, ...]
          const firstEntry = nodeData.reduce((earliest, current) =>
            new Date(current.timestamp) < new Date(earliest.timestamp)
              ? current
              : earliest
          ); // e.g., { id: "1", voltage: 237, timestamp: "2025-03-29T10:00:00Z" }
          const firstTimestamp = firstEntry.timestamp;
          let lastVoltage: number | null = null;

          //* Data Points - Voltage values for each label
          const data = labels.map((label) => {
            const timestamp = history.find(
              (e) => new Date(e.timestamp).toLocaleTimeString() === label
            )?.timestamp; // e.g., "2025-03-29T10:00:00Z"
            const entry = nodeData.find((e) => e.timestamp === timestamp); // e.g., { id: "1", voltage: 237, ... }
            if (entry) lastVoltage = entry.voltage; // e.g., 237
            return timestamp && new Date(timestamp) < new Date(firstTimestamp)
              ? null
              : lastVoltage; // e.g., 237 or null
          });

          //* Point Colors - Green for safe, orange for out-of-range
          const pointColors = labels.map((label) => {
            const timestamp = history.find(
              (e) => new Date(e.timestamp).toLocaleTimeString() === label
            )?.timestamp; // e.g., "2025-03-29T10:00:00Z"
            const entry = nodeData.find((e) => e.timestamp === timestamp); // e.g., { id: "1", voltage: 237, ... }
            const voltage = entry ? entry.voltage : lastVoltage;
            return voltage && voltage >= 223 && voltage <= 237
              ? "#2ecc71"
              : "#f39c12";
          });

          return {
            label: `Node ${nodeId}`,
            data, // e.g., [null, 237, 237, ...]
            borderColor: getNodeColor(nodeId),
            backgroundColor: "transparent",
            pointBackgroundColor: pointColors,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.3,
            fill: false,
            hidden: hiddenNodes?.has(nodeId) || false,
          };
        }
      ),
    };
  }, [history, getNodeColor, hiddenNodes]);

  //* Effect - Sync chart data and visibility with updates
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    chart.data = chartData; //* Sync chart data, e.g., { labels: ["10:00:00", ...], datasets: [...] }
    chart.update({ duration: 500 });
  }, [chartData]);

  //* Chart Options - Configure appearance and behavior
  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    plugins: {
      legend: {
        position: "top",
        labels: { color: "#e2e8f0", font: { size: 14 } },
        onClick: (e, legendItem) => {
          const index = legendItem.datasetIndex!;
          const chart = chartRef.current!;
          const meta = chart.getDatasetMeta(index);
          meta.hidden = !meta.hidden; //* Toggle Node visibility in Chart.js
          const nodeId = legendItem.text.split(" ")[1]; // e.g., "1" from "Node 1"
          if (onLegendClick) onLegendClick(nodeId); //* Notify App of toggle
          chart.update();
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#e2e8f0",
        callbacks: {
          label: (context) => {
            const dataset = context.dataset; // e.g., { label: "Node 1", data: [237, ...], ... }
            const timestamp = history.find(
              (e) =>
                new Date(e.timestamp).toLocaleTimeString() === context.label
            )?.timestamp;
            const entry = history.find(
              (e) =>
                e.id === dataset.label?.split(" ")[1] &&
                e.timestamp === timestamp
            );
            return entry
              ? `Node ${entry.id}: ${entry.voltage}V at ${new Date(
                  entry.timestamp
                ).toLocaleString()}` // e.g., "Node 1: 237V at 3/29/2025, 10:00:00 AM"
              : `Node ${dataset.label?.split(" ")[1]}: ${
                  context.raw
                }V (interpolated)`; // e.g., "Node 1: 237V (interpolated)"
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
        min: 215,
        max: 245,
      },
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
  };

  //* Render - Display the line chart
  return (
    <div className="w-full h-[400px] bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
};
