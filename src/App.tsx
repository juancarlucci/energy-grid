import { useQuery, useSubscription, gql } from "@apollo/client";
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

// Mock grid data type
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

  const { data: subData, error: subError } = useSubscription(GRID_SUBSCRIPTION);
  const [liveData, setLiveData] = useState<GridEntry[]>([]);
  const [updatedId, setUpdatedId] = useState<string | null>(null); //* Track last updated ID for highlight

  //* Combine initial query data with subscription updates
  useEffect(() => {
    if (queryData) {
      const initialData: GridEntry[] = queryData.grid; //* Now directly from local server
      setLiveData(initialData);
    }
    if (subData?.gridUpdate) {
      //* checks if a new book arrived from the subscription.
      setLiveData((prev) => {
        //* updates the branch’s display shelf (liveData):
        //*If id: "1" exists, it replaces that entry with the new book.
        //* If not (unlikely here), it adds it.
        const newEntry = subData.gridUpdate; //* extracts the book’s contents ({ id: "1", voltage: 232, timestamp: "..." }).
        const exists = prev.some((entry) => entry.id === newEntry.id);
        setUpdatedId(newEntry.id); //* Mark this ID for a visual flash
        setTimeout(() => setUpdatedId(null), 500); //* Clear highlight after 0.5s
        return exists
          ? prev.map((entry) => (entry.id === newEntry.id ? newEntry : entry)) //* Only update matching ID
          : [...prev, newEntry]; //* Add new entry if ID doesn’t exist
      });
    }
  }, [queryData, subData]);

  //* Format timestamp for readability
  const formatTimestamp = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

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
