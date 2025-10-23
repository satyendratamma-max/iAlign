import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Typography,
  Slider,
  Box,
  Chip,
  FormControlLabel,
  Checkbox,
  Autocomplete,
} from '@mui/material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface Capability {
  id: number;
  appId: number;
  technologyId: number;
  roleId: number;
  proficiencyLevel: string;
  isPrimary: boolean;
  app: { id: number; name: string; code: string };
  technology: { id: number; name: string; code: string };
  role: { id: number; name: string; code: string; level: string };
}

interface Requirement {
  id: number;
  appId: number;
  technologyId: number;
  roleId: number;
  proficiencyLevel: string;
  requiredCount: number;
  fulfilledCount: number;
  app: { id: number; name: string; code: string };
  technology: { id: number; name: string; code: string };
  role: { id: number; name: string; code: string; level: string };
}

interface Resource {
  id: number;
  employeeId: string;
  firstName?: string;
  lastName?: string;
  domainId?: number;
}

interface Project {
  id: number;
  name: string;
  status: string;
  startDate?: string;
  endDate?: string;
  domainId?: number;
  businessDecision?: string;
}

interface Allocation {
  id: number;
  allocationPercentage: number;
  allocationType: string;
  startDate: string;
  endDate: string;
  resourceCapabilityId?: number;
  projectRequirementId?: number;
}

interface QuickAllocationDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  resource: Resource | null;
  project: Project | null;
  scenarioId: number;
  allocation?: Allocation | null; // Optional: for edit mode
}

const QuickAllocationDialog = ({
  open,
  onClose,
  onSave,
  resource,
  project,
  scenarioId,
  allocation,
}: QuickAllocationDialogProps) => {
  const isEditMode = !!allocation;
  const [allocationPercentage, setAllocationPercentage] = useState(100);
  const [allocationType, setAllocationType] = useState('Shared');
  const [useProjectDuration, setUseProjectDuration] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [selectedCapabilityId, setSelectedCapabilityId] = useState<number | undefined>();
  const [selectedRequirementId, setSelectedRequirementId] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && resource && project) {
      // If editing, pre-populate form with allocation data
      if (isEditMode && allocation) {
        setAllocationPercentage(allocation.allocationPercentage);
        setAllocationType(allocation.allocationType);
        setStartDate(allocation.startDate?.split('T')[0] || '');
        setEndDate(allocation.endDate?.split('T')[0] || '');
        setSelectedCapabilityId(allocation.resourceCapabilityId);
        setSelectedRequirementId(allocation.projectRequirementId);

        // Check if using project duration
        const usesProjectDuration =
          allocation.startDate === project.startDate &&
          allocation.endDate === project.endDate;
        setUseProjectDuration(usesProjectDuration);
      } else {
        // Set default dates from project for new allocation
        if (project.startDate && project.endDate) {
          setStartDate(project.startDate.split('T')[0]);
          setEndDate(project.endDate.split('T')[0]);
          setUseProjectDuration(true);
        } else {
          setUseProjectDuration(false);
        }
      }

      // Load capabilities and requirements
      loadCapabilitiesAndRequirements();
    }
  }, [open, resource, project, allocation]);

  const loadCapabilitiesAndRequirements = async () => {
    if (!resource || !project) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [capRes, reqRes] = await Promise.all([
        axios.get(`${API_URL}/resource-capabilities?resourceId=${resource.id}`, config),
        axios.get(`${API_URL}/project-requirements/project/${project.id}`, config),
      ]);

      const capsData = capRes.data.data || [];
      const reqsData = reqRes.data.data || [];

      setCapabilities(capsData);
      setRequirements(reqsData);

      // Auto-select best matching capability and requirement
      if (capsData.length > 0 && reqsData.length > 0) {
        // Try to find matching app/tech/role
        const bestMatch = capsData.find((cap: Capability) =>
          reqsData.some(
            (req: Requirement) =>
              req.appId === cap.appId &&
              req.technologyId === cap.technologyId &&
              req.roleId === cap.roleId
          )
        );

        if (bestMatch) {
          setSelectedCapabilityId(bestMatch.id);
          const matchingReq = reqsData.find(
            (req: Requirement) =>
              req.appId === bestMatch.appId &&
              req.technologyId === bestMatch.technologyId &&
              req.roleId === bestMatch.roleId
          );
          if (matchingReq) {
            setSelectedRequirementId(matchingReq.id);
          }
        } else {
          // Select primary capability if available
          const primary = capsData.find((c: Capability) => c.isPrimary);
          setSelectedCapabilityId(primary?.id || capsData[0].id);
          setSelectedRequirementId(reqsData[0]?.id);
        }
      }
    } catch (error) {
      console.error('Error loading capabilities/requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!resource || !project) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const allocationData = {
        resourceId: resource.id,
        projectId: project.id,
        scenarioId,
        allocationPercentage,
        allocationType,
        startDate: useProjectDuration ? project.startDate : startDate,
        endDate: useProjectDuration ? project.endDate : endDate,
        resourceCapabilityId: selectedCapabilityId,
        projectRequirementId: selectedRequirementId,
        isActive: true,
      };

      if (isEditMode && allocation) {
        // Update existing allocation
        await axios.put(`${API_URL}/allocations/${allocation.id}`, allocationData, config);
      } else {
        // Create new allocation
        await axios.post(`${API_URL}/allocations`, allocationData, config);
      }

      onSave();
      handleClose();
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} allocation:`, error);
    }
  };

  const handleClose = () => {
    setAllocationPercentage(100);
    setAllocationType('Shared');
    setUseProjectDuration(true);
    setStartDate('');
    setEndDate('');
    setCapabilities([]);
    setRequirements([]);
    setSelectedCapabilityId(undefined);
    setSelectedRequirementId(undefined);
    onClose();
  };

  const getMatchIndicator = () => {
    if (!selectedCapabilityId || !selectedRequirementId) return null;

    const cap = capabilities.find(c => c.id === selectedCapabilityId);
    const req = requirements.find(r => r.id === selectedRequirementId);

    if (!cap || !req) return null;

    const isMatch =
      cap.appId === req.appId &&
      cap.technologyId === req.technologyId &&
      cap.roleId === req.roleId;

    return (
      <Chip
        label={isMatch ? 'Good Match' : 'Different Skill Set'}
        color={isMatch ? 'success' : 'warning'}
        size="small"
        sx={{ mt: 1 }}
      />
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditMode ? 'Edit Allocation' : 'Quick Allocation'}
        <Typography variant="body2" color="text.secondary">
          {resource?.firstName} {resource?.lastName} → {project?.name}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {/* Allocation Percentage */}
          <Grid item xs={12}>
            <Typography gutterBottom>
              Allocation Percentage: {allocationPercentage}%
            </Typography>
            <Slider
              value={allocationPercentage}
              onChange={(_, value) => setAllocationPercentage(value as number)}
              min={1}
              max={100}
              step={5}
              marks={[
                { value: 25, label: '25%' },
                { value: 50, label: '50%' },
                { value: 75, label: '75%' },
                { value: 100, label: '100%' },
              ]}
              valueLabelDisplay="auto"
            />
          </Grid>

          {/* Allocation Type */}
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              label="Allocation Type"
              value={allocationType}
              onChange={(e) => setAllocationType(e.target.value)}
            >
              <MenuItem value="Shared">Shared</MenuItem>
              <MenuItem value="Dedicated">Dedicated</MenuItem>
              <MenuItem value="On-Demand">On-Demand</MenuItem>
            </TextField>
          </Grid>

          {/* Duration */}
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={useProjectDuration}
                  onChange={(e) => setUseProjectDuration(e.target.checked)}
                />
              }
              label="Use full project duration"
            />
          </Grid>

          {!useProjectDuration && (
            <>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </>
          )}

          {useProjectDuration && project?.startDate && project?.endDate && (
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                Duration: {new Date(project.startDate).toLocaleDateString()} -{' '}
                {new Date(project.endDate).toLocaleDateString()}
              </Typography>
            </Grid>
          )}

          {/* Resource Capability */}
          <Grid item xs={12}>
            <Autocomplete
              fullWidth
              options={capabilities}
              getOptionLabel={(option) => `${option.app.code}/${option.technology.code}/${option.role.code}`}
              value={capabilities.find(c => c.id === selectedCapabilityId) || null}
              onChange={(_, newValue) => setSelectedCapabilityId(newValue?.id)}
              disabled={loading || capabilities.length === 0}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Resource Capability"
                  placeholder="Search capabilities..."
                  helperText={capabilities.length === 0 ? 'No capabilities available' : ''}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {option.app.code}/{option.technology.code}/{option.role.code}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.proficiencyLevel}
                      {option.isPrimary && ' • Primary'}
                    </Typography>
                  </Box>
                </li>
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          </Grid>

          {/* Project Requirement */}
          <Grid item xs={12}>
            <Autocomplete
              fullWidth
              options={requirements}
              getOptionLabel={(option) => `${option.app.code}/${option.technology.code}/${option.role.code}`}
              value={requirements.find(r => r.id === selectedRequirementId) || null}
              onChange={(_, newValue) => setSelectedRequirementId(newValue?.id)}
              disabled={loading || requirements.length === 0}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Project Requirement"
                  placeholder="Search requirements..."
                  helperText={requirements.length === 0 ? 'No requirements available' : ''}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {option.app.code}/{option.technology.code}/{option.role.code}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Need: {option.proficiencyLevel} ({option.fulfilledCount}/{option.requiredCount})
                    </Typography>
                  </Box>
                </li>
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          </Grid>

          {/* Match Indicator */}
          {getMatchIndicator() && (
            <Grid item xs={12}>
              <Box display="flex" justifyContent="center">
                {getMatchIndicator()}
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          {isEditMode ? 'Update' : 'Allocate'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickAllocationDialog;
