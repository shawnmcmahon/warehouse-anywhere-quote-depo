import { useCallback, useEffect, useState } from "react";

export type ApiQueryResult<T> = {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useApiQuery<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  options?: { skip?: boolean },
): ApiQueryResult<T> {
  const skip = options?.skip ?? false;
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (skip) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
    // fetcher identity is controlled by the caller via deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, ...deps]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
