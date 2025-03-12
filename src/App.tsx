import { useQuery, gql, useApolloClient } from "@apollo/client";
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

// Mock grid data type (simulating what a real API might return)
type GridEntry = {
  id: string;
  voltage: number; // We'll fake this from "title"
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
  const { loading, error, data } = useQuery(GET_GRID_DATA, {
    // pollInterval: 5000, //* Simulate real-time updates by polling every 5 seconds
    fetchPolicy: "cache-and-network", //* Use cache first, then update with network
  });

  const client = useApolloClient(); //* Access ApolloClient for manual cache updates
  const [liveData, setLiveData] = useState<GridEntry[]>([]);

  //* Simulate real-time updates (since GraphQLZero lacks subscriptions)
  useEffect(() => {
    if (!data) return;

    //* Initial load from query
    const initialData: GridEntry[] = data.posts.data.map(
      (post: { id: string; title: string }) => ({
        id: post.id,
        voltage: parseInt(post.title.slice(0, 3), 10) || 230, //* Fake voltage from title
        timestamp: new Date().toISOString(),
      })
    );
    setLiveData(initialData);

    //* Simulate subscription with interval
    const interval = setInterval(() => {
      setLiveData((prev) =>
        //* Key Detail: setLiveData in useEffect creates a new array
        //* each time (via prev.map), so liveData’s reference changes every 3 seconds, triggering useMemo.
        //* But the JSX output is stable for unchanged items thanks to key={entry.id}.
        prev.map((entry) => ({
          ...entry,
          voltage: entry.voltage + Math.floor(Math.random() * 10) - 5, //* Random fluctuation
          timestamp: new Date().toISOString(),
        }))
      );
      //* Optional: Write to cache (simulating a subscription update)
      client.writeQuery({
        query: GET_GRID_DATA,
        data: {
          posts: {
            data: liveData.map((entry) => ({
              id: entry.id,
              title: `${entry.voltage}`, //* Back to string for mock API consistency
              __typename: "Post", //* Required for cache normalization
            })),
          },
        },
      });
    }, 3000); //* Update every 3 seconds

    return () => clearInterval(interval); //* Cleanup
  }, [data, client]);

  //* Optimize rendering with useMemo
  const renderedGrid = useMemo(() => {
    //* Does It Fully Prevent Re-Renders?
    //* No: useMemo doesn’t stop the component
    //* from re-rendering (e.g., when liveData updates).
    //* It prevents unnecessary recomputation of renderedGrid.
    //* React still diffs the Virtual DOM, but key={entry.id} ensures unchanged <li> elements don’t update in the real DOM.
    return liveData.map((entry) => (
      <li key={entry.id}>
        Voltage: {entry.voltage} V (ID: {entry.id}, Time: {entry.timestamp})
      </li>
    ));
  }, [liveData]);

  if (loading && !data) return <p>Loading grid data...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1>Energy Grid Dashboard</h1>
      <p>Simulated real-time updates every 3 seconds</p>
      <ul>{renderedGrid}</ul>
    </div>
  );
}

export default App;
