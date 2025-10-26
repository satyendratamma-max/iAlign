import { createContext, useContext, useState, ReactNode } from 'react';

export interface BackendError {
  type: 'network' | 'timeout' | 'server';
  message: string;
  endpoint?: string;
  timestamp: string;
  details?: string;
}

interface ErrorContextType {
  error: BackendError | null;
  showError: (error: BackendError) => void;
  clearError: () => void;
  retryCallback: (() => void) | null;
  setRetryCallback: (callback: (() => void) | null) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider = ({ children }: { children: ReactNode }) => {
  const [error, setError] = useState<BackendError | null>(null);
  const [retryCallback, setRetryCallback] = useState<(() => void) | null>(null);

  const showError = (newError: BackendError) => {
    setError(newError);
  };

  const clearError = () => {
    setError(null);
    setRetryCallback(null);
  };

  return (
    <ErrorContext.Provider
      value={{
        error,
        showError,
        clearError,
        retryCallback,
        setRetryCallback,
      }}
    >
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};
