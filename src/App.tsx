import { useQuery, useSubscription, gql } from "@apollo/client";
import { useState, useEffect, useMemo } from "react";

//* Define a GraphQL query for static grid data (mocked as "posts" from GraphQLZero)
const GET_GRID_DATA = gql`
  query GetGridData {
    posts {
      data {
        id
        title # Mocking as "voltage"
      }
    }
  }
`;

//* Define a GraphQL subscription for real-time grid updates
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
      const initialData: GridEntry[] = queryData.posts.data.map(
        (post: { id: string; title: string }) => ({
          id: post.id,
          voltage: parseInt(post.title.slice(0, 3), 10) || 230, //* Fake voltage from title
          timestamp: new Date().toISOString(),
        })
      );
      setLiveData(initialData);
    }
    if (subData?.gridUpdate) {
      setLiveData((prev) => {
        const newEntry = subData.gridUpdate;
        const exists = prev.some((entry) => entry.id === newEntry.id);
        setUpdatedId(newEntry.id); //* Mark this ID for a visual flash
        setTimeout(() => setUpdatedId(null), 500); //* Clear highlight after 0.5s
        return exists
          ? prev.map((entry) => (entry.id === newEntry.id ? newEntry : entry)) //* Only update matching ID
          : [...prev, newEntry]; //* Add new entry if ID doesn’t exist
      });
    }
  }, [queryData, subData]);

  //* Optimize rendering with useMemo
  const renderedGrid = useMemo(() => {
    //* Prevents recomputation unless liveData changes; keys ensure stable DOM updates
    return liveData.map((entry) => (
      <li
        key={entry.id}
        style={{
          backgroundColor: entry.id === updatedId ? "#387938" : "transparent",
        }} //* Flash green on update
      >
        Voltage: {entry.voltage} V (ID: {entry.id}, Time: {entry.timestamp})
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
