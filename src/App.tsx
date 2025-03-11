import { useQuery, gql } from "@apollo/client";

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
  const { loading, error, data, refetch } = useQuery(GET_GRID_DATA, {
    pollInterval: 5000, //* Simulate real-time updates by polling every 5 seconds
  });

  if (loading) return <p>Loading grid data...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1>Energy Grid Dashboard</h1>
      <p>Simulated real-time updates every 5 seconds</p>
      <button onClick={() => refetch()}>Refresh Now</button>
      <ul>
        {data?.posts?.data.map((entry: { id: string; title: string }) => (
          <li key={entry.id}>
            Voltage: {entry.title} (ID: {entry.id})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
