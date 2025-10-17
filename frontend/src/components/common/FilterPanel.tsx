import React, { ReactNode, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Collapse,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';

interface FilterPanelProps {
  children: ReactNode;
  title?: string;
  defaultExpanded?: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  children,
  title = 'Filters',
  defaultExpanded = true,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const theme = useTheme();

  return (
    <Paper
      elevation={1}
      sx={{
        mb: 2,
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 1.5,
        backgroundColor: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(8px)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          backgroundColor: alpha(theme.palette.primary.main, 0.04),
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
          },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <FilterListIcon
            sx={{
              fontSize: 20,
              color: theme.palette.primary.main,
            }}
          />
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: theme.palette.text.primary,
              fontSize: '0.9375rem',
            }}
          >
            {title}
          </Typography>
        </Box>
        <IconButton
          size="small"
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s',
          }}
        >
          <ExpandMoreIcon />
        </IconButton>
      </Box>
      <Collapse in={expanded} timeout="auto">
        <Box sx={{ p: 2, pt: 1.5 }}>{children}</Box>
      </Collapse>
    </Paper>
  );
};

export default FilterPanel;
