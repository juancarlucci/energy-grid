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
  } = useQuery(GET_GRID_DATA, {
    fetchPolicy: "cache-and-network", //* Use cache first, then update with network
  });
  const [updateVoltage] = useMutation(UPDATE_VOLTAGE);
  const { data: subData, error: subError } = useSubscription(GRID_SUBSCRIPTION);
  // const [liveData, setLiveData] = useState<GridEntry[]>([]);
  const [updatedId, setUpdatedId] = useState<string | null>(null); //* Track last updated ID for highlight

  //* Combine query and subscription data via cache
  const liveData = useMemo(() => {
    if (!queryData?.grid) return [];
    const grid = [...queryData.grid];
    if (subData?.gridUpdate) {
      const subEntry = subData.gridUpdate;
      const index = grid.findIndex((entry) => entry.id === subEntry.id);
      if (index !== -1) grid[index] = subEntry;
      else grid.push(subEntry);
    }
    return grid;
  }, [queryData, subData]);

  //* Highlight subscription updates
  useEffect(() => {
    if (subData?.gridUpdate) {
      setUpdatedId(subData.gridUpdate.id);
      setTimeout(() => setUpdatedId(null), 500);
    }
  }, [subData]);

  // //* Combine initial query data with subscription updates
  // useEffect(() => {
  //   if (queryData) {
  //     const initialData: GridEntry[] = queryData.grid; //* Now directly from local server
  //     setLiveData(initialData);
  //   }
  //   if (subData?.gridUpdate) {
  //     //* checks if a new book arrived from the subscription.
  //     setLiveData((prev) => {
  //       //* updates the branch’s display shelf (liveData):
  //       //*If id: "1" exists, it replaces that entry with the new book.
  //       //* If not (unlikely here), it adds it.
  //       const newEntry = subData.gridUpdate; //* extracts the book’s contents ({ id: "1", voltage: 232, timestamp: "..." }).
  //       const exists = prev.some((entry) => entry.id === newEntry.id);
  //       setUpdatedId(newEntry.id); //* Mark this ID for a visual flash
  //       setTimeout(() => setUpdatedId(null), 500); //* Clear highlight after 0.5s
  //       return exists
  //         ? prev.map((entry) => (entry.id === newEntry.id ? newEntry : entry)) //* Only update matching ID
  //         : [...prev, newEntry]; //* Add new entry if ID doesn’t exist
  //     });
  //   }

  //   //* No return function here since there’s no ongoing process (like an interval) to stop.
  //   //* useSubscription handles its own cleanup via Apollo.
  // }, [queryData, subData]);

  //* Format timestamp for readability
  const formatTimestamp = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const handleUpdateVoltage = (id: string) => {
    const newVoltage = Math.floor(Math.random() * 20) + 220; // Random 220-239
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
        setUpdatedId(id);
        setTimeout(() => setUpdatedId(null), 500);
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
        {formatTimestamp(entry.timestamp)}){" "}
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
