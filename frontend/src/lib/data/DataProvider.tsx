import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type DataRefreshContextValue = {
  refreshKey: number;
  invalidate: () => void;
};

const DataRefreshContext = createContext<DataRefreshContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const invalidate = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  const value = useMemo(
    () => ({ refreshKey, invalidate }),
    [refreshKey, invalidate],
  );

  return (
    <DataRefreshContext.Provider value={value}>
      {children}
    </DataRefreshContext.Provider>
  );
}

export function useDataRefresh(): DataRefreshContextValue {
  const value = useContext(DataRefreshContext);
  if (!value) {
    throw new Error("useDataRefresh must be used within DataProvider");
  }
  return value;
}
