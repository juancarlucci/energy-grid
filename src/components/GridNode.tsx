import { GridEntry } from "../App"; // Assuming you export this type
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
    const newVoltage =
      parseInt(voltageInput) || Math.floor(Math.random() * 20) + 220;
    onUpdateVoltage(entry.id, newVoltage);
    setVoltageInput(""); // Reset input
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
