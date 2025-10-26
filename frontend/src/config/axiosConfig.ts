import axios, { AxiosError } from 'axios';
import store from '../store';
import { logout } from '../store/slices/authSlice';

// Global error handler instance - will be set by App.tsx
let globalErrorHandler: ((error: any) => void) | null = null;

export const setGlobalErrorHandler = (handler: (error: any) => void) => {
  globalErrorHandler = handler;
};

// Helper function to determine error type
const getErrorType = (error: AxiosError): 'network' | 'timeout' | 'server' => {
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return 'timeout';
  }
  if (!error.response) {
    // No response means network error (backend down, no internet, etc.)
    return 'network';
  }
  return 'server';
};

// Helper function to get user-friendly error message
const getErrorMessage = (error: AxiosError): string => {
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return 'The request took too long to complete. Please check your connection and try again.';
  }

  if (!error.response) {
    return 'Cannot connect to the server. The backend may be offline or unreachable.';
  }

  const status = error.response.status;
  switch (status) {
    case 500:
      return 'The server encountered an internal error. Please try again or contact support.';
    case 502:
    case 503:
    case 504:
      return 'The server is temporarily unavailable. Please try again in a few moments.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
};

// Global axios request interceptor - adds auth token to all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global axios response interceptor - handles errors
axios.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized (token expired or invalid)
    if (error.response?.status === 401) {
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Dispatch logout action to Redux store
      store.dispatch(logout());

      // Redirect to login page
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Handle network errors, timeouts, and server errors (5xx)
    const errorType = getErrorType(error);
    const shouldShowDialog =
      errorType === 'network' ||
      errorType === 'timeout' ||
      (error.response?.status && error.response.status >= 500);

    if (shouldShowDialog && globalErrorHandler) {
      const backendError = {
        type: errorType,
        message: getErrorMessage(error),
        endpoint: error.config?.url,
        timestamp: new Date().toISOString(),
        details: error.response?.data
          ? JSON.stringify(error.response.data, null, 2)
          : error.message,
      };

      // Show the error dialog
      globalErrorHandler(backendError);
    }

    return Promise.reject(error);
  }
);

export default axios;
