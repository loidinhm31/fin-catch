import { useCallback, useEffect, useState } from "react";
import { Portfolio } from "@fin-catch/shared";
import { finCatchAPI } from "@fin-catch/ui/services";

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
      // Use functional update to avoid circular dependency on selectedPortfolioId
      setSelectedPortfolioId((prev) => {
        if (portfolioList.length > 0 && !prev) {
          return portfolioList[0].id;
        }
        return prev;
      });
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load portfolios",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

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
  }, [loadPortfolios]);

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
