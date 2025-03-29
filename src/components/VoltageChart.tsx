import { useEffect, useMemo, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2"; //* Only need Line, not Chart, since we use ChartJS for typing
import styles from "../styles/VoltageChart.module.css";

//* Register Chart.js components - Enable scales, lines, points, and UI elements
//* Why: Chart.js requires explicit registration of features we use
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

//* Type Definitions - Describe props and data structure
//* Kept inline for quick reference; could move to types/grid.ts if reused
type GridEntry = {
  id: string; // e.g., "1"
  voltage: number; // e.g., 237
  timestamp: string; // e.g., "2025-03-29T10:00:00Z"
};

type VoltageChartProps = {
  history: GridEntry[]; // e.g., [{ id: "1", voltage: 237, timestamp: "2025-03-29T10:00:00Z" }, ...]
};

//* VoltageChart Component - Displays a line chart of voltage history
export const VoltageChart = ({ history }: VoltageChartProps) => {
  //* Ref - Stable reference to Chart.js instance
  //* Why: Allows direct data updates without re-rendering component
  //* What: Holds the chart object for incremental updates
  const chartRef = useRef<ChartJS<"line", (number | null)[], string> | null>(
    null
  );

  //* Initial Data - Compute starting chart data once on mount
  //* Why: useMemo with [] ensures this runs only once, avoiding redundant calculations
  //* Where: Passed to <Line> as initial prop
  //* What: Sets up labels (x-axis) and datasets (lines/points) from history
  const initialData = useMemo(() => {
    //* Extract unique timestamps for x-axis labels
    const uniqueTimestamps = Array.from(
      new Set(history.map((entry) => entry.timestamp))
    );
    const labels = uniqueTimestamps.map((ts) =>
      new Date(ts).toLocaleTimeString()
    ); // e.g., ["10:00:00 AM", "10:00:03 AM"]

    //* Get unique node IDs for separate lines
    const nodes = Array.from(new Set(history.map((entry) => entry.id))); // e.g., ["1", "2"]

    //* Build datasets - One per node, with voltages and point colors
    const datasets = nodes.map((nodeId) => {
      const nodeData = history.filter((entry) => entry.id === nodeId); // e.g., [{ id: "1", voltage: 237, ... }]
      let lastVoltage: number | null = null;

      //* Map voltages to labels, filling gaps with last known value
      const data = labels.map((label) => {
        const timestamp = uniqueTimestamps[labels.indexOf(label)];
        const entry = nodeData.find((e) => e.timestamp === timestamp);
        if (entry) {
          lastVoltage = entry.voltage;
          return entry.voltage; // e.g., 237
        }
        return lastVoltage; // e.g., 237 (carried forward)
      });

      //* Set point colors based on voltage range
      const pointColors = labels.map((label) => {
        const timestamp = uniqueTimestamps[labels.indexOf(label)];
        const entry = nodeData.find((e) => e.timestamp === timestamp);
        if (entry) {
          return entry.voltage >= 223 && entry.voltage <= 237
            ? "#2ecc71"
            : "#f39c12"; // Green or orange
        }
        return lastVoltage && lastVoltage >= 223 && lastVoltage <= 237
          ? "#2ecc71"
          : "#f39c12";
      });

      //* Dataset shape: { label: "Node 1", data: [237, 237, ...], pointBackgroundColor: ["#2ecc71", ...], ... }
      return {
        label: `Node ${nodeId}`,
        data, // Array of voltages or nulls
        borderColor: "#3498db", // Blue line
        backgroundColor: "transparent",
        pointBackgroundColor: pointColors, // Green/orange points
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3, // Slight curve in lines
        fill: false,
      };
    });

    //* Return: { labels: ["10:00:00 AM", ...], datasets: [{ label: "Node 1", data: [237, ...], ... }, ...] }
    return { labels, datasets };
  }, []); //* Empty deps: Runs once on mount

  //* Effect - Update chart data incrementally when history changes
  //* Why: Handles real-time updates without full re-render, animates new points
  //* Where: Runs after render when history prop updates
  //* What: Syncs chart.data with history, updates canvas
  useEffect(() => {
    if (!chartRef.current) return; //* Exit if chart not initialized

    const chart = chartRef.current;
    const uniqueTimestamps = Array.from(
      new Set(history.map((entry) => entry.timestamp))
    );
    const newLabels = uniqueTimestamps.map((ts) =>
      new Date(ts).toLocaleTimeString()
    ); // e.g., ["10:00:00 AM", ...]
    const nodes = Array.from(new Set(history.map((entry) => entry.id))); // e.g., ["1", "2"]

    //* Update x-axis labels if new timestamps arrive
    if (newLabels.length > chart.data.labels!.length) {
      chart.data.labels = newLabels;
    }

    //* Update each node's dataset
    nodes.forEach((nodeId) => {
      const nodeData = history.filter((entry) => entry.id === nodeId); // e.g., [{ id: "1", voltage: 237, ... }]
      const datasetIndex = chart.data.datasets.findIndex(
        (d) => d.label === `Node ${nodeId}`
      );
      let dataset = chart.data.datasets[datasetIndex];

      if (datasetIndex === -1) {
        //* New node - Create full dataset
        let lastVoltage: number | null = null;
        const data = newLabels.map((label) => {
          const timestamp = uniqueTimestamps[newLabels.indexOf(label)];
          const entry = nodeData.find((e) => e.timestamp === timestamp);
          if (entry) {
            lastVoltage = entry.voltage;
            return entry.voltage;
          }
          return lastVoltage;
        });
        const pointColors = newLabels.map((label) => {
          const timestamp = uniqueTimestamps[newLabels.indexOf(label)];
          const entry = nodeData.find((e) => e.timestamp === timestamp);
          if (entry) {
            return entry.voltage >= 223 && entry.voltage <= 237
              ? "#2ecc71"
              : "#f39c12";
          }
          return lastVoltage && lastVoltage >= 223 && lastVoltage <= 237
            ? "#2ecc71"
            : "#f39c12";
        });
        dataset = {
          label: `Node ${nodeId}`,
          data, // e.g., [237, 237, ...]
          borderColor: "#3498db",
          backgroundColor: "transparent",
          pointBackgroundColor: pointColors, // e.g., ["#2ecc71", ...]
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.3,
          fill: false,
        };
        chart.data.datasets.push(dataset);
      } else {
        //* Existing node - Update with new points
        let lastVoltage = dataset.data[dataset.data.length - 1]; // e.g., 237
        const newData = newLabels.map((label) => {
          const timestamp = uniqueTimestamps[newLabels.indexOf(label)];
          const entry = nodeData.find((e) => e.timestamp === timestamp);
          if (entry) {
            lastVoltage = entry.voltage;
            return entry.voltage;
          }
          return lastVoltage;
        });
        const newPointColors = newLabels.map((label) => {
          const timestamp = uniqueTimestamps[newLabels.indexOf(label)];
          const entry = nodeData.find((e) => e.timestamp === timestamp);
          if (entry) {
            return entry.voltage >= 223 && entry.voltage <= 237
              ? "#2ecc71"
              : "#f39c12";
          }
          return lastVoltage && lastVoltage >= 223 && lastVoltage <= 237
            ? "#2ecc71"
            : "#f39c12";
        });
        dataset.data = newData; // e.g., [237, 237, 238]
        dataset.pointBackgroundColor = newPointColors; // e.g., ["#2ecc71", "#2ecc71", "#2ecc71"]
      }
    });

    //* Update chart with animation for new points only
    //* Nuance: animation: { duration: 0 } below disables default full redraw; this controls it
    chart.update({ duration: 500 }); //* 500ms animation for new points
    console.log("Chart Updated:", chart.data); // e.g., { labels: [...], datasets: [{ label: "Node 1", data: [...], ... }] }
  }, [history]);

  //* Chart Options - Configure appearance and behavior
  //* Why: Defines how the chart looks and interacts
  //* What: Sets scales, colors, tooltips, and animation
  const options: ChartOptions<"line"> = {
    responsive: true, //* Adapts to container size
    maintainAspectRatio: false, //* Fills container height (e.g., 400px from CSS)
    animation: {
      duration: 0, //* Disable default animation; we control it via chart.update()
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: { color: "#fff", font: { size: 14 } }, //* White labels, 14px
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#bbb",
        callbacks: {
          //* Custom tooltip text
          label: (context) => {
            const dataset = context.dataset; // e.g., { label: "Node 1", data: [237, ...] }
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
    },
    scales: {
      x: {
        title: { display: true, text: "Time", color: "#bbb" },
        ticks: { color: "#bbb", maxTicksLimit: 10 }, //* Limit to 10 ticks for readability
        grid: { color: "#666" },
      },
      y: {
        title: { display: true, text: "Voltage (V)", color: "#bbb" },
        ticks: { color: "#bbb" },
        grid: { color: "#666" },
        min: 210,
        max: 250, //* Fixed range for voltage
      },
    },
    interaction: {
      mode: "index" as const, //* Show tooltip for all points at x-position
      intersect: false,
    },
  };

  //* Render - Display the chart
  return (
    <div className={styles.chartContainer}>
      <Line ref={chartRef} data={initialData} options={options} />
    </div>
  );
};
