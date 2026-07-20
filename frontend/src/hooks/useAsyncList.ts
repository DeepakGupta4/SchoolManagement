"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseAsyncListResult<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Debounced, race-safe list fetching shared by every module's list page.
 *
 * `fetcher` must be referentially stable across renders that shouldn't
 * refetch — wrap it in useCallback with the filter values as deps.
 */
export function useAsyncList<T>(
  fetcher: () => Promise<T[]>,
  { debounceMs = 250 }: { debounceMs?: number } = {}
): UseAsyncListResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const run = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher();
      if (id !== requestId.current) return; // a newer request already won
      setItems(data);
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    // Debounce so each keystroke in a search box isn't a request.
    const timer = setTimeout(run, debounceMs);
    return () => clearTimeout(timer);
  }, [run, debounceMs]);

  return { items, loading, error, refetch: run };
}
