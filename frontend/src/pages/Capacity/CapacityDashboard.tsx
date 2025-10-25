import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  LinearProgress,
  Tooltip,
  Paper,
} from '@mui/material';
import CompactFilterBar from '../../components/common/CompactFilterBar';
import FilterPresets from '../../components/common/FilterPresets';
import PageHeader from '../../components/common/PageHeader';
import { useAppSelector } from '../../hooks/redux';
import { useScenario } from '../../contexts/ScenarioContext';
import {
  People,
  TrendingUp,
  AttachMoney,
  Speed,
  InfoOutlined,
  CheckCircle,
  HourglassEmpty,
  Warning,
  ErrorOutline,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { calculateResourceAllocations } from '../../utils/allocationCalculations';
import { fetchAllPages } from '../../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface Resource {
  id: number;
  employeeId: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  location?: string;
  hourlyRate?: number;
  utilizationRate?: number;
  domainId?: number;
}

interface Allocation {
  id: number;
  resourceId: number;
  projectId: number;
  allocationPercentage: number;
  startDate?: string;
  endDate?: string;
}

interface Domain {
  id: number;
  name: string;
}

interface Project {
  id: number;
  businessDecision?: string;
}

const CapacityDashboard = () => {
  const { activeScenario } = useScenario();
  const { selectedDomainIds, selectedBusinessDecisions } = useAppSelector((state) => state.filters);
  const [resources, setResources] = useState<Resource[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!activeScenario) return;

      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [allResources, allAllocations, domainsRes, allProjects] = await Promise.all([
          fetchAllPages(`${API_URL}/resources`, config),
          fetchAllPages(`${API_URL}/allocations`, { ...config, params: { scenarioId: activeScenario.id } }),
          axios.get(`${API_URL}/domains`, config),
          fetchAllPages(`${API_URL}/projects`, { ...config, params: { scenarioId: activeScenario.id } }),
        ]);

        const allDomains = domainsRes.data.data || [];

        setDomains(allDomains);
        setProjects(allProjects);

        // Get project IDs that match the business decision filter
        const matchingProjectIds = selectedBusinessDecisions.length === 0
          ? new Set(allProjects.map((p: Project) => p.id))
          : new Set(
              allProjects
                .filter((p: Project) => selectedBusinessDecisions.includes(p.businessDecision || ''))
                .map((p: Project) => p.id)
            );

        // Filter allocations by business decision (via projects)
        const businessDecisionFilteredAllocations = selectedBusinessDecisions.length === 0
          ? allAllocations
          : allAllocations.filter((a: Allocation) => matchingProjectIds.has(a.projectId));

        // Filter resources by domain if selected
        const filteredResources = selectedDomainIds.length === 0
          ? allResources
          : allResources.filter((r: Resource) => selectedDomainIds.includes(r.domainId || 0));

        // Filter allocations to match filtered resources and business decisions
        const filteredResourceIds = filteredResources.map((r: Resource) => r.id);
        const filteredAllocations = businessDecisionFilteredAllocations.filter((a: Allocation) =>
          filteredResourceIds.includes(a.resourceId)
        );

        setResources(filteredResources);
        setAllocations(filteredAllocations);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeScenario, selectedDomainIds, selectedBusinessDecisions]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const totalResources = resources.length;
  const avgUtilization = resources.reduce((sum, r) => sum + (r.utilizationRate || 0), 0) / totalResources || 0;

  // Calculate actual utilization from allocations (using time-based overlap calculation)
  const resourceUtilization = calculateResourceAllocations(allocations);
  const resourceActualUtilization = resourceUtilization; // Same map, use for both purposes

  const allocatedResources = resourceUtilization.size;
  const totalAllocations = allocations.length;

  // Calculate monthly cost based on resources
  const totalMonthlyCost = resources.reduce((sum, r) => {
    const monthlyHours = 160; // Standard work month
    return sum + ((r.hourlyRate || 0) * monthlyHours);
  }, 0);

  const avgHourlyRate = resources.reduce((sum, r) => sum + (r.hourlyRate || 0), 0) / totalResources || 0;

  // Get all resource IDs
  const allResourceIds = resources.map(r => r.id);

  // Available Capacity: resources with actual allocation <= 100%
  const availableCapacityCount = allResourceIds.filter(id => {
    const utilization = resourceActualUtilization.get(id) || 0;
    return utilization <= 100;
  }).length;

  // Bench Resources: resources with 0% allocation
  const benchResourcesCount = allResourceIds.filter(id => {
    const utilization = resourceActualUtilization.get(id) || 0;
    return utilization === 0;
  }).length;

  // Fully Allocated: resources with exactly 100% allocation
  const fullyAllocatedCount = allResourceIds.filter(id => {
    const utilization = resourceActualUtilization.get(id) || 0;
    return utilization === 100;
  }).length;

  // Over-Allocated: resources with >100% allocation
  const overAllocatedCount = allResourceIds.filter(id => {
    const utilization = resourceActualUtilization.get(id) || 0;
    return utilization > 100;
  }).length;

  // Critical Resources: resources with >=95% and <100% allocation
  const criticalResourcesCount = allResourceIds.filter(id => {
    const utilization = resourceActualUtilization.get(id) || 0;
    return utilization >= 95 && utilization < 100;
  }).length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Get unique business decisions from projects
  const uniqueBusinessDecisions = Array.from(
    new Set(projects.map((p) => p.businessDecision).filter(Boolean))
  ) as string[];

  return (
    <Box>
      <PageHeader
        title="Capacity Dashboard"
        subtitle="Unified capacity planning with predictive analytics"
        icon={<DashboardIcon sx={{ fontSize: 32 }} />}
        compact
      />

      <CompactFilterBar
        domains={domains}
        businessDecisions={uniqueBusinessDecisions}
        extraActions={<FilterPresets />}
      />

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box sx={{ flex: 1 }}>
                  <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                    <Typography color="text.secondary" variant="body2">
                      Total Resources
                    </Typography>
                    <Tooltip
                      title="Total number of active resources in the system. The 'actively allocated' count shows unique resources that have at least one allocation (a resource working on multiple projects is counted once)."
                      arrow
                    >
                      <InfoOutlined sx={{ fontSize: 16, color: 'text.disabled', cursor: 'help' }} />
                    </Tooltip>
                  </Box>
                  <Typography variant="h4">{totalResources}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {allocatedResources} actively allocated
                  </Typography>
                </Box>
                <Box sx={{ color: 'primary.main' }}>
                  <People />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box sx={{ flex: 1 }}>
                  <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                    <Typography color="text.secondary" variant="body2">
                      Avg Utilization
                    </Typography>
                    <Tooltip
                      title="Average utilization rate across all resources. Calculated as the mean of each resource's utilization rate. Optimal range is typically 70-85%."
                      arrow
                    >
                      <InfoOutlined sx={{ fontSize: 16, color: 'text.disabled', cursor: 'help' }} />
                    </Tooltip>
                  </Box>
                  <Typography variant="h4">{Math.round(avgUtilization)}%</Typography>
                  <Typography variant="caption" color="success.main">
                    ↑ Optimal range
                  </Typography>
                </Box>
                <Box sx={{ color: 'success.main' }}>
                  <Speed />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box sx={{ flex: 1 }}>
                  <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                    <Typography color="text.secondary" variant="body2">
                      Monthly Cost
                    </Typography>
                    <Tooltip
                      title="Total monthly resource cost calculated as: Sum of (hourly rate × 160 standard work hours) for all resources. Based on current resource pool regardless of allocation status."
                      arrow
                    >
                      <InfoOutlined sx={{ fontSize: 16, color: 'text.disabled', cursor: 'help' }} />
                    </Tooltip>
                  </Box>
                  <Typography variant="h4">{formatCurrency(totalMonthlyCost)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {totalResources} resources
                  </Typography>
                </Box>
                <Box sx={{ color: 'info.main' }}>
                  <AttachMoney />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box sx={{ flex: 1 }}>
                  <Box display="flex" alignItems="center" gap={0.5} mb={1}>
                    <Typography color="text.secondary" variant="body2">
                      Avg Hourly Rate
                    </Typography>
                    <Tooltip
                      title="Average hourly rate across all resources. Calculated as the sum of all hourly rates divided by the total number of resources."
                      arrow
                    >
                      <InfoOutlined sx={{ fontSize: 16, color: 'text.disabled', cursor: 'help' }} />
                    </Tooltip>
                  </Box>
                  <Typography variant="h4">{formatCurrency(avgHourlyRate)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Per resource
                  </Typography>
                </Box>
                <Box sx={{ color: 'warning.main' }}>
                  <TrendingUp />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Resource Utilization */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resource Utilization
              </Typography>
              <TableContainer component={Paper} sx={{ boxShadow: 2, borderRadius: 1.5 }}>
                <Table>
                  <TableHead sx={{ backgroundColor: (theme) => theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.grey[900] }}>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Rate</TableCell>
                      <TableCell>Utilization</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resources.slice(0, 8).map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {resource.firstName} {resource.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {resource.employeeId}
                          </Typography>
                        </TableCell>
                        <TableCell>{resource.role || '-'}</TableCell>
                        <TableCell>{resource.location || '-'}</TableCell>
                        <TableCell>{formatCurrency(resource.hourlyRate || 0)}/hr</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LinearProgress
                              variant="determinate"
                              value={resource.utilizationRate || 0}
                              sx={{
                                width: 80,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: 'grey.200',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor:
                                    (resource.utilizationRate || 0) >= 85
                                      ? 'success.main'
                                      : (resource.utilizationRate || 0) >= 70
                                      ? 'primary.main'
                                      : 'warning.main',
                                },
                              }}
                            />
                            <Typography variant="caption">
                              {resource.utilizationRate || 0}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Capacity Status */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Capacity Status
              </Typography>
              <Box sx={{ mt: 2 }}>
                {/* Available Capacity */}
                <Box sx={{ mb: 3, p: 2, bgcolor: 'success.50', borderRadius: 1, border: '1px solid', borderColor: 'success.200' }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <CheckCircle sx={{ fontSize: 20, color: 'success.main' }} />
                    <Typography variant="body2" fontWeight="medium">
                      Available Capacity
                    </Typography>
                    <Tooltip
                      title="Resources with actual allocation at or below 100%. This includes fully allocated resources (at 100%) and those with available capacity (below 100%)."
                      arrow
                    >
                      <InfoOutlined sx={{ fontSize: 14, color: 'text.disabled', cursor: 'help' }} />
                    </Tooltip>
                  </Box>
                  <Typography variant="h4" color="success.main">
                    {availableCapacityCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    at or below capacity ({fullyAllocatedCount} at 100%)
                  </Typography>
                </Box>

                {/* Bench Resources */}
                <Box sx={{ mb: 3, p: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <HourglassEmpty sx={{ fontSize: 20, color: 'info.main' }} />
                    <Typography variant="body2" fontWeight="medium">
                      Bench Resources
                    </Typography>
                    <Tooltip
                      title="Resources with 0% allocation. These resources are immediately available for new projects."
                      arrow
                    >
                      <InfoOutlined sx={{ fontSize: 14, color: 'text.disabled', cursor: 'help' }} />
                    </Tooltip>
                  </Box>
                  <Typography variant="h4" color="info.main">
                    {benchResourcesCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ready for assignment
                  </Typography>
                </Box>

                {/* Critical Resources */}
                <Box sx={{ mb: 3, p: 2, bgcolor: 'warning.50', borderRadius: 1, border: '1px solid', borderColor: 'warning.200' }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Warning sx={{ fontSize: 20, color: 'warning.main' }} />
                    <Typography variant="body2" fontWeight="medium">
                      Critical Resources
                    </Typography>
                    <Tooltip
                      title="Resources with 95-100% allocation. These resources are near capacity and may need attention."
                      arrow
                    >
                      <InfoOutlined sx={{ fontSize: 14, color: 'text.disabled', cursor: 'help' }} />
                    </Tooltip>
                  </Box>
                  <Typography variant="h4" color="warning.main">
                    {criticalResourcesCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    near capacity
                  </Typography>
                </Box>

                {/* Over-Allocated */}
                <Box sx={{ p: 2, bgcolor: 'error.50', borderRadius: 1, border: '1px solid', borderColor: 'error.200' }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <ErrorOutline sx={{ fontSize: 20, color: 'error.main' }} />
                    <Typography variant="body2" fontWeight="medium">
                      Over-Allocated
                    </Typography>
                    <Tooltip
                      title="Resources with allocation exceeding 100%. These resources need immediate rebalancing."
                      arrow
                    >
                      <InfoOutlined sx={{ fontSize: 14, color: 'text.disabled', cursor: 'help' }} />
                    </Tooltip>
                  </Box>
                  <Typography variant="h4" color="error.main">
                    {overAllocatedCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    require attention
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CapacityDashboard;

