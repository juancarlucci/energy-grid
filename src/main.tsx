import React from "react";
import ReactDOM from "react-dom/client";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";
import App from "./App";
import "../src/output.css"; //* please look at src/docs/tailwind-react.md

//* WebSocket link: A live courier service delivering real-time book updates (and static queries) from our local publishing house
const wsLink = new WebSocketLink({
  uri: "ws://localhost:4000/graphql",
  options: { reconnect: true }, // Keeps the courier coming back if the line drops
});

//* ApolloClient: The library headquarters managing book storage (cache) and deliveries (links)
const client = new ApolloClient({
  link: wsLink, //* Routes all requests via WebSocket to local server
  cache: new InMemoryCache(), //* Stores books in the local branch’s shelves
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      {/* Delivers the library services to all branch components 
       like handing out library cards.*/}
      <App />
    </ApolloProvider>
  </React.StrictMode>
);
