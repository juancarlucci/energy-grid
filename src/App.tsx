import { useQuery, useMutation, useSubscription, gql } from "@apollo/client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { GridNode } from "./components/GridNode";
import { ControlPanel } from "./components/ControlPanel";
import { VoltageChart } from "./components/VoltageChart";
import styles from "./styles/App.module.css";

//* GraphQL Queries & Mutations - Define how we fetch, subscribe, and modify grid data
//* Kept inline for simplicity; could move to graphql/queries.ts in a larger app
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

//* Type Definitions - Describe our grid data structure
//* Inline for quick reference; could move to types/grid.ts if reused elsewhere
export type GridEntry = {
  id: string;
  voltage: number;
  timestamp: string;
};

function App() {
  //* State - Manage UI and data flow
  const [paused, setPaused] = useState(false); // Pause/resume subscription
  const [isRefreshing, setIsRefreshing] = useState(false); // Track manual refresh
  const [voltageHistory, setVoltageHistory] = useState<GridEntry[]>(() => {
    //* Load history from localStorage on mount, default to empty array
    const saved = localStorage.getItem("voltageHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [updatedId, setUpdatedId] = useState<string | null>(null); // Highlight updated node
  const [alerts, setAlerts] = useState<string[]>([]); // Show temporary alerts
  const [timeFrame, setTimeFrame] = useState<"5m" | "15m" | "all">("5m"); // Filter chart history
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]); // Nodes to display in chart
  const [mutationLoading, setMutationLoading] = useState<{
    add?: boolean;
    delete?: boolean;
  }>({}); // Track mutation status
  const processedUpdatesRef = useRef<Set<string>>(new Set()); //* Ref to track processed updates, persists across renders

  //* Apollo Hooks - Fetch, subscribe, and mutate data
  const {
    loading: queryLoading,
    error: queryError,
    data: queryData,
    refetch,
  } = useQuery(GET_GRID_DATA, {
    fetchPolicy: "cache-and-network", //* Use cache first, then network for fresh data
    notifyOnNetworkStatusChange: true, //* Update loading state on refetch
  });
  const [updateVoltage] = useMutation(UPDATE_VOLTAGE);
  const [addNode] = useMutation(ADD_NODE);
  const [deleteNode] = useMutation(DELETE_NODE);
  const { data: subData, error: subError } = useSubscription(
    GRID_SUBSCRIPTION,
    {
      skip: paused || !queryData, //* Skip if paused or no initial data
      onSubscriptionData: ({ client, subscriptionData }) => {
        const newEntry = subscriptionData.data.gridUpdate;
        const key = `${newEntry.id}-${newEntry.timestamp}-${newEntry.voltage}`;
        //* Prevent duplicate updates using ref
        if (processedUpdatesRef.current.has(key)) {
          console.log("Skipping duplicate subscription update:", newEntry);
          return;
        }
        //* Update Apollo cache with new entry
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
          updateHistory(newEntry, "subscription", key);
        }
      },
    }
  );

  //* Effects - Handle side effects after render
  useEffect(() => {
    //* Set initial selected nodes from query data if none selected
    if (queryData?.grid && selectedNodes.length === 0) {
      setSelectedNodes(queryData.grid.map((entry: GridEntry) => entry.id));
    }
  }, [queryData, selectedNodes.length]);

  useEffect(() => {
    //* Handle subscription updates: alerts and highlight
    if (subData?.gridUpdate) {
      const { id, voltage } = subData.gridUpdate;
      if (voltage < 223 || voltage > 237) {
        addAlert(`Node ${id} voltage ${voltage}V out of safe range!`);
      }
      setUpdatedId(id);
      setTimeout(() => setUpdatedId(null), 500); //* Clear highlight after 500ms
    }
  }, [subData]);

  useEffect(() => {
    //* Persist voltage history to localStorage
    localStorage.setItem("voltageHistory", JSON.stringify(voltageHistory));
  }, [voltageHistory]);

  //* Callbacks - Memoized functions for performance
  const updateHistory = useCallback(
    (newEntry: GridEntry, source: string, key: string) => {
      //* Skip duplicates tracked by ref
      if (processedUpdatesRef.current.has(key)) {
        console.log(`Duplicate skipped from ${source}:`, newEntry, { key });
        return;
      }
      setVoltageHistory((prev) => {
        console.log(`updateHistory from ${source}:`, newEntry, { key });
        //* Check for duplicates in history array
        const isDuplicate = prev.some(
          (entry) =>
            entry.id === newEntry.id &&
            entry.timestamp === newEntry.timestamp &&
            entry.voltage === newEntry.voltage
        );
        if (isDuplicate) {
          console.log("Duplicate detected in history, skipping:", newEntry);
          return prev;
        }
        processedUpdatesRef.current.add(key); //* Mark as processed
        return [...prev, newEntry].slice(-200); //* Keep last 200 entries
      });
    },
    []
  );

  const addAlert = useCallback((message: string) => {
    //* Add alert, limit to 3, auto-clear after 5s
    setAlerts((prev) => [message, ...prev.slice(0, 2)]);
    setTimeout(
      () => setAlerts((prev) => prev.filter((a) => a !== message)),
      5000
    );
  }, []);

  const handleUpdateVoltage = useCallback(
    (id: string, voltage: number) => {
      const clampedVoltage = Math.max(220, Math.min(239, voltage)); //* Clamp to safe range
      const timestamp = new Date().toISOString();
      const optimisticEntry = { id, voltage: clampedVoltage, timestamp };
      const optimisticKey = `${id}-${timestamp}-${clampedVoltage}`;

      updateVoltage({
        variables: { id, voltage: clampedVoltage },
        optimisticResponse: {
          updateVoltage: { ...optimisticEntry, __typename: "Grid" }, //* Optimistic UI update
        },
        update: (cache, { data }) => {
          const updatedEntry = data?.updateVoltage;
          if (!updatedEntry) return;
          const isOptimistic =
            updatedEntry.timestamp === optimisticEntry.timestamp;
          const serverKey = `${updatedEntry.id}-${updatedEntry.timestamp}-${updatedEntry.voltage}`;
          //* Update cache with new voltage
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
            //* Add to history only if not optimistic (server-confirmed)
            if (!isOptimistic)
              updateHistory(updatedEntry, "mutation", serverKey);
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
              const key = `${newNode.id}-${newNode.timestamp}-${newNode.voltage}`;
              updateHistory(newNode, "addNode", key);
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
      const { data } = await refetch({ fetchPolicy: "network-only" }); //* Force network fetch
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

  //* Memoized Computations - Optimize performance
  const filteredHistory = useMemo(() => {
    //* Filter history by time frame and selected nodes for VoltageChart
    //* Why: Prevents re-filtering on every render, only when dependencies change
    //* Where: Used by VoltageChart to display relevant data
    //* What: Returns subset of voltageHistory based on time and node selection
    const now = Date.now();
    const timeLimits = {
      "5m": 5 * 60 * 1000,
      "15m": 15 * 60 * 1000,
      all: Infinity,
    };
    const limit = timeLimits[timeFrame];
    return voltageHistory.filter(
      (entry) =>
        now - new Date(entry.timestamp).getTime() <= limit && //* Check time range
        selectedNodes.includes(entry.id) //* Check node selection
    );
  }, [voltageHistory, timeFrame, selectedNodes]);

  const renderedGrid = useMemo(() => {
    //* Render GridNode components only when grid data or updatedId changes
    //* Why: Avoids re-rendering all nodes unnecessarily
    //* Where: Used in the node list below
    //* What: Maps queryData.grid to GridNode components
    if (!queryData?.grid) return null;
    return queryData.grid.map((entry: GridEntry) => (
      <GridNode
        key={entry.id} //* Key ensures efficient DOM diffing
        entry={entry}
        updatedId={updatedId} //* Highlights recently updated node
        onUpdateVoltage={handleUpdateVoltage}
      />
    ));
  }, [queryData?.grid, updatedId, handleUpdateVoltage]);

  const toggleNode = useCallback((id: string) => {
    //* Toggle a node's selection for chart filtering
    //* Why: Memoized to prevent re-creation on every render
    //* Where: Called by checkbox onChange
    //* What: Adds/removes node ID from selectedNodes
    setSelectedNodes((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
    );
  }, []);

  //* Render - Define the UI structure
  //* Why: This is the visual output, updated by state changes
  //* Where: Root of the component, returned after hooks
  //* What: Combines header, alerts, filters, controls, chart, and node list
  if (queryLoading && !queryData) return <p>Loading grid data...</p>; //* Initial load state
  if (queryError) return <p>Error: {queryError.message}</p>; //* Query error state
  if (subError) return <p>Subscription Error: {subError.message}</p>; //* Subscription error state

  return (
    <div className={styles.container}>
      {/* Header */}
      <h1 className={styles.header}>Energy Grid Dashboard</h1>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className={styles.alerts}>
          {alerts.map((alert, idx) => (
            <p key={idx} className={styles.alert}>
              {alert}
            </p>
          ))}
          <button
            onClick={() => setAlerts([])}
            className={styles.alertClearButton}
          >
            Clear Alerts
          </button>
        </div>
      )}
      <p className={styles.subheader}>
        Real-time updates via GraphQL subscription (random node every 3s)
      </p>

      {/* Filter Sections */}
      <div className={styles.filterSection}>
        <label className={styles.filterLabel}>Time Frame: </label>
        <select
          value={timeFrame}
          onChange={(e) => setTimeFrame(e.target.value as "5m" | "15m" | "all")}
        >
          <option value="5m">Last 5 Minutes</option>
          <option value="15m">Last 15 Minutes</option>
          <option value="all">All Data</option>
        </select>
      </div>
      <div className={styles.filterSection}>
        <label className={styles.filterLabel}>Nodes: </label>
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

      {/* Components */}
      <ControlPanel
        paused={paused}
        onTogglePause={() => setPaused(!paused)}
        onRefresh={handleRefresh}
        onAddNode={handleAddNode}
        onDeleteNode={handleDeleteNode}
        loading={queryLoading || isRefreshing} //* Show loading during fetch/refresh
        mutationLoading={mutationLoading}
        nodes={queryData?.grid || []}
      />
      <VoltageChart history={filteredHistory} />
      <ul className={styles.nodeList}>{renderedGrid}</ul>
    </div>
  );
}

export default App;
