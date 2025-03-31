import { gql } from "@apollo/client";

//* Query - Fetch initial grid data
export const GET_GRID_DATA = gql`
  query GetGridData {
    grid {
      id
      voltage
      timestamp
    }
  }
`;

//* Subscription - Real-time updates for grid nodes
export const GRID_SUBSCRIPTION = gql`
  subscription OnGridUpdate {
    gridUpdate {
      id
      voltage
      timestamp
    }
  }
`;

//* Mutation - Update voltage for a specific node
export const UPDATE_VOLTAGE = gql`
  mutation UpdateVoltage($id: String!, $voltage: Int!) {
    updateVoltage(id: $id, voltage: $voltage) {
      id
      voltage
      timestamp
    }
  }
`;

//* Mutation - Add a new node to the grid
export const ADD_NODE = gql`
  mutation AddNode($id: String!) {
    addNode(id: $id) {
      id
      voltage
      timestamp
    }
  }
`;

//* Mutation - Remove a node from the grid
export const DELETE_NODE = gql`
  mutation DeleteNode($id: String!) {
    deleteNode(id: $id) {
      id
      voltage
      timestamp
    }
  }
`;
