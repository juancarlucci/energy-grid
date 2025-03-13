import { useQuery, useMutation, useSubscription, gql } from "@apollo/client";
import { useState, useEffect, useMemo } from "react";

//* Define a GraphQL query for static grid data from local server
const GET_GRID_DATA = gql`
  query GetGridData {
    grid {
      id
      voltage
      timestamp
    }
  }
`;

//* Define a GraphQL subscription for real-time grid updates
//* Library Analogy: The branch fills out a standing order form:
//* “Send me every new edition of the ‘Grid Update’ book with ID, voltage, and timestamp chapters.”
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

//* Mock grid data type
type GridEntry = {
  id: string;
  voltage: number;
  timestamp: string;
};

function App() {
  //* useQuery as a friendly librarian working in a local branch library (your App component).
  //* This librarian doesn’t own the books or manage the storage—that’s HQ’s job.
  //* Instead, the librarian knows how to request specific books (queries) from headquarters and
  //* deliver them to readers (your UI).
  //* Why in App.tsx? You place useQuery in App.tsx (or any component) because that’s where you need
  //* the data—like a branch library serving its local readers.
  //* Each component can have its own librarian (useQuery) asking for different books (queries or subscriptions) tailored to its needs.
  //* When useQuery runs, it sends a request to the ApolloClient (HQ)
  //* with the GET_GRID_DATA query. The client fetches the data from the server (or cache) and
  //* hands it back to useQuery, which then gives you loading, error, and data states to work with.
  //* It’s a local worker relying on the central system.
  const {
    loading: queryLoading,
    error: queryError,
    data: queryData,
    refetch,
  } = useQuery(GET_GRID_DATA, {
    fetchPolicy: "cache-and-network", //* Use cache first, then update with network
  });
  const [updateVoltage] = useMutation(UPDATE_VOLTAGE);
  const { data: subData, error: subError } = useSubscription(GRID_SUBSCRIPTION);
  const [updatedId, setUpdatedId] = useState<string | null>(null); //* Track last updated ID for highlight
  const [lastMutation, setLastMutation] = useState<GridEntry | null>(null); //* Track latest mutation

  //* Combine query, subscription, and mutation data
  const liveData = useMemo(() => {
    if (!queryData?.grid) return [];
    const grid = [...queryData.grid];

    //* Apply last mutation first (takes precedence)
    if (lastMutation) {
      const index = grid.findIndex((entry) => entry.id === lastMutation.id);
      if (index !== -1) grid[index] = lastMutation;
      else grid.push(lastMutation);
    }

    //* Then apply subscription data (if not overridden by mutation)
    if (
      subData?.gridUpdate &&
      (!lastMutation || subData.gridUpdate.timestamp > lastMutation.timestamp)
    ) {
      const subEntry = subData.gridUpdate;
      const index = grid.findIndex((entry) => entry.id === subEntry.id);
      if (index !== -1) grid[index] = subEntry;
      else grid.push(subEntry);
    }
    return grid;
  }, [queryData, subData, lastMutation]);

  //* Highlight subscription updates
  useEffect(() => {
    if (subData?.gridUpdate) {
      setUpdatedId(subData.gridUpdate.id);
      setTimeout(() => setUpdatedId(null), 500);
    }
  }, [subData]);

  //* Format timestamp for readability
  const formatTimestamp = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const handleUpdateVoltage = (id: string) => {
    const newVoltage = Math.floor(Math.random() * 20) + 220; // Random 220-239
    const optimisticEntry = {
      id,
      voltage: newVoltage,
      timestamp: new Date().toISOString(),
    };
    updateVoltage({
      variables: { id, voltage: newVoltage },
      optimisticResponse: {
        updateVoltage: {
          id,
          voltage: newVoltage,
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
        setLastMutation(optimisticEntry); // Store mutation locally
        setUpdatedId(id);
        setTimeout(() => setUpdatedId(null), 500);
        refetch(); //* Force query refresh
      })
      .catch((error) => console.error("Mutation error:", error));
  };

  //* Optimize rendering with useMemo
  const renderedGrid = useMemo(() => {
    //* Prevents recomputation unless liveData changes; keys ensure stable DOM updates
    return liveData.map((entry) => (
      <li
        key={entry.id}
        style={{
          backgroundColor: entry.id === updatedId ? "#328232" : "transparent",
        }} //* Flash green on update
      >
        Voltage: {entry.voltage} V (ID: {entry.id}, Time:{" "}
        {formatTimestamp(entry.timestamp)})
        <button onClick={() => handleUpdateVoltage(entry.id)}>
          Update Voltage
        </button>
      </li>
    ));
  }, [liveData, updatedId]);

  if (queryLoading && !queryData) return <p>Loading grid data...</p>;
  if (queryError) return <p>Error: {queryError.message}</p>;
  if (subError) return <p>Subscription Error: {subError.message}</p>;

  return (
    <div>
      <h1>Energy Grid Dashboard</h1>
      <p>Real-time updates via GraphQL subscription (ID 1 updates every 3s)</p>
      <ul>{renderedGrid}</ul>
    </div>
  );
}

export default App;
