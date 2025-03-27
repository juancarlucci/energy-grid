import {
  useQuery,
  useMutation,
  useSubscription,
  gql,
} from "@apollo/client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { GridNode } from "./components/GridNode";
import { ControlPanel } from "./components/ControlPanel";
import { VoltageChart } from "./components/VoltageChart";

const GET_GRID_DATA = gql`
  query GetGridData {
    grid {
      id
      voltage
      timestamp
    }
  }
`;

const GRID_SUBSCRIPTION = gql`
  subscription OnGridUpdate {
    gridUpdate {
      id
      voltage
      timestamp
    }
  }
`;

const UPDATE_VOLTAGE = gql`
  mutation UpdateVoltage($id: String!, $voltage: Int!) {
    updateVoltage(id: $id, voltage: $voltage) {
      id
      voltage
      timestamp
    }
  }
`;

const ADD_NODE = gql`
  mutation AddNode($id: String!) {
    addNode(id: $id) {
      id
      voltage
      timestamp
    }
  }
`;

const DELETE_NODE = gql`
  mutation DeleteNode($id: String!) {
    deleteNode(id: $id) {
      id
      voltage
      timestamp
    }
  }
`;

export type GridEntry = {
  id: string;
  voltage: number;
  timestamp: string;
};

function App() {
  // --- State Management ---
  const [paused, setPaused] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [voltageHistory, setVoltageHistory] = useState<GridEntry[]>(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem("voltageHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [updatedId, setUpdatedId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [timeFrame, setTimeFrame] = useState<"5m" | "15m" | "all">("5m");
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [mutationLoading, setMutationLoading] = useState<{
    add?: boolean;
    delete?: boolean;
  }>({});

  // --- Apollo Hooks ---
  const {
    loading: queryLoading,
    error: queryError,
    data: queryData,
    refetch,
  } = useQuery(GET_GRID_DATA, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });
  const [updateVoltage] = useMutation(UPDATE_VOLTAGE);
  const [addNode] = useMutation(ADD_NODE);
  const [deleteNode] = useMutation(DELETE_NODE);
  const { data: subData, error: subError } = useSubscription(
    GRID_SUBSCRIPTION,
    {
      skip: paused || !queryData,
      onSubscriptionData: ({ client, subscriptionData }) => {
        const newEntry = subscriptionData.data.gridUpdate;
        const cachedData = client.readQuery<{ grid: GridEntry[] }>({
          query: GET_GRID_DATA,
        });
        if (cachedData) {
          client.writeQuery({
            query: GET_GRID_DATA,
            data: {
              grid: cachedData.grid.map((entry) =>
                entry.id === newEntry.id ? newEntry : entry
              ),
            },
          });
          updateHistory(newEntry);
        }
      },
    }
  );

  // --- Effects ---
  // Initialize selectedNodes with all nodes from queryData
  useEffect(() => {
    if (queryData?.grid && selectedNodes.length === 0) {
      setSelectedNodes(queryData.grid.map((entry: GridEntry) => entry.id));
    }
  }, [queryData, selectedNodes.length]);

  // Handle subscription updates and alerts
  useEffect(() => {
    if (subData?.gridUpdate) {
      const { id, voltage } = subData.gridUpdate;
      if (voltage < 223 || voltage > 237) {
        addAlert(`Node ${id} voltage ${voltage}V out of safe range!`);
      }
      setUpdatedId(id);
      setTimeout(() => setUpdatedId(null), 500);
    }
  }, [subData]);

  // Persist voltageHistory to localStorage
  useEffect(() => {
    localStorage.setItem("voltageHistory", JSON.stringify(voltageHistory));
  }, [voltageHistory]);

  // --- Utility Functions ---
  const updateHistory = useCallback((newEntry: GridEntry) => {
    setVoltageHistory((prev) => [...prev, newEntry].slice(-200));
  }, []);

  const addAlert = useCallback((message: string) => {
    setAlerts((prev) => [message, ...prev.slice(0, 2)]);
    setTimeout(() => {
      setAlerts((prev) => prev.filter((a) => a !== message));
    }, 5000); // Auto-dismiss after 5 seconds
  }, []);

  // --- Handlers ---
  const handleUpdateVoltage = useCallback(
    (id: string, voltage: number) => {
      const clampedVoltage = Math.max(220, Math.min(239, voltage));
      updateVoltage({
        variables: { id, voltage: clampedVoltage },
        optimisticResponse: {
          updateVoltage: {
            id,
            voltage: clampedVoltage,
            timestamp: new Date().toISOString(),
            __typename: "Grid",
          },
        },
        update: (cache, { data }) => {
          const updatedEntry = data?.updateVoltage;
          if (updatedEntry) {
            const cachedData = cache.readQuery<{ grid: GridEntry[] }>({
              query: GET_GRID_DATA,
            });
            if (cachedData) {
              cache.writeQuery({
                query: GET_GRID_DATA,
                data: {
                  grid: cachedData.grid.map((entry) =>
                    entry.id === updatedEntry.id ? updatedEntry : entry
                  ),
                },
              });
              updateHistory(updatedEntry);
              if (updatedEntry.voltage < 223 || updatedEntry.voltage > 237) {
                addAlert(
                  `Node ${id} voltage ${updatedEntry.voltage}V out of safe range!`
                );
              }
            }
          }
        },
      })
        .then(() => {
          setUpdatedId(id);
          setTimeout(() => setUpdatedId(null), 500);
        })
        .catch((error) => {
          console.error("Update voltage error:", error);
          addAlert(`Failed to update Node ${id}: ${error.message}`);
        });
    },
    [updateVoltage, updateHistory, addAlert]
  );

  const handleAddNode = useCallback(
    (id: string) => {
      setMutationLoading((prev) => ({ ...prev, add: true }));
      addNode({
        variables: { id },
        update: (cache, { data }) => {
          const newNode = data?.addNode;
          if (newNode) {
            const cachedData = cache.readQuery<{ grid: GridEntry[] }>({
              query: GET_GRID_DATA,
            });
            if (cachedData) {
              cache.writeQuery({
                query: GET_GRID_DATA,
                data: { grid: [...cachedData.grid, newNode] },
              });
              setSelectedNodes((prev) => [...prev, newNode.id]);
              updateHistory(newNode);
            }
          }
        },
      })
        .then(() => setMutationLoading((prev) => ({ ...prev, add: false })))
        .catch((error) => {
          console.error("Add node error:", error);
          addAlert(`Failed to add Node ${id}: ${error.message}`);
          setMutationLoading((prev) => ({ ...prev, add: false }));
        });
    },
    [addNode, updateHistory, addAlert]
  );

  const handleDeleteNode = useCallback(
    (id: string) => {
      setMutationLoading((prev) => ({ ...prev, delete: true }));
      deleteNode({
        variables: { id },
        update: (cache, { data }) => {
          const deletedNode = data?.deleteNode;
          if (deletedNode) {
            const cachedData = cache.readQuery<{ grid: GridEntry[] }>({
              query: GET_GRID_DATA,
            });
            if (cachedData) {
              cache.writeQuery({
                query: GET_GRID_DATA,
                data: {
                  grid: cachedData.grid.filter((entry) => entry.id !== id),
                },
              });
              setSelectedNodes((prev) => prev.filter((n) => n !== id));
            }
          }
        },
      })
        .then(() => setMutationLoading((prev) => ({ ...prev, delete: false })))
        .catch((error) => {
          console.error("Delete node error:", error);
          addAlert(`Failed to delete Node ${id}: ${error.message}`);
          setMutationLoading((prev) => ({ ...prev, delete: false }));
        });
    },
    [deleteNode, addAlert]
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { data } = await refetch({ fetchPolicy: "network-only" });
      if (data?.grid) {
        setVoltageHistory((prev) => {
          const latestById = new Map(prev.map((entry) => [entry.id, entry]));
          data.grid.forEach((entry: GridEntry) =>
            latestById.set(entry.id, entry)
          );
          return [...prev, ...Array.from(latestById.values())].slice(-200);
        });
        setSelectedNodes(data.grid.map((entry: GridEntry) => entry.id));
      }
    } catch (error) {
      console.error("Refetch error:", error);
      addAlert(`Refresh failed: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, addAlert]);

  // --- Memoized Computations ---
  const filteredHistory = useMemo(() => {
    const now = Date.now();
    const timeLimits = {
      "5m": 5 * 60 * 1000,
      "15m": 15 * 60 * 1000,
      "all": Infinity,
    };
    const limit = timeLimits[timeFrame];
    return voltageHistory.filter(
      (entry) =>
        now - new Date(entry.timestamp).getTime() <= limit &&
        selectedNodes.includes(entry.id)
    );
  }, [voltageHistory, timeFrame, selectedNodes]);

  const renderedGrid = useMemo(() => {
    if (!queryData?.grid) return null;
    return queryData.grid.map((entry: GridEntry) => (
      <GridNode
        key={entry.id}
        entry={entry}
        updatedId={updatedId}
        onUpdateVoltage={handleUpdateVoltage}
      />
    ));
  }, [queryData?.grid, updatedId, handleUpdateVoltage]);

  const toggleNode = useCallback((id: string) => {
    setSelectedNodes((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
    );
  }, []);

  // --- Render ---
  if (queryLoading && !queryData) return <p>Loading grid data...</p>;
  if (queryError) return <p>Error: {queryError.message}</p>;
  if (subError) return <p>Subscription Error: {subError.message}</p>;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ marginBottom: "10px" }}>Energy Grid Dashboard</h1>
      {alerts.length > 0 && (
        <div
          style={{
            position: "fixed",
            top: "10px",
            right: "10px",
            background: "red",
            color: "white",
            padding: "10px",
            borderRadius: "5px",
            maxWidth: "300px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            zIndex: 1000,
          }}
        >
          {alerts.map((alert, idx) => (
            <p key={idx} style={{ margin: "5px 0" }}>
              {alert}
            </p>
          ))}
          <button
            onClick={() => setAlerts([])}
            style={{
              display: "block",
              margin: "5px auto",
              padding: "5px 10px",
              background: "white",
              color: "red",
              border: "none",
              borderRadius: "3px",
              cursor: "pointer",
            }}
          >
            Clear Alerts
          </button>
        </div>
      )}
      <p style={{ marginBottom: "15px" }}>
        Real-time updates via GraphQL subscription (random node every 3s)
      </p>
      <div style={{ marginBottom: "15px" }}>
        <label style={{ marginRight: "10px" }}>Time Frame: </label>
        <select
          value={timeFrame}
          onChange={(e) => setTimeFrame(e.target.value as "5m" | "15m" | "all")}
          style={{ padding: "5px" }}
        >
          <option value="5m">Last 5 Minutes</option>
          <option value="15m">Last 15 Minutes</option>
          <option value="all">All Data</option>
        </select>
      </div>
      <div style={{ marginBottom: "15px" }}>
        <label style={{ marginRight: "10px" }}>Nodes: </label>
        {queryData?.grid.map((entry: GridEntry) => (
          <label key={entry.id} style={{ marginRight: "15px" }}>
            <input
              type="checkbox"
              checked={selectedNodes.includes(entry.id)}
              onChange={() => toggleNode(entry.id)}
            />
            Node {entry.id}
          </label>
        ))}
      </div>
      <ControlPanel
        paused={paused}
        onTogglePause={() => setPaused(!paused)}
        onRefresh={handleRefresh}
        onAddNode={handleAddNode}
        onDeleteNode={handleDeleteNode}
        loading={queryLoading || isRefreshing}
        mutationLoading={mutationLoading}
      />
      <VoltageChart history={filteredHistory} />
      <ul style={{ listStyle: "none", padding: 0, marginTop: "20px" }}>
        {renderedGrid}
      </ul>
    </div>
  );
}

export default App;