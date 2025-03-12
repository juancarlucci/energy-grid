const { createServer } = require("http");
const { WebSocketServer } = require("ws");
const {
  execute,
  subscribe,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
} = require("graphql");
const { SubscriptionServer } = require("subscriptions-transport-ws");

const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("GraphQL WebSocket Server");
});

// Mock Grid Data Type
const GridType = new GraphQLObjectType({
  name: "Grid",
  fields: {
    id: { type: GraphQLString },
    voltage: { type: GraphQLInt },
    timestamp: { type: GraphQLString },
  },
});

// Subscription to simulate grid updates
const Subscription = new GraphQLObjectType({
  name: "Subscription",
  fields: {
    gridUpdate: {
      type: GridType,
      subscribe: async function* () {
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

const schema = new GraphQLSchema({
  subscription: Subscription,
});

const wsServer = new WebSocketServer({
  server,
  path: "/graphql",
});

server.listen(4000, () => {
  console.log("WebSocket server running on ws://localhost:4000/graphql");

  SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
    },
    wsServer
  );
});
