import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface LoadingState {
  isLoading: boolean;
  message: string | null;
  error: string | null;
}

interface LoadingContextType extends LoadingState {
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  setLoadingError: (error: string) => void;
  clearError: () => void;
  navigateWithLoading: <T>(
    navigateFn: () => T | Promise<T>,
    options?: { message?: string; minDuration?: number }
  ) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

const MIN_LOADING_DURATION = 300;

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLoading = useCallback((msg?: string) => {
    startTimeRef.current = Date.now();
    setMessage(msg || null);
    setError(null);
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, MIN_LOADING_DURATION - elapsed);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setIsLoading(false);
      timerRef.current = null;
    }, remaining);
  }, []);

  const setLoadingError = useCallback((err: string) => {
    setError(err);
    setIsLoading(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const navigateWithLoading = useCallback(async <T,>(
    navigateFn: () => T | Promise<T>,
    options?: { message?: string; minDuration?: number }
  ): Promise<T> => {
    const minDuration = options?.minDuration ?? MIN_LOADING_DURATION;
    const loadStart = Date.now();
    startLoading(options?.message);

    try {
      const result = await Promise.resolve(navigateFn());
      const elapsed = Date.now() - loadStart;
      const remaining = Math.max(0, minDuration - elapsed);

      await new Promise((resolve) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setIsLoading(false);
          timerRef.current = null;
          resolve(undefined);
        }, remaining);
      });

      return result;
    } catch (err: any) {
      setLoadingError(err?.message || 'Navigation failed. Please try again.');
      throw err;
    }
  }, [startLoading, setLoadingError]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      startLoading('Loading...');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [startLoading]);

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        message,
        error,
        startLoading,
        stopLoading,
        setLoadingError,
        clearError,
        navigateWithLoading,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

export function useLoading(): LoadingContextType {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return ctx;
}
