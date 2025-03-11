import { useQuery, gql } from "@apollo/client";

// Define a GraphQL query
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
  const { loading, error, data } = useQuery(GET_POSTS);

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
