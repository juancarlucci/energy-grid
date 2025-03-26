# Energy Grid Dashboard

A React-based web application simulating real-time energy grid monitoring using GraphQL queries and subscriptions. Built with Apollo Client, it fetches mock static data and delivers live voltage updates via a local WebSocket server. Think of it as a utility dashboard for tracking grid metrics—like voltage—across multiple nodes, blending historical data with live updates.

## Overview

This project mimics a small-scale energy grid dashboard, pulling initial data (e.g., grid nodes "1", "2", "3") from a local GraphQL server and subscribing to live voltage updates for node "1" every 3 seconds. It showcases modern front-end techniques: GraphQL for data fetching, WebSocket for real-time updates, and Apollo Client for efficient caching. Ideal for developers exploring real-time dashboards or utility monitoring concepts.

## Features

- **Static Data Fetching**: Pulls initial grid data (IDs "1", "2", "3") from a local GraphQL server via queries.
- **Real-Time Updates**: Subscribes to the same server for live voltage updates on `id: "1"`, refreshing every 3 seconds.
- **Visual Feedback**: Highlights updated entries with a brief green flash for clarity.
- **Optimized Rendering**: Uses `useMemo` to ensure efficient UI updates without unnecessary re-renders.

_See a demo screenshot below:_  
![Dashboard Screenshot](https://via.placeholder.com/600x300.png?text=Energy+Grid+Dashboard+Screenshot)  
_(Replace with an actual screenshot of the dashboard showing the green flash.)_

## Getting Started

### Prerequisites

- **Node.js**: v20.9.0 (recommended for WebSocket compatibility; newer versions may work)
- **npm**: v10.1.0 or compatible

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/juancarlucci/energy-grid.git
   cd energy-grid
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the WebSocket server:

   ```bash
   npm run server
   ```

4. In a separate terminal, launch the app:

   ```bash
   npm run dev
   ```

5. Open the browser to [http://localhost:5173](http://localhost:5173) to see the dashboard in action.

### Troubleshooting

- **WebSocket Error:** Ensure port 4000 is free (`lsof -i :4000` on Unix systems) and restart the server.
- **Dependencies Fail:** Verify Node.js version with `node -v` and reinstall with `npm install`.

### Usage

Once running, the dashboard displays:

- A list of grid nodes (IDs "1", "2", "3") with initial voltage and timestamp data.
- Live updates for ID "1" every 3 seconds, highlighted with a green flash for 0.5 seconds.

Interact with the UI to see real-time changes—no user input is required beyond launching the app.

### Architecture

The app follows a simple flow:

1. **Server (`server.cjs`):** A local WebSocket server at `ws://localhost:4000/graphql` provides mock static data and live updates.
2. **Apollo Client (`main.tsx`):** Manages data fetching and caching, connecting via WebSocket.
3. **UI (`App.tsx`):** Displays static and live data, optimized with `useMemo`.

**Library Analogy:** Think of Apollo Client as a library headquarters fetching "books" (data) from a warehouse (server), while the UI is a branch library serving readers (users) with static shelves and live deliveries.

## How It Works

### Key Components

- **Apollo Client (`main.tsx`):** The central hub, set up with `ApolloProvider` to share a cache across the app. Uses a WebSocket link for queries and subscriptions.
- **`useQuery` (`App.tsx`):** Fetches static grid data (e.g., `GET_GRID_DATA`) and updates the UI when loaded.
- **`useSubscription` (`App.tsx`):** Listens for live updates (e.g., `GRID_SUBSCRIPTION`) and refreshes ID "1" every 3 seconds.
- **InMemoryCache:** Stores data by ID (e.g., `Grid:1`) for fast access and deduplication.
- **WebSocket Server (`server.cjs`):** Supplies static data and pushes live voltage updates.

### Technical Highlights

- **GraphQL Queries:** Fetch initial data efficiently.
- **Subscriptions:** Deliver real-time updates via WebSocket using `subscriptions-transport-ws`.
- **State Management:** Combines query and subscription data in `liveData` with `useEffect`.
- **Performance:** `useMemo` caches rendered UI elements; the cache minimizes network calls.

**Example Flow:**

1. `useQuery` loads static data → cached in Apollo.
2. `useSubscription` receives updates → `useEffect` syncs `liveData` → UI flashes green.

## Project Structure

```

## Why This Matters

This project demonstrates:
- **Real-Time Data:** GraphQL subscriptions for dynamic updates, key for monitoring apps.
- **Efficient Caching:** Apollo Client’s `InMemoryCache` for scalable data management.
- **User Experience:** Visual cues (green flash) enhance clarity, a nod to polished UX.

**Potential Use Case:** A utility company could adapt this for real grid monitoring, replacing mock data with live sensor feeds.

## Development Details

### Sample Code

#### Subscription Setup (`App.tsx`):
```

```javascript
const { data: subData } = useSubscription(GRID_SUBSCRIPTION);

useEffect(() => {
  if (subData?.gridUpdate) {
    setLiveData((prev) =>
      prev.map((entry) =>
        entry.id === subData.gridUpdate.id ? subData.gridUpdate : entry
      )
    );
    setUpdatedId(subData.gridUpdate.id);
    setTimeout(() => setUpdatedId(null), 500);
  }
}, [subData]);
```

#### Rendering Optimization (`App.tsx`):

```javascript
const renderedGrid = useMemo(
  () =>
    liveData.map((entry) => (
      <li
        key={entry.id}
        style={{
          backgroundColor: entry.id === updatedId ? "#e0ffe0" : "transparent",
        }}
      >
        Voltage: {entry.voltage} V (ID: {entry.id}, Time: {entry.timestamp})
      </li>
    )),
  [liveData, updatedId]
);
```

### Dependencies

#### Key libraries (see package.json for full list):

\*@apollo/client: GraphQL client and caching

\*graphql: GraphQL parsing

\*subscriptions-transport-ws: WebSocket support

\*ws: WebSocket server

### Status

As of March 26, 2025, this is a functional demo with mock data. Future enhancements could include real grid data integration or multi-node subscriptions.

### License

MIT License - see LICENSE for details.
TODO (Add a LICENSE file to the repo with MIT terms if applicable.)
