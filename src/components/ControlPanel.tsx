interface ControlPanelProps {
  paused: boolean;
  onTogglePause: () => void;
  onRefresh: () => void;
  loading: boolean;
}

export function ControlPanel({
  paused,
  onTogglePause,
  onRefresh,
  loading,
}: ControlPanelProps) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <button onClick={onTogglePause} disabled={loading}>
        {paused ? "Resume Updates" : "Pause Updates"}
      </button>
      <button
        onClick={onRefresh}
        disabled={loading}
        style={{ marginLeft: "10px" }}
      >
        Refresh Data
      </button>
      {loading && <span style={{ marginLeft: "10px" }}>Loading...</span>}
    </div>
  );
}
