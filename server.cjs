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

//* Dummy Query type—required by GraphQL, even if unused, to keep the library open
const Query = new GraphQLObjectType({
  name: "Query",
  fields: {
    dummy: { type: GraphQLString }, //* A placeholder field
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
        //* Generator function—delivers new books every 3 seconds
        while (true) {
          yield {
            gridUpdate: {
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
  query: Query, //* Added to satisfy GraphQL requirements
  subscription: Subscription,
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
