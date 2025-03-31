import { ApolloCache } from "@apollo/client";
import { GET_GRID_DATA } from "../graphql/graphql";
import { GridEntry } from "../hooks/useGridData";

//* Update cache with new grid entry
export function updateGridCache(
  cache: ApolloCache<{ grid: GridEntry[] }>,
  newEntry: GridEntry,
  operation: "update" | "add" | "delete"
) {
  const cachedData = cache.readQuery<{ grid: GridEntry[] }>({
    query: GET_GRID_DATA,
  });
  if (!cachedData) return;

  let updatedGrid: GridEntry[];
  switch (operation) {
    case "update":
      updatedGrid = cachedData.grid.map((entry) =>
        entry.id === newEntry.id ? newEntry : entry
      );
      break;
    case "add":
      updatedGrid = [...cachedData.grid, newEntry];
      break;
    case "delete":
      updatedGrid = cachedData.grid.filter((entry) => entry.id !== newEntry.id);
      break;
    default:
      return;
  }

  cache.writeQuery({
    query: GET_GRID_DATA,
    data: { grid: updatedGrid },
  });
}
