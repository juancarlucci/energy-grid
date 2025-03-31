import { useState, useEffect, useCallback, useMemo } from "react";
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

function App() {
  const [voltageHistory, setVoltageHistory] = useState<GridEntry[]>([]);
  const [timeFrame, setTimeFrame] = useState<string>("Last 5 min");
  const [updatedId, setUpdatedId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mutationLoading, setMutationLoading] = useState<{
    add?: boolean;
    delete?: boolean;
  }>({});

  const {
    data: queryData,
    loading,
    refetch,
  } = useQuery(GET_GRID_DATA, {
    fetchPolicy: "cache-and-network",
  });
  const { data: subData } = useSubscription(GRID_SUBSCRIPTION, {
    skip: isPaused,
  });
  const [updateVoltage] = useMutation(UPDATE_VOLTAGE);
  const [addNode] = useMutation(ADD_NODE);
  const [deleteNode] = useMutation(DELETE_NODE);

  useEffect(() => {
    if (queryData?.grid) {
      setVoltageHistory((prev) => {
        const serverIds = new Set(
          queryData.grid.map((entry: GridEntry) => entry.id)
        );
        const filtered = prev.filter((entry) => serverIds.has(entry.id));
        return [...filtered, ...queryData.grid].slice(-200);
      });
    }
  }, [queryData]);

  useEffect(() => {
    if (subData?.gridUpdate && !isPaused) {
      const { id, voltage, timestamp } = subData.gridUpdate;
      console.log("Subscription update:", subData.gridUpdate);
      if (voltage < 223 || voltage > 237) {
        addAlert(`Node ${id} voltage ${voltage}V out of safe range!`);
      }
      setUpdatedId(id);
      setTimeout(() => setUpdatedId(null), 500);
      setVoltageHistory((prev) => {
        const index = prev.findIndex(
          (entry) => entry.id === id && entry.timestamp === timestamp
        );
        if (index === -1)
          return [...prev, { id, voltage, timestamp }].slice(-200);
        return prev;
      });
    }
  }, [subData, isPaused]);

  const addAlert = useCallback((message: string) => {
    setAlerts((prev) => [...prev, message].slice(-5));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const handleUpdateVoltage = useCallback(
    (id: string, voltage: number) => {
      updateVoltage({
        variables: { id, voltage },
        optimisticResponse: {
          updateVoltage: {
            id,
            voltage,
            timestamp: new Date().toISOString(),
            __typename: "Grid",
          },
        },
        update: (cache, { data }) => {
          const updatedEntry = data?.updateVoltage;
          if (updatedEntry) updateGridCache(cache, updatedEntry, "update");
        },
      })
        .then(({ data }) => {
          if (data?.updateVoltage) {
            const { id, voltage, timestamp } = data.updateVoltage;
            setUpdatedId(id);
            setTimeout(() => setUpdatedId(null), 500);
            setVoltageHistory((prev) => {
              const index = prev.findIndex(
                (entry) => entry.id === id && entry.timestamp === timestamp
              );
              if (index === -1)
                return [...prev, { id, voltage, timestamp }].slice(-200);
              return prev;
            });
          }
        })
        .catch((error) =>
          addAlert(`Failed to update Node ${id}: ${error.message}`)
        );
    },
    [updateVoltage, addAlert]
  );

  const handleAddNode = useCallback(
    (id: string) => {
      setMutationLoading((prev) => ({ ...prev, add: true }));
      addNode({
        variables: { id },
        update: (cache, { data }) => {
          if (data?.addNode) updateGridCache(cache, data.addNode, "add");
        },
      })
        .then(({ data }) => {
          if (data?.addNode) {
            const { id, voltage, timestamp } = data.addNode;
            setVoltageHistory((prev) =>
              [...prev, { id, voltage, timestamp }].slice(-200)
            );
          }
        })
        .catch((error) =>
          addAlert(`Failed to add Node ${id}: ${error.message}`)
        )
        .finally(() => setMutationLoading((prev) => ({ ...prev, add: false })));
    },
    [addNode, addAlert]
  );

  const handleDeleteNode = useCallback(
    (id: string) => {
      setMutationLoading((prev) => ({ ...prev, delete: true }));
      deleteNode({
        variables: { id },
        update: (cache, { data }) => {
          const deletedNode = data?.deleteNode;
          if (deletedNode) {
            updateGridCache(cache, deletedNode, "delete");
            setVoltageHistory((prev) =>
              prev.filter((entry) => entry.id !== id)
            );
          }
        },
      })
        .then(() => setMutationLoading((prev) => ({ ...prev, delete: false })))
        .catch((error) => {
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
          const updatedHistory = [...prev];
          data.grid.forEach((newEntry: GridEntry) => {
            const index = updatedHistory.findIndex(
              (entry) => entry.id === newEntry.id
            );
            if (index !== -1) {
              updatedHistory[index] = newEntry;
            } else {
              updatedHistory.push(newEntry);
            }
          });
          return updatedHistory.slice(-200);
        });
      }
    } catch (error) {
      addAlert(`Refresh failed: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, addAlert]);

  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const filteredHistory = useMemo(() => {
    const now = Date.now();
    const limit = TIME_LIMITS[timeFrame];
    return voltageHistory.filter(
      (entry) => now - new Date(entry.timestamp).getTime() <= limit
    );
  }, [voltageHistory, timeFrame]);

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

  const renderContent = () => {
    if (loading && !queryData) {
      return <p className="text-gray-400">Loading grid data...</p>;
    }
    return (
      <>
        <div className="relative">
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
          {alerts.length > 0 && (
            <div className="absolute top-0 right-0 mt-2 mr-2 max-w-xs">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-semibold text-gray-200">Alerts</h3>
                <button
                  onClick={clearAlerts}
                  className="text-xs text-gray-400 hover:text-gray-200"
                >
                  Clear
                </button>
              </div>
              <ul className="space-y-1">
                {alerts.map((alert, index) => (
                  <li
                    key={index}
                    className="p-1 bg-red-500/20 text-red-400 text-sm rounded"
                  >
                    {alert}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="mb-6">
          <div className="flex gap-2 mb-4">
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
          </div>
          <VoltageChart history={filteredHistory} />
        </div>
        <ul className="space-y-3">{renderedGrid}</ul>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-6">
      <h1 className="text-3xl font-bold mb-6">Grid Voltage Monitor</h1>
      {renderContent()}
    </div>
  );
}

export default App;
