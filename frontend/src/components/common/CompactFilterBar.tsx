import { useState, useMemo } from 'react';
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
  setFiscalYearFilter,
  clearAllFilters,
} from '../../store/slices/filtersSlice';

interface CompactFilterBarProps {
  domains?: Array<{ id: number; name: string }>;
  businessDecisions?: string[];
  fiscalYears?: string[];
  showDomainFilter?: boolean;
  showBusinessDecisionFilter?: boolean;
  showFiscalYearFilter?: boolean;
  extraActions?: React.ReactNode;
}

const CompactFilterBar: React.FC<CompactFilterBarProps> = ({
  domains = [],
  businessDecisions = [],
  fiscalYears = [],
  showDomainFilter = true,
  showBusinessDecisionFilter = true,
  showFiscalYearFilter = true,
  extraActions,
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { selectedDomainIds, selectedBusinessDecisions, selectedFiscalYears } = useAppSelector(
    (state) => state.filters
  );
  const [expanded, setExpanded] = useState(false);

  // Sort filter values alphabetically
  const sortedDomains = useMemo(() =>
    [...domains].sort((a, b) => a.name.localeCompare(b.name)),
    [domains]
  );

  const sortedBusinessDecisions = useMemo(() =>
    [...businessDecisions].sort((a, b) => a.localeCompare(b)),
    [businessDecisions]
  );

  const sortedFiscalYears = useMemo(() =>
    [...fiscalYears].sort((a, b) => a.localeCompare(b)),
    [fiscalYears]
  );

  const hasActiveFilters =
    selectedDomainIds.length > 0 || selectedBusinessDecisions.length > 0 || selectedFiscalYears.length > 0;

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

  const handleRemoveFiscalYear = (fiscalYear: string) => {
    dispatch(
      setFiscalYearFilter(
        selectedFiscalYears.filter((fy) => fy !== fiscalYear)
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

  const handleToggleFiscalYear = (fiscalYear: string) => {
    if (selectedFiscalYears.includes(fiscalYear)) {
      dispatch(
        setFiscalYearFilter(
          selectedFiscalYears.filter((fy) => fy !== fiscalYear)
        )
      );
    } else {
      dispatch(setFiscalYearFilter([...selectedFiscalYears, fiscalYear]));
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
          const domain = sortedDomains.find((d) => d.id === domainId);
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

        {/* Fiscal Year Chips */}
        {selectedFiscalYears.map((fiscalYear) => (
          <Chip
            key={fiscalYear}
            label={fiscalYear}
            size="small"
            onDelete={() => handleRemoveFiscalYear(fiscalYear)}
            color="info"
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
            {showDomainFilter && sortedDomains.length > 0 && (
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
                  {sortedDomains.map((domain) => (
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
            {showBusinessDecisionFilter && sortedBusinessDecisions.length > 0 && (
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
                  {sortedBusinessDecisions.map((decision) => (
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

            {/* Fiscal Year Filter */}
            {showFiscalYearFilter && sortedFiscalYears.length > 0 && (
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
                  Fiscal Year
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {sortedFiscalYears.map((fiscalYear) => (
                    <Chip
                      key={fiscalYear}
                      label={fiscalYear}
                      size="small"
                      onClick={() => handleToggleFiscalYear(fiscalYear)}
                      color={
                        selectedFiscalYears.includes(fiscalYear)
                          ? 'info'
                          : 'default'
                      }
                      variant={
                        selectedFiscalYears.includes(fiscalYear)
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
