import { useState } from 'react';
import {
  Box,
  Chip,
  Button,
  Collapse,
  Paper,
  IconButton,
  Divider,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import {
  setDomainFilter,
  setBusinessDecisionFilter,
  clearAllFilters,
} from '../../store/slices/filtersSlice';

interface CompactFilterBarProps {
  domains?: Array<{ id: number; name: string }>;
  businessDecisions?: string[];
  showDomainFilter?: boolean;
  showBusinessDecisionFilter?: boolean;
  extraActions?: React.ReactNode;
}

const CompactFilterBar: React.FC<CompactFilterBarProps> = ({
  domains = [],
  businessDecisions = [],
  showDomainFilter = true,
  showBusinessDecisionFilter = true,
  extraActions,
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { selectedDomainIds, selectedBusinessDecisions } = useAppSelector(
    (state) => state.filters
  );
  const [expanded, setExpanded] = useState(false);

  const hasActiveFilters =
    selectedDomainIds.length > 0 || selectedBusinessDecisions.length > 0;

  const handleRemoveDomain = (domainId: number) => {
    dispatch(setDomainFilter(selectedDomainIds.filter((id) => id !== domainId)));
  };

  const handleRemoveBusinessDecision = (decision: string) => {
    dispatch(
      setBusinessDecisionFilter(
        selectedBusinessDecisions.filter((d) => d !== decision)
      )
    );
  };

  const handleClearAll = () => {
    dispatch(clearAllFilters());
  };

  const handleToggleDomain = (domainId: number) => {
    if (selectedDomainIds.includes(domainId)) {
      dispatch(setDomainFilter(selectedDomainIds.filter((id) => id !== domainId)));
    } else {
      dispatch(setDomainFilter([...selectedDomainIds, domainId]));
    }
  };

  const handleToggleBusinessDecision = (decision: string) => {
    if (selectedBusinessDecisions.includes(decision)) {
      dispatch(
        setBusinessDecisionFilter(
          selectedBusinessDecisions.filter((d) => d !== decision)
        )
      );
    } else {
      dispatch(setBusinessDecisionFilter([...selectedBusinessDecisions, decision]));
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2,
        backgroundColor: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(8px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 1.5,
        overflow: 'hidden',
      }}
    >
      {/* Active Filters Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
          p: 1.5,
          minHeight: 56,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
          <FilterIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
          <Box
            component="span"
            sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.secondary' }}
          >
            Filters:
          </Box>
        </Box>

        {/* Domain Chips */}
        {selectedDomainIds.map((domainId) => {
          const domain = domains.find((d) => d.id === domainId);
          return domain ? (
            <Chip
              key={domainId}
              label={domain.name}
              size="small"
              onDelete={() => handleRemoveDomain(domainId)}
              color="primary"
              variant="filled"
              sx={{
                height: 28,
                fontSize: '0.8125rem',
                fontWeight: 500,
              }}
            />
          ) : null;
        })}

        {/* Business Decision Chips */}
        {selectedBusinessDecisions.map((decision) => (
          <Chip
            key={decision}
            label={decision}
            size="small"
            onDelete={() => handleRemoveBusinessDecision(decision)}
            color="secondary"
            variant="filled"
            sx={{
              height: 28,
              fontSize: '0.8125rem',
              fontWeight: 500,
            }}
          />
        ))}

        {/* Add Filter Button */}
        {!expanded && (
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setExpanded(true)}
            sx={{
              height: 28,
              fontSize: '0.8125rem',
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Add Filter
          </Button>
        )}

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Clear All Button */}
        {hasActiveFilters && (
          <Button
            size="small"
            onClick={handleClearAll}
            sx={{
              height: 28,
              fontSize: '0.8125rem',
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Clear All
          </Button>
        )}

        {/* Extra Actions */}
        {extraActions}

        {/* Toggle Filters Button */}
        {expanded && (
          <IconButton
            size="small"
            onClick={() => setExpanded(false)}
            sx={{ ml: 1 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Expandable Filter Options */}
      <Collapse in={expanded} timeout="auto">
        <Divider />
        <Box sx={{ p: 2, bgcolor: alpha(theme.palette.background.default, 0.3) }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Domain Filter */}
            {showDomainFilter && domains.length > 0 && (
              <Box>
                <Box
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                    mb: 1,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Domain
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {domains.map((domain) => (
                    <Chip
                      key={domain.id}
                      label={domain.name}
                      size="small"
                      onClick={() => handleToggleDomain(domain.id)}
                      color={
                        selectedDomainIds.includes(domain.id) ? 'primary' : 'default'
                      }
                      variant={
                        selectedDomainIds.includes(domain.id) ? 'filled' : 'outlined'
                      }
                      sx={{
                        cursor: 'pointer',
                        height: 32,
                        fontSize: '0.8125rem',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Business Decision Filter */}
            {showBusinessDecisionFilter && businessDecisions.length > 0 && (
              <Box>
                <Box
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'text.secondary',
                    mb: 1,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Business Decision
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {businessDecisions.map((decision) => (
                    <Chip
                      key={decision}
                      label={decision}
                      size="small"
                      onClick={() => handleToggleBusinessDecision(decision)}
                      color={
                        selectedBusinessDecisions.includes(decision)
                          ? 'secondary'
                          : 'default'
                      }
                      variant={
                        selectedBusinessDecisions.includes(decision)
                          ? 'filled'
                          : 'outlined'
                      }
                      sx={{
                        cursor: 'pointer',
                        height: 32,
                        fontSize: '0.8125rem',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default CompactFilterBar;
