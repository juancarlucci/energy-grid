import { useQuery, useMutation, useSubscription, gql } from "@apollo/client";
import { useState, useEffect, useMemo } from "react";
import { GridNode } from "./components/GridNode";
import { ControlPanel } from "./components/ControlPanel";

// GraphQL Definitions
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

export type GridEntry = {
  id: string;
  voltage: number;
  timestamp: string;
};

function App() {
  const {
    loading: queryLoading,
    error: queryError,
    data: queryData,
    refetch,
  } = useQuery(GET_GRID_DATA, { fetchPolicy: "cache-and-network" });
  const [updateVoltage] = useMutation(UPDATE_VOLTAGE);
  const [paused, setPaused] = useState(false);
  const { data: subData, error: subError } = useSubscription(
    GRID_SUBSCRIPTION,
    {
      skip: paused,
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
        }
      },
    }
  );
  const [updatedId, setUpdatedId] = useState<string | null>(null);

  // Highlight updates
  useEffect(() => {
    if (subData?.gridUpdate) {
      setUpdatedId(subData.gridUpdate.id);
      setTimeout(() => setUpdatedId(null), 500);
    }
  }, [subData]);

  const handleUpdateVoltage = (id: string, voltage: number) => {
    const clampedVoltage = Math.max(220, Math.min(239, voltage)); // Enforce 220-239 range
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
          }
        }
      },
    })
      .then(() => {
        setUpdatedId(id);
        setTimeout(() => setUpdatedId(null), 500);
      })
      .catch((error) => console.error("Mutation error:", error));
  };

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
  }, [queryData, updatedId]);

  if (queryLoading && !queryData) return <p>Loading grid data...</p>;
  if (queryError) return <p>Error: {queryError.message}</p>;
  if (subError) return <p>Subscription Error: {subError.message}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Energy Grid Dashboard</h1>
      <p>Real-time updates via GraphQL subscription (ID 1 updates every 3s)</p>
      <ControlPanel
        paused={paused}
        onTogglePause={() => setPaused(!paused)}
        onRefresh={refetch}
        loading={queryLoading}
      />
      <ul style={{ listStyle: "none", padding: 0 }}>{renderedGrid}</ul>
    </div>
  );
}

export default App;
