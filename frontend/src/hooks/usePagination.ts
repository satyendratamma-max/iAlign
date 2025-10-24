import { useState, useMemo } from 'react';

interface PaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

/**
 * Hook for client-side pagination of large datasets
 * Reduces render time by only displaying a subset of data
 *
 * @param data - The full dataset to paginate
 * @param options - Pagination configuration
 * @returns Paginated data and pagination controls
 */
export function usePagination<T>(data: T[], options: PaginationOptions = {}) {
  const { initialPage = 1, initialPageSize = 50 } = options;

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Calculate pagination values
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  // Memoize the paginated data to avoid recalculation on every render
  const paginatedData = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const nextPage = () => goToPage(page + 1);
  const previousPage = () => goToPage(page - 1);
  const goToFirstPage = () => setPage(1);
  const goToLastPage = () => setPage(totalPages);

  const changePageSize = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  };

  return {
    paginatedData,
    page,
    pageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
    changePageSize,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
