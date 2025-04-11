import { useState } from "react";
import { GridEntry } from "../hooks/useGridData";

//* Props - Define expected input for GridNode
interface GridNodeProps {
  entry: GridEntry; //* e.g., { id: "1", voltage: 237, timestamp: "2025-03-29T10:00:00Z" }
  updatedId: string | null;
  onUpdateVoltage: (id: string, voltage: number) => void;
  onDeleteNode: (id: string) => void;
  alert: string | null;
}

//* GridNode Component - Displays a single grid node with voltage update UI and delete option
export function GridNode({
  entry,
  updatedId,
  onUpdateVoltage,
  onDeleteNode,
  alert,
}: GridNodeProps) {
  const [voltageInput, setVoltageInput] = useState("");
  const formatTimestamp = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  //* Computed Values - Drive UI styling
  const isSafe = entry.voltage >= 223 && entry.voltage <= 237;
  const isUpdated = entry.id === updatedId;

  const handleUpdate = () => {
    const parsedVoltage = parseInt(voltageInput);
    if (!isNaN(parsedVoltage)) {
      const clampedVoltage = Math.max(220, Math.min(239, parsedVoltage));
      onUpdateVoltage(entry.id, clampedVoltage); //* Triggers update in App
      setVoltageInput("");
    }
  };

  const handleDelete = () => {
    onDeleteNode(entry.id);
  };

  //* Render - Display node info and controls as an article within a list
  return (
    <li
      key={entry.id}
      className={`p-4 bg-gray-800 border border-gray-700 rounded-lg relative ${
        isUpdated ? "bg-blue-500/20" : ""
      }`}
    >
      <article
        className="flex flex-col gap-4"
        aria-label={`Node ${entry.id} status`}
      >
        {/* Node name, voltage and timestamp */}
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Node {entry.id}:</span>
            <span
              className={`font-bold ${
                isSafe ? "text-green-400" : "text-orange-400"
              }`}
            >
              {entry.voltage}V
            </span>
          </div>
          <time className="text-gray-400" dateTime={entry.timestamp}>
            {formatTimestamp(entry.timestamp)}
          </time>
        </div>

        {/* Voltage input and update */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            value={voltageInput}
            onChange={(e) => setVoltageInput(e.target.value)}
            placeholder="220-239"
            className="w-24 p-1 bg-gray-700 text-gray-200 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
            aria-label={`Voltage input for Node ${entry.id}`}
          />
          <button
            onClick={handleUpdate}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
          >
            Update
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 focus:ring-2 focus:ring-red-500"
          >
            Delete
          </button>
        </div>

        {alert && (
          <span
            className="text-red-500 text-sm font-medium"
            role="alert"
            aria-live="polite"
          >
            {alert}
          </span>
        )}
      </article>
    </li>
  );
}
