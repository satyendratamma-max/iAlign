import { useEffect, useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  Button,
  Box,
  SelectChangeEvent,
} from '@mui/material';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import {
  setDomainFilter,
  setBusinessDecisionFilter,
  clearAllFilters,
} from '../../store/slices/filtersSlice';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface Domain {
  id: number;
  name: string;
}

interface SharedFiltersProps {
  showClearButton?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

const SharedFilters = ({ showClearButton = true, orientation = 'horizontal' }: SharedFiltersProps) => {
  const dispatch = useAppDispatch();
  const { selectedDomainIds, selectedBusinessDecisions } = useAppSelector((state) => state.filters);
  const [domains, setDomains] = useState<Domain[]>([]);

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`${API_URL}/domains`, config);
        setDomains(response.data.data || []);
      } catch (error) {
        console.error('Error fetching domains:', error);
      }
    };

    fetchDomains();
  }, []);

  const handleDomainChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value;
    dispatch(setDomainFilter(typeof value === 'string' ? [] : value));
  };

  const handleBusinessDecisionChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    dispatch(setBusinessDecisionFilter(typeof value === 'string' ? [] : value));
  };

  const handleClearAll = () => {
    dispatch(clearAllFilters());
  };

  const businessDecisionOptions = ['Above Cutline', 'Below Cutline', 'Pending'];

  const containerSx = orientation === 'horizontal'
    ? { display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }
    : { display: 'flex', flexDirection: 'column', gap: 2 };

  return (
    <Box sx={containerSx}>
      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel id="shared-domain-filter-label">Filter by Domain</InputLabel>
        <Select
          labelId="shared-domain-filter-label"
          multiple
          value={selectedDomainIds}
          label="Filter by Domain"
          onChange={handleDomainChange}
          renderValue={(selected) =>
            selected.length > 0
              ? `${selected.length} selected`
              : 'All Domains'
          }
        >
          {domains.map((domain) => (
            <MenuItem key={domain.id} value={domain.id}>
              <Checkbox checked={selectedDomainIds.indexOf(domain.id) > -1} size="small" />
              {domain.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        size="small"
        select
        label="Business Decision"
        sx={{ minWidth: 200 }}
        value={selectedBusinessDecisions}
        onChange={handleBusinessDecisionChange as any}
        SelectProps={{
          multiple: true,
          renderValue: (selected) =>
            (selected as string[]).length > 0
              ? `${(selected as string[]).length} selected`
              : 'All',
        }}
      >
        {businessDecisionOptions.map((option) => (
          <MenuItem key={option} value={option}>
            <Checkbox checked={selectedBusinessDecisions.indexOf(option) > -1} size="small" />
            {option}
          </MenuItem>
        ))}
      </TextField>

      {showClearButton && (selectedDomainIds.length > 0 || selectedBusinessDecisions.length > 0) && (
        <Button variant="outlined" size="small" onClick={handleClearAll}>
          Clear Filters
        </Button>
      )}
    </Box>
  );
};

export default SharedFilters;
