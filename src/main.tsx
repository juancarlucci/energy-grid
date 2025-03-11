import React from "react";
import ReactDOM from "react-dom/client";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  HttpLink,
} from "@apollo/client";
import App from "./App.tsx";
import "./index.css";

//* Why in main.tsx? This is the entry point of your app—like the town’s only library HQ.
//* You set it up here because it needs to be established once, at the top level, and
//* made available to every part of the app (every component) via ApolloProvider.
//* Putting it in main.tsx ensures it’s ready before any “readers” (components) start asking for books (data).

//* Initialize Apollo Client
//* ApolloClient as the central library headquarters.
//* It’s the hub that manages all the books (data),
//* knows where to get them (the GraphQL server), and keeps them organized in storage (the cache).
//* Central vs. Local: ApolloClient is the global brain (in main.tsx),
//* while useQuery is the local hands (in App.tsx, or any component).
const client = new ApolloClient({
  link: new HttpLink({
    uri: "https://graphqlzero.almansi.me/api", // Mock GraphQL API
  }),
  //* main.tsx sets up new InMemoryCache(). This creates a JavaScript object in the browser’s memory, managed by Apollo.
  //* When useQuery fetches GET_POSTS, the response (e.g., posts with IDs and titles) gets stored in this object,
  //* not on your MacBook’s SSD or an external server.
  cache: new InMemoryCache(),
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* main.tsx builds the library (ApolloClient) and gives every branch a library card (ApolloProvider). */}
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
);
