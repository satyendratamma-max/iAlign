import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Tooltip,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
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
  role: { id: number; name: string; code: string };
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
  role: { id: number; name: string; code: string };
}

interface Resource {
  id: number;
  employeeId: string;
  firstName?: string;
  lastName?: string;
  domainId?: number;
  capabilities?: Capability[];
  domain?: {
    id: number;
    name: string;
  };
}

interface Project {
  id: number;
  name: string;
  status: string;
  domainId?: number;
  businessDecision?: string;
  domain?: {
    id: number;
    name: string;
  };
}

interface Allocation {
  id: number;
  projectId: number;
  resourceId: number;
  resourceCapabilityId?: number;
  projectRequirementId?: number;
  allocationType: string;
  allocationPercentage: number;
  matchScore?: number;
  startDate?: string;
  endDate?: string;
  resource?: Resource;
  project?: Project;
  resourceCapability?: Capability;
  projectRequirement?: Requirement;
}

interface Domain {
  id: number;
  name: string;
}

const ResourceAllocation = () => {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentAllocation, setCurrentAllocation] = useState<Partial<Allocation>>({
    allocationPercentage: 50,
    allocationType: 'Shared',
  });
  const [selectedResourceCapabilities, setSelectedResourceCapabilities] = useState<Capability[]>([]);
  const [selectedProjectRequirements, setSelectedProjectRequirements] = useState<Requirement[]>([]);
  const [filters, setFilters] = useState({
    resource: '',
    project: [] as string[],
    allocationType: [] as string[],
    matchScore: '',
    domainId: '',
    businessDecision: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [allocationsRes, resourcesRes, projectsRes, domainsRes] = await Promise.all([
        axios.get(`${API_URL}/allocations`, config),
        axios.get(`${API_URL}/resources`, config),
        axios.get(`${API_URL}/projects`, config),
        axios.get(`${API_URL}/domains`, config),
      ]);

      setAllocations(allocationsRes.data.data || []);
      setResources(resourcesRes.data.data || []);
      setProjects(projectsRes.data.data || []);
      setDomains(domainsRes.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (allocation?: Allocation) => {
    if (allocation) {
      setEditMode(true);
      setCurrentAllocation(allocation);

      // Pre-populate with existing capability/requirement if available
      if (allocation.resourceCapability) {
        setSelectedResourceCapabilities([allocation.resourceCapability]);
      }
      if (allocation.projectRequirement) {
        setSelectedProjectRequirements([allocation.projectRequirement]);
      }

      // Load all capabilities/requirements for the resource/project
      if (allocation.resourceId) {
        loadResourceCapabilities(allocation.resourceId);
      }
      if (allocation.projectId) {
        loadProjectRequirements(allocation.projectId);
      }
    } else {
      setEditMode(false);
      setCurrentAllocation({
        allocationPercentage: 50,
        allocationType: 'Shared',
      });
      setSelectedResourceCapabilities([]);
      setSelectedProjectRequirements([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentAllocation({
      allocationPercentage: 50,
      allocationType: 'Shared',
    });
    setSelectedResourceCapabilities([]);
    setSelectedProjectRequirements([]);
  };

  const loadResourceCapabilities = async (resourceId: number) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/resource-capabilities?resourceId=${resourceId}`, config);
      const capabilities = res.data.data || [];

      // Merge with existing capabilities to avoid duplicates
      setSelectedResourceCapabilities((prev) => {
        const existingIds = new Set(prev.map(c => c.id));
        const newCapabilities = capabilities.filter((c: Capability) => !existingIds.has(c.id));
        return [...prev, ...newCapabilities];
      });
    } catch (err) {
      console.error('Error loading resource capabilities:', err);
    }
  };

  const loadProjectRequirements = async (projectId: number) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/project-requirements/project/${projectId}`, config);
      const requirements = res.data.data || [];

      // Merge with existing requirements to avoid duplicates
      setSelectedProjectRequirements((prev) => {
        const existingIds = new Set(prev.map(r => r.id));
        const newRequirements = requirements.filter((r: Requirement) => !existingIds.has(r.id));
        return [...prev, ...newRequirements];
      });
    } catch (err) {
      console.error('Error loading project requirements:', err);
    }
  };

  const handleResourceChange = (resourceId: number) => {
    setCurrentAllocation({ ...currentAllocation, resourceId, resourceCapabilityId: undefined });
    setSelectedResourceCapabilities([]); // Clear previous capabilities
    loadResourceCapabilities(resourceId);
  };

  const handleProjectChange = (projectId: number) => {
    setCurrentAllocation({ ...currentAllocation, projectId, projectRequirementId: undefined });
    setSelectedProjectRequirements([]); // Clear previous requirements
    loadProjectRequirements(projectId);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editMode && currentAllocation.id) {
        await axios.put(`${API_URL}/allocations/${currentAllocation.id}`, currentAllocation, config);
      } else {
        await axios.post(`${API_URL}/allocations`, currentAllocation, config);
      }

      fetchData();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save allocation');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this allocation?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/allocations/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchData();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete allocation');
      }
    }
  };

  const getMatchScoreColor = (score?: number) => {
    if (!score) return 'default';
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getMatchScoreIcon = (score?: number) => {
    if (!score) return null;
    if (score >= 80) return <CheckCircleIcon fontSize="small" color="success" />;
    if (score >= 60) return <WarningIcon fontSize="small" color="warning" />;
    return <ErrorIcon fontSize="small" color="error" />;
  };

  const getMatchScoreLabel = (score?: number) => {
    if (!score) return 'No Match Data';
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Poor Match';
  };

  // Calculate resource utilization statistics
  const resourceStats = allocations.reduce((acc: any, allocation) => {
    const resourceId = allocation.resourceId;
    if (!acc[resourceId]) {
      acc[resourceId] = {
        resource: allocation.resource,
        totalAllocation: 0,
        allocations: [],
        avgMatchScore: 0,
      };
    }
    acc[resourceId].totalAllocation += allocation.allocationPercentage;
    acc[resourceId].allocations.push(allocation);

    if (allocation.matchScore) {
      const scores = acc[resourceId].allocations
        .filter((a: Allocation) => a.matchScore)
        .map((a: Allocation) => a.matchScore!);
      acc[resourceId].avgMatchScore = scores.length > 0
        ? scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length
        : 0;
    }

    return acc;
  }, {});

  const overAllocatedResources = Object.values(resourceStats).filter(
    (stat: any) => stat.totalAllocation > 100
  );

  const poorMatchAllocations = allocations.filter(
    (a) => a.matchScore && a.matchScore < 60
  );

  // Calculate cross-domain metrics
  const calculateCrossDomainMetrics = () => {
    if (filters.domainId === '' && filters.businessDecision === '') {
      return { outboundCrossDomain: 0, inboundCrossDomain: 0 };
    }

    // Resources from selected domain working in other domains (outbound)
    const outboundCrossDomain = allocations.filter((allocation) => {
      const resourceInSelectedDomain = filters.domainId !== '' &&
        allocation.resource?.domainId?.toString() === filters.domainId;
      const projectInDifferentDomain = allocation.project?.domainId?.toString() !== filters.domainId;

      const resourceMatchesBusinessDecision = filters.businessDecision !== '' &&
        allocation.resource?.domainId !== undefined &&
        projects.find(p => p.domainId === allocation.resource?.domainId)?.businessDecision === filters.businessDecision;
      const projectDifferentBusinessDecision = allocation.project?.businessDecision !== filters.businessDecision;

      if (filters.domainId !== '' && filters.businessDecision !== '') {
        return (resourceInSelectedDomain && projectInDifferentDomain) ||
               (resourceMatchesBusinessDecision && projectDifferentBusinessDecision);
      } else if (filters.domainId !== '') {
        return resourceInSelectedDomain && projectInDifferentDomain;
      } else {
        return resourceMatchesBusinessDecision && projectDifferentBusinessDecision;
      }
    });

    // Resources from other domains working in selected domain (inbound)
    const inboundCrossDomain = allocations.filter((allocation) => {
      const projectInSelectedDomain = filters.domainId !== '' &&
        allocation.project?.domainId?.toString() === filters.domainId;
      const resourceFromDifferentDomain = allocation.resource?.domainId?.toString() !== filters.domainId;

      const projectMatchesBusinessDecision = filters.businessDecision !== '' &&
        allocation.project?.businessDecision === filters.businessDecision;
      const resourceFromDifferentBusinessDecision = allocation.resource?.domainId !== undefined &&
        projects.find(p => p.domainId === allocation.resource?.domainId)?.businessDecision !== filters.businessDecision;

      if (filters.domainId !== '' && filters.businessDecision !== '') {
        return (projectInSelectedDomain && resourceFromDifferentDomain) ||
               (projectMatchesBusinessDecision && resourceFromDifferentBusinessDecision);
      } else if (filters.domainId !== '') {
        return projectInSelectedDomain && resourceFromDifferentDomain;
      } else {
        return projectMatchesBusinessDecision && resourceFromDifferentBusinessDecision;
      }
    });

    return {
      outboundCrossDomain: new Set(outboundCrossDomain.map(a => a.resourceId)).size,
      inboundCrossDomain: new Set(inboundCrossDomain.map(a => a.resourceId)).size,
    };
  };

  const { outboundCrossDomain, inboundCrossDomain } = calculateCrossDomainMetrics();

  // Filter allocations based on current filters with cross-domain logic
  const filteredAllocations = allocations.filter((allocation) => {
    const resourceName = `${allocation.resource?.firstName || ''} ${allocation.resource?.lastName || ''}`.toLowerCase();

    // Basic filters
    const matchesResourceName = resourceName.includes(filters.resource.toLowerCase());
    const matchesProject = filters.project.length === 0 || filters.project.includes(allocation.project?.name || '');
    const matchesAllocationType = filters.allocationType.length === 0 || filters.allocationType.includes(allocation.allocationType);
    const matchesScore = filters.matchScore === '' ||
      (filters.matchScore === 'excellent' && (allocation.matchScore || 0) >= 80) ||
      (filters.matchScore === 'good' && (allocation.matchScore || 0) >= 60 && (allocation.matchScore || 0) < 80) ||
      (filters.matchScore === 'fair' && (allocation.matchScore || 0) >= 40 && (allocation.matchScore || 0) < 60) ||
      (filters.matchScore === 'poor' && (allocation.matchScore || 0) < 40);

    // Cross-domain filtering logic
    let matchesDomain = true;
    let matchesBusinessDecision = true;

    if (filters.domainId !== '' || filters.businessDecision !== '') {
      const projectMatchesDomain = filters.domainId === '' || allocation.project?.domainId?.toString() === filters.domainId;
      const projectMatchesBusinessDecision = filters.businessDecision === '' || allocation.project?.businessDecision === filters.businessDecision;

      // Show allocation if:
      // 1. Project matches the filter (normal case)
      // 2. OR resource from selected domain is working on other domain projects (cross-domain outbound)
      // 3. OR resource from other domain is working on selected domain projects (cross-domain inbound)

      const projectMatchesFilter = projectMatchesDomain && projectMatchesBusinessDecision;
      const resourceMatchesDomain = filters.domainId === '' || allocation.resource?.domainId?.toString() === filters.domainId;

      matchesDomain = projectMatchesFilter || resourceMatchesDomain;
      matchesBusinessDecision = projectMatchesBusinessDecision || resourceMatchesDomain;
    }

    return matchesResourceName && matchesProject && matchesAllocationType && matchesScore && matchesDomain && matchesBusinessDecision;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Resource Allocation Matrix
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Capability-based resource allocation with smart matching scores
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Allocation
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Total Allocations
              </Typography>
              <Typography variant="h4">{allocations.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Over-Allocated Resources
              </Typography>
              <Typography variant="h4" color="error">
                {overAllocatedResources.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Poor Match Allocations
              </Typography>
              <Typography variant="h4" color="warning.main">
                {poorMatchAllocations.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Match score &lt; 60
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Avg Match Score
              </Typography>
              <Typography variant="h4" color="success.main">
                {allocations.filter((a) => a.matchScore).length > 0
                  ? Math.round(
                      allocations
                        .filter((a) => a.matchScore)
                        .reduce((sum, a) => sum + (a.matchScore || 0), 0) /
                        allocations.filter((a) => a.matchScore).length
                    )
                  : '-'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Cross-Domain Metrics - Only show when domain or business decision filter is active */}
        {(filters.domainId !== '' || filters.businessDecision !== '') && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'info.lighter' }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Resources Working Cross-Domain
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {outboundCrossDomain}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    From selected filter working in other domains
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'secondary.lighter' }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    External Resources Contributing
                  </Typography>
                  <Typography variant="h4" color="secondary.main">
                    {inboundCrossDomain}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    From other domains working in selected filter
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>

      {/* Allocations Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Active Allocations
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Resource</TableCell>
                  <TableCell>Resource Domain</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Project Domain</TableCell>
                  <TableCell>Business Decision</TableCell>
                  <TableCell>Resource Capability</TableCell>
                  <TableCell>Project Requirement</TableCell>
                  <TableCell>Match Score</TableCell>
                  <TableCell>Allocation %</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Timeline</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
                {/* Filter Row */}
                <TableRow>
                  <TableCell>
                    <TextField
                      size="small"
                      placeholder="Filter by name"
                      value={filters.resource}
                      onChange={(e) => setFilters({ ...filters, resource: e.target.value })}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      placeholder="All"
                      value={filters.domainId}
                      onChange={(e) => setFilters({ ...filters, domainId: e.target.value })}
                      fullWidth
                    >
                      <MenuItem value="">All</MenuItem>
                      {domains.map((domain) => (
                        <MenuItem key={domain.id} value={domain.id.toString()}>
                          {domain.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      placeholder="All"
                      value={filters.project}
                      onChange={(e) => setFilters({ ...filters, project: e.target.value as unknown as string[] })}
                      SelectProps={{
                        multiple: true,
                        renderValue: (selected) =>
                          (selected as string[]).length > 0 ? `${(selected as string[]).length} selected` : 'All'
                      }}
                      fullWidth
                    >
                      {projects.map((project) => (
                        <MenuItem key={project.id} value={project.name}>
                          {project.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell />
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      placeholder="All"
                      value={filters.businessDecision}
                      onChange={(e) => setFilters({ ...filters, businessDecision: e.target.value })}
                      fullWidth
                    >
                      <MenuItem value="">All</MenuItem>
                      {Array.from(new Set(projects.map(p => p.businessDecision).filter(Boolean))).map((decision) => (
                        <MenuItem key={decision} value={decision!}>
                          {decision}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      value={filters.matchScore}
                      onChange={(e) => setFilters({ ...filters, matchScore: e.target.value })}
                      fullWidth
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="excellent">Excellent (80+)</MenuItem>
                      <MenuItem value="good">Good (60-79)</MenuItem>
                      <MenuItem value="fair">Fair (40-59)</MenuItem>
                      <MenuItem value="poor">Poor (&lt;40)</MenuItem>
                    </TextField>
                  </TableCell>
                  <TableCell />
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      placeholder="All"
                      value={filters.allocationType}
                      onChange={(e) => setFilters({ ...filters, allocationType: e.target.value as unknown as string[] })}
                      SelectProps={{
                        multiple: true,
                        renderValue: (selected) =>
                          (selected as string[]).length > 0 ? `${(selected as string[]).length} selected` : 'All'
                      }}
                      fullWidth
                    >
                      <MenuItem value="Shared">Shared</MenuItem>
                      <MenuItem value="Dedicated">Dedicated</MenuItem>
                      <MenuItem value="On-Demand">On-Demand</MenuItem>
                    </TextField>
                  </TableCell>
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAllocations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} align="center">
                      <Typography variant="body2" color="text.secondary" py={3}>
                        No allocations found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAllocations.map((allocation) => {
                    // Check if this is a cross-domain allocation
                    const isCrossDomain = allocation.resource?.domainId !== allocation.project?.domainId;

                    return (
                    <TableRow
                      key={allocation.id}
                      hover
                      sx={{
                        bgcolor:
                          allocation.matchScore && allocation.matchScore < 60
                            ? 'error.lighter'
                            : isCrossDomain
                            ? 'info.lighter'
                            : 'inherit',
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {allocation.resource?.firstName} {allocation.resource?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {allocation.resource?.employeeId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {allocation.resource?.domain?.name || '-'}
                        </Typography>
                        {isCrossDomain && (
                          <Chip
                            label="Cross-Domain"
                            size="small"
                            color="info"
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{allocation.project?.name}</Typography>
                        <Chip
                          label={allocation.project?.status}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {allocation.project?.domain?.name || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {allocation.project?.businessDecision || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {allocation.resourceCapability ? (
                          <Box>
                            <Chip
                              label={`${allocation.resourceCapability.app.code}/${allocation.resourceCapability.technology.code}/${allocation.resourceCapability.role.code}`}
                              size="small"
                              color={
                                allocation.resourceCapability.isPrimary ? 'primary' : 'default'
                              }
                            />
                            <Typography variant="caption" display="block" mt={0.5}>
                              {allocation.resourceCapability.proficiencyLevel}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            No capability linked
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {allocation.projectRequirement ? (
                          <Box>
                            <Chip
                              label={`${allocation.projectRequirement.app.code}/${allocation.projectRequirement.technology.code}/${allocation.projectRequirement.role.code}`}
                              size="small"
                              variant="outlined"
                            />
                            <Typography variant="caption" display="block" mt={0.5}>
                              Need: {allocation.projectRequirement.proficiencyLevel} ({allocation.projectRequirement.fulfilledCount}/{allocation.projectRequirement.requiredCount})
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            No requirement linked
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {allocation.matchScore ? (
                          <Tooltip title={getMatchScoreLabel(allocation.matchScore)}>
                            <Box display="flex" alignItems="center" gap={1}>
                              {getMatchScoreIcon(allocation.matchScore)}
                              <Box sx={{ width: 60 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={allocation.matchScore}
                                  color={getMatchScoreColor(allocation.matchScore) as any}
                                  sx={{ height: 8, borderRadius: 1 }}
                                />
                              </Box>
                              <Typography variant="caption" fontWeight="medium">
                                {allocation.matchScore}
                              </Typography>
                            </Box>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${allocation.allocationPercentage}%`}
                          size="small"
                          color="info"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip label={allocation.allocationType} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        {allocation.startDate && allocation.endDate ? (
                          <Typography variant="caption">
                            {new Date(allocation.startDate).toLocaleDateString()} -{' '}
                            {new Date(allocation.endDate).toLocaleDateString()}
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(allocation)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(allocation.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Poor Matches Alert */}
      {poorMatchAllocations.length > 0 && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="body2" fontWeight="medium">
            {poorMatchAllocations.length} allocation(s) have match scores below 60
          </Typography>
          <Typography variant="caption">
            Consider reviewing these allocations to ensure resources have the right capabilities for
            project requirements.
          </Typography>
        </Alert>
      )}

      {/* Over-allocation Alert */}
      {overAllocatedResources.length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="body2" fontWeight="medium">
            {overAllocatedResources.length} resource(s) are allocated over 100%
          </Typography>
          <Typography variant="caption">
            {overAllocatedResources
              .map(
                (stat: any) =>
                  `${stat.resource?.firstName} ${stat.resource?.lastName} (${Math.round(stat.totalAllocation)}%)`
              )
              .join(', ')}
          </Typography>
        </Alert>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Edit Allocation' : 'Add Allocation'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Resource"
                value={currentAllocation.resourceId || ''}
                onChange={(e) => handleResourceChange(parseInt(e.target.value))}
                required
              >
                {resources.map((resource) => (
                  <MenuItem key={resource.id} value={resource.id}>
                    {resource.firstName} {resource.lastName} ({resource.employeeId})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Project"
                value={currentAllocation.projectId || ''}
                onChange={(e) => handleProjectChange(parseInt(e.target.value))}
                required
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Resource Capability"
                value={
                  currentAllocation.resourceCapabilityId &&
                  selectedResourceCapabilities.some(c => c.id === currentAllocation.resourceCapabilityId)
                    ? currentAllocation.resourceCapabilityId
                    : ''
                }
                onChange={(e) =>
                  setCurrentAllocation({
                    ...currentAllocation,
                    resourceCapabilityId: parseInt(e.target.value),
                  })
                }
                disabled={!currentAllocation.resourceId}
                helperText={!currentAllocation.resourceId ? 'Select a resource first' : ''}
              >
                {selectedResourceCapabilities.map((capability) => (
                  <MenuItem key={capability.id} value={capability.id}>
                    {capability.app.code}/{capability.technology.code}/{capability.role.code} - {capability.proficiencyLevel}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Project Requirement"
                value={
                  currentAllocation.projectRequirementId &&
                  selectedProjectRequirements.some(r => r.id === currentAllocation.projectRequirementId)
                    ? currentAllocation.projectRequirementId
                    : ''
                }
                onChange={(e) =>
                  setCurrentAllocation({
                    ...currentAllocation,
                    projectRequirementId: parseInt(e.target.value),
                  })
                }
                disabled={!currentAllocation.projectId}
                helperText={!currentAllocation.projectId ? 'Select a project first' : ''}
              >
                {selectedProjectRequirements.map((requirement) => (
                  <MenuItem key={requirement.id} value={requirement.id}>
                    {requirement.app.code}/{requirement.technology.code}/{requirement.role.code} - {requirement.proficiencyLevel}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Allocation %"
                value={currentAllocation.allocationPercentage || 50}
                onChange={(e) =>
                  setCurrentAllocation({
                    ...currentAllocation,
                    allocationPercentage: parseInt(e.target.value),
                  })
                }
                inputProps={{ min: 1, max: 100 }}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Allocation Type"
                value={currentAllocation.allocationType || 'Shared'}
                onChange={(e) =>
                  setCurrentAllocation({
                    ...currentAllocation,
                    allocationType: e.target.value,
                  })
                }
                required
              >
                <MenuItem value="Shared">Shared</MenuItem>
                <MenuItem value="Dedicated">Dedicated</MenuItem>
                <MenuItem value="On-Demand">On-Demand</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={currentAllocation.startDate?.split('T')[0] || ''}
                onChange={(e) =>
                  setCurrentAllocation({
                    ...currentAllocation,
                    startDate: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={currentAllocation.endDate?.split('T')[0] || ''}
                onChange={(e) =>
                  setCurrentAllocation({
                    ...currentAllocation,
                    endDate: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!currentAllocation.resourceId || !currentAllocation.projectId}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResourceAllocation;
