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

// HTTP link for queries (GraphQLZero)
const httpLink = new HttpLink({
  uri: "https://graphqlzero.almansi.me/api",
});

// WebSocket link for subscriptions (local mock server)
const wsLink = new WebSocketLink({
  uri: "ws://localhost:4000/graphql",
  options: { reconnect: true },
});

// Split traffic: subscriptions via WS, queries via HTTP
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

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
);
