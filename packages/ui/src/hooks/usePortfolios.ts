import { useCallback, useEffect, useState } from "react";
import { Portfolio } from "@repo/shared";
import { finCatchAPI } from "@repo/ui/services";

export const usePortfolios = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPortfolios = useCallback(async () => {
    setIsLoading(true);
    try {
      const portfolioList = await finCatchAPI.listPortfolios();
      setPortfolios(portfolioList);
      if (portfolioList.length > 0 && !selectedPortfolioId) {
        setSelectedPortfolioId(portfolioList[0].id);
      }
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load portfolios",
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedPortfolioId]);

  const createPortfolio = async (portfolio: Portfolio): Promise<string> => {
    const portfolioId = await finCatchAPI.createPortfolio(portfolio);
    await loadPortfolios();
    setSelectedPortfolioId(portfolioId);
    return portfolioId;
  };

  const deletePortfolio = async (portfolioId: string) => {
    await finCatchAPI.deletePortfolio(portfolioId);
    await loadPortfolios();
    if (selectedPortfolioId === portfolioId) {
      setSelectedPortfolioId(portfolios.length > 1 ? portfolios[0].id : null);
    }
  };

  useEffect(() => {
    loadPortfolios();
  }, []);

  const selectedPortfolio = portfolios.find(
    (p) => p.id === selectedPortfolioId,
  );

  return {
    portfolios,
    selectedPortfolioId,
    selectedPortfolio,
    setSelectedPortfolioId,
    isLoading,
    error,
    setError,
    loadPortfolios,
    createPortfolio,
    deletePortfolio,
  };
};
