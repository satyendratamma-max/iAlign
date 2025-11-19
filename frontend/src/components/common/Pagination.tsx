import { Box, Button, MenuItem, Select, Typography } from '@mui/material';
import {
  FirstPage,
  LastPage,
  NavigateBefore,
  NavigateNext,
} from '@mui/icons-material';

interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onFirstPage: () => void;
  onLastPage: () => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  pageSizeOptions?: number[];
}

const Pagination = ({
  page,
  pageSize,
  totalItems,
  totalPages,
  startIndex,
  endIndex,
  onPageChange,
  onPageSizeChange,
  onFirstPage,
  onLastPage,
  onNextPage,
  onPreviousPage,
  hasNextPage,
  hasPreviousPage,
  pageSizeOptions = [10, 25, 50, 100, 200],
}: PaginationProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        borderTop: 1,
        borderColor: 'divider',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[50]
            : theme.palette.grey[900],
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Rows per page:
        </Typography>
        <Select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          size="small"
          sx={{ minWidth: 80 }}
        >
          {pageSizeOptions.map((size) => (
            <MenuItem key={size} value={size}>
              {size}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <Typography variant="body2" color="text.secondary">
        Showing {Math.min(startIndex + 1, totalItems)}-{Math.min(endIndex, totalItems)} of{' '}
        {totalItems}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Button
          size="small"
          onClick={onFirstPage}
          disabled={!hasPreviousPage}
          sx={{ minWidth: 'auto', p: 0.5 }}
        >
          <FirstPage />
        </Button>
        <Button
          size="small"
          onClick={onPreviousPage}
          disabled={!hasPreviousPage}
          sx={{ minWidth: 'auto', p: 0.5 }}
        >
          <NavigateBefore />
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mx: 2 }}>
          <Typography variant="body2">Page</Typography>
          <Select
            value={page}
            onChange={(e) => onPageChange(Number(e.target.value))}
            size="small"
            sx={{ minWidth: 70 }}
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </Select>
          <Typography variant="body2">of {totalPages}</Typography>
        </Box>

        <Button
          size="small"
          onClick={onNextPage}
          disabled={!hasNextPage}
          sx={{ minWidth: 'auto', p: 0.5 }}
        >
          <NavigateNext />
        </Button>
        <Button
          size="small"
          onClick={onLastPage}
          disabled={!hasNextPage}
          sx={{ minWidth: 'auto', p: 0.5 }}
        >
          <LastPage />
        </Button>
      </Box>
    </Box>
  );
};

export default Pagination;
