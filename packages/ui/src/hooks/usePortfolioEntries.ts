import { useEffect, useState, useCallback } from "react";
import { PortfolioEntry } from "../types";
import { finCatchAPI } from "../services/api";

export const usePortfolioEntries = (portfolioId: string | null) => {
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const entryList = await finCatchAPI.listEntries(id);
      setEntries(entryList);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entries");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createEntry = async (entry: PortfolioEntry) => {
    await finCatchAPI.createEntry(entry);
    if (portfolioId) {
      await loadEntries(portfolioId);
    }
  };

  const updateEntry = async (entry: PortfolioEntry) => {
    await finCatchAPI.updateEntry(entry);
    if (portfolioId) {
      await loadEntries(portfolioId);
    }
  };

  const deleteEntry = async (entryId: string) => {
    await finCatchAPI.deleteEntry(entryId);
    if (portfolioId) {
      await loadEntries(portfolioId);
    }
  };

  useEffect(() => {
    if (portfolioId) {
      loadEntries(portfolioId);
    }
  }, [portfolioId]);

  return {
    entries,
    isLoading,
    error,
    setError,
    loadEntries,
    createEntry,
    updateEntry,
    deleteEntry,
  };
};
