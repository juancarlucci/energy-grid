# Energy Grid Dashboard

A real-time dashboard to monitor and manage energy grid nodes using React and GraphQL, with a WebSocket-based server.

## Overview

This project mimics a small-scale energy grid dashboard, pulling initial data (e.g., grid nodes "1", "2", "3") from a local GraphQL server and subscribing to live voltage updates for node "1" every 3 seconds. It showcases modern front-end techniques: GraphQL for data fetching, WebSocket for real-time updates, and Apollo Client for efficient caching. Ideal for developers exploring real-time dashboards or utility monitoring concepts.

## Features

## Features

- **Real-Time Updates**: Voltage updates for nodes every ~3 seconds via GraphQL subscription.
- **Voltage Chart**: Displays voltage history with green (safe: 223V–237V) and red (out-of-range) dots.
- **Node Management**:
  - View current voltage for each node.
  - Update node voltage manually (clamped to 220V–239V).
  - Add new nodes by ID.
  - Delete existing nodes.
- **Controls**:
  - Pause/resume real-time updates.
  - Refresh data manually.
  - Filter chart by time frame (5m, 15m, all) and node visibility.
- **Alerts**: Pop-up warnings for out-of-range voltages (clears after 5s).
- **Persistence**: Voltage history saved in `localStorage`.

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

Dashboard: See node voltages and chart with real-time updates from server.cjs.

Control Panel:

"Pause/Resume": Toggle subscription updates.

"Refresh": Fetch latest data from the server.

"Add Node": Enter an ID (e.g., "4") and click to add a new node.

"Delete Node": Select a node from the dropdown and click to remove it.

Nodes: Adjust voltage via input fields; toggle chart visibility with checkboxes.

Chart: Switch time frames (5m, 15m, all) via dropdown.

### Architecture

The app follows a simple flow:

1. **Server (`server.cjs`):** A local WebSocket server at `ws://localhost:4000/graphql` provides mock static data and live updates.
2. **Apollo Client (`main.tsx`):** Manages data fetching and caching, connecting via WebSocket.
3. **UI (`App.tsx`):** Displays static and live data, optimized with `useMemo`.

**Library Analogy:** Think of Apollo Client as a library headquarters fetching "books" (data) from a warehouse (server), while the UI is a branch library serving readers (users) with static shelves and live deliveries.

## How It Works

### Key Components

### Key Components

- **Apollo Client (`main.tsx`)**: Sets up `ApolloProvider` with a WebSocket link for queries, mutations, and subscriptions, sharing a cache across the app.
- **`useQuery` (`App.tsx`)**: Fetches initial grid data via `GET_GRID_DATA` and updates the UI with current node states.
- **`useSubscription` (`App.tsx`)**: Subscribes to `GRID_SUBSCRIPTION` for real-time updates, pushing random node voltage changes every ~3 seconds.
- **`useMutation` (`App.tsx`)**: Handles `UPDATE_VOLTAGE`, `ADD_NODE`, and `DELETE_NODE` to modify grid nodes, updating the cache and history.
- **InMemoryCache**: Caches node data by ID (e.g., `Grid:1`) for quick access and deduplication.
- **WebSocket Server (`server.cjs`)**: Provides static grid data, supports mutations (`updateVoltage`, `addNode`, `deleteNode`), and broadcasts live `gridUpdate` events via WebSocket.

## Why This Matters

This project demonstrates:

- **Real-Time Data:** GraphQL subscriptions for dynamic updates, key for monitoring apps.
- **Efficient Caching:** Apollo Client’s `InMemoryCache` for scalable data management.
- **User Experience:** Visual cues (green flash) enhance clarity, a nod to polished UX.

**Potential Use Case:** A utility company could adapt this for real grid monitoring, replacing mock data with live sensor feeds.

## Development Details

### Sample Code

#### Subscription Setup (`App.tsx`):

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
