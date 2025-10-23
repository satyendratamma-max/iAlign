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
  LinearProgress,
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
  yearsOfExperience?: number;
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
  minYearsExp?: number;
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
  capabilities?: Capability[];
}

interface ResourceWithScore extends Resource {
  matchScore: number;
  bestCapability?: Capability;
  bestRequirement?: Requirement;
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

// Proficiency level scoring weights (matching backend logic)
const PROFICIENCY_SCORES: Record<string, number> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Expert: 4,
};

// Match score calculation weights (matching backend logic)
const WEIGHTS = {
  EXACT_MATCH: 40, // App/Tech/Role exact match
  PROFICIENCY: 30, // Proficiency level match
  EXPERIENCE: 20, // Years of experience match
  IS_PRIMARY: 10, // Whether this is a primary capability
};

/**
 * Calculate match score between a resource capability and a project requirement
 * Matches backend logic from resourceMatcher.ts
 */
const calculateMatchScore = (capability: Capability, requirement: Requirement): number => {
  let score = 0;

  // 1. Exact Match Score (40 points)
  if (
    capability.appId === requirement.appId &&
    capability.technologyId === requirement.technologyId &&
    capability.roleId === requirement.roleId
  ) {
    score += WEIGHTS.EXACT_MATCH;
  } else {
    return 0; // No match at all
  }

  // 2. Proficiency Level Score (30 points)
  const capabilityProficiency = PROFICIENCY_SCORES[capability.proficiencyLevel];
  const requirementProficiency = PROFICIENCY_SCORES[requirement.proficiencyLevel];

  if (capabilityProficiency >= requirementProficiency) {
    if (capabilityProficiency === requirementProficiency) {
      score += WEIGHTS.PROFICIENCY;
    } else {
      const excess = capabilityProficiency - requirementProficiency;
      score += WEIGHTS.PROFICIENCY * (1 - excess * 0.1);
    }
  } else {
    const gap = requirementProficiency - capabilityProficiency;
    score += WEIGHTS.PROFICIENCY * Math.max(0, 1 - gap * 0.3);
  }

  // 3. Years of Experience Score (20 points)
  if (requirement.minYearsExp !== undefined && requirement.minYearsExp !== null) {
    const resourceYears = capability.yearsOfExperience || 0;

    if (resourceYears >= requirement.minYearsExp) {
      if (resourceYears === requirement.minYearsExp) {
        score += WEIGHTS.EXPERIENCE;
      } else {
        const excess = Math.min(resourceYears - requirement.minYearsExp, 5);
        score += WEIGHTS.EXPERIENCE * (1 - excess * 0.05);
      }
    } else {
      const gap = requirement.minYearsExp - resourceYears;
      score += WEIGHTS.EXPERIENCE * Math.max(0, 1 - gap * 0.15);
    }
  } else {
    score += WEIGHTS.EXPERIENCE;
  }

  // 4. Is Primary Capability Bonus (10 points)
  if (capability.isPrimary) {
    score += WEIGHTS.IS_PRIMARY;
  } else {
    score += WEIGHTS.IS_PRIMARY * 0.7;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
};

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
  const [availableResources, setAvailableResources] = useState<ResourceWithScore[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<number | undefined>(resource?.id);
  const [minMatchScore, setMinMatchScore] = useState<number>(0);

  useEffect(() => {
    if (open && project) {
      // If no resource is provided, load all available resources
      if (!resource) {
        loadAvailableResources();
      } else {
        setSelectedResourceId(resource.id);
      }

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
    }
  }, [open, resource, project, allocation]);

  useEffect(() => {
    // Load capabilities and requirements when resource is selected
    if (selectedResourceId && project) {
      loadCapabilitiesAndRequirements();
    }
  }, [selectedResourceId, project]);

  const loadAvailableResources = async () => {
    if (!project) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Load resources with capabilities and project requirements in parallel
      const [resourcesRes, reqRes] = await Promise.all([
        axios.get(`${API_URL}/resources`, config),
        axios.get(`${API_URL}/project-requirements/project/${project.id}`, config),
      ]);

      const resources = resourcesRes.data.data || [];
      const projectRequirements = reqRes.data.data || [];

      // Load capabilities for each resource
      const resourcesWithCapabilities = await Promise.all(
        resources.map(async (res: Resource) => {
          try {
            const capRes = await axios.get(`${API_URL}/resource-capabilities?resourceId=${res.id}`, config);
            return { ...res, capabilities: capRes.data.data || [] };
          } catch (error) {
            return { ...res, capabilities: [] };
          }
        })
      );

      // Calculate match scores for each resource
      const resourcesWithScores: ResourceWithScore[] = resourcesWithCapabilities.map((res) => {
        let bestScore = 0;
        let bestCapability: Capability | undefined;
        let bestRequirement: Requirement | undefined;

        // Find the best match between any capability and any requirement
        if (res.capabilities && res.capabilities.length > 0 && projectRequirements.length > 0) {
          res.capabilities.forEach((cap: Capability) => {
            projectRequirements.forEach((req: Requirement) => {
              const score = calculateMatchScore(cap, req);
              if (score > bestScore) {
                bestScore = score;
                bestCapability = cap;
                bestRequirement = req;
              }
            });
          });
        }

        return {
          ...res,
          matchScore: bestScore,
          bestCapability,
          bestRequirement,
        };
      });

      // Sort by match score (highest first)
      resourcesWithScores.sort((a, b) => b.matchScore - a.matchScore);

      setAvailableResources(resourcesWithScores);
      setRequirements(projectRequirements);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCapabilitiesAndRequirements = async () => {
    if (!selectedResourceId || !project) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [capRes, reqRes] = await Promise.all([
        axios.get(`${API_URL}/resource-capabilities?resourceId=${selectedResourceId}`, config),
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
    if (!selectedResourceId || !project) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const allocationData = {
        resourceId: selectedResourceId,
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
    setAvailableResources([]);
    setSelectedResourceId(undefined);
    setMinMatchScore(0);
    onClose();
  };

  const getMatchIndicator = () => {
    if (!selectedCapabilityId || !selectedRequirementId) return null;

    const cap = capabilities.find(c => c.id === selectedCapabilityId);
    const req = requirements.find(r => r.id === selectedRequirementId);

    if (!cap || !req) return null;

    const matchScore = calculateMatchScore(cap, req);

    // Determine color based on score
    let color: 'error' | 'warning' | 'success' = 'error';
    let label = 'Poor Match';

    if (matchScore >= 80) {
      color = 'success';
      label = 'Excellent Match';
    } else if (matchScore >= 60) {
      color = 'success';
      label = 'Good Match';
    } else if (matchScore >= 40) {
      color = 'warning';
      label = 'Fair Match';
    }

    return (
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" fontWeight="medium">
            Match Score
          </Typography>
          <Chip
            label={`${matchScore}% - ${label}`}
            color={color}
            size="small"
          />
        </Box>
        <LinearProgress
          variant="determinate"
          value={matchScore}
          color={color}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Box>
    );
  };

  const selectedResourceData = resource || availableResources.find(r => r.id === selectedResourceId);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditMode ? 'Edit Allocation' : 'Quick Allocation'}
        <Typography variant="body2" color="text.secondary">
          {selectedResourceData ? (
            `${selectedResourceData.firstName} ${selectedResourceData.lastName} → ${project?.name}`
          ) : (
            `Select a resource → ${project?.name}`
          )}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {/* Resource Selector (only when no resource is pre-selected) */}
          {!resource && (
            <>
              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom>
                  Minimum Match Score: {minMatchScore}%
                </Typography>
                <Slider
                  value={minMatchScore}
                  onChange={(_, value) => setMinMatchScore(value as number)}
                  min={0}
                  max={100}
                  step={10}
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 50, label: '50%' },
                    { value: 80, label: '80%' },
                    { value: 100, label: '100%' },
                  ]}
                  valueLabelDisplay="auto"
                />
              </Grid>
              <Grid item xs={12}>
                <Autocomplete
                  fullWidth
                  options={availableResources.filter(r => r.matchScore >= minMatchScore)}
                  getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.employeeId}) - ${option.matchScore}%`}
                  value={availableResources.find(r => r.id === selectedResourceId) || null}
                  onChange={(_, newValue) => {
                    setSelectedResourceId(newValue?.id);
                    // When resource changes, capabilities will be loaded by the useEffect
                    // But we can pre-populate from the loaded data
                    if (newValue?.capabilities) {
                      setCapabilities(newValue.capabilities);
                    }
                    // Auto-select the best matching capability and requirement
                    if (newValue?.bestCapability) {
                      setSelectedCapabilityId(newValue.bestCapability.id);
                    }
                    if (newValue?.bestRequirement) {
                      setSelectedRequirementId(newValue.bestRequirement.id);
                    }
                  }}
                  loading={loading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Resource *"
                      placeholder="Search resources..."
                      required
                      helperText={
                        availableResources.filter(r => r.matchScore >= minMatchScore).length === 0
                          ? 'No resources match the current filter'
                          : `${availableResources.filter(r => r.matchScore >= minMatchScore).length} resources available`
                      }
                    />
                  )}
                  renderOption={(props, option) => {
                    const matchColor =
                      option.matchScore >= 80 ? 'success' :
                      option.matchScore >= 60 ? 'primary' :
                      option.matchScore >= 40 ? 'warning' : 'error';

                    return (
                      <li {...props} key={option.id}>
                        <Box sx={{ width: '100%' }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {option.firstName} {option.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {option.employeeId}
                              </Typography>
                            </Box>
                            <Chip
                              label={`${option.matchScore}%`}
                              color={matchColor as any}
                              size="small"
                            />
                          </Box>
                          {option.bestCapability && (
                            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                              Best match: {option.bestCapability.app.code}/{option.bestCapability.technology.code}/{option.bestCapability.role.code}
                            </Typography>
                          )}
                        </Box>
                      </li>
                    );
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  noOptionsText={minMatchScore > 0 ? "No resources match the minimum score" : "No resources available"}
                />
              </Grid>
            </>
          )}

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

          {/* Match Score Indicator */}
          {selectedCapabilityId && selectedRequirementId && (
            <Grid item xs={12}>
              {getMatchIndicator()}
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={loading || !selectedResourceId}>
          {isEditMode ? 'Update' : 'Allocate'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickAllocationDialog;
