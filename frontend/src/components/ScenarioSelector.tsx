import { FormControl, Select, MenuItem, Chip, Box, Typography, SelectChangeEvent } from '@mui/material';
import { useScenario } from '../contexts/ScenarioContext';
import { Scenario } from '../services/scenarioApi';

const ScenarioSelector = () => {
  const { scenarios, activeScenario, setActiveScenario, loading } = useScenario();

  const handleChange = (event: SelectChangeEvent<number>) => {
    const scenarioId = event.target.value as number;
    const scenario = scenarios.find(s => s.id === scenarioId) || null;
    setActiveScenario(scenario);
  };

  if (loading || scenarios.length === 0) {
    return null;
  }

  return (
    <Box sx={{ minWidth: 250 }}>
      <FormControl fullWidth size="small">
        <Select
          value={activeScenario?.id || ''}
          onChange={handleChange}
          displayEmpty
          sx={{
            backgroundColor: 'background.paper',
            '& .MuiSelect-select': {
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            },
          }}
        >
          <MenuItem value="" disabled>
            <Typography variant="body2" color="text.secondary">Select Scenario</Typography>
          </MenuItem>
          {scenarios.map((scenario: Scenario) => (
            <MenuItem key={scenario.id} value={scenario.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {scenario.name}
                </Typography>
                <Chip
                  label={scenario.status}
                  size="small"
                  color={scenario.status === 'published' ? 'success' : 'default'}
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default ScenarioSelector;
