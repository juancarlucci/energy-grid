import React from "react";
import ReactDOM from "react-dom/client";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  HttpLink,
  split,
} from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";
import App from "./App.tsx";
import "./index.css";

//* HTTP link: Like a delivery truck fetching books (query data) from GraphQLZero’s warehouse
const httpLink = new HttpLink({
  uri: "https://graphqlzero.almansi.me/api",
});
// WebSocket link for subscriptions (local mock server)

//* WebSocket linkfor subscriptions (local mock server):
//* A live courier service delivering real-time book updates (subscriptions) from our local library server
const wsLink = new WebSocketLink({
  uri: "ws://localhost:4000/graphql",
  options: { reconnect: true }, //* Keeps the courier coming back if the line drops
});

//* Split traffic: subscriptions via WS, queries via HTTP
//* The library clerk deciding whether to use the truck (HTTP) for regular books or the courier (WS) for live updates
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLink
);

//* ApolloClient: The library headquarters managing book storage (cache) and deliveries (links)
const client = new ApolloClient({
  link: splitLink, // Routes requests to the right delivery service
  cache: new InMemoryCache(), // Stores books in the local branch’s shelves
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      {/* Delivers the library services to all branch components */}
      <App />
    </ApolloProvider>
  </React.StrictMode>
);
