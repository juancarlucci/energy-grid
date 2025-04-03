import { useState } from "react";

//* Props - Define expected input for ControlPanel
interface ControlPanelProps {
  paused: boolean; // e.g., false - Subscription paused or active
  onTogglePause: () => void; //* Toggles paused state
  onRefresh: () => void; //* Refetches data
  onAddNode: (id: string) => void; //* Adds a new node
  onDeleteNode: (id: string) => void; //* Deletes a node
  loading: boolean; // e.g., true during query or mutation
  mutationLoading: { add?: boolean; delete?: boolean }; // e.g., { add: true }
  nodes: { id: string }[]; // e.g., [{ id: "1" }, { id: "2" }]
}

//* ControlPanel Component - Manages grid operations and node selection
export const ControlPanel = ({
  paused,
  onTogglePause,
  onRefresh,
  onAddNode,
  loading,
  mutationLoading,
}: ControlPanelProps) => {
  //* State - Track inputs for adding and deleting nodes
  const [newNodeId, setNewNodeId] = useState("");
  //* Handlers - Add or delete nodes
  const handleAdd = () => {
    const trimmedId = newNodeId.trim();
    if (trimmedId && !mutationLoading.add) {
      onAddNode(trimmedId);
      setNewNodeId("");
    }
  };

  //* Render - Display control UI with Tailwind styling
  return (
    <div className="p-5 bg-gray-800 border border-gray-700 rounded-lg mb-6 flex flex-wrap gap-4 items-center">
      <button
        onClick={onTogglePause}
        disabled={loading}
        className={`px-3 py-1 rounded text-white ${
          paused
            ? "bg-red-500 hover:bg-red-600"
            : "bg-blue-600 hover:bg-blue-700"
        } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
      >
        {paused ? "Resume" : "Pause"}
      </button>
      <button
        onClick={onRefresh}
        disabled={loading}
        className={`px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 ${
          loading ? "opacity-70 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Refreshing..." : "Refresh"}
      </button>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newNodeId}
          onChange={(e) => setNewNodeId(e.target.value)}
          placeholder="New Node ID (e.g., 4)"
          className="px-2 py-1 bg-gray-700 text-gray-200 border border-gray-600 rounded w-32 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleAdd}
          disabled={mutationLoading?.add || !newNodeId.trim()}
          className={`px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 ${
            mutationLoading?.add || !newNodeId.trim()
              ? "opacity-70 cursor-not-allowed"
              : ""
          }`}
        >
          {mutationLoading?.add ? "Adding..." : "Add Node"}
        </button>
      </div>
    </div>
  );
};
