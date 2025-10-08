import { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import {
  TrendingUp,
  Folder,
  AttachMoney,
  TrendingDown,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  People,
  Schedule,
  AssignmentTurnedIn,
  Timeline,
  Groups,
  Business,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface DashboardMetrics {
  totalProjects: number;
  activeProjects: number;
  totalBudget: number;
  totalActualCost: number;
  budgetVariance: number;
  averageProgress: number;
  statusBreakdown: Record<string, number>;
  healthBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
}

interface SegmentFunctionStats {
  totalSegmentFunctions: number;
  totalValue: number;
  averageROI: number;
  averageRisk: number;
}

interface ResourceMetrics {
  totalResources: number;
  totalAllocations: number;
  averageUtilization: number;
  overAllocatedResources: number;
  availableResources: number;
}

interface DomainPerformance {
  domainId: number;
  domainName: string;
  projectCount: number;
  totalBudget: number;
  avgProgress: number;
  healthScore: number;
}

interface Project {
  id: number;
  name: string;
  status: string;
  progress: number;
  budget?: number;
  actualCost?: number;
  healthStatus?: string;
  priority: string;
  fiscalYear?: string;
}

interface Allocation {
  id: number;
  resourceId: number;
  projectId: number;
  allocationPercentage: number;
}

interface Domain {
  id: number;
  name: string;
}

const Dashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [segmentFunctionStats, setSegmentFunctionStats] = useState<SegmentFunctionStats | null>(null);
  const [resourceMetrics, setResourceMetrics] = useState<ResourceMetrics | null>(null);
  const [domainPerformance, setDomainPerformance] = useState<DomainPerformance[]>([]);
  const [topProjects, setTopProjects] = useState<Project[]>([]);
  const [atRiskProjects, setAtRiskProjects] = useState<Project[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [allProjects, setAllProjects] = useState<Project[]>([]);

  // Fetch data only once on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };

        const [projectsRes, resourcesRes, allocationsRes, domainsRes, segmentFunctionsRes] = await Promise.all([
          axios.get(`${API_URL}/projects`, config),
          axios.get(`${API_URL}/resources`, config),
          axios.get(`${API_URL}/allocations`, config),
          axios.get(`${API_URL}/domains`, config),
          axios.get(`${API_URL}/segment-functions`, config),
        ]);

        const fetchedProjects: Project[] = projectsRes.data.data;
        const resources = resourcesRes.data.data;
        const allocations: Allocation[] = allocationsRes.data.data;
        const allDomains = domainsRes.data.data;

        setAllProjects(fetchedProjects);
        setDomains(allDomains);

        // Portfolio stats
        setSegmentFunctionStats({
          totalSegmentFunctions: segmentFunctionsRes.data.data.length,
          totalValue: fetchedProjects.reduce((sum, p) => sum + (p.budget || 0), 0),
          averageROI: 15.5, // placeholder
          averageRisk: 3.2, // placeholder
        });


        // Calculate resource metrics
        const resourceUtilization = resources.map((resource: any) => {
          const resourceAllocs = allocations.filter(a => a.resourceId === resource.id);
          const totalAllocation = resourceAllocs.reduce((sum, a) => sum + a.allocationPercentage, 0);
          return { ...resource, totalAllocation };
        });

        const overAllocated = resourceUtilization.filter((r: any) => r.totalAllocation > 100).length;
        const available = resourceUtilization.filter((r: any) => r.totalAllocation < 80).length;
        const avgUtil = resourceUtilization.length > 0
          ? resourceUtilization.reduce((sum: number, r: any) => sum + r.totalAllocation, 0) / resourceUtilization.length
          : 0;

        setResourceMetrics({
          totalResources: resources.length,
          totalAllocations: allocations.length,
          averageUtilization: Math.round(avgUtil),
          overAllocatedResources: overAllocated,
          availableResources: available,
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate filtered metrics when domain filter changes
  useEffect(() => {
    if (allProjects.length === 0) return;

    // Filter projects by domain if selected
    const projects = selectedDomainId === 'all'
      ? allProjects
      : allProjects.filter((p: any) => p.domainId === selectedDomainId);

    // Calculate project metrics (filtered by domain)
    const activeProjects = projects.filter(p => p.status !== 'Completed' && p.status !== 'Cancelled');
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalActualCost = projects.reduce((sum, p) => sum + (p.actualCost || 0), 0);
    const averageProgress = projects.length > 0
      ? projects.reduce((sum, p) => sum + p.progress, 0) / projects.length
      : 0;

    const statusBreakdown: Record<string, number> = {};
    const healthBreakdown: Record<string, number> = {};
    const priorityBreakdown: Record<string, number> = {};

    projects.forEach(p => {
      statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1;
      if (p.healthStatus) {
        healthBreakdown[p.healthStatus] = (healthBreakdown[p.healthStatus] || 0) + 1;
      }
      priorityBreakdown[p.priority] = (priorityBreakdown[p.priority] || 0) + 1;
    });

    setMetrics({
      totalProjects: projects.length,
      activeProjects: activeProjects.length,
      totalBudget,
      totalActualCost,
      budgetVariance: totalBudget - totalActualCost,
      averageProgress: Math.round(averageProgress),
      statusBreakdown,
      healthBreakdown,
      priorityBreakdown,
    });

    // Top projects by budget (filtered)
    const sortedByBudget = [...projects]
      .filter(p => p.budget && p.budget > 0)
      .sort((a, b) => (b.budget || 0) - (a.budget || 0))
      .slice(0, 5);
    setTopProjects(sortedByBudget);

    // At-risk projects (filtered)
    const atRisk = projects.filter(p =>
      p.healthStatus === 'Red' ||
      p.healthStatus === 'Yellow' && p.progress < 50
    ).slice(0, 5);
    setAtRiskProjects(atRisk);

    // Calculate domain performance (filtered by domain selection)
    const domainsToShow = selectedDomainId === 'all'
      ? domains
      : domains.filter(d => d.id === selectedDomainId);

    const domainPerf: DomainPerformance[] = domainsToShow.map((domain: any) => {
      const domainProjects = allProjects.filter((p: any) => p.domainId === domain.id);
      const domainBudget = domainProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
      const avgProg = domainProjects.length > 0
        ? domainProjects.reduce((sum, p) => sum + p.progress, 0) / domainProjects.length
        : 0;

      const healthyProjects = domainProjects.filter(p => p.healthStatus === 'Green').length;
      const healthScore = domainProjects.length > 0
        ? (healthyProjects / domainProjects.length) * 100
        : 0;

      return {
        domainId: domain.id,
        domainName: domain.name,
        projectCount: domainProjects.length,
        totalBudget: domainBudget,
        avgProgress: Math.round(avgProg),
        healthScore: Math.round(healthScore),
      };
    }).filter((d: DomainPerformance) => d.projectCount > 0);

    setDomainPerformance(domainPerf);
  }, [allProjects, selectedDomainId, domains]);

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
      maximumFractionDigits: 0,
    }).format(value);
  };

  const mainMetrics = [
    {
      title: 'Total Segment Function Value',
      value: segmentFunctionStats ? formatCurrency(segmentFunctionStats.totalValue) : '$0',
      icon: <Business sx={{ fontSize: 40 }} />,
      subtitle: `${segmentFunctionStats?.totalSegmentFunctions || 0} segment functions`,
      trend: '+12% from last quarter',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      iconBg: 'rgba(102, 126, 234, 0.1)',
    },
    {
      title: 'Active Projects',
      value: metrics?.activeProjects || 0,
      icon: <Folder sx={{ fontSize: 40 }} />,
      subtitle: `${metrics?.totalProjects || 0} total projects`,
      trend: `${metrics?.averageProgress || 0}% avg completion`,
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      iconBg: 'rgba(240, 147, 251, 0.1)',
    },
    {
      title: 'Total Resources',
      value: resourceMetrics?.totalResources || 0,
      icon: <People sx={{ fontSize: 40 }} />,
      subtitle: `${resourceMetrics?.averageUtilization || 0}% avg utilization`,
      trend: `${resourceMetrics?.availableResources || 0} available`,
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      iconBg: 'rgba(79, 172, 254, 0.1)',
    },
    {
      title: 'Budget Variance',
      value: metrics ? formatCurrency(Math.abs(metrics.budgetVariance)) : '$0',
      icon: metrics && metrics.budgetVariance >= 0 ? <TrendingUp sx={{ fontSize: 40 }} /> : <TrendingDown sx={{ fontSize: 40 }} />,
      subtitle: `${formatCurrency(metrics?.totalActualCost || 0)} spent`,
      trend: metrics && metrics.budgetVariance >= 0 ? 'Under budget' : 'Over budget',
      color: metrics && metrics.budgetVariance >= 0
        ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
        : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      iconBg: metrics && metrics.budgetVariance >= 0 ? 'rgba(67, 233, 123, 0.1)' : 'rgba(250, 112, 154, 0.1)',
    },
  ];

  const healthColors: Record<string, string> = {
    Green: 'success',
    Yellow: 'warning',
    Red: 'error',
  };

  const healthIcons: Record<string, JSX.Element> = {
    Green: <CheckCircle />,
    Yellow: <Warning />,
    Red: <ErrorIcon />,
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 75) return 'success';
    if (score >= 50) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Box sx={{ mb: { xs: 3, sm: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' },
              }}
              gutterBottom
            >
              Executive Dashboard
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Real-time insights and analytics across your portfolio
            </Typography>
          </Box>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="domain-filter-label">Filter by Domain</InputLabel>
            <Select
              labelId="domain-filter-label"
              value={selectedDomainId}
              label="Filter by Domain"
              onChange={(e) => setSelectedDomainId(e.target.value as number | 'all')}
            >
              <MenuItem value="all">All Domains</MenuItem>
              {domains.map((domain) => (
                <MenuItem key={domain.id} value={domain.id}>
                  {domain.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Alerts */}
      {resourceMetrics && resourceMetrics.overAllocatedResources > 0 && (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: { xs: 2, sm: 3 } }}>
          <strong>{resourceMetrics.overAllocatedResources}</strong> resource(s) are over-allocated.
          Review resource allocation to prevent burnout.
        </Alert>
      )}

      {/* Main Metrics Cards */}
      <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        {mainMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Card
              sx={{
                height: '100%',
                background: metric.color,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  transition: 'transform 0.3s ease-in-out',
                  boxShadow: 6,
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      {metric.title}
                    </Typography>
                    <Typography variant="h3" fontWeight="bold" sx={{ mb: 1 }}>
                      {metric.value}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5 }}>
                      {metric.subtitle}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {metric.trend}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      borderRadius: 2,
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {metric.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Resource Utilization */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Groups sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Resource Utilization
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.lighter', borderRadius: 2 }}>
                    <Typography variant="h3" color="success.main" fontWeight="bold">
                      {resourceMetrics?.averageUtilization || 0}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Utilization
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.lighter', borderRadius: 2 }}>
                    <Typography variant="h3" color="info.main" fontWeight="bold">
                      {resourceMetrics?.availableResources || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Available Resources
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.lighter', borderRadius: 2 }}>
                    <Typography variant="h3" color="error.main" fontWeight="bold">
                      {resourceMetrics?.overAllocatedResources || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Over-Allocated
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.lighter', borderRadius: 2 }}>
                    <Typography variant="h3" color="warning.main" fontWeight="bold">
                      {resourceMetrics?.totalAllocations || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Allocations
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Project Health */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Timeline sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Project Health Overview
                </Typography>
              </Box>
              <Box>
                {metrics &&
                  Object.entries(metrics.healthBreakdown).map(([health, count]) => (
                    <Box key={health} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ color: `${healthColors[health]}.main` }}>
                            {healthIcons[health]}
                          </Box>
                          <Typography fontWeight="medium">{health}</Typography>
                        </Box>
                        <Chip
                          label={`${count} projects`}
                          size="small"
                          color={healthColors[health] as any}
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(count / metrics.totalProjects) * 100}
                        color={healthColors[health] as any}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Domain Performance */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Business sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Domain Performance
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Domain</strong></TableCell>
                      <TableCell align="center"><strong>Projects</strong></TableCell>
                      <TableCell align="center"><strong>Budget</strong></TableCell>
                      <TableCell align="center"><strong>Avg Progress</strong></TableCell>
                      <TableCell align="center"><strong>Health Score</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {domainPerformance.map((domain) => (
                      <TableRow key={domain.domainId} hover>
                        <TableCell>
                          <Typography fontWeight="medium">{domain.domainName}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={domain.projectCount} size="small" color="primary" variant="outlined" />
                        </TableCell>
                        <TableCell align="center">
                          <Typography>{formatCurrency(domain.totalBudget)}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={domain.avgProgress}
                              sx={{ width: 100, height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="body2">{domain.avgProgress}%</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${domain.healthScore}%`}
                            size="small"
                            color={getHealthScoreColor(domain.healthScore) as any}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Projects by Budget */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoney sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Top Projects by Budget
                </Typography>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Project</strong></TableCell>
                      <TableCell align="right"><strong>Budget</strong></TableCell>
                      <TableCell align="center"><strong>Progress</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topProjects.map((project) => (
                      <TableRow key={project.id} hover>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {project.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {project.fiscalYear}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(project.budget || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <LinearProgress
                            variant="determinate"
                            value={project.progress}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* At-Risk Projects */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning sx={{ mr: 1, color: 'error.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  At-Risk Projects
                </Typography>
              </Box>
              {atRiskProjects.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography variant="body1" color="text.secondary">
                    No projects at risk!
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Project</strong></TableCell>
                        <TableCell align="center"><strong>Health</strong></TableCell>
                        <TableCell align="center"><strong>Progress</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {atRiskProjects.map((project) => (
                        <TableRow key={project.id} hover>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {project.name}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={project.healthStatus || 'N/A'}
                              size="small"
                              color={healthColors[project.healthStatus || ''] as any}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{project.progress}%</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Project Status Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssignmentTurnedIn sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Project Status Distribution
                </Typography>
              </Box>
              <Box>
                {metrics &&
                  Object.entries(metrics.statusBreakdown).map(([status, count]) => (
                    <Box key={status} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography fontWeight="medium">{status}</Typography>
                        <Typography color="text.secondary">
                          {count} ({Math.round((count / metrics.totalProjects) * 100)}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(count / metrics.totalProjects) * 100}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Priority Breakdown */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="bold">
                  Priority Breakdown
                </Typography>
              </Box>
              <Box>
                {metrics &&
                  Object.entries(metrics.priorityBreakdown).map(([priority, count]) => (
                    <Box key={priority} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography fontWeight="medium">{priority}</Typography>
                        <Chip
                          label={count}
                          size="small"
                          color={
                            priority === 'Critical' ? 'error' :
                            priority === 'High' ? 'warning' :
                            priority === 'Medium' ? 'info' : 'default'
                          }
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(count / metrics.totalProjects) * 100}
                        color={
                          priority === 'Critical' ? 'error' :
                          priority === 'High' ? 'warning' :
                          priority === 'Medium' ? 'info' : 'primary'
                        }
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
