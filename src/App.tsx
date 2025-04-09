import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useQuery, useMutation, useSubscription } from "@apollo/client";
import { GridEntry } from "./hooks/useGridData";
import { VoltageChart } from "./components/VoltageChart";
import { ControlPanel } from "./components/ControlPanel";
import { GridNode } from "./components/GridNode";
import {
  GET_GRID_DATA,
  UPDATE_VOLTAGE,
  ADD_NODE,
  DELETE_NODE,
  GRID_SUBSCRIPTION,
} from "./graphql/graphql";
import { updateGridCache } from "./utils/cacheUtils";

const TIME_LIMITS: Record<string, number> = {
  "All Data": Infinity,
  "Last 15 min": 15 * 60 * 1000,
  "Last 5 min": 5 * 60 * 1000,
};

//* App Component - Main application managing grid data and UI
function App() {
  const [voltageHistory, setVoltageHistory] = useState<GridEntry[]>([]); //* e.g., [{ id: "1", voltage: 237, timestamp: "2025-03-29T10:00:00Z" }, ...]
  const [timeFrame, setTimeFrame] = useState<string>("Last 5 min");
  const [updatedId, setUpdatedId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Record<string, string | null>>({}); //* e.g., { "1": "Node 1 voltage 240V out of safe range!", "2": null }
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mutationLoading, setMutationLoading] = useState<{
    add?: boolean;
    delete?: boolean;
  }>({});
  const [hiddenNodes, setHiddenNodes] = useState<Set<string>>(new Set());

  //* Apollo Hooks - Fetch and manage grid data
  const {
    data: queryData,
    loading,
    refetch,
  } = useQuery(GET_GRID_DATA, {
    fetchPolicy: "cache-and-network", //* Use cache first, then network
  }); //* queryData e.g., { grid: [{ id: "1", voltage: 237, timestamp: "2025-03-29T10:00:00Z" }, ...] }
  const { data: subData } = useSubscription(GRID_SUBSCRIPTION, {
    skip: isPaused,
  }); //* subData e.g., { gridUpdate: { id: "1", voltage: 238, timestamp: "2025-03-29T10:00:03Z" } }
  const [updateVoltage] = useMutation(UPDATE_VOLTAGE);
  const [addNode] = useMutation(ADD_NODE);
  const [deleteNode] = useMutation(DELETE_NODE);

  //* Effect - Merge initial grid data into history
  useEffect(() => {
    if (queryData?.grid) {
      setVoltageHistory((prev) => {
        const serverIds = new Set(
          queryData.grid.map((entry: GridEntry) => entry.id)
        ); //* e.g., Set(["1", "2", "3"])
        const filtered = prev.filter((entry) => serverIds.has(entry.id)); //* e.g., [{ id: "1", ... }]
        return [...filtered, ...queryData.grid].slice(-200); //* e.g., capped at 200 entries
      });
    }
  }, [queryData]);

  const addAlert = useCallback((nodeId: string, message: string | null) => {
    setAlerts((prev) => ({ ...prev, [nodeId]: message })); //* e.g., { "1": "Node 1 voltage 240V out of safe range!" }
  }, []);
  //* Effect - Handle real-time subscription updates
  useEffect(() => {
    if (subData?.gridUpdate && !isPaused) {
      const { id, voltage, timestamp } = subData.gridUpdate; //* e.g., { id: "1", voltage: 238, timestamp: "2025-03-29T10:00:03Z" }
      console.log("Subscription update:", subData.gridUpdate);
      if (voltage < 223 || voltage > 237) {
        addAlert(id, `Node ${id} voltage ${voltage}V out of safe range!`);
      } else {
        addAlert(id, null); //* Clear alert if voltage is safe
      }
      setUpdatedId(id);
      setTimeout(() => setUpdatedId(null), 500);
      setVoltageHistory((prev) => {
        const index = prev.findIndex(
          (entry) => entry.id === id && entry.timestamp === timestamp
        );
        if (index === -1)
          return [...prev, { id, voltage, timestamp }].slice(-200); //* e.g., add new entry
        return prev; //* No change if duplicate
      });
    }
  }, [subData, isPaused, addAlert]);

  //* Callback - Handle legend click to toggle node visibility
  const handleLegendClick = useCallback((nodeId: string) => {
    setHiddenNodes((prev) => {
      const newHidden = new Set(prev);
      if (newHidden.has(nodeId)) {
        newHidden.delete(nodeId); // e.g., show "1"
      } else {
        newHidden.add(nodeId); // e.g., hide "1"
      }
      return newHidden;
    });
  }, []);

  //* Callback - Update voltage for a node
  const handleUpdateVoltage = useCallback(
    (id: string, voltage: number) => {
      updateVoltage({
        variables: { id, voltage },
        optimisticResponse: {
          updateVoltage: {
            id,
            voltage,
            timestamp: new Date().toISOString(), //* e.g., "2025-03-29T10:00:06Z"
            __typename: "Grid",
          },
        },
        update: (cache, { data }) => {
          const updatedEntry = data?.updateVoltage; //* e.g., { id: "1", voltage: 225, timestamp: "2025-03-29T10:00:06Z" }
          if (updatedEntry) updateGridCache(cache, updatedEntry, "update"); //* Update Apollo cache
        },
      })
        .then(({ data }) => {
          if (data?.updateVoltage) {
            const { id, voltage, timestamp } = data.updateVoltage; //* e.g., { id: "1", voltage: 225, timestamp: "2025-03-29T10:00:06Z" }
            setUpdatedId(id);
            setTimeout(() => setUpdatedId(null), 500);
            setVoltageHistory((prev) => {
              const index = prev.findIndex(
                (entry) => entry.id === id && entry.timestamp === timestamp
              );
              if (index === -1)
                return [...prev, { id, voltage, timestamp }].slice(-200); //* e.g., add new entry
              return prev; //* No change if duplicate
            });
            if (voltage < 223 || voltage > 237) {
              addAlert(id, `Node ${id} voltage ${voltage}V out of safe range!`);
            } else {
              addAlert(id, null); //* Clear alert if voltage is safe
            }
          }
        })
        .catch((error) =>
          addAlert(id, `Failed to update Node ${id}: ${error.message}`)
        );
    },
    [updateVoltage, addAlert]
  );

  //* Callback - Add a new node to the grid
  const handleAddNode = useCallback(
    (id: string) => {
      setMutationLoading((prev) => ({ ...prev, add: true }));
      addNode({
        variables: { id },
        update: (cache, { data }) => {
          if (data?.addNode) updateGridCache(cache, data.addNode, "add"); //* Update Apollo cache with new node
        },
      })
        .then(({ data }) => {
          if (data?.addNode) {
            const { id, voltage, timestamp } = data.addNode; //* e.g., { id: "4", voltage: 230, timestamp: "2025-03-29T10:00:09Z" }
            setVoltageHistory((prev) =>
              [...prev, { id, voltage, timestamp }].slice(-200)
            );
            addAlert(id, null); //* Initialize with no alert
          }
        })
        .catch((error) =>
          addAlert(id, `Failed to add Node ${id}: ${error.message}`)
        )
        .finally(() => setMutationLoading((prev) => ({ ...prev, add: false })));
    },
    [addNode, addAlert]
  );

  //* Callback - Delete a node from the grid
  const handleDeleteNode = useCallback(
    (id: string) => {
      setMutationLoading((prev) => ({ ...prev, delete: true }));
      deleteNode({
        variables: { id },
        update: (cache, { data }) => {
          const deletedNode = data?.deleteNode;
          if (deletedNode) {
            updateGridCache(cache, deletedNode, "delete"); //* Update Apollo cache
            setVoltageHistory(
              (prev) => prev.filter((entry) => entry.id !== id) //* e.g., remove entries with id "4"
            );
            setAlerts((prev) => {
              const newAlerts = { ...prev };
              delete newAlerts[id]; //* Remove alert for deleted node
              return newAlerts;
            });
          }
        },
      })
        .then(() => setMutationLoading((prev) => ({ ...prev, delete: false })))
        .catch((error) => {
          addAlert(id, `Failed to delete Node ${id}: ${error.message}`);
          setMutationLoading((prev) => ({ ...prev, delete: false }));
        });
    },
    [deleteNode, addAlert]
  );

  //* Callback - Refresh grid data from server
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { data } = await refetch({ fetchPolicy: "network-only" }); //* Force network fetch
      if (data?.grid) {
        setVoltageHistory((prev) => {
          const updatedHistory = [...prev]; //* e.g., [{ id: "1", ... }, ...]
          data.grid.forEach((newEntry: GridEntry) => {
            const index = updatedHistory.findIndex(
              (entry) => entry.id === newEntry.id
            );
            if (index !== -1) {
              updatedHistory[index] = newEntry; //* e.g., update existing entry
            } else {
              updatedHistory.push(newEntry);
            }
          });
          return updatedHistory.slice(-200);
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Refresh failed: ${error.message}`);
      } else {
        console.error("Refresh failed with an unknown error.");
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  //* Callback - Toggle pause state for subscription
  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev); // e.g., true -> false
  }, []);

  //* Computed - Filter history based on selected time frame only (no hidden nodes filter)
  const filteredHistory = useMemo(() => {
    const now = Date.now(); // e.g., 1711792800000
    const limit = TIME_LIMITS[timeFrame]; // e.g., 300000 for "Last 5 min"
    return voltageHistory.filter(
      (entry) => now - new Date(entry.timestamp).getTime() <= limit // e.g., keep entries within 5 min
    );
  }, [voltageHistory, timeFrame]);

  //* Computed - Render list of grid nodes with delete and alerts
  const renderedGrid = useMemo(() => {
    if (!queryData?.grid) return null;
    return queryData.grid.map((entry: GridEntry) => (
      <Suspense key={entry.id} fallback={<li>Loading node...</li>}>
        <GridNode
          entry={entry}
          updatedId={updatedId}
          onUpdateVoltage={handleUpdateVoltage}
          onDeleteNode={handleDeleteNode}
          alert={alerts[entry.id] || null}
        />
      </Suspense>
    ));
  }, [
    queryData?.grid,
    updatedId,
    handleUpdateVoltage,
    handleDeleteNode,
    alerts,
  ]);

  //* Render Function - Conditionally display content
  const renderContent = () => {
    if (loading && !queryData) {
      return <p className="text-gray-400">Loading grid data...</p>;
    }
    return (
      <Suspense
        fallback={<div className="text-gray-400">Loading components...</div>}
      >
        <ControlPanel
          paused={isPaused}
          onTogglePause={handleTogglePause}
          onRefresh={handleRefresh}
          onAddNode={handleAddNode}
          onDeleteNode={handleDeleteNode}
          loading={isRefreshing}
          mutationLoading={mutationLoading}
          nodes={queryData?.grid || []}
        />
        <div className="mb-6">
          {/* <div className="flex gap-2 mb-4">
            {Object.keys(TIME_LIMITS).map((frame) => (
              <button
                key={frame}
                onClick={() => setTimeFrame(frame)}
                className={`px-3 py-1 rounded ${
                  timeFrame === frame
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                }`}
              >
                {frame}
              </button>
            ))}
          </div> */}
          <VoltageChart
            history={filteredHistory}
            onLegendClick={handleLegendClick}
            hiddenNodes={hiddenNodes}
          />
        </div>

        <ul className="max-w-[1180px] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(276px,1fr))] gap-4">
          {renderedGrid}
        </ul>
      </Suspense>
    );
  };

  return (
    <main
      className="min-h-screen bg-gray-900 text-gray-200 p-4 sm:p-6"
      role="main"
    >
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
          Grid Voltage Monitor
        </h1>
      </header>
      {renderContent()}
    </main>
  );
}

export default App;
