//* HTTP server base—like the library building itself
const { createServer } = require("http");
//* WebSocket setup—the live delivery system for real-time books
const { WebSocketServer } = require("ws");
//* GraphQL tools—the librarians who manage book types, execution, and subscriptions
const {
  execute,
  subscribe,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
} = require("graphql");
//* Subscription server—the clerk handling live book deliveries
const { SubscriptionServer } = require("subscriptions-transport-ws");

//* Basic HTTP server—welcomes visitors with a sign saying "GraphQL WebSocket Server"
const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("GraphQL WebSocket Server");
});

//* Mock Grid Data Type—a book template defining id, voltage, and timestamp
const GridType = new GraphQLObjectType({
  name: "Grid",
  fields: {
    id: { type: GraphQLString },
    voltage: { type: GraphQLInt },
    timestamp: { type: GraphQLString },
  },
});

//* Query type—the static book request desk, serving mock grid data
const Query = new GraphQLObjectType({
  name: "Query",
  fields: {
    grid: {
      type: new GraphQLList(GridType), //* Returns a list of grid books
      resolve: () => [
        { id: "1", voltage: 230, timestamp: new Date().toISOString() },
        { id: "2", voltage: 225, timestamp: new Date().toISOString() },
        { id: "3", voltage: 235, timestamp: new Date().toISOString() },
      ], //* Mock static data
    },
  },
});

//* Subscription type—the live updates catalog section for grid data
//* It’s the root subscription type in the schema, telling the server what real-time books (data) to deliver
const Subscription = new GraphQLObjectType({
  name: "Subscription",
  fields: {
    gridUpdate: {
      type: GridType,
      subscribe: async function* () {
        //* subscribe: async function* () is the resolver (the writer).
        //* It’s a generator (note the *) that “yields” a new book every 3 seconds.
        while (true) {
          yield {
            gridUpdate: {
              //* courier bag labeled gridUpdate.
              id: "1",
              voltage: 230 + Math.floor(Math.random() * 10) - 5,
              timestamp: new Date().toISOString(),
            },
          };
          await new Promise((resolve) => setTimeout(resolve, 3000)); // Every 3 seconds
        }
      },
    },
  },
});

//* Schema—the library’s master catalog, now with a query section for validity
const schema = new GraphQLSchema({
  query: Query, //*  Added to satisfy GraphQL requirements. Static book requests
  subscription: Subscription, //* Live book deliveries
});

//* WebSocket server—the live delivery desk at /graphql
const wsServer = new WebSocketServer({
  server,
  path: "/graphql",
});

//* Start the library at port 4000 and set up the subscription clerk
server.listen(4000, () => {
  console.log("WebSocket server running on ws://localhost:4000/graphql");

  SubscriptionServer.create(
    {
      schema, //* The catalog to use
      execute, //* How to process book requests
      subscribe, //* How to handle live deliveries
    },
    wsServer //* The delivery desk to operate from
  );
});
