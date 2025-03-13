# Energy Grid Dashboard

Welcome to the **Energy Grid Dashboard**, a React-based web application that simulates real-time monitoring of an energy grid using GraphQL queries and subscriptions. Built with Apollo Client, this project fetches mock static data from GraphQLZero and delivers live voltage updates via a local WebSocket server—perfect for demonstrating modern front-end development skills in a professional yet approachable way.

## Overview

This app mimics a utility dashboard for tracking grid metrics (e.g., voltage) across multiple nodes. It combines historical data with live updates, offering a seamless user experience powered by Apollo Client’s caching and subscription features. Think of it as a small-town library system: static data is like books fetched from a distant warehouse, while real-time updates arrive via a trusty courier from a local publishing house.

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

### Apollo Client: The Library Headquarters

Role: Apollo Client is the central hub—like the library headquarters (HQ)—set up in main.tsx. It manages all data (books), connects to external sources (GraphQL servers), and organizes them in a storage room (the InMemoryCache).

Why in main.tsx? It’s the app’s entry point—the town’s only HQ. Initialized here with ApolloProvider, it ensures every component (branch library) has a library card to access data. One HQ serves all, keeping the cache shared and efficient.

Behind the Scenes: Configured with a WebSocket link (ws://localhost:4000/graphql) for both queries and subscriptions, it’s the backbone fetching and storing grid data in RAM for quick access.

### useQuery: The Branch Librarian

Role: In App.tsx, useQuery acts as a friendly librarian at a local branch. It doesn’t own the books—that’s HQ’s job—but requests specific titles (e.g., GET_GRID_DATA) from Apollo Client and delivers them to the UI (readers).

Why in App.tsx? This is where the data is needed—like a branch serving its readers. Each component can have its own librarian tailored to its needs, fetching static grid data here while subscriptions handle live updates.

Flow: useQuery asks HQ for initial data, which Apollo fetches from GraphQLZero, caches, and returns as loading, error, or data states.

### useSubscription: The Live Courier

Role: Also in App.tsx, useSubscription is like a courier delivering real-time updates (e.g., GRID_SUBSCRIPTION) from the local WebSocket server at server.cjs.

How It Works: It listens for gridUpdate events, updating only id: "1" in the liveData state every 3 seconds, with a green flash to highlight the change.

Why Here? Paired with useQuery, it keeps the branch current with live grid readings alongside static ones.

### The Cache: The Storage Room

Role: The InMemoryCache in Apollo Client is the storage room in RAM, holding grid data (e.g., Grid:1, Grid:2) for fast retrieval.

Normalization: Data is split into objects by ID (e.g., Post:1, Post:2) with query keys (e.g., Query.GetGridData) acting like catalog cards pointing to them. This avoids duplicates and speeds up access.

In Action: Initial query data is cached, and subscription updates for id: "1" refresh the cache, keeping the UI in sync without redundant server calls.

### WebSocket Server: The Local Publishing House

Role: Defined in server.cjs, this is an independent publishing house—not part of HQ—producing and delivering real-time grid updates via subscriptions-transport-ws. Running locally at ws://localhost:4000/graphql, it sends new voltage readings for id: "1" every 3 seconds to HQ’s courier line (WebSocket link), keeping the dashboard current.

### GraphQLZero: The Remote Warehouse

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

### GraphQL Terms in the Library Analogy

#### Schema: The Library’s Master Catalog

Role: The schema is the blueprint or catalog that defines all the books (data types) the library system can handle—what’s available, how they’re structured, and how they can be requested or updated.

In the Ecosystem: It lives in both HQ (Apollo Client knows it implicitly via queries/subscriptions) and the publishing house (server.cjs), where it’s explicitly defined:

const schema = new GraphQLSchema({
query: Query, //_ Static book requests
subscription: Subscription, //_ Live book deliveries
});

Your App: In server.cjs, the schema lists Grid (a book type with id, voltage, timestamp), a dummy Query section (for Apollo), and a Subscription section (for live gridUpdate deliveries).

Analogy: It’s the master index card file at HQ and the publishing house, telling librarians (and couriers) what books exist (e.g., “Grid books”) and what fields they have (e.g., “voltage chapter”).

#### Query: The Book Request Form

Role: A query is a specific request form a branch librarian (useQuery) submits to HQ to fetch books (data) from the storage room (cache) or external suppliers (GraphQLZero, server.cjs if it had queries).

In the Ecosystem: Handled by HQ’s delivery truck (HTTP link) or storage room (cache).

Your App: In App.tsx, GET_GRID_DATA is a query:

const GET_GRID_DATA = gql`  query GetGridData {
    posts {
      data {
        id
        title
      }
    }
  }`;

It asks HQ for “posts” books from GraphQLZero, mocked as grid data.

Analogy: A librarian fills out a form (“I need all grid books with IDs and voltages”) and hands it to HQ, which fetches or pulls from the shelves.

#### Mutation: The Book Revision Request

Role: A mutation is a request to change or add books in the library—think of it as a form to update a book’s content (e.g., change voltage) or add a new one (e.g., new grid node).

In the Ecosystem: Sent to HQ, which forwards it to the supplier (GraphQLZero or server.cjs if they supported mutations) and updates the storage room (cache).

Your App: You don’t have mutations yet (GraphQLZero is read-only, and server.cjs is subscription-only), but imagine adding one in server.cjs:

const Mutation = new GraphQLObjectType({
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

Analogy: A librarian submits a “revision form” to HQ (“Update Grid:1’s voltage to 240”), HQ tells the publishing house, and the new edition gets shelved.

#### Subscription: The Live Book Subscription

Role: A subscription is a standing order for new book editions delivered in real-time—like signing up for a newsletter from the publishing house.

In the Ecosystem: Managed by the courier line (WebSocket link) from the publishing house (server.cjs) to HQ, then to branch couriers (useSubscription).

Your App: In App.tsx, GRID_SUBSCRIPTION listens for updates:

const GRID_SUBSCRIPTION = gql`  subscription OnGridUpdate {
    gridUpdate {
      id
      voltage
      timestamp
    }
  }`;

In server.cjs, it’s defined in the Subscription type, delivering id: "1".

Analogy: The branch subscribes to “Grid Updates Monthly,” and the publishing house sends new editions (voltage readings) every 3 seconds via courier.

#### Type (e.g., GridType): The Book Template

Role: A type defines the structure of a book —what chapters (fields) it has (e.g., id, voltage, timestamp).

In the Ecosystem: Part of the schema, used by HQ and the publishing house to ensure books are consistent.

Your App: In server.cjs:

const GridType = new GraphQLObjectType({
name: "Grid",
fields: {
id: { type: GraphQLString },
voltage: { type: GraphQLInt },
timestamp: { type: GraphQLString },
},
});

Analogy: A template saying, “All grid books must have an ID page, a voltage chapter, and a timestamp appendix.”

#### Resolver: The Book Compiler

Role: A resolver is the logic that “writes” or “finds” a book’s content when a query, mutation, or subscription asks for it.

In the Ecosystem: Lives in the publishing house (server.cjs) or remote warehouse (GraphQLZero) to generate data.

Your App: In server.cjs, the subscribe function is a resolver:

subscribe: async function* () {
while (true) {
yield { gridUpdate: { id: "1", voltage: 230 + Math.floor(Math.random() * 10) - 5, timestamp: new Date().toISOString() } };
await new Promise((resolve) => setTimeout(resolve, 3000));
}
}

(No explicit resolve for queries/mutations yet since they’re minimal.)

Analogy: The publishing house’s writer who pens new grid book editions or fetches existing ones from the back room.

### The Big Picture: Data Flow

Think of this as a book delivery pipeline:
server.cjs (Publishing House): Writes and sends new “grid update” books every 3 seconds.

Apollo Client (HQ): Receives these books via its courier line (WebSocket) and hands them to the branch.

App.tsx (Branch Library): Uses a courier (useSubscription) to pick up the books and display them in the UI.

Your specific question is about useSubscription(GRID_SUBSCRIPTION)—how does it “know” to get data from server.cjs’s gridUpdate? Let’s trace it.

#### Step 1: server.cjs - The Publishing House Sends Books

In server.cjs, the Subscription type defines what live updates are available:
Line 51-ish (server.cjs):

const Subscription = new GraphQLObjectType({
name: "Subscription",
fields: {
gridUpdate: {
type: GridType,
subscribe: async function* () { //* Generator function—delivers new books every 3 seconds
while (true) {
yield {
gridUpdate: {
id: "1",
voltage: 230 + Math.floor(Math.random() \* 10) - 5,
timestamp: new Date().toISOString(),
},
};
await new Promise((resolve) => setTimeout(resolve, 3000)); // Every 3 seconds
}
},
},
},
});

What’s Happening:
Subscription is the catalog section for live updates.

gridUpdate is a subscription field—a specific book series clients can subscribe to.

subscribe: async function* () is the resolver (the writer). It’s a generator (note the *) that “yields” a new book every 3 seconds.

yield { gridUpdate: { id: "1", ... } }: Each book is labeled gridUpdate and contains id, voltage, and timestamp. This matches the GridType template.

Library Analogy: The publishing house prints a new edition of the “Grid Update” book for id: "1" every 3 seconds and puts it in a courier bag labeled gridUpdate.

Output Format: The yielded object is wrapped in a GraphQL response:
json

{
"data": {
"gridUpdate": {
"id": "1",
"voltage": 232,
"timestamp": "2025-03-12T10:00:00Z"
}
}
}

##### Sent Where?

The SubscriptionServer (line 80-ish) attaches this to the WebSocket server (ws://localhost:4000/graphql), which broadcasts it to any subscribed clients.

#### Step 2: main.tsx - HQ Sets Up the Courier Line

In main.tsx, Apollo Client connects to the publishing house:
Relevant Lines:
tsx
const wsLink = new WebSocketLink({
uri: "ws://localhost:4000/graphql",
options: { reconnect: true },
});

const client = new ApolloClient({
link: wsLink,
cache: new InMemoryCache(),
});

What’s Happening:
WebSocketLink is HQ’s courier line, tuned to ws://localhost:4000/graphql—the publishing house’s address.

client (Apollo Client) uses this link for all GraphQL operations (queries and subscriptions since we dropped the HTTP link).

ApolloProvider makes this client available to all components, like handing out library cards.

Library Analogy: HQ hires a courier service (WebSocket) to pick up books from the publishing house and bring them back to the storage room (cache) or directly to branches.

#### Step 3: App.tsx - The Branch Requests Live Deliveries

In App.tsx, useSubscription subscribes to the gridUpdate series:
Line 16 (GRID_SUBSCRIPTION Definition):
tsx
const GRID_SUBSCRIPTION = gql`  subscription OnGridUpdate {
    gridUpdate {
      id
      voltage
      timestamp
    }
  }`;

What’s Happening:
gql turns this string into a GraphQL document—a subscription request form.

subscription OnGridUpdate names the request (arbitrary, just for clarity).

gridUpdate { id voltage timestamp } specifies the book series (gridUpdate) and chapters (fields) the branch wants from the publishing house.

This matches the gridUpdate field in server.cjs’s Subscription type.

Library Analogy: The branch fills out a standing order form: “Send me every new edition of the ‘Grid Update’ book with ID, voltage, and timestamp chapters.”

Line 53-ish (useSubscription):
tsx
const { data: subData, error: subError } = useSubscription(GRID_SUBSCRIPTION);

What’s Happening:
useSubscription(GRID_SUBSCRIPTION) is the courier at the branch. It takes the form (GRID_SUBSCRIPTION) and sends it to HQ (Apollo Client).

HQ forwards it via the WebSocket link to server.cjs, saying, “Start sending gridUpdate books.”

server.cjs responds by yielding a new gridUpdate book every 3 seconds, which flows back through the WebSocket to HQ.

Apollo Client delivers this to useSubscription, populating subData with each new book:
tsx
subData = {
gridUpdate: {
id: "1",
voltage: 232,
timestamp: "2025-03-12T10:00:00Z"
}
}

Library Analogy: The courier (useSubscription) stands at the branch door, receiving new “Grid Update” books from HQ’s WebSocket courier line every 3 seconds. Each book lands in subData.

#### Step 4: App.tsx - Processing the Delivery

Line 60-ish (useEffect):
tsx
useEffect(() => {
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

What’s Happening:
if (subData?.gridUpdate) checks if a new book arrived from the subscription.

const newEntry = subData.gridUpdate extracts the book’s contents ({ id: "1", voltage: 232, timestamp: "..." }).

setLiveData((prev) => ...) updates the branch’s display shelf (liveData):
If id: "1" exists, it replaces that entry with the new book.

If not (unlikely here), it adds it.

setUpdatedId triggers the green flash for id: "1".

Library Analogy: When the courier drops off a new “Grid Update” book, the branch librarian (useEffect) takes it, updates the display shelf (liveData), and puts a spotlight (green flash) on it for 0.5 seconds.

### The Detailed Flow

Publishing House (server.cjs):
Every 3 seconds, yields a gridUpdate book: { id: "1", voltage: 232, timestamp: "..." }.

Sends it via WebSocket (ws://localhost:4000/graphql).

HQ (Apollo Client in main.tsx):
WebSocket link receives the book.

Matches it to the GRID_SUBSCRIPTION request from App.tsx.

Forwards it to useSubscription.

Branch (App.tsx):
useSubscription gets subData.gridUpdate.

useEffect updates liveData with the new book.

UI renders the updated voltage for id: "1", flashing green.

### Why It “Knows” to Get gridUpdate

Schema Match: GRID_SUBSCRIPTION’s gridUpdate field matches the gridUpdate field in server.cjs’s Subscription type.

WebSocket Link: main.tsx points Apollo to ws://localhost:4000/graphql, where server.cjs listens and responds with gridUpdate data.

Apollo Magic: useSubscription tells Apollo, “Subscribe to this,” and Apollo handles the WebSocket handshake, passing subData back when data arrives.

### Analogy Recap

server.cjs: Publishing house prints gridUpdate books every 3 seconds.

WebSocket: Courier truck drives books from the publishing house to HQ.

useSubscription: Branch courier picks up books from HQ and hands them to the librarian (useEffect).

UI: Readers see the latest book on the shelf with a flashy highlight.

### WebSocket Details: How It Works Under the Hood

Connection Setup:
When useSubscription runs, Apollo opens a WebSocket connection to ws://localhost:4000/graphql.

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
{"type": "start", "id": "1", "payload": {"query": "subscription { gridUpdate { id voltage timestamp } }"}}
// Server to Client
{"type": "data", "id": "1", "payload": {"data": {"gridUpdate": {"id": "1", "voltage": 232, "timestamp": "..."}}}}

Reconnection:
reconnect: true in wsLink ensures if the server restarts, Apollo reopens the connection and resubscribes.

Efficiency:
No polling (unlike HTTP setInterval fetching every 3 seconds).

Server-initiated pushes mean real-time updates without client overhead.

### Why WebSocket Here?

Subscriptions Need It: GraphQL subscriptions require a persistent connection—HTTP can’t push data from server to client without polling. WebSocket is ideal for gridUpdate updates every 3 seconds.

Your App: server.cjs simulates a real grid server pushing live data, and WebSocket delivers it to App.tsx via Apollo.

### Full Flow Recap

Publishing House (server.cjs): Yields gridUpdate every 3 seconds, sends via WebSocket.

HQ (main.tsx): WebSocket link receives it, Apollo routes it to useSubscription.

Branch (App.tsx): useSubscription gets subData.gridUpdate, useEffect updates liveData, UI shows it.
