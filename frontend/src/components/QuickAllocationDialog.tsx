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
  utilizationRate?: number;
  capabilities?: Capability[];
}

interface ResourceWithScore extends Resource {
  matchScore: number;
  bestCapability?: Capability;
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
  allocation?: Allocation | null;
}

// Proficiency level scoring weights
const PROFICIENCY_SCORES: Record<string, number> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Expert: 4,
};

// Match score calculation weights
const WEIGHTS = {
  EXACT_MATCH: 40,
  PROFICIENCY: 30,
  EXPERIENCE: 20,
  IS_PRIMARY: 10,
};

/**
 * Calculate match score between a resource capability and a project requirement
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
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [selectedRequirementId, setSelectedRequirementId] = useState<number | undefined>();
  const [availableResources, setAvailableResources] = useState<ResourceWithScore[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<number | undefined>(resource?.id);
  const [selectedCapabilityId, setSelectedCapabilityId] = useState<number | undefined>();
  const [minMatchScore, setMinMatchScore] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && project) {
      const initializeDialog = async () => {
        // Load requirements first
        const loadedRequirements = await loadProjectRequirements();

        // If editing, pre-populate form with allocation data
        if (isEditMode && allocation) {
          setAllocationPercentage(allocation.allocationPercentage);
          setAllocationType(allocation.allocationType);
          setStartDate(allocation.startDate?.split('T')[0] || '');
          setEndDate(allocation.endDate?.split('T')[0] || '');
          setSelectedCapabilityId(allocation.resourceCapabilityId);
          setSelectedRequirementId(allocation.projectRequirementId);
          setSelectedResourceId(resource?.id);

          // Check if using project duration
          const usesProjectDuration =
            allocation.startDate === project.startDate &&
            allocation.endDate === project.endDate;
          setUseProjectDuration(usesProjectDuration);

          // Load matching resources for the selected requirement in edit mode
          if (allocation.projectRequirementId && loadedRequirements) {
            // Find the requirement from the loaded data
            const selectedRequirement = loadedRequirements.find(r => r.id === allocation.projectRequirementId);
            if (selectedRequirement) {
              await loadMatchingResourcesForEdit(selectedRequirement);
            }
          }
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
      };

      initializeDialog();
    }
  }, [open, resource, project, allocation]);

  const loadProjectRequirements = async (): Promise<Requirement[] | undefined> => {
    if (!project) return undefined;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const reqRes = await axios.get(`${API_URL}/project-requirements/project/${project.id}`, config);
      const loadedRequirements = reqRes.data.data || [];
      setRequirements(loadedRequirements);
      return loadedRequirements;
    } catch (error) {
      console.error('Error loading requirements:', error);
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  const loadMatchingResources = async (requirementId: number) => {
    if (!project) return;

    const selectedRequirement = requirements.find(r => r.id === requirementId);
    if (!selectedRequirement) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Load all resources
      const resourcesRes = await axios.get(`${API_URL}/resources`, config);
      const resources = resourcesRes.data.data || [];

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

      // Calculate match scores for the selected requirement
      const resourcesWithScores: ResourceWithScore[] = resourcesWithCapabilities.map((res) => {
        let bestScore = 0;
        let bestCapability: Capability | undefined;

        if (res.capabilities && res.capabilities.length > 0) {
          res.capabilities.forEach((cap: Capability) => {
            const score = calculateMatchScore(cap, selectedRequirement);
            if (score > bestScore) {
              bestScore = score;
              bestCapability = cap;
            }
          });
        }

        return {
          ...res,
          matchScore: bestScore,
          bestCapability,
        };
      });

      // Sort by match score (highest first)
      resourcesWithScores.sort((a, b) => b.matchScore - a.matchScore);

      setAvailableResources(resourcesWithScores);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  // Similar to loadMatchingResources but for edit mode - doesn't clear selections
  const loadMatchingResourcesForEdit = async (selectedRequirement: Requirement) => {
    if (!project) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Load all resources
      const resourcesRes = await axios.get(`${API_URL}/resources`, config);
      const resources = resourcesRes.data.data || [];

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

      // Calculate match scores for the selected requirement
      const resourcesWithScores: ResourceWithScore[] = resourcesWithCapabilities.map((res) => {
        let bestScore = 0;
        let bestCapability: Capability | undefined;

        if (res.capabilities && res.capabilities.length > 0) {
          res.capabilities.forEach((cap: Capability) => {
            const score = calculateMatchScore(cap, selectedRequirement);
            if (score > bestScore) {
              bestScore = score;
              bestCapability = cap;
            }
          });
        }

        return {
          ...res,
          matchScore: bestScore,
          bestCapability,
        };
      });

      // Sort by match score (highest first)
      resourcesWithScores.sort((a, b) => b.matchScore - a.matchScore);

      setAvailableResources(resourcesWithScores);
    } catch (error) {
      console.error('Error loading resources for edit mode:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequirementChange = (requirementId: number | undefined) => {
    setSelectedRequirementId(requirementId);
    setSelectedResourceId(undefined);
    setSelectedCapabilityId(undefined);
    setAvailableResources([]);

    if (requirementId) {
      loadMatchingResources(requirementId);
    }
  };

  const handleResourceChange = (resourceId: number | undefined, bestCapabilityId?: number) => {
    setSelectedResourceId(resourceId);
    if (bestCapabilityId) {
      setSelectedCapabilityId(bestCapabilityId);
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
        await axios.put(`${API_URL}/allocations/${allocation.id}`, allocationData, config);
      } else {
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
    setRequirements([]);
    setSelectedRequirementId(undefined);
    setAvailableResources([]);
    setSelectedResourceId(undefined);
    setSelectedCapabilityId(undefined);
    setMinMatchScore(0);
    onClose();
  };

  const getMatchIndicator = () => {
    if (!selectedCapabilityId || !selectedRequirementId) return null;

    const selectedResource = availableResources.find(r => r.id === selectedResourceId);
    const selectedRequirement = requirements.find(r => r.id === selectedRequirementId);

    if (!selectedResource?.bestCapability || !selectedRequirement) return null;

    const matchScore = calculateMatchScore(selectedResource.bestCapability, selectedRequirement);

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
  const selectedRequirement = requirements.find(r => r.id === selectedRequirementId);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditMode ? 'Edit Allocation' : 'Quick Allocation'}
        <Typography variant="body2" color="text.secondary">
          {project?.name}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {/* Step 1: Select Project Requirement */}
          <Grid item xs={12}>
            <Autocomplete
              fullWidth
              options={requirements}
              getOptionLabel={(option) =>
                `${option.app.code}/${option.technology.code}/${option.role.code} - ${option.proficiencyLevel}`
              }
              value={selectedRequirement || null}
              onChange={(_, newValue) => handleRequirementChange(newValue?.id)}
              disabled={loading || isEditMode}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={isEditMode ? "Project Requirement" : "1. Select Project Requirement *"}
                  placeholder={isEditMode ? "" : "Choose the skill needed..."}
                  required
                  helperText={
                    isEditMode ? '' :
                    selectedRequirement
                      ? `Need ${selectedRequirement.requiredCount} resource(s) - ${selectedRequirement.fulfilledCount} fulfilled`
                      : 'Select a requirement first'
                  }
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="body2" fontWeight="medium">
                      {option.app.code}/{option.technology.code}/{option.role.code}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        {option.proficiencyLevel}
                        {option.minYearsExp && ` • ${option.minYearsExp}+ years exp`}
                      </Typography>
                      <Chip
                        label={`${option.fulfilledCount}/${option.requiredCount} filled`}
                        size="small"
                        color={option.fulfilledCount >= option.requiredCount ? 'success' : 'warning'}
                      />
                    </Box>
                  </Box>
                </li>
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          </Grid>

          {/* Step 2: Match Score Filter (only show when requirement is selected, or always in edit mode) */}
          {(selectedRequirementId && availableResources.length > 0) || (isEditMode && selectedRequirementId) ? (
            <>
              {!isEditMode && (
                <Grid item xs={12}>
                  <Typography variant="body2" gutterBottom>
                    2. Filter by Minimum Match Score: {minMatchScore}%
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
              )}

              {/* Step 3: Select Matching Resource */}
              <Grid item xs={12}>
                <Autocomplete
                  fullWidth
                  options={availableResources.filter(r => isEditMode || r.matchScore >= minMatchScore)}
                  getOptionLabel={(option) =>
                    `${option.firstName} ${option.lastName} (${option.employeeId})${!isEditMode ? ` - ${option.matchScore}%` : ''}`
                  }
                  value={availableResources.find(r => r.id === selectedResourceId) || null}
                  onChange={(_, newValue) => handleResourceChange(newValue?.id, newValue?.bestCapability?.id)}
                  loading={loading}
                  disabled={isEditMode}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={isEditMode ? "Resource" : "3. Select Resource *"}
                      placeholder={isEditMode ? "" : "Choose from matching resources..."}
                      required
                      helperText={
                        isEditMode ? '' :
                        availableResources.filter(r => r.matchScore >= minMatchScore).length === 0
                          ? 'No resources match the current filter - try lowering the match score'
                          : `${availableResources.filter(r => r.matchScore >= minMatchScore).length} matching resource(s) available`
                      }
                    />
                  )}
                  renderOption={(props, option) => {
                    const matchColor =
                      option.matchScore >= 80 ? 'success' :
                      option.matchScore >= 60 ? 'primary' :
                      option.matchScore >= 40 ? 'warning' : 'error';

                    const utilizationColor =
                      (option.utilizationRate || 0) >= 90 ? 'error' :
                      (option.utilizationRate || 0) >= 70 ? 'warning' : 'success';

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
                            <Box display="flex" gap={1} alignItems="center">
                              {option.utilizationRate !== undefined && option.utilizationRate !== null && (
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={option.utilizationRate}
                                    color={utilizationColor}
                                    sx={{ width: 40, height: 6, borderRadius: 1 }}
                                  />
                                  <Typography variant="caption" fontWeight="medium" sx={{ minWidth: 30 }}>
                                    {option.utilizationRate.toFixed(0)}%
                                  </Typography>
                                </Box>
                              )}
                              {!isEditMode && (
                                <Chip
                                  label={`${option.matchScore}%`}
                                  color={matchColor as any}
                                  size="small"
                                />
                              )}
                            </Box>
                          </Box>
                          {option.bestCapability && (
                            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                              Capability: {option.bestCapability.app.code}/{option.bestCapability.technology.code}/{option.bestCapability.role.code} - {option.bestCapability.proficiencyLevel}
                            </Typography>
                          )}
                        </Box>
                      </li>
                    );
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  noOptionsText={minMatchScore > 0 && !isEditMode ? "No resources match the minimum score" : "No resources available"}
                />
              </Grid>
            </>
          ) : null}

          {/* Match Score Indicator */}
          {selectedCapabilityId && selectedRequirementId && (
            <Grid item xs={12}>
              {getMatchIndicator()}
            </Grid>
          )}

          {/* Allocation Details (only show when resource is selected, or always in edit mode) */}
          {(selectedResourceId || isEditMode) && (
            <>
              {/* Allocation Percentage */}
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box flex={1}>
                    <Typography variant="body2" gutterBottom>
                      Allocation Percentage
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
                  </Box>
                  <TextField
                    type="number"
                    label="Percentage"
                    value={allocationPercentage}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      setAllocationPercentage(Math.max(1, Math.min(100, value)));
                    }}
                    inputProps={{ min: 1, max: 100 }}
                    sx={{ width: 100 }}
                    size="small"
                  />
                </Box>
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
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || !selectedResourceId || !selectedRequirementId}
        >
          {isEditMode ? 'Update' : 'Allocate'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickAllocationDialog;
