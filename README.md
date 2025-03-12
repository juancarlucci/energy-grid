# Energy Grid Dashboard

Welcome to the **Energy Grid Dashboard**, a React-based web application that simulates real-time monitoring of an energy grid using GraphQL queries and subscriptions. Built with Apollo Client, this project fetches mock static data from GraphQLZero and delivers live voltage updates via a local WebSocket server—perfect for demonstrating modern front-end development skills in a professional yet approachable way.

## Overview

This app mimics a utility dashboard for tracking grid metrics (e.g., voltage) across multiple nodes. It combines historical data with live updates, offering a seamless user experience powered by Apollo Client’s caching and subscription features. Think of it as a small-town library system: static data is like books fetched from a distant warehouse, while real-time updates arrive via a trusty courier from a local publishing house.

### Features

- **Static Data Fetching:** Pulls initial grid data (mocked as "posts") from GraphQLZero via GraphQL queries.
- **Real-Time Updates:** Subscribes to a local WebSocket server for live voltage updates on `id: "1"`, refreshing every 3 seconds.
- **Visual Feedback:** Highlights updated entries with a brief green flash for clarity.
- **Optimized Rendering:** Uses `useMemo` to ensure efficient UI updates without unnecessary re-renders.

## Getting Started

### Prerequisites

- Node.js (v20.9.0 recommended)
- npm (v10.1.0 or compatible)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/energy-grid.git
   cd energy-grid
   ```

Install dependencies:

npm install

Start the WebSocket server:

npm run server

In a separate terminal, launch the app:
npm run dev

Open your browser to http://localhost:5173 to see the dashboard in action.

## How It Works: The Library Analogy

Imagine this app as a bustling library ecosystem managing energy grid "books" (data). Here’s how the pieces fit together:
Apollo Client: The Library Headquarters
Role: Apollo Client is the central hub—like the library headquarters (HQ)—set up in main.tsx. It manages all data (books), connects to external sources (GraphQL servers), and organizes them in a storage room (the InMemoryCache).

Why in main.tsx? It’s the app’s entry point—the town’s only HQ. Initialized here with ApolloProvider, it ensures every component (branch library) has a library card to access data. One HQ serves all, keeping the cache shared and efficient.

Behind the Scenes: Configured with an HTTP link (GraphQLZero) for queries and a WebSocket link (ws://localhost:4000/graphql) for subscriptions, it’s the backbone fetching and storing grid data in RAM for quick access.

#### useQuery: The Branch Librarian

Role: In App.tsx, useQuery acts as a friendly librarian at a local branch. It doesn’t own the books—that’s HQ’s job—but requests specific titles (e.g., GET_GRID_DATA) from Apollo Client and delivers them to the UI (readers).

Why in App.tsx? This is where the data is needed—like a branch serving its readers. Each component can have its own librarian tailored to its needs, fetching static grid data here while subscriptions handle live updates.

Flow: useQuery asks HQ for initial data, which Apollo fetches from GraphQLZero, caches, and returns as loading, error, or data states.

#### useSubscription: The Live Courier

Role: Also in App.tsx, useSubscription is like a courier delivering real-time updates (e.g., GRID_SUBSCRIPTION) from the local WebSocket server at server.cjs.

How It Works: It listens for gridUpdate events, updating only id: "1" in the liveData state every 3 seconds, with a green flash to highlight the change.

Why Here? Paired with useQuery, it keeps the branch current with live grid readings alongside static ones.

#### The Cache: The Storage Room

Role: The InMemoryCache in Apollo Client is the storage room in RAM, holding grid data (e.g., Grid:1, Grid:2) for fast retrieval.

Normalization: Data is split into objects by ID (e.g., Post:1, Post:2) with query keys (e.g., Query.GetGridData) acting like catalog cards pointing to them. This avoids duplicates and speeds up access.

In Action: Initial query data is cached, and subscription updates for id: "1" refresh the cache, keeping the UI in sync without redundant server calls.

#### WebSocket Server: The Local Publishing House

Role: Defined in server.cjs, this is an independent publishing house—not part of HQ—producing and delivering real-time grid updates via subscriptions-transport-ws. Running locally at ws://localhost:4000/graphql, it sends new voltage readings for id: "1" every 3 seconds to HQ’s courier line (WebSocket link), keeping the dashboard current.

#### GraphQLZero: The Remote Warehouse

Role: A distant supplier of static books (initial grid data), accessed via HQ’s delivery truck (HTTP link).

### Project Structure

src/main.tsx: Sets up Apollo Client (HQ) with HTTP and WebSocket links, wrapping the app in ApolloProvider.

src/App.tsx: Hosts useQuery and useSubscription to fetch and display grid data, with UI optimization via useMemo.

server.cjs: Runs a WebSocket server at ws://localhost:4000/graphql for subscription updates.

package.json: Defines scripts (dev, server) and dependencies (@apollo/client, graphql, subscriptions-transport-ws, ws).

### Technical Highlights

GraphQL Queries: Fetch static data from GraphQLZero (https://graphqlzero.almansi.me/api).

Subscriptions: Deliver real-time updates via WebSocket using subscriptions-transport-ws.

State Management: Combines query and subscription data in liveData, updated efficiently with useEffect.

Performance: useMemo optimizes rendering, and the cache minimizes network requests.

### Why This Matters

This project showcases a modern front-end stack:
Real-Time Data: Demonstrates GraphQL subscriptions for live updates, a key skill for dynamic apps.

Caching: Highlights Apollo’s efficiency in managing data, critical for scalable dashboards.

UI Feedback: Adds a professional touch with visual cues, showing attention to user experience.
