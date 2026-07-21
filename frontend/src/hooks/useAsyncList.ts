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
  { debounceMs = 200 }: { debounceMs?: number } = {}
): UseAsyncListResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const hasFetched = useRef(false);

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
    // The first fetch of a page fires immediately — debouncing it just makes
    // every navigation feel slow for no benefit. Only subsequent fetches
    // (filter changes, search keystrokes) are debounced.
    // A 0ms timer rather than a direct call: `run` sets loading state before
    // its first await, and setState must not run synchronously in an effect.
    const wait = hasFetched.current ? debounceMs : 0;
    hasFetched.current = true;

    const timer = setTimeout(run, wait);
    return () => clearTimeout(timer);
  }, [run, debounceMs]);

  return { items, loading, error, refetch: run };
}
