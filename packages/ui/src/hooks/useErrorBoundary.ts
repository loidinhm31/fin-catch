import { useState, useCallback } from "react";

/**
 * Hook for imperative error boundary control
 *
 * Can be used to programmatically trigger the error boundary
 * from event handlers or async operations.
 */
export function useErrorBoundary(): {
  error: Error | null;
  showBoundary: (error: Error) => void;
  resetBoundary: () => void;
} {
  const [error, setError] = useState<Error | null>(null);

  const showBoundary = useCallback((error: Error) => {
    setError(error);
  }, []);

  const resetBoundary = useCallback(() => {
    setError(null);
  }, []);

  // If there's an error, throw it to trigger the nearest error boundary
  if (error) {
    throw error;
  }

  return {
    error,
    showBoundary,
    resetBoundary,
  };
}
