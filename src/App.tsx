import { useQuery, gql } from "@apollo/client";

//* Define a GraphQL query
const GET_POSTS = gql`
  query GetPosts {
    posts {
      data {
        id
        title
      }
    }
  }
`;

function App() {
  //* useQuery as a friendly librarian working in a local branch library (your App component).
  //* This librarian doesn’t own the books or manage the storage—that’s HQ’s job.
  //* Instead, the librarian knows how to request specific books (queries) from headquarters and
  //* deliver them to readers (your UI).
  const { loading, error, data } = useQuery(GET_POSTS);
  //* Why in App.tsx? You place useQuery in App.tsx (or any component) because that’s where you need
  //* the data—like a branch library serving its local readers.
  //* Each component can have its own librarian (useQuery) asking for different books (queries or subscriptions) tailored to its needs.

  //* When useQuery runs, it sends a request to the ApolloClient (HQ)
  //* with the GET_POSTS query. The client fetches the data from the server (or cache) and
  //* hands it back to useQuery, which then gives you loading, error, and data states to work with.
  //* It’s a local worker relying on the central system.
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1>Energy Grid Mock</h1>
      <ul>
        {data?.posts?.data.map((post: { id: string; title: string }) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
