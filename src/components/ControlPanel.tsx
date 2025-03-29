import { useState } from "react";

//* Type Definition - Define props for ControlPanel
//* Why: TypeScript ensures props align with App.tsx's expectations
type ControlPanelProps = {
  paused: boolean; // e.g., false - Subscription paused or active
  onTogglePause: () => void; //* Toggles paused state in App.tsx
  onRefresh: () => void; //* Refetches data in App.tsx
  onAddNode: (id: string) => void;
  onDeleteNode: (id: string) => void;
  loading: boolean;
  mutationLoading: { add?: boolean; delete?: boolean };
  nodes: { id: string }[]; // e.g., [{ id: "1" }, { id: "2" }] - List of node IDs
};

//* ControlPanel Component - Manages grid operations (pause, refresh, add, delete)
export const ControlPanel = ({
  paused,
  onTogglePause,
  onRefresh,
  onAddNode,
  onDeleteNode,
  loading,
  mutationLoading,
  nodes,
}: ControlPanelProps) => {
  //* State - Track inputs for adding and deleting nodes
  const [newNodeId, setNewNodeId] = useState(""); // e.g., "" or "4"
  const [nodeToDelete, setNodeToDelete] = useState(""); // e.g., "" or "1"

  //* Handlers - Add a new node or Delete a selected node
  //* Why: Validates input, triggers mutation, clears field
  //* What: Ensures non-empty ID and no mutation in progress
  const handleAdd = () => {
    const trimmedId = newNodeId.trim(); // e.g., "4" Nuance: trim() removes whitespace, check prevents action during mutation
    if (trimmedId && !mutationLoading.add) {
      onAddNode(trimmedId);
      setNewNodeId("");
    }
  };
  const handleDelete = () => {
    if (nodeToDelete && !mutationLoading.delete) {
      //* Nuance: No action if empty or deleting - avoids errors
      onDeleteNode(nodeToDelete);
      setNodeToDelete("");
    }
  };

  //* Render - Display control UI with Tailwind classes
  return (
    <div className="p-5 bg-gray-800 border border-gray-700 rounded-lg mb-5 flex flex-wrap gap-3 items-center">
      {/* Pause/Resume Button */}
      <button
        onClick={onTogglePause}
        disabled={loading}
        className={`px-3 py-1 rounded text-white ${
          paused
            ? "bg-red-500 hover:bg-red-600"
            : "bg-blue-600 hover:bg-blue-700"
        } ${loading ? "bg-gray-600 cursor-not-allowed" : ""}`}
      >
        {paused ? "Resume" : "Pause"}
      </button>

      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        disabled={loading}
        className={`px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 ${
          loading ? "bg-gray-600 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Refreshing..." : "Refresh"}
      </button>

      {/* Add Node Section */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newNodeId}
          onChange={(e) => setNewNodeId(e.target.value)} //* Updates state as user types
          placeholder="New Node ID (e.g., 4)"
          className="px-2 py-1 bg-gray-900 text-white border border-gray-700 rounded w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAdd}
          disabled={mutationLoading.add || !newNodeId.trim()}
          className={`px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 ${
            mutationLoading.add || !newNodeId.trim()
              ? "bg-gray-600 cursor-not-allowed"
              : ""
          }`}
        >
          {mutationLoading.add ? "Adding..." : "Add Node"}
        </button>
      </div>

      {/* Delete Node Section */}
      <div className="flex items-center gap-2">
        <select
          value={nodeToDelete}
          onChange={(e) => setNodeToDelete(e.target.value)}
          className="px-2 py-1 bg-gray-900 text-white border border-gray-700 rounded w-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Node to Delete</option>
          {nodes.map((node) => (
            <option key={node.id} value={node.id}>
              Node {node.id} {/* e.g., "Node 1" */}
            </option>
          ))}
        </select>
        <button
          onClick={handleDelete}
          disabled={mutationLoading.delete || !nodeToDelete}
          className={`px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 ${
            mutationLoading.delete || !nodeToDelete
              ? "bg-gray-600 cursor-not-allowed"
              : ""
          }`}
        >
          {mutationLoading.delete ? "Deleting..." : "Delete Node"}
        </button>
      </div>
    </div>
  );
};
