import { useState, useRef } from "react";
import {
  useQuery,
  useMutation,
  useSubscription,
  ApolloError,
} from "@apollo/client";
import {
  GET_GRID_DATA,
  GRID_SUBSCRIPTION,
  UPDATE_VOLTAGE,
  ADD_NODE,
  DELETE_NODE,
} from "../graphql/graphql";

//* Type Definitions - Describe grid data structure
export type GridEntry = {
  id: string;
  voltage: number;
  timestamp: string;
};

//* Custom Hook - Manage grid data, state, and Apollo interactions
export function useGridData() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voltageHistory, setVoltageHistory] = useState<GridEntry[]>(() => {
    const saved = localStorage.getItem("voltageHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [updatedId, setUpdatedId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [timeFrame, setTimeFrame] = useState<"5m" | "15m" | "all">("5m");
  const [mutationLoading, setMutationLoading] = useState<{
    add?: boolean;
    delete?: boolean;
  }>({});
  const processedUpdatesRef = useRef<Set<string>>(new Set());

  //* Apollo Hooks - Fetch, subscribe, and mutate data
  const {
    loading: queryLoading,
    error: queryError,
    data: queryData,
    refetch,
  } = useQuery(GET_GRID_DATA, {
    fetchPolicy: "cache-and-network", //* Use cache first, then network for fresh data
    notifyOnNetworkStatusChange: true, //* Update loading state on refetch
  });

  const [updateVoltage] = useMutation(UPDATE_VOLTAGE);
  const [addNode] = useMutation(ADD_NODE);
  const [deleteNode] = useMutation(DELETE_NODE);

  const {
    data: subData,
    error: subError,
  }: { data?: { gridUpdate: GridEntry }; error?: ApolloError } =
    useSubscription(GRID_SUBSCRIPTION, {
      skip: paused || !queryData, //* Skip if paused or no initial data
      onSubscriptionData: ({ client, subscriptionData }) => {
        const newEntry = subscriptionData.data?.gridUpdate;
        if (!newEntry) return;
        const key = `${newEntry.id}-${newEntry.timestamp}-${newEntry.voltage}`;
        const cachedData = client.readQuery<{ grid: GridEntry[] }>({
          query: GET_GRID_DATA,
        });
        if (cachedData) {
          client.writeQuery({
            query: GET_GRID_DATA,
            data: {
              grid: cachedData.grid.map((entry) =>
                entry.id === newEntry.id ? newEntry : entry
              ),
            },
          });
          setVoltageHistory((prev) => {
            if (processedUpdatesRef.current.has(key)) return prev;
            processedUpdatesRef.current.add(key);
            return [...prev, newEntry].slice(-200); //* Keep last 200 entries
          });
        }
      },
    });

  return {
    isRefreshing,
    setIsRefreshing,
    paused,
    setPaused,
    voltageHistory,
    setVoltageHistory,
    updatedId,
    setUpdatedId,
    alerts,
    setAlerts,
    timeFrame,
    setTimeFrame,
    mutationLoading,
    setMutationLoading,
    processedUpdatesRef,
    queryLoading,
    queryError,
    queryData,
    refetch,
    updateVoltage,
    addNode,
    deleteNode,
    subData,
    subError,
  };
}
