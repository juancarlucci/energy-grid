# **Frontend Documentation – App.tsx**

## **Introduction**

This document provides an in-depth breakdown of App.tsx, the core React component that powers the **Energy Grid Dashboard**. It integrates real-time grid monitoring using GraphQL queries, mutations, and subscriptions, while managing UI interactions and state updates.

## **1\. Purpose**

App.tsx is responsible for:

- Displaying a **dashboard** for monitoring energy grid nodes (e.g., Node 1, Node 2, Node 3).
- Handling **real-time voltage updates** via a GraphQL subscription (every ~3s from the server).
- **Plotting voltage history** on a chart with color-coded dots (green for safe, red for out-of-range).
- Allowing users to manually **update voltages, add/delete nodes, and filter data**.

## **2\. Key Features**

**FeatureDescriptionReal-Time Updates**Uses a GraphQL subscription to receive grid updates every ~3s.**Voltage Chart**Renders a line chart (VoltageChart) showing historical voltage data, filtered by time frame (5m, 15m, all).**Node Control**Displays GridNode components for each node, allowing voltage updates.**Control Panel**Provides buttons for adding, pausing, and refreshing nodes.**Alerts**Displays warnings when voltages go out of the safe range (223V–237V).**Persistence**Stores voltage history in localStorage for continuity across refreshes.

## **3\. State Management**

- **voltageHistory**: Stores an array of node voltage updates ({ id, voltage, timestamp }), capped at **200 entries**.
- **processedUpdatesRef**: Uses useRef to **prevent duplicate updates** (by tracking unique id-timestamp-voltage keys).
- **updatedId**: Tracks the **last updated node** for UI feedback (e.g., highlighting).
- **alerts**: Stores alert messages (e.g., "Voltage out of range!"), shown for **5 seconds**.
- **timeFrame**: Filters voltage history (**"5m", "15m", "all"**).
- **selectedNodes**: Manages **which nodes** appear in the chart.
- **paused**: Toggles **GraphQL subscription on/off**.
- **isRefreshing**: Indicates a **manual data refresh**.
- **mutationLoading**: Tracks **loading states** for node add/delete mutations.

## **4\. GraphQL Integration**

### **Queries & Subscriptions**

- **GET_GRID_DATA** – Fetches initial node data (id, voltage, timestamp).
- **GRID_SUBSCRIPTION** – Listens for real-time updates, updating the cache & history.

### **Mutations**

- **UPDATE_VOLTAGE** – Updates a node’s voltage.
- **ADD_NODE** – Adds a new node.
- **DELETE_NODE** – Removes a node.

## **5\. Key Functions**

### **1. updateHistory(newEntry, source, key)**

- Adds a new entry to voltageHistory if it’s **not a duplicate**.
- Uses processedUpdatesRef to prevent **double updates in React Strict Mode**.
- Logs updates for debugging (**e.g., "mutation" or "subscription"**).

### **2. handleUpdateVoltage(id, voltage)**

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`  const handleUpdateVoltage = (id: string, voltage: number) => {    const clampedVoltage = Math.min(239, Math.max(220, voltage));    updateVoltageMutation({ variables: { id, voltage: clampedVoltage } });  };  `

- Clamps voltage between **220V–239V**.
- Runs mutation to update the server.
- Skips optimistic updates to avoid UI flickering.

### **3. handleAddNode(id) & handleDeleteNode(id)**

- Handles **adding/removing** nodes from the system.
- Updates the **cache and UI** accordingly.

### **4. handleRefresh()**

- Fetches **fresh data** from the server.
- Updates voltageHistory and selectedNodes.

### **5. addAlert(message)**

- Displays a **temporary alert** (e.g., "Node 1 voltage 239V out of range!").

## **6\. UI Structure**

- **Header** – Displays "Energy Grid Dashboard" title.
- **Alerts** – Red popup warnings for out-of-range voltages, clearable.
- **Time Frame Selector** – Dropdown to filter chart data (**5m, 15m, all**).
- **Node Checkboxes** – Toggle visibility of nodes in the chart.
- **Control Panel** – Buttons for **pause, refresh, add/delete nodes**.
- **Chart** – Displays voltage history with color-coded dots (**green for safe, red for out-of-range**).
- **Node List** – Renders GridNode components with voltage input fields.

## **7\. How It Works Together**

### **1\. Initial Load**

- Runs GET_GRID_DATA query to **fetch node states**.
- Loads voltageHistory from localStorage.
- Sets selectedNodes to **all available nodes**.

### **2\. Real-Time Updates**

- **Subscription** listens for gridUpdate, updating the cache & history.
- **processedUpdatesRef** ensures only unique updates are added.

### **3\. Manual Updates**

- User modifies a node's voltage, triggering handleUpdateVoltage().
- Mutation runs with an **optimistic response**, then updates state.

### **4\. Chart Rendering**

- **filteredHistory** selects voltage data based on timeFrame & selectedNodes.
- **VoltageChart** plots the data with color indicators.

### **5\. Persistence**

- Every voltageHistory update saves to localStorage for continuity.

# Energy Grid Dashboard Components

This README provides an overview of the key React components used in the **Energy Grid Dashboard** application: ControlPanel, GridNode, and VoltageChart. These components work together to provide a real-time monitoring and control interface for energy grid nodes.

---

## 1. ControlPanel

### Description

The ControlPanel component provides user controls for managing the energy grid. It includes buttons for pausing/resuming updates, refreshing data, adding new nodes, and deleting existing nodes.

### Props

| Prop Name       | Type                                | Description                                           |
| --------------- | ----------------------------------- | ----------------------------------------------------- |
| paused          | boolean                             | Indicates whether the grid updates are paused.        |
| onTogglePause   | () => void                          | Callback to toggle the paused state.                  |
| onRefresh       | () => void                          | Callback to refresh the grid data.                    |
| onAddNode       | (id: string) => void                | Callback to add a new node with the specified ID.     |
| onDeleteNode    | (id: string) => void                | Callback to delete a node with the specified ID.      |
| loading         | boolean                             | Indicates whether the grid is currently loading data. |
| mutationLoading | { add?: boolean; delete?: boolean } | Tracks loading states for add/delete mutations.       |
| nodes           | { id: string }[]                    | Array of existing nodes, each with an id property.    |

### Key Features

- Pause/Resume updates with a toggle button.
- Refresh grid data manually.
- Add new nodes by entering an ID.
- Delete existing nodes using a dropdown selector.

---

## 2. GridNode

### Description

The GridNode component represents an individual energy grid node. It displays the node's current voltage and allows users to update it manually.

### Props

| Prop Name       | Type                                  | Description                                               |
| --------------- | ------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------- |
| entry           | GridEntry                             | The grid node data, including id, voltage, and timestamp. |
| updatedId       | string                                | null                                                      | The ID of the last updated node, used for UI highlighting. |
| onUpdateVoltage | (id: string, voltage: number) => void | Callback to update the voltage of the node.               |

### Key Features

- Displays the node's voltage, ID, and last update time.
- Allows users to input a new voltage value (clamped between 220V and 239V).
- Highlights the node if it was recently updated.

---

## 3. VoltageChart

### Description

The VoltageChart component renders a line chart showing the historical voltage data for all nodes. It uses the react-chartjs-2 library for visualization.

### Props

| Prop Name | Type        | Description                                                                         |
| --------- | ----------- | ----------------------------------------------------------------------------------- |
| history   | GridEntry[] | Array of historical voltage data, each entry containing id, voltage, and timestamp. |

### Key Features

- Plots voltage data over time for each node.
- Color-coded points:
  - **Green**: Voltage within the safe range (223V–237V).
  - **Red**: Voltage out of range.
  - **Gray**: Missing data.
- Dynamic line colors for each node.
- Tooltip displays voltage values and indicates if they are out of range.

---

## How These Components Work Together

1. **ControlPanel**: Provides user controls for managing the grid (e.g., adding/deleting nodes, pausing updates).
2. **GridNode**: Displays individual node data and allows manual voltage updates.
3. **VoltageChart**: Visualizes the historical voltage data for all nodes in a line chart.

These components are integrated into the main App.tsx file, which handles state management, GraphQL queries/mutations, and subscriptions to provide real-time updates.

---

## Example Usage

tsx
import { ControlPanel } from "./components/ControlPanel";
import { GridNode } from "./components/GridNode";
import { VoltageChart } from "./components/VoltageChart";

const App = () => {
// Example state and handlers
const [paused, setPaused] = useState(false);
const [history, setHistory] = useState([]);
const [nodes, setNodes] = useState([{ id: "1" }, { id: "2" }]);

const handleTogglePause = () => setPaused(!paused);
const handleRefresh = () => console.log("Refreshing data...");
const handleAddNode = (id) => console.log(`Adding node ${id}`);
const handleDeleteNode = (id) => console.log(`Deleting node ${id}`);
const handleUpdateVoltage = (id, voltage) =>
console.log(`Updating node ${id} to voltage ${voltage}`);

return (
<div>
<ControlPanel
paused={paused}
onTogglePause={handleTogglePause}
onRefresh={handleRefresh}
onAddNode={handleAddNode}
onDeleteNode={handleDeleteNode}
loading={false}
mutationLoading={{ add: false, delete: false }}
nodes={nodes}
/>
<ul>
{nodes.map((node) => (
<GridNode
key={node.id}
entry={{ id: node.id, voltage: 230, timestamp: new Date().toISOString() }}
updatedId={null}
onUpdateVoltage={handleUpdateVoltage}
/>
))}
</ul>
<VoltageChart history={history} />
</div>
);
};

export default App;
