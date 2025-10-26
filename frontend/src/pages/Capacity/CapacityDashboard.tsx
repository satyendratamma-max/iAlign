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

interface Domain {
  id: number;
  name: string;
}

interface Project {
  id: number;
  businessDecision?: string;
  fiscalYear?: string;
}

interface DashboardMetrics {
  totalResources: number;
  allocatedResources: number;
  avgUtilization: number;
  totalMonthlyCost: number;
  avgHourlyRate: number;
  availableCapacityCount: number;
  benchResourcesCount: number;
  fullyAllocatedCount: number;
  criticalResourcesCount: number;
  overAllocatedCount: number;
}

const CapacityDashboard = () => {
  const { activeScenario } = useScenario();
  const { selectedDomainIds, selectedBusinessDecisions } = useAppSelector((state) => state.filters);
  const [resources, setResources] = useState<Resource[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalResources: 0,
    allocatedResources: 0,
    avgUtilization: 0,
    totalMonthlyCost: 0,
    avgHourlyRate: 0,
    availableCapacityCount: 0,
    benchResourcesCount: 0,
    fullyAllocatedCount: 0,
    criticalResourcesCount: 0,
    overAllocatedCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!activeScenario) return;

      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Build filter params for server-side filtering
        const params: any = {
          scenarioId: activeScenario.id,
        };

        // Apply domain filter if selected
        if (selectedDomainIds.length > 0) {
          params.domainId = selectedDomainIds[0];
        }

        // Apply business decision filter if selected
        if (selectedBusinessDecisions.length > 0) {
          params.businessDecision = selectedBusinessDecisions[0];
        }

        // Fetch data from server-side endpoints in parallel
        const [metricsRes, resourcesRes, domainsRes, projectsRes] = await Promise.all([
          axios.get(`${API_URL}/capacity/dashboard/metrics`, { ...config, params }),
          axios.get(`${API_URL}/capacity/dashboard/resources`, { ...config, params: { ...params, limit: 8 } }),
          axios.get(`${API_URL}/domains`, config),
          axios.get(`${API_URL}/projects`, { ...config, params: { scenarioId: activeScenario.id, limit: 100 } }),
        ]);

        setMetrics(metricsRes.data.data);
        setResources(resourcesRes.data.data || []);
        setDomains(domainsRes.data.data || []);
        setProjects(projectsRes.data.data || []);
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

  // Get unique fiscal years from projects
  const uniqueFiscalYears = Array.from(
    new Set(projects.map((p) => p.fiscalYear).filter(Boolean))
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
        fiscalYears={uniqueFiscalYears}
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
                  <Typography variant="h4">{metrics.totalResources}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {metrics.allocatedResources} actively allocated
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
                  <Typography variant="h4">{metrics.avgUtilization}%</Typography>
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
                  <Typography variant="h4">{formatCurrency(metrics.totalMonthlyCost)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {metrics.totalResources} resources
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
                  <Typography variant="h4">{formatCurrency(metrics.avgHourlyRate)}</Typography>
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
                    {resources.map((resource) => (
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
                    {metrics.availableCapacityCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    at or below capacity ({metrics.fullyAllocatedCount} at 100%)
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
                    {metrics.benchResourcesCount}
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
                    {metrics.criticalResourcesCount}
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
                    {metrics.overAllocatedCount}
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

