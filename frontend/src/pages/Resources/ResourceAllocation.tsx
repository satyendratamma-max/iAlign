import { useState, useEffect, useMemo } from 'react';
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
  Tabs,
  Tab,
  Autocomplete,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TableChart as TableChartIcon,
  Timeline as TimelineIcon,
  ViewKanban as ViewKanbanIcon,
  InfoOutlined,
} from '@mui/icons-material';
import axios from 'axios';
import PageHeader from '../../components/common/PageHeader';
import ActionBar, { ActionGroup } from '../../components/common/ActionBar';
import CompactFilterBar from '../../components/common/CompactFilterBar';
import FilterPresets from '../../components/common/FilterPresets';
import { useScenario } from '../../contexts/ScenarioContext';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { setDomainFilter, setBusinessDecisionFilter, clearAllFilters } from '../../store/slices/filtersSlice';
import TimelineView from '../../components/TimelineView';
import KanbanView from '../../components/KanbanView';
import { calculateMaxConcurrentAllocation } from '../../utils/allocationCalculations';

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
  const { activeScenario } = useScenario();
  const dispatch = useAppDispatch();
  const { selectedDomainIds, selectedBusinessDecisions } = useAppSelector((state) => state.filters);
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
  const [currentView, setCurrentView] = useState<'table' | 'timeline' | 'kanban'>('table');
  const [filters, setFilters] = useState({
    resource: '',
    project: [] as string[],
    allocationType: [] as string[],
    matchScore: '',
    domainId: '',
    businessDecision: '',
  });

  useEffect(() => {
    if (activeScenario) {
      fetchData();
    }
  }, [activeScenario]);

  const fetchData = async () => {
    if (!activeScenario?.id) {
      console.warn('No active scenario selected for ResourceAllocation');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const scenarioParam = `?scenarioId=${activeScenario.id}`;

      const [allocationsRes, resourcesRes, projectsRes, domainsRes] = await Promise.all([
        axios.get(`${API_URL}/allocations${scenarioParam}`, config),
        axios.get(`${API_URL}/resources`, config), // Resources are shared, no scenarioId filter
        axios.get(`${API_URL}/projects${scenarioParam}`, config),
        axios.get(`${API_URL}/domains`, config),
      ]);

      const allocationData = allocationsRes.data.data || [];
      setAllocations(allocationData);
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

      // Ensure the allocated resource is in the resources list
      if (allocation.resource && !resources.some(r => r.id === allocation.resource!.id)) {
        setResources(prev => [...prev, allocation.resource!]);
      }

      // Ensure the allocated project is in the projects list
      if (allocation.project && !projects.some(p => p.id === allocation.project!.id)) {
        setProjects(prev => [...prev, allocation.project!]);
      }

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

      // Ensure scenarioId is included in the allocation data
      const allocationData = {
        ...currentAllocation,
        scenarioId: activeScenario?.id,
      };

      if (editMode && currentAllocation.id) {
        await axios.put(`${API_URL}/allocations/${currentAllocation.id}`, allocationData, config);
      } else {
        await axios.post(`${API_URL}/allocations`, allocationData, config);
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

  // Filter resources based on global filters
  const filteredResources = useMemo(() => {
    let filtered = resources;

    // Apply global domain filter
    if (selectedDomainIds.length > 0) {
      filtered = filtered.filter(r => {
        return r.domainId && selectedDomainIds.includes(r.domainId);
      });
    }

    return filtered;
  }, [resources, selectedDomainIds]);

  // Filter projects based on global filters
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Apply global domain filter
    if (selectedDomainIds.length > 0) {
      filtered = filtered.filter(p => {
        return p.domainId && selectedDomainIds.includes(p.domainId);
      });
    }

    // Apply global business decision filter
    if (selectedBusinessDecisions.length > 0) {
      filtered = filtered.filter(p => {
        return p.businessDecision && selectedBusinessDecisions.includes(p.businessDecision);
      });
    }

    return filtered;
  }, [projects, selectedDomainIds, selectedBusinessDecisions]);

  // Filter allocations based on global and local filters with cross-domain logic
  const filteredAllocations = useMemo(() => {
    let filtered = allocations;

    // Apply global domain filter
    if (selectedDomainIds.length > 0) {
      filtered = filtered.filter(a => {
        // Include allocation if project's domain matches OR resource's domain matches (cross-domain)
        const projectMatches = a.project && selectedDomainIds.includes(a.project.domainId!);
        const resourceMatches = a.resource && selectedDomainIds.includes(a.resource.domainId!);
        return projectMatches || resourceMatches;
      });
    }

    // Apply global business decision filter
    if (selectedBusinessDecisions.length > 0) {
      filtered = filtered.filter(a => {
        return a.project && selectedBusinessDecisions.includes(a.project.businessDecision!);
      });
    }

    // Apply local filters
    filtered = filtered.filter((allocation) => {
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

      // Cross-domain filtering logic for local filters
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

    return filtered;
  }, [allocations, selectedDomainIds, selectedBusinessDecisions, filters]);

  // Calculate resource utilization statistics from filtered allocations
  const resourceStats = useMemo(() => {
    return filteredAllocations.reduce((acc: any, allocation) => {
      const resourceId = allocation.resourceId;
      if (!acc[resourceId]) {
        acc[resourceId] = {
          resource: allocation.resource,
          totalAllocation: 0,
          allocations: [],
          avgMatchScore: 0,
        };
      }
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
  }, [filteredAllocations]);

  // Calculate max concurrent allocation for each resource
  Object.keys(resourceStats).forEach(resourceId => {
    resourceStats[resourceId].totalAllocation = calculateMaxConcurrentAllocation(
      resourceStats[resourceId].allocations
    );
  });

  const overAllocatedResources = useMemo(() => {
    return Object.values(resourceStats).filter(
      (stat: any) => stat.totalAllocation > 100
    );
  }, [resourceStats]);

  const poorMatchAllocations = useMemo(() => {
    return filteredAllocations.filter(
      (a) => a.matchScore && a.matchScore < 60
    );
  }, [filteredAllocations]);

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

  // Extract unique business decisions for filter options
  const uniqueBusinessDecisions = Array.from(
    new Set(projects.map((p) => p.businessDecision).filter(Boolean))
  ) as string[];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Resource Allocation Matrix"
        subtitle="Capability-based resource allocation with smart matching scores"
        icon={<TableChartIcon sx={{ fontSize: 32 }} />}
        compact
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            size="small"
            sx={{
              px: 3,
              fontWeight: 600,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
              },
            }}
          >
            Add Allocation
          </Button>
        }
      />

      <ActionBar elevation={1}>
        <ActionGroup divider>
          <Button
            variant={currentView === 'table' ? 'contained' : 'outlined'}
            startIcon={<TableChartIcon />}
            onClick={() => setCurrentView('table')}
            size="small"
          >
            Table
          </Button>
          <Button
            variant={currentView === 'timeline' ? 'contained' : 'outlined'}
            startIcon={<TimelineIcon />}
            onClick={() => setCurrentView('timeline')}
            size="small"
          >
            Timeline
          </Button>
          <Button
            variant={currentView === 'kanban' ? 'contained' : 'outlined'}
            startIcon={<ViewKanbanIcon />}
            onClick={() => setCurrentView('kanban')}
            size="small"
          >
            Kanban
          </Button>
        </ActionGroup>
      </ActionBar>

      <CompactFilterBar
        domains={domains}
        businessDecisions={uniqueBusinessDecisions}
        extraActions={<FilterPresets />}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Render appropriate view */}
      {currentView === 'timeline' && (
        <>
          <TimelineView
            resources={filteredResources}
            projects={filteredProjects}
            allocations={filteredAllocations}
            scenarioId={activeScenario?.id || 0}
            onRefresh={fetchData}
            onEdit={handleOpenDialog}
            onDelete={handleDelete}
          />
        </>
      )}

      {currentView === 'kanban' && (
        <>
          <KanbanView
            resources={filteredResources}
            projects={filteredProjects}
            allocations={filteredAllocations}
            scenarioId={activeScenario?.id || 0}
            onRefresh={fetchData}
          />
        </>
      )}

      {currentView === 'table' && (
        <>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                <Typography color="text.secondary" variant="body2">
                  Total Allocations
                </Typography>
                <Tooltip
                  title="Total number of allocation records in the current scenario. This counts each resource-project assignment separately. A single resource can have multiple allocations if assigned to multiple projects."
                  arrow
                >
                  <InfoOutlined sx={{ fontSize: 16, color: 'text.disabled', cursor: 'help' }} />
                </Tooltip>
              </Box>
              <Typography variant="h4">{filteredAllocations.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                <Typography color="text.secondary" variant="body2">
                  Over-Allocated Resources
                </Typography>
                <Tooltip
                  title="Number of resources with total allocation percentage exceeding 100%. Calculated by summing all allocation percentages for each resource across all their projects."
                  arrow
                >
                  <InfoOutlined sx={{ fontSize: 16, color: 'text.disabled', cursor: 'help' }} />
                </Tooltip>
              </Box>
              <Typography variant="h4" color="error">
                {overAllocatedResources.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                <Typography color="text.secondary" variant="body2">
                  Poor Match Allocations
                </Typography>
                <Tooltip
                  title="Allocations with match score below 60. Match score compares resource capabilities (app/tech/role/proficiency) against project requirements. Lower scores indicate skill mismatches."
                  arrow
                >
                  <InfoOutlined sx={{ fontSize: 16, color: 'text.disabled', cursor: 'help' }} />
                </Tooltip>
              </Box>
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
              <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                <Typography color="text.secondary" variant="body2">
                  Avg Match Score
                </Typography>
                <Tooltip
                  title="Average match score across all allocations that have scores. Calculated as the mean of all match scores. 80+ = Excellent, 60-79 = Good, 40-59 = Fair, <40 = Poor."
                  arrow
                >
                  <InfoOutlined sx={{ fontSize: 16, color: 'text.disabled', cursor: 'help' }} />
                </Tooltip>
              </Box>
              <Typography variant="h4" color="success.main">
                {filteredAllocations.filter((a) => a.matchScore).length > 0
                  ? Math.round(
                      filteredAllocations
                        .filter((a) => a.matchScore)
                        .reduce((sum, a) => sum + (a.matchScore || 0), 0) /
                        filteredAllocations.filter((a) => a.matchScore).length
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
                  <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                    <Typography color="text.secondary" variant="body2">
                      Resources Working Cross-Domain
                    </Typography>
                    <Tooltip
                      title="Unique resources from the filtered domain/decision who are working on projects in OTHER domains/decisions. This shows resource sharing going outbound from your selection."
                      arrow
                    >
                      <InfoOutlined sx={{ fontSize: 16, color: 'text.disabled', cursor: 'help' }} />
                    </Tooltip>
                  </Box>
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
                  <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                    <Typography color="text.secondary" variant="body2">
                      External Resources Contributing
                    </Typography>
                    <Tooltip
                      title="Unique resources from OTHER domains/decisions who are working on projects in your filtered selection. This shows resource sharing coming inbound to your selection."
                      arrow
                    >
                      <InfoOutlined sx={{ fontSize: 16, color: 'text.disabled', cursor: 'help' }} />
                    </Tooltip>
                  </Box>
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
                  <TableCell align="right" sx={{ minWidth: 120 }}>Actions</TableCell>
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
                </TableRow>
                {/* Filter Row */}
                <TableRow>
                  <TableCell />
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
                    <Autocomplete
                      size="small"
                      options={['', ...domains.map(d => d.id.toString())]}
                      value={filters.domainId || ''}
                      onChange={(_, newValue) => setFilters({ ...filters, domainId: newValue || '' })}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="All Domains"
                          size="small"
                        />
                      )}
                      getOptionLabel={(option) => {
                        if (option === '') return 'All Domains';
                        const domain = domains.find(d => d.id.toString() === option);
                        return domain?.name || option;
                      }}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell>
                    <Autocomplete
                      size="small"
                      multiple
                      options={projects.map(p => p.name)}
                      value={filters.project}
                      onChange={(_, newValue) => setFilters({ ...filters, project: newValue })}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder={filters.project.length > 0 ? `${filters.project.length} selected` : 'All Projects'}
                          size="small"
                        />
                      )}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell />
                  <TableCell>
                    <Autocomplete
                      size="small"
                      options={['', ...Array.from(new Set(projects.map(p => p.businessDecision).filter(Boolean))) as string[]]}
                      value={filters.businessDecision || ''}
                      onChange={(_, newValue) => setFilters({ ...filters, businessDecision: newValue || '' })}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="All Decisions"
                          size="small"
                        />
                      )}
                      getOptionLabel={(option) => option === '' ? 'All Decisions' : option}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell>
                    <Autocomplete
                      size="small"
                      options={['', 'excellent', 'good', 'fair', 'poor']}
                      value={filters.matchScore || ''}
                      onChange={(_, newValue) => setFilters({ ...filters, matchScore: newValue || '' })}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="All Match Scores"
                          size="small"
                        />
                      )}
                      getOptionLabel={(option) => {
                        if (option === '') return 'All Match Scores';
                        if (option === 'excellent') return 'Excellent (80+)';
                        if (option === 'good') return 'Good (60-79)';
                        if (option === 'fair') return 'Fair (40-59)';
                        if (option === 'poor') return 'Poor (<40)';
                        return option;
                      }}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell />
                  <TableCell>
                    <Autocomplete
                      size="small"
                      multiple
                      options={['Shared', 'Dedicated', 'On-Demand']}
                      value={filters.allocationType}
                      onChange={(_, newValue) => setFilters({ ...filters, allocationType: newValue })}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder={filters.allocationType.length > 0 ? `${filters.allocationType.length} selected` : 'All Types'}
                          size="small"
                        />
                      )}
                      fullWidth
                    />
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
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Edit Allocation' : 'Add Allocation'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                fullWidth
                options={resources}
                getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.employeeId})`}
                value={resources.find(r => r.id === currentAllocation.resourceId) || null}
                onChange={(_, newValue) => {
                  if (newValue) {
                    handleResourceChange(newValue.id);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Resource"
                    required
                    placeholder="Search resources..."
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {option.firstName} {option.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.employeeId} • {option.domain?.name || 'No domain'}
                      </Typography>
                    </Box>
                  </li>
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Autocomplete
                fullWidth
                options={projects}
                getOptionLabel={(option) => option.name}
                value={projects.find(p => p.id === currentAllocation.projectId) || null}
                onChange={(_, newValue) => {
                  if (newValue) {
                    handleProjectChange(newValue.id);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Project"
                    required
                    placeholder="Search projects..."
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {option.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.status} • {option.domain?.name || 'No domain'}
                      </Typography>
                    </Box>
                  </li>
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Autocomplete
                fullWidth
                options={selectedResourceCapabilities}
                getOptionLabel={(option) => `${option.app.code}/${option.technology.code}/${option.role.code}`}
                value={selectedResourceCapabilities.find(c => c.id === currentAllocation.resourceCapabilityId) || null}
                onChange={(_, newValue) => {
                  setCurrentAllocation({
                    ...currentAllocation,
                    resourceCapabilityId: newValue?.id,
                  });
                }}
                disabled={!currentAllocation.resourceId}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Resource Capability"
                    placeholder="Search capabilities..."
                    helperText={!currentAllocation.resourceId ? 'Select a resource first' : ''}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {option.app.code}/{option.technology.code}/{option.role.code}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.proficiencyLevel} {option.isPrimary && '• Primary'}
                      </Typography>
                    </Box>
                  </li>
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Autocomplete
                fullWidth
                options={selectedProjectRequirements}
                getOptionLabel={(option) => `${option.app.code}/${option.technology.code}/${option.role.code}`}
                value={selectedProjectRequirements.find(r => r.id === currentAllocation.projectRequirementId) || null}
                onChange={(_, newValue) => {
                  setCurrentAllocation({
                    ...currentAllocation,
                    projectRequirementId: newValue?.id,
                  });
                }}
                disabled={!currentAllocation.projectId}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Project Requirement"
                    placeholder="Search requirements..."
                    helperText={!currentAllocation.projectId ? 'Select a project first' : ''}
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
