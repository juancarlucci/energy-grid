const { createServer } = require("http");
const { WebSocketServer } = require("ws");
const {
  execute,
  subscribe,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
} = require("graphql");
const { SubscriptionServer } = require("subscriptions-transport-ws");

const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("GraphQL WebSocket Server");
});

let gridData = [
  { id: "1", voltage: 230, timestamp: new Date().toISOString() },
  { id: "2", voltage: 225, timestamp: new Date().toISOString() },
  { id: "3", voltage: 235, timestamp: new Date().toISOString() },
];

const GridType = new GraphQLObjectType({
  name: "Grid",
  fields: {
    id: { type: GraphQLString },
    voltage: { type: GraphQLInt },
    timestamp: { type: GraphQLString },
  },
});

const Query = new GraphQLObjectType({
  name: "Query",
  fields: {
    grid: {
      type: new GraphQLList(GridType),
      resolve: () => {
        // Simulate fresh voltage readings on each query
        gridData = gridData.map((entry) => ({
          ...entry,
          voltage: Math.max(
            220,
            Math.min(239, entry.voltage + Math.floor(Math.random() * 10) - 5)
          ),
          timestamp: new Date().toISOString(),
        }));
        console.log("Query returning:", gridData);
        return gridData;
      },
    },
  },
});

const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    updateVoltage: {
      type: GridType,
      args: {
        id: { type: GraphQLString },
        voltage: { type: GraphQLInt },
      },
      resolve: (_, { id, voltage }) => {
        console.log(`Mutation received: id=${id}, voltage=${voltage}`);
        const entry = gridData.find((item) => item.id === id);
        if (entry) {
          entry.voltage = voltage;
          entry.timestamp = new Date().toISOString();
          console.log(`Updated gridData: ${JSON.stringify(gridData)}`);
          return entry;
        }
        console.log(`No entry found for id: ${id}`);
        return null;
      },
    },
  },
});

const Subscription = new GraphQLObjectType({
  name: "Subscription",
  fields: {
    gridUpdate: {
      type: GridType,
      subscribe: async function* () {
        while (true) {
          const entry = gridData.find((item) => item.id === "1");
          const newVoltage = entry.voltage + Math.floor(Math.random() * 10) - 5;
          entry.voltage = Math.max(220, Math.min(239, newVoltage));
          entry.timestamp = new Date().toISOString();
          const update = { gridUpdate: { ...entry } };
          console.log(`Subscription yielding: ${JSON.stringify(update)}`);
          yield update;
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      },
    },
  },
});

const schema = new GraphQLSchema({
  query: Query,
  mutation: Mutation,
  subscription: Subscription,
});

const wsServer = new WebSocketServer({
  server,
  path: "/graphql",
});

server.listen(4000, () => {
  console.log("WebSocket server running on ws://localhost:4000/graphql");
  SubscriptionServer.create({ schema, execute, subscribe }, wsServer);
});
