import { useState } from "react";

type ControlPanelProps = {
  paused: boolean;
  onTogglePause: () => void;
  onRefresh: () => void;
  onAddNode: (id: string) => void;
  onDeleteNode: (id: string) => void;
  loading: boolean;
  mutationLoading: { add?: boolean; delete?: boolean };
  nodes: { id: string }[]; // Define nodes as an array of objects with an 'id' property
};

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
  const [newNodeId, setNewNodeId] = useState("");
  const [nodeToDelete, setNodeToDelete] = useState("");

  const handleAdd = () => {
    if (newNodeId.trim() && !mutationLoading.add) {
      onAddNode(newNodeId.trim());
      setNewNodeId("");
    }
  };

  const handleDelete = () => {
    if (nodeToDelete && !mutationLoading.delete) {
      onDeleteNode(nodeToDelete);
      setNodeToDelete("");
    }
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <button
        onClick={onTogglePause}
        disabled={loading}
        style={{
          marginRight: "10px",
          padding: "5px 10px",
          background: paused ? "green" : "gray",
          color: "white",
          border: "none",
          borderRadius: "3px",
        }}
      >
        {paused ? "Resume" : "Pause"}
      </button>
      <button
        onClick={onRefresh}
        disabled={loading}
        style={{
          marginRight: "10px",
          padding: "5px 10px",
          background: "blue",
          color: "white",
          border: "none",
          borderRadius: "3px",
        }}
      >
        {loading ? "Refreshing..." : "Refresh"}
      </button>
      <input
        type="text"
        value={newNodeId}
        onChange={(e) => setNewNodeId(e.target.value)}
        placeholder="New Node ID (e.g., 4)"
        style={{ padding: "5px", marginRight: "10px" }}
      />
      <button
        onClick={handleAdd}
        disabled={mutationLoading.add || !newNodeId.trim()}
        style={{
          padding: "5px 10px",
          background: mutationLoading.add ? "gray" : "orange",
          color: "white",
          border: "none",
          borderRadius: "3px",
          marginRight: "10px",
        }}
      >
        {mutationLoading.add ? "Adding..." : "Add Node"}
      </button>
      <select
        value={nodeToDelete}
        onChange={(e) => setNodeToDelete(e.target.value)}
        style={{ padding: "5px", marginRight: "10px" }}
      >
        <option value="">Select Node to Delete</option>
        {nodes.map((node) => (
          <option key={node.id} value={node.id}>
            Node {node.id}
          </option>
        ))}
      </select>
      <button
        onClick={handleDelete}
        disabled={mutationLoading.delete || !nodeToDelete}
        style={{
          padding: "5px 10px",
          background: mutationLoading.delete ? "gray" : "purple",
          color: "white",
          border: "none",
          borderRadius: "3px",
        }}
      >
        {mutationLoading.delete ? "Deleting..." : "Delete Node"}
      </button>
    </div>
  );
};
