import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Checkbox,
  FormControlLabel,
  Typography,
  Chip,
  Alert,
} from '@mui/material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export interface Capability {
  id?: number;
  resourceId?: number;
  appId: number;
  technologyId: number;
  roleId: number;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  isPrimary: boolean;
  yearsOfExperience?: number;
  certifications?: string;
  lastUsedDate?: string;
  endorsements?: number;
  isActive?: boolean;
}

interface App {
  id: number;
  name: string;
  code: string;
  category: string;
  isGlobal: boolean;
}

interface Technology {
  id: number;
  appId?: number;
  name: string;
  code: string;
  category: string;
  stackType: string;
  app?: {
    id: number;
    name: string;
    code: string;
  };
}

interface Role {
  id: number;
  appId?: number;
  technologyId?: number;
  name: string;
  code: string;
  level?: string;
  category: string;
  app?: {
    id: number;
    name: string;
    code: string;
  };
  technology?: {
    id: number;
    name: string;
    code: string;
  };
}

interface CapabilityBuilderProps {
  value: Capability;
  onChange: (capability: Capability) => void;
  showPrimary?: boolean;
  disabled?: boolean;
}

const CapabilityBuilder: React.FC<CapabilityBuilderProps> = ({
  value,
  onChange,
  showPrimary = true,
  disabled = false,
}) => {
  const [apps, setApps] = useState<App[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Fetch all apps on mount
  useEffect(() => {
    fetchApps();
  }, []);

  // Fetch technologies when app changes
  useEffect(() => {
    if (value.appId) {
      fetchTechnologies(value.appId);
    } else {
      setTechnologies([]);
    }
  }, [value.appId]);

  // Fetch roles when app or technology changes
  useEffect(() => {
    if (value.appId) {
      fetchRoles(value.appId, value.technologyId);
    } else {
      setRoles([]);
    }
  }, [value.appId, value.technologyId]);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/apps`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApps(response.data.data);
      setError('');
    } catch (err: any) {
      setError('Failed to load apps');
      console.error('Error fetching apps:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnologies = async (appId: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/technologies?appId=${appId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTechnologies(response.data.data);
      setError('');
    } catch (err: any) {
      setError('Failed to load technologies');
      console.error('Error fetching technologies:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async (appId: number, technologyId?: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = `${API_URL}/roles?appId=${appId}`;
      if (technologyId) {
        url += `&technologyId=${technologyId}`;
      }
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoles(response.data.data);
      setError('');
    } catch (err: any) {
      setError('Failed to load roles');
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAppChange = (event: SelectChangeEvent<number>) => {
    const newAppId = event.target.value as number;
    onChange({
      ...value,
      appId: newAppId,
      technologyId: 0, // Reset technology when app changes
      roleId: 0, // Reset role when app changes
    });
  };

  const handleTechnologyChange = (event: SelectChangeEvent<number>) => {
    const newTechnologyId = event.target.value as number;
    onChange({
      ...value,
      technologyId: newTechnologyId,
      roleId: 0, // Reset role when technology changes
    });
  };

  const handleRoleChange = (event: SelectChangeEvent<number>) => {
    onChange({
      ...value,
      roleId: event.target.value as number,
    });
  };

  const handleProficiencyChange = (event: SelectChangeEvent<string>) => {
    onChange({
      ...value,
      proficiencyLevel: event.target.value as Capability['proficiencyLevel'],
    });
  };

  const handleYearsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      yearsOfExperience: event.target.value ? parseInt(event.target.value) : undefined,
    });
  };

  const handlePrimaryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      isPrimary: event.target.checked,
    });
  };

  const selectedApp = apps.find((app) => app.id === value.appId);
  const selectedTechnology = technologies.find((tech) => tech.id === value.technologyId);
  const selectedRole = roles.find((role) => role.id === value.roleId);

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* App Selection */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required disabled={disabled}>
            <InputLabel>Application</InputLabel>
            <Select
              value={value.appId || ''}
              onChange={handleAppChange}
              label="Application"
            >
              {apps.map((app) => (
                <MenuItem key={app.id} value={app.id}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <span>{app.name}</span>
                    <Chip
                      label={app.category}
                      size="small"
                      color={app.isGlobal ? 'secondary' : 'primary'}
                      sx={{ height: 20 }}
                    />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Technology Selection (Cascaded by App) */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required disabled={!value.appId || disabled}>
            <InputLabel>Technology</InputLabel>
            <Select
              value={value.technologyId || ''}
              onChange={handleTechnologyChange}
              label="Technology"
            >
              {technologies.map((tech) => (
                <MenuItem key={tech.id} value={tech.id}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <span>{tech.name}</span>
                    <Chip
                      label={tech.stackType}
                      size="small"
                      sx={{ height: 20 }}
                    />
                    {!tech.appId && (
                      <Chip
                        label="Global"
                        size="small"
                        color="secondary"
                        sx={{ height: 20 }}
                      />
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {value.appId && technologies.length === 0 && !loading && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                No technologies available for this app
              </Typography>
            )}
          </FormControl>
        </Grid>

        {/* Role Selection (Cascaded by App + Technology) */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required disabled={!value.technologyId || disabled}>
            <InputLabel>Role</InputLabel>
            <Select
              value={value.roleId || ''}
              onChange={handleRoleChange}
              label="Role"
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <span>{role.name}</span>
                    {role.level && (
                      <Chip
                        label={role.level}
                        size="small"
                        color="info"
                        sx={{ height: 20 }}
                      />
                    )}
                    {!role.appId && !role.technologyId && (
                      <Chip
                        label="Global"
                        size="small"
                        color="secondary"
                        sx={{ height: 20 }}
                      />
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {value.technologyId && roles.length === 0 && !loading && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                No roles available for this combination
              </Typography>
            )}
          </FormControl>
        </Grid>

        {/* Proficiency Level */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required disabled={disabled}>
            <InputLabel>Proficiency Level</InputLabel>
            <Select
              value={value.proficiencyLevel || 'Intermediate'}
              onChange={handleProficiencyChange}
              label="Proficiency Level"
            >
              <MenuItem value="Beginner">Beginner</MenuItem>
              <MenuItem value="Intermediate">Intermediate</MenuItem>
              <MenuItem value="Advanced">Advanced</MenuItem>
              <MenuItem value="Expert">Expert</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Years of Experience */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Years of Experience"
            type="number"
            value={value.yearsOfExperience || ''}
            onChange={handleYearsChange}
            disabled={disabled}
            inputProps={{ min: 0, max: 50 }}
          />
        </Grid>

        {/* Primary Capability Checkbox */}
        {showPrimary && (
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={value.isPrimary || false}
                  onChange={handlePrimaryChange}
                  disabled={disabled}
                />
              }
              label="Primary Capability"
            />
            {value.isPrimary && (
              <Typography variant="caption" color="text.secondary" display="block">
                This will be the primary capability for this resource
              </Typography>
            )}
          </Grid>
        )}
      </Grid>

      {/* Display selected capability summary */}
      {selectedApp && selectedTechnology && selectedRole && (
        <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
          <Typography variant="subtitle2" gutterBottom>
            Selected Capability:
          </Typography>
          <Typography variant="body2">
            <strong>{selectedApp.name}</strong> → <strong>{selectedTechnology.name}</strong> →{' '}
            <strong>{selectedRole.name}</strong> ({value.proficiencyLevel})
            {value.yearsOfExperience && ` • ${value.yearsOfExperience} years`}
            {value.isPrimary && ' • Primary'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CapabilityBuilder;
