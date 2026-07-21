"use client";

import { useCallback, useState } from "react";
import { useAsyncList } from "./useAsyncList";
import { useToast } from "@/components/ui";
import type { Resource, ResourceRecord } from "@/lib/api/createResource";

interface UseResourceOptions<T> {
  /** Singular noun for toast copy, e.g. "book" -> "Book added". */
  label: string;
  /** How to name a specific row in toast copy. Defaults to its id. */
  describe?: (row: T) => string;
}

/**
 * List + create/update/delete for one resource, with toasts and refetch wired
 * up. Pages supply filters and a form; everything else is handled here so each
 * module doesn't re-implement the same six handlers.
 */
export function useResource<T extends ResourceRecord, F, G extends keyof T = never>(
  resource: Resource<T, F, G>,
  filters: F,
  { label, describe }: UseResourceOptions<T>
) {
  const { toast } = useToast();

  // Filters arrive as a fresh object each render, so the fetcher is keyed on a
  // stable serialisation rather than the object identity.
  const filterKey = JSON.stringify(filters);
  const fetcher = useCallback(
    () => resource.list(JSON.parse(filterKey) as F),
    [resource, filterKey]
  );

  const { items, loading, error, refetch } = useAsyncList<T>(fetcher);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const name = (row: T) => describe?.(row) ?? row.id;
  const Label = label.charAt(0).toUpperCase() + label.slice(1);

  const fail = (verb: string, e: unknown) =>
    toast({
      title: `Could not ${verb} ${label}`,
      description: e instanceof Error ? e.message : "Something went wrong.",
      variant: "error",
    });

  /** Returns true on success so callers can close their modal. */
  const save = async (values: Omit<T, "id" | G>, editing?: T | null) => {
    setSaving(true);
    try {
      if (editing) {
        // `Omit<T, "id" | G>` is a strict subset of `Partial<Omit<T, "id">>`,
        // but TypeScript can't prove that while T and G are still generic.
        const updated = await resource.update(editing.id, values as Partial<Omit<T, "id">>);
        toast({ title: `${Label} updated`, description: `${name(updated)} was saved.` });
      } else {
        const created = await resource.create(values);
        toast({ title: `${Label} added`, description: `${name(created)} was created.` });
      }
      refetch();
      return true;
    } catch (e) {
      fail("save", e);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: T) => {
    setDeleting(true);
    try {
      await resource.remove(row.id);
      toast({ title: `${Label} removed`, description: `${name(row)} was deleted.` });
      refetch();
      return true;
    } catch (e) {
      fail("delete", e);
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return { items, loading, error, refetch, save, remove, saving, deleting };
}
