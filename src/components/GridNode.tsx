import { GridEntry } from "../App"; //* Import GridEntry type from App.tsx
import { useState } from "react";
import styles from "../styles/GridNode.module.css";

//* Interface - Define props for GridNode
//* Why: TypeScript ensures props match expected shape from App.tsx
//* Where: Passed from App.tsx to display and update a node
interface GridNodeProps {
  entry: GridEntry; // e.g., { id: "1", voltage: 237, timestamp: "2025-03-29T10:00:00Z" }
  updatedId: string | null; // e.g., "1" or null - Highlights recently updated node
  onUpdateVoltage: (id: string, voltage: number) => void; //* Callback to trigger voltage update in App.tsx
}

//* GridNode Component - Displays a single grid node with voltage update UI
//* Why: Shows node status and allows manual voltage changes
//* Where: Rendered in App.tsx's node list (<ul>)
export function GridNode({ entry, updatedId, onUpdateVoltage }: GridNodeProps) {
  //* State - Track user input for voltage updates
  //* Why: Local state for input field, resets after update
  //* What: String to handle typing (parsed later to number)
  const [voltageInput, setVoltageInput] = useState(""); // e.g., "" or "225"

  //* Utility - Format timestamp for display
  //* Why: Converts ISO string to readable time
  //* Where: Used in JSX for timestamp display
  const formatTimestamp = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }); // e.g., "10:00:00"

  //* Computed Values - Drive UI styling
  //* Why: Determines safe/warning colors and update highlight
  const isSafe = entry.voltage >= 223 && entry.voltage <= 237; // e.g., true for 225
  const isUpdated = entry.id === updatedId; // e.g., true if "1" === "1"

  //* Handler - Update voltage on button click
  //* Why: Validates input, clamps value, calls parent callback
  //* Where: Triggered by Update button
  //* What: Ensures valid number in 220-239 range
  const handleUpdate = () => {
    const parsedVoltage = parseInt(voltageInput); // e.g., 225 or NaN
    if (!isNaN(parsedVoltage)) {
      const clampedVoltage = Math.max(220, Math.min(239, parsedVoltage)); // e.g., 225 (clamped from 300)
      onUpdateVoltage(entry.id, clampedVoltage); //* Calls App.tsx, may trigger optimistic update there
      setVoltageInput(""); //* Reset input after success
    }
    //* Nuance: Ignores invalid/empty input - no fallback to avoid unintended updates
  };

  return (
    <li className={`${styles.node} ${isUpdated ? styles.updated : ""}`}>
      Voltage: {entry.voltage} V (ID: {entry.id}, Time:{" "}
      {formatTimestamp(entry.timestamp)})
      <span className={styles.label}>Node {entry.id}:</span>
      <span
        className={`${styles.voltage} ${isSafe ? styles.safe : styles.warning}`}
      >
        {entry.voltage}V
      </span>
      <input
        type="number"
        value={voltageInput}
        onChange={(e) => setVoltageInput(e.target.value)}
        placeholder="Set voltage (220-239)"
        style={{ marginLeft: "10px", width: "100px" }}
      />
      <button onClick={handleUpdate} style={{ marginLeft: "5px" }}>
        Update
      </button>
    </li>
  );
}
