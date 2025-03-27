import { GridEntry } from "../App";
import { useState } from "react";

interface GridNodeProps {
  entry: GridEntry;
  updatedId: string | null;
  onUpdateVoltage: (id: string, voltage: number) => void;
}

export function GridNode({ entry, updatedId, onUpdateVoltage }: GridNodeProps) {
  const [voltageInput, setVoltageInput] = useState("");

  const formatTimestamp = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const handleUpdate = () => {
    const parsedVoltage = parseInt(voltageInput);
    // Only update if input is a valid number and within range
    if (!isNaN(parsedVoltage)) {
      const clampedVoltage = Math.max(220, Math.min(239, parsedVoltage));
      onUpdateVoltage(entry.id, clampedVoltage);
      setVoltageInput(""); // Reset input after successful update
    }
    // If invalid or empty, do nothing (no random fallback)
  };

  return (
    <li
      style={{
        backgroundColor: entry.id === updatedId ? "#328232" : "transparent",
        padding: "5px",
      }}
    >
      Voltage: {entry.voltage} V (ID: {entry.id}, Time:{" "}
      {formatTimestamp(entry.timestamp)})
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
