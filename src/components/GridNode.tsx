import { useState } from "react";
import { GridEntry } from "../hooks/useGridData"; //* Import GridEntry from useGridData.ts

//* Props - Define expected input for GridNode
interface GridNodeProps {
  entry: GridEntry; // e.g., { id: "1", voltage: 237, timestamp: "2025-03-29T10:00:00Z" }
  updatedId: string | null; // e.g., "1" or null - Highlights recently updated node
  onUpdateVoltage: (id: string, voltage: number) => void; //* Callback to update voltage in App
}

//* GridNode Component - Displays a single grid node with voltage update UI
export function GridNode({ entry, updatedId, onUpdateVoltage }: GridNodeProps) {
  //* State - Track user input for voltage updates
  const [voltageInput, setVoltageInput] = useState(""); // e.g., "" or "225"

  //* Utility - Format timestamp for display
  const formatTimestamp = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }); // e.g., "10:00:00"

  //* Computed Values - Drive UI styling
  const isSafe = entry.voltage >= 223 && entry.voltage <= 237; // e.g., true for 225
  const isUpdated = entry.id === updatedId; // e.g., true if "1" === "1"

  //* Handler - Update voltage on button click
  const handleUpdate = () => {
    const parsedVoltage = parseInt(voltageInput); // e.g., 225 or NaN
    if (!isNaN(parsedVoltage)) {
      const clampedVoltage = Math.max(220, Math.min(239, parsedVoltage)); // e.g., 225
      onUpdateVoltage(entry.id, clampedVoltage); //* Triggers update in App
      setVoltageInput(""); //* Reset input
    }
  };

  //* Render - Display node info and update controls
  return (
    <li
      className={`p-4 bg-gray-800 border border-gray-700 rounded-lg flex items-center gap-3 ${
        isUpdated ? "bg-blue-500/20" : ""
      }`}
    >
      <span className="text-gray-400">Node {entry.id}:</span>
      <span
        className={`font-bold ${isSafe ? "text-green-400" : "text-orange-400"}`}
      >
        {entry.voltage}V
      </span>
      <span className="text-gray-400">{formatTimestamp(entry.timestamp)}</span>
      <input
        type="number"
        value={voltageInput}
        onChange={(e) => setVoltageInput(e.target.value)}
        placeholder="220-239"
        className="ml-2 w-24 p-1 bg-gray-700 text-gray-200 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
      />
      <button
        onClick={handleUpdate}
        className="ml-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
      >
        Update
      </button>
    </li>
  );
}
