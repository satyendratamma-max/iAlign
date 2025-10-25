import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Fetch all pages from a paginated endpoint automatically
 * The backend returns: { success: true, data: [...], pagination: { total, page, limit, totalPages, hasMore } }
 *
 * @param endpoint - API endpoint (e.g., '/resources', '/projects')
 * @param config - Axios config (headers, params, etc.)
 * @param onProgress - Optional callback to report progress (current, total)
 * @returns Promise<any[]> - All records from all pages combined
 */
export const fetchAllPages = async (
  endpoint: string,
  config: any = {},
  onProgress?: (current: number, total: number) => void
): Promise<any[]> => {
  const allData: any[] = [];
  let currentPage = 1;
  let hasMore = true;
  let totalPages = 1;

  while (hasMore) {
    try {
      // Add page parameter to the request
      const pageConfig = {
        ...config,
        params: {
          ...config.params,
          page: currentPage,
          limit: 100, // Max page size for efficiency
        },
      };

      const response = await api.get(endpoint, pageConfig);

      // Check if response has pagination structure
      if (response.data.pagination) {
        // Paginated response
        allData.push(...response.data.data);
        hasMore = response.data.pagination.hasMore;
        totalPages = response.data.pagination.totalPages;

        // Report progress if callback provided
        if (onProgress) {
          onProgress(currentPage, totalPages);
        }

        currentPage++;
      } else {
        // Non-paginated response (old format) - return directly
        return Array.isArray(response.data.data) ? response.data.data : [];
      }
    } catch (error) {
      console.error(`Error fetching page ${currentPage} from ${endpoint}:`, error);
      throw error;
    }
  }

  return allData;
};

export default api;
