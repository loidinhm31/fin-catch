import { useCallback, useEffect, useRef, useState } from "react";
import { PortfolioEntry } from "@fin-catch/shared";
import {
  listEntries,
  createEntry as createEntryService,
  updateEntry as updateEntryService,
  deleteEntry as deleteEntryService,
} from "@fin-catch/ui/services";

export const usePortfolioEntries = (portfolioId: string | null) => {
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteErrorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setDeleteErrorWithTimeout = (msg: string) => {
    if (deleteErrorTimer.current) clearTimeout(deleteErrorTimer.current);
    setDeleteError(msg);
    deleteErrorTimer.current = setTimeout(() => setDeleteError(null), 5000);
  };

  const loadEntries = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const entryList = await listEntries(id);
      setEntries(entryList);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entries");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createEntry = async (entry: PortfolioEntry) => {
    await createEntryService(entry);
    if (portfolioId) {
      await loadEntries(portfolioId);
    }
  };

  const updateEntry = async (entry: PortfolioEntry) => {
    await updateEntryService(entry);
    if (portfolioId) {
      await loadEntries(portfolioId);
    }
  };

  const deleteEntry = async (entryId: string) => {
    setDeleteError(null);
    try {
      await deleteEntryService(entryId);
      if (portfolioId) {
        await loadEntries(portfolioId);
      }
    } catch (err) {
      setDeleteErrorWithTimeout(
        err instanceof Error ? err.message : "Failed to delete entry",
      );
    }
  };

  useEffect(() => {
    if (portfolioId) {
      loadEntries(portfolioId);
    }
  }, [portfolioId]);

  useEffect(() => {
    return () => {
      if (deleteErrorTimer.current) clearTimeout(deleteErrorTimer.current);
    };
  }, []);

  return {
    entries,
    isLoading,
    error,
    setError,
    deleteError,
    loadEntries,
    createEntry,
    updateEntry,
    deleteEntry,
  };
};
