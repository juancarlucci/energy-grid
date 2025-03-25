# Energy Grid Dashboard

Welcome to the **Energy Grid Dashboard**, a React-based web application that simulates real-time monitoring of an energy grid using GraphQL queries and subscriptions. Built with Apollo Client, this project fetches mock static data and delivers live voltage updates via a local WebSocket server.

## Overview

This app mimics a utility dashboard for tracking grid metrics (e.g., voltage) across multiple nodes. It combines historical data with live updates, offering a seamless user experience powered by Apollo Client’s caching and subscription features. Think of it as a small-town library system: static data is like books fetched from a local warehouse, while real-time updates arrive via a courier from the same warehouse’s live press.

### Features

- **Static Data Fetching:** Pulls initial grid data (IDs "1", "2", "3") from a local GraphQL server via queries.
- **Real-Time Updates:** Subscribes to the same server for live voltage updates on `id: "1"`, refreshing every 3 seconds.
- **Visual Feedback:** Highlights updated entries with a brief green flash for clarity.
- **Optimized Rendering:** Uses `useMemo` to ensure efficient UI updates without unnecessary re-renders.

## Getting Started

### Prerequisites

- Node.js (v20.9.0 recommended)
- npm (v10.1.0 or compatible)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/juancarlucci/energy-grid.git
   cd energy-grid
   ```

Install dependencies:

npm install

Start the WebSocket server:

npm run server

In a separate terminal, launch the app:
npm run dev

Open the browser to http://localhost:5173 to see the dashboard in action.

## How It Works: The Library Analogy

Imagine this app as a bustling library ecosystem managing energy grid "books" (data). Here’s how the pieces fit together:

### Apollo Client: The Library Headquarters (main.tsx)

Role: Apollo Client is the central hub—like the library headquarters (HQ)—set up in main.tsx. It manages all data (books), connects to external sources (GraphQL servers), and organizes them in a storage room (the InMemoryCache).

Why in main.tsx? It’s the app’s entry point—the town’s only HQ. Initialized here with ApolloProvider, it ensures every component (branch library) has a library card to access data. One HQ serves all, keeping the cache shared and efficient.

Behind the Scenes: Configured with a WebSocket link (ws://localhost:4000/graphql) for queries and subscriptions, it fetches and stores grid data in RAM for quick access.

### useQuery: The Branch Librarian

Role: In App.tsx, useQuery acts as a friendly librarian at a local branch. It doesn’t own the books—that’s HQ’s job—but requests specific titles (e.g., GET_GRID_DATA) from Apollo Client and delivers them to the UI (readers).

In App.tsx: This is where data is displayed—like a branch serving its readers. It fetches static grid data, while subscriptions handle live updates.

Flow: useQuery asks HQ for initial data, which Apollo fetches from erver.cjs, caches, and returns as loading, error, or data states.

### useSubscription: The Live Courier

Role: In App.tsx, useSubscription is like a courier delivering real-time updates (e.g., GRID_SUBSCRIPTION) from the local WebSocket server at server.cjs.

How It Works: It listens for gridUpdate events, updating only id: "1" in the liveData state every 3 seconds, with a green flash to highlight the change.

Why Here? Paired with useQuery, it keeps the branch current with live grid readings alongside static ones.

### The Cache: The Storage Room

Role: The InMemoryCache in Apollo Client holds grid data (e.g., Grid:1, Grid:2) in RAM for fast retrieval.

Normalization: Data is split into objects by ID (e.g., Post:1, Post:2) with query keys (e.g., Query.GetGridData) acting like catalog cards pointing to them. This avoids duplicates and speeds up access.

In Action: Initial query data is cached, and subscription updates for id: "1" refresh the cache, keeping the UI in sync without redundant server calls.

### WebSocket Server: The Local Warehouse and Press (provides both static and live data)

Role: Defined in server.cjs, this is a local warehouse supplying static grid data and a live press sending real-time updates via subscriptions-transport-ws. Running at ws://localhost:4000/graphql, it delivers voltage readings for id: "1" every 3 seconds to HQ’s courier line (WebSocket link), keeping the dashboard current.

### Project Structure

src/main.tsx: Sets up Apollo Client (HQ) with HTTP and WebSocket links, wrapping the app in ApolloProvider.

src/App.tsx: Hosts useQuery and useSubscription to fetch and display grid data, with UI optimization via useMemo.

server.cjs: Runs a WebSocket server at ws://localhost:4000/graphql for queries and subscriptions.

package.json: Defines scripts (dev, server) and dependencies (@apollo/client, graphql, subscriptions-transport-ws, ws).

### Technical Highlights

GraphQL Queries: Fetch static data from the local server.

Subscriptions: Deliver real-time updates via WebSocket using subscriptions-transport-ws.

State Management: Combines query and subscription data in liveData, updated efficiently with useEffect.

Performance: useMemo optimizes rendering, and the cache minimizes network requests.

### Why This Matters

This project showcases a modern front-end stack:
Real-Time Data: Demonstrates GraphQL subscriptions for live updates, a key component for dynamic apps.

Caching: Highlights Apollo’s efficiency in managing data, critical for scalable dashboards.

UI Feedback: Adds a professional touch with visual cues, showing attention to user experience.

### GraphQL Terms in the Library Analogy

#### Schema: The Library’s Master Catalog

Role: The schema is the blueprint or catalog that defines all the books (data types) the library system can handle—what’s available, how they’re structured, and how they can be requested or updated.

In the Ecosystem: It lives in both HQ (Apollo Client knows it implicitly via queries/subscriptions) and the publishing house (server.cjs), where it’s explicitly defined:

const schema = new GraphQLSchema({
query: Query, //_ Static book requests
subscription: Subscription, //_ Live book deliveries
});

In server.cjs: The schema lists Grid (a book type with id, voltage, timestamp), a Query section for static data, and a Subscription section for live gridUpdate deliveries.
Analogy: It’s the master index card file at HQ and the warehouse, telling librarians what books exist (e.g., “Grid books”) and their fields (e.g., “voltage chapter”).

#### Query: The Book Request Form

Role: A query is a specific request form a branch librarian (useQuery) submits to HQ to fetch books (data) from the storage room (cache) or external suppliers (server.cjs).

In App.tsx, GET_GRID_DATA is a query:

```const GET_GRID_DATA = gql query GetGridData {
grid {
id
voltage
timestamp
}
};

```

It asks HQ for “grid” books from server.cjs.

Analogy: A librarian fills out a form (“I need all grid books with IDs and voltages”) and hands it to HQ, which fetches or pulls from the shelves.

#### Mutation: The Book Revision Request

Role: A mutation is a request to change or add books in the library—think of it as a form to update a book’s content (e.g., change voltage) or add a new one (e.g., new grid node).

In the Ecosystem: Sent to HQ, which forwards it to the supplier (GraphQLZero or server.cjs if they supported mutations) and updates the storage room (cache).

Server.cjs:

```const Mutation = new GraphQLObjectType({
name: "Mutation",
fields: {
updateVoltage: {
type: GridType,
args: { id: { type: GraphQLString }, voltage: { type: GraphQLInt } },
resolve: (\_, { id, voltage }) => ({ id, voltage, timestamp: new Date().toISOString() }),
},
},
});
const schema = new GraphQLSchema({ query: Query, mutation: Mutation, subscription: Subscription });
```

Analogy: A librarian submits a “revision form” to HQ (“Update Grid:1’s voltage to 240”), HQ tells the publishing house, and the new edition gets shelved.

#### Subscription: The Live Book Subscription

Role: A subscription is a standing order for new book editions delivered in real-time—like signing up for a newsletter from the publishing house.

In the Ecosystem: Managed by the courier line (WebSocket link) from the publishing house (server.cjs) to HQ, then to branch couriers (useSubscription).

In App.tsx, GRID_SUBSCRIPTION listens for updates:

```const GRID_SUBSCRIPTION = gql subscription OnGridUpdate {
gridUpdate {
id
voltage
timestamp
}
};

```

In server.cjs, it’s defined in the Subscription type, delivering id: "1".

Analogy: The branch subscribes to “Grid Updates Monthly,” and the publishing house sends new editions (voltage readings) every 3 seconds via courier.

#### Type (e.g., GridType): The Book Template

Role: A type defines the structure of a book —what chapters (fields) it has (e.g., id, voltage, timestamp).

In the Ecosystem: Part of the schema, used by HQ and the publishing house to ensure books are consistent.

In server.cjs:

```const GridType = new GraphQLObjectType({
name: "Grid",
fields: {
id: { type: GraphQLString },
voltage: { type: GraphQLInt },
timestamp: { type: GraphQLString },
},
});
```

Analogy: A template saying, “All grid books must have an ID page, a voltage chapter, and a timestamp appendix.”

#### Resolver: The Book Compiler

Role: A resolver is the logic that “writes” or “finds” a book’s content when a query, mutation, or subscription asks for it.

In the Ecosystem: Lives in the publishing house (server.cjs) or remote warehouse (GraphQLZero, or other server) to generate data.

In server.cjs, the subscribe function is a resolver:

```const Subscription = new GraphQLObjectType({
name: "Subscription",
fields: {
gridUpdate: {
type: GridType,
subscribe: async function* () {
//* subscribe: async function* () is the resolver (the writer).
//* It’s a generator (note the _) that “yields” a new book every 3 seconds.
while (true) {
const entry = gridData.find((item) => item.id === "1"); //_ Use current gridData
const newVoltage = entry.voltage + Math.floor(Math.random() _ 10) - 5; // Simulate fluctuation
entry.voltage = Math.max(220, Math.min(239, newVoltage)); // Keep within 220-239
entry.timestamp = new Date().toISOString();
const update = {
//_ courier bag labeled gridUpdate.
gridUpdate: {
...entry,
},
};
yield update; //\* Single yield with defined object
await new Promise((resolve) => setTimeout(resolve, 3000)); // Every 3 seconds
}
},
},
},
});
```

Analogy: The publishing house’s writer who pens new grid book editions or fetches existing ones from the back room.

### WebSocket Details: How It Works Under the Hood

Connection Setup:
When useSubscription runs, Apollo opens a WebSocket connection to `ws://localhost:4000/graphql.`

Protocol: Starts with an HTTP handshake (GET /graphql with Upgrade: websocket), then switches to WebSocket (ws://).

Persistent Channel:
Unlike HTTP’s one-and-done requests, WebSocket keeps the socket open.

server.cjs can push data anytime (e.g., every 3 seconds), and Apollo listens continuously.

Message Format:
Uses a protocol (here, subscriptions-transport-ws’s format):
Client: "start" message with the subscription query.

Server: "data" messages with each gridUpdate payload.

Example (simplified):
json
// Client to Server

```{"type": "start", "id": "1", "payload": {"query": "subscription { gridUpdate { id voltage timestamp } }"}}
// Server to Client
{"type": "data", "id": "1", "payload": {"data": {"gridUpdate": {"id": "1", "voltage": 232, "timestamp": "..."}}}}
```

Reconnection:
reconnect: true in wsLink ensures if the server restarts, Apollo reopens the connection and resubscribes.

Efficiency:
No polling (unlike HTTP setInterval fetching every 3 seconds).

Server-initiated pushes mean real-time updates without client overhead.

### Why WebSocket Here?

Subscriptions Need It: GraphQL subscriptions require a persistent connection—HTTP can’t push data from server to client without polling. WebSocket is ideal for gridUpdate updates every 3 seconds.

In server.cjs simulates a real grid server pushing live data, and WebSocket delivers it to App.tsx via Apollo.

### Full Flow Recap

Publishing House (server.cjs): Yields gridUpdate every 3 seconds, sends via WebSocket.

HQ (main.tsx): WebSocket link receives it, Apollo routes it to useSubscription.

Branch (App.tsx): useSubscription gets subData.gridUpdate, useEffect updates liveData, UI shows it.

### What is useEffect?

useEffect is a React hook that lets you perform side effects in functional components. Side effects are actions outside the main render flow—like fetching data, updating state based on external changes, or setting up subscriptions. It runs after the component renders, ensuring the UI is ready before handling these extras.
Key Idea: It’s React’s way of saying, “Render the UI first, then deal with the messy stuff.”

Library Analogy: Think of useEffect as the branch librarian’s assistant who steps in after the library opens (rendering) to rearrange books on the shelf (state updates) based on new deliveries (data changes).

### How Does useEffect Work?

Syntax:

```
useEffect(() => {
// Side effect code here
}, [dependencies]);
```

Callback Function (() => { ... }):
This runs the side effect—like updating state or fetching data.

It executes after every render by default, unless controlled by dependencies.

Dependency Array ([dependencies]):
A list of variables the effect depends on.

If empty ([]), the effect runs once after the initial render (like a setup).

If populated (e.g., [queryData, subData]), it runs only when those values change.

Cleanup (Optional Return):
If the callback returns a function, it runs before the next effect or when the component unmounts—like cleaning up a subscription.

Example:
```return () => clearInterval(interval);````.

Technical Flow:
Render → DOM updates → useEffect runs.

If dependencies change → Re-render → useEffect runs again.

Library Analogy: The assistant checks the delivery log (dependencies). If new books (queryData, subData) arrive, they rearrange the shelf (setLiveData). If no changes, they chill.

### useEffect in App.tsx

Code:

```useEffect(() => {
if (queryData) {
const initialData: GridEntry[] = queryData.grid;
setLiveData(initialData);
}
if (subData?.gridUpdate) {
setLiveData((prev) => {
const newEntry = subData.gridUpdate;
const exists = prev.some((entry) => entry.id === newEntry.id);
setUpdatedId(newEntry.id); //_ Mark this ID for a visual flash
setTimeout(() => setUpdatedId(null), 500); //_ Clear highlight after 0.5s
return exists
? prev.map((entry) => (entry.id === newEntry.id ? newEntry : entry))
: [...prev, newEntry];
});
}
}, [queryData, subData]);
```

Breakdown:
The Effect (() => { ... }):
Purpose: Syncs liveData (the UI’s display shelf) with incoming data from useQuery (queryData) and useSubscription (subData).

Two Conditions:
if (queryData): When static data arrives from the GET_GRID_DATA query:
queryData.grid is an array of grid entries (e.g., [{ id: "1", ... }, { id: "2", ... }, { id: "3", ... }]).

setLiveData(initialData) sets the initial shelf state with all three IDs.

if (subData?.gridUpdate): When a live update arrives from GRID_SUBSCRIPTION:
subData.gridUpdate is a single entry (e.g., { id: "1", voltage: 232, timestamp: "..." }).

setLiveData((prev) => ...) updates the shelf:
const newEntry = subData.gridUpdate: Grabs the new book.

exists = prev.some(...): Checks if id: "1" is already on the shelf.

setUpdatedId(newEntry.id): Triggers the green flash for id: "1".

setTimeout(() => setUpdatedId(null), 500): Turns off the flash after 0.5s.

return exists ? ... : ...: If id: "1" exists, updates it; if not, adds it (though it always exists here after the query).

Dependencies ([queryData, subData]):
queryData: From useQuery. Changes when the initial grid data loads or updates.

subData: From useSubscription. Changes every 3 seconds when a new gridUpdate arrives via WebSocket.

Effect Runs When:
First render: queryData loads → sets initial liveData.

Every 3 seconds: subData updates → updates id: "1" in liveData.

No Cleanup:
No return function here since there’s no ongoing process (like an interval) to stop. useSubscription handles its own cleanup via Apollo.

Library Analogy:
The assistant (useEffect) watches the delivery log (queryData, subData).

When a big shipment arrives (queryData), they stock the shelf (setLiveData) with all books.

When a courier drops off a new book (subData.gridUpdate), they update the shelf, spotlight it (setUpdatedId), and dim the light after 0.5s.

### Why Use useEffect Here?

Timing:
useQuery and useSubscription fetch data asynchronously—queryData and subData aren’t ready during the initial render. useEffect waits until after render, when the data’s available.

Reactivity:
Without useEffect, you’d need to manually update liveData in render, which could cause infinite loops (render → setState → render). useEffect runs only when queryData or subData changes, keeping it controlled.

Side Effects:
Updating liveData and triggering the flash (setUpdatedId) are side effects—they affect state and UI outside the main render logic. useEffect is built for this.

Alternative Without useEffect:
You could try setting liveData directly in render:
tsx
if (queryData) setLiveData(queryData.grid); // BAD: Causes infinite render loop

This breaks React—setLiveData triggers a re-render, which calls it again, ad infinitum. useEffect prevents this by running after render, only on dependency changes.

Library Analogy: The assistant doesn’t rearrange the shelf while the library’s still building (rendering). They wait until it’s open (post-render) and only act when new books arrive (dependencies change).

How It Fits the Flow
Initial Render: UI shows “Loading...”, useEffect waits.

Query Loads: queryData populates → useEffect sets liveData with IDs "1", "2", "3" → UI updates.

Subscription Kicks In: subData updates every 3 seconds → useEffect updates id: "1" in liveData → UI flashes green.

#### Technical Nuances

Why [queryData, subData] and Not Empty?
Empty ([]) would run once on mount, missing live updates. [queryData, subData] ensures it reacts to new data.

Why prev in setLiveData?
Using the callback form (prev => ...) ensures you’re working with the latest state, avoiding race conditions if multiple updates happen close together.

Performance: useEffect with useMemo (for rendering) keeps the app efficient—only updates what’s needed.

1. useQuery and useSubscription Fetch Data Asynchronously? Event Loop?
   Are They Asynchronous?
   Yes, both useQuery and useSubscription fetch data asynchronously. Here’s why:
   What “Asynchronous” Means:
   JavaScript runs in a single-threaded event loop, meaning it can only do one thing at a time.

Asynchronous operations (like fetching data over the network) don’t block the thread—they’re offloaded to the browser’s Web APIs (e.g., fetch for HTTP, WebSocket for subscriptions), which handle them in the background.

useQuery:
In App.tsx:

```const { loading: queryLoading, error: queryError, data: queryData } = useQuery(GET_GRID_DATA, {
fetchPolicy: "cache-and-network",
});
```

How It Works:
When useQuery runs, Apollo Client sends a GraphQL query (GET_GRID_DATA) to ws://localhost:4000/graphql via the WebSocket link (in the current setup).

This isn’t instant—it’s a network call. Apollo uses an async operation (WebSocket message) to request data from server.cjs.

While waiting, useQuery returns { loading: true, data: undefined }. Once the response arrives, it updates to { loading: false, data: { grid: [...] } }.

useSubscription:
In App.tsx:

const { data: subData, error: subError } = useSubscription(GRID_SUBSCRIPTION);

How It Works:
useSubscription sets up a WebSocket subscription to server.cjs. It sends a "start" message asynchronously to subscribe to gridUpdate.

The WebSocket stays open, and server.cjs pushes data every 3 seconds. Each push is an async event—Apollo receives it in the background and updates subData.

Why Async?
Network operations (HTTP or WebSocket) take time (milliseconds to seconds). Blocking the thread would freeze the app. Async lets React render the UI (e.g., “Loading...”) while waiting.

Event Loop Connection
The event loop is JavaScript’s mechanism for handling async tasks. Here’s how it fits:
Quick Event Loop Primer:
Call Stack: Executes synchronous code (e.g., rendering App).

Web APIs: Handles async tasks (e.g., network requests, timers) outside the stack.

Task Queue: Holds callbacks ready to run (e.g., when data arrives).

Event Loop: Moves tasks from the queue to the stack when the stack is empty.

useQuery Flow:
useQuery runs in the render phase (synchronous), registering the query with Apollo.

Apollo sends the WebSocket message (async, offloaded to Web API).

Render finishes, showing “Loading...” (if (queryLoading && !queryData)).

WebSocket response arrives → callback added to task queue.

Event loop picks it up → Apollo updates queryData → triggers re-render.

useSubscription Flow:
useSubscription runs in render, sending the subscription request (async WebSocket "start").

WebSocket connects and waits.

Every 3 seconds, server.cjs pushes data → WebSocket API triggers a callback → queued.

Event loop runs it → Apollo updates subData → re-render.

Library Analogy:
The branch librarian (useQuery, useSubscription) puts in an order (query/subscription) and keeps working (rendering “Loading...”).

The courier (WebSocket) delivers books in the background (Web API). The event loop is the assistant who grabs the delivery from the mailbox (queue) and hands it over when the librarian’s free (stack empty).

Initial render: queryLoading = true, subData = undefined.

Event loop: queryData loads → re-render with static data → subData updates every 3 seconds → re-renders with live data.

2. useEffect with useMemo Keeps the App Efficient—Expand on Rendering
   Rendering Basics
   What is Rendering?
   Rendering is React updating the UI. It happens when:
   A component mounts (first render).

State or props change (re-render).

React builds a Virtual DOM, compares it to the previous one (diffing), and updates the real DOM only where needed.

In the App:
liveData changes (via setLiveData) → triggers re-render → renderedGrid updates → DOM reflects new voltages.

useEffect Role
Code:

useEffect(() => {
if (queryData) setLiveData(queryData.grid);
if (subData?.gridUpdate) {
setLiveData((prev) => {
const newEntry = subData.gridUpdate;
const exists = prev.some((entry) => entry.id === newEntry.id);
setUpdatedId(newEntry.id);
setTimeout(() => setUpdatedId(null), 500);
return exists ? prev.map(...) : [...prev, newEntry];
});
}
}, [queryData, subData]);

Efficiency:
Runs only when queryData or subData changes, not every render.

Updates liveData precisely—once for initial data, then only id: "1" for subscriptions—minimizing state changes.

Without useEffect, state updates in render would loop infinitely.

useMemo Role
Code:

```const formatTimestamp = (timestamp: string) =>
new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const renderedGrid = useMemo(() => {
return liveData.map((entry) => (

<li
key={entry.id}
style={{ backgroundColor: entry.id === updatedId ? "#e0ffe0" : "transparent" }} >
Voltage: {entry.voltage} V (ID: {entry.id}, Time: {formatTimestamp(entry.timestamp)})
</li>
));
}, [liveData, updatedId]);
```

What It Does:
useMemo(() => ..., [dependencies]): Memoizes (caches) the result of the callback. Only recalculates when liveData or updatedId changes.

Without useMemo:
Every render (e.g., from setUpdatedId toggling) would re-run the .map(), creating new <li> elements—even if liveData didn’t change.

React would still diff the Virtual DOM, but recomputing the array is unnecessary work.

With useMemo:
If liveData and updatedId are unchanged, it reuses the cached renderedGrid array—no recomputation.

Reduces CPU work, especially if liveData grows large.

Rendering Impact:
Initial Render: liveData = [], renderedGrid = [].

Query Loads: liveData updates → useMemo computes <li>s → DOM updates.

Subscription Updates:
liveData changes (new id: "1") → useMemo recomputes <li>s.

setUpdatedId triggers re-render → useMemo recomputes only if updatedId differs.

setTimeout clears updatedId → re-render → useMemo updates styles.

Efficiency: Only changed <li>s (e.g., id: "1") update in the DOM, thanks to key={entry.id}—React skips untouched ones (e.g., id: "2", id: "3").

How They Work Together
useEffect:
Controls when liveData updates—only on new queryData or subData.

Prevents over-rendering by limiting state changes.

useMemo:
Controls what renders—caches renderedGrid to avoid redundant computation.

Ensures DOM updates are minimal (e.g., only id: "1"’s <li> changes).

Library Analogy:
Without Optimization: Every time a book arrives, the assistant (useEffect) rebuilds the entire shelf, and the display team (render) redraws every label—even unchanged ones.

With Optimization: The assistant updates only the new book (useEffect), and the display team uses a pre-made list (useMemo), tweaking only the updated label (DOM diffing).

Performance Win:
useEffect reduces re-renders (e.g., no update if subData is unchanged).

useMemo reduces computation (e.g., no re-mapping if liveData is stable).

Together: Fewer state changes + less work per render = snappy app.
