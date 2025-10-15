import { useState, useEffect, useRef } from 'react';
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
  Button,
  IconButton,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Fullscreen as FullscreenIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import SharedFilters from '../../components/common/SharedFilters';
import { useAppSelector } from '../../hooks/redux';
import { useScenario } from '../../contexts/ScenarioContext';
import {
  TrendingUp,
  Folder,
  AttachMoney,
  TrendingDown,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  People,
  Business,
} from '@mui/icons-material';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  businessDecision?: string;
  segmentFunctionId?: number;
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

interface ProjectRiskScore {
  projectId: number;
  projectName: string;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
}

const Dashboard = () => {
  const { selectedDomainIds, selectedBusinessDecisions } = useAppSelector((state) => state.filters);
  const { activeScenario } = useScenario();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [segmentFunctionStats, setSegmentFunctionStats] = useState<SegmentFunctionStats | null>(null);
  const [resourceMetrics, setResourceMetrics] = useState<ResourceMetrics | null>(null);
  const [domainPerformance, setDomainPerformance] = useState<DomainPerformance[]>([]);
  const [topProjects, setTopProjects] = useState<Project[]>([]);
  const [atRiskProjects, setAtRiskProjects] = useState<Project[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allResources, setAllResources] = useState<any[]>([]);
  const [allAllocations, setAllAllocations] = useState<Allocation[]>([]);
  const [presentationMode, setPresentationMode] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [projectRisks, setProjectRisks] = useState<Record<number, ProjectRiskScore>>({});

  // Fetch data when active scenario changes
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!activeScenario) return;

      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };

        // Build query parameters with scenarioId
        const scenarioParam = `?scenarioId=${activeScenario.id}`;

        const [projectsRes, resourcesRes, allocationsRes, domainsRes, segmentFunctionsRes] = await Promise.all([
          axios.get(`${API_URL}/projects${scenarioParam}`, config),
          axios.get(`${API_URL}/resources${scenarioParam}`, config),
          axios.get(`${API_URL}/allocations`, config),
          axios.get(`${API_URL}/domains`, config),
          axios.get(`${API_URL}/segment-functions`, config),
        ]);

        const fetchedProjects: Project[] = projectsRes.data.data;
        const resources = resourcesRes.data.data;
        const allocations: Allocation[] = allocationsRes.data.data;
        const allDomains = domainsRes.data.data;

        setAllProjects(fetchedProjects);
        setAllResources(resources);
        setAllAllocations(allocations);
        setDomains(allDomains);

        // Portfolio stats (will be updated by filter effect)
        setSegmentFunctionStats({
          totalSegmentFunctions: segmentFunctionsRes.data.data.length,
          totalValue: fetchedProjects.reduce((sum, p) => sum + (p.budget || 0), 0),
          averageROI: 15.5,
          averageRisk: 3.2,
        });

        // Fetch risk data for all segment functions
        const uniqueSegmentFunctionIds = [...new Set(
          fetchedProjects
            .filter((p: Project) => p.segmentFunctionId)
            .map((p: Project) => p.segmentFunctionId)
        )].filter((id): id is number => id !== undefined);

        if (uniqueSegmentFunctionIds.length > 0) {
          fetchRiskData(uniqueSegmentFunctionIds, activeScenario.id, token, config);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [activeScenario]);

  const fetchRiskData = async (
    segmentFunctionIds: number[],
    scenarioId: number,
    token: string | null,
    config: { headers: { Authorization: string } }
  ) => {
    try {
      const riskPromises = segmentFunctionIds.map(segmentFunctionId =>
        axios.get(
          `${API_URL}/segment-functions/${segmentFunctionId}/risk?scenarioId=${scenarioId}`,
          config
        ).catch(error => {
          console.error(`Error fetching risk for segment function ${segmentFunctionId}:`, error);
          return null;
        })
      );

      const riskResponses = await Promise.all(riskPromises);
      const risksMap: Record<number, ProjectRiskScore> = {};

      riskResponses.forEach(response => {
        if (response?.data?.data?.projectRisks) {
          response.data.data.projectRisks.forEach((risk: ProjectRiskScore) => {
            risksMap[risk.projectId] = risk;
          });
        }
      });

      setProjectRisks(risksMap);
    } catch (error) {
      console.error('Error fetching risk data:', error);
    }
  };

  // Calculate filtered metrics when domain filter changes
  useEffect(() => {
    if (allProjects.length === 0) return;

    // Filter projects by domain if selected
    let projects = selectedDomainIds.length === 0
      ? allProjects
      : allProjects.filter((p: any) => selectedDomainIds.includes(p.domainId));

    // Apply businessDecision filter
    if (selectedBusinessDecisions.length > 0) {
      projects = projects.filter((p: Project) =>
        selectedBusinessDecisions.includes(p.businessDecision || '')
      );
    }

    // Recalculate segment function stats with filtered projects
    setSegmentFunctionStats({
      totalSegmentFunctions: new Set(projects.map((p: any) => p.segmentFunctionId).filter(Boolean)).size,
      totalValue: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
      averageROI: 15.5,
      averageRisk: 3.2,
    });

    // Filter resources by domain if selected
    const resources = selectedDomainIds.length === 0
      ? allResources
      : allResources.filter((r: any) => selectedDomainIds.includes(r.domainId));

    // Filter allocations to match filtered resources
    const resourceIds = resources.map((r: any) => r.id);
    const allocations = selectedDomainIds.length === 0
      ? allAllocations
      : allAllocations.filter((a: Allocation) => resourceIds.includes(a.resourceId));

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

    // Calculate resource metrics (filtered by domain)
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

    // Top projects by budget (filtered)
    const sortedByBudget = [...projects]
      .filter(p => p.budget && p.budget > 0)
      .sort((a, b) => (b.budget || 0) - (a.budget || 0))
      .slice(0, 8);
    setTopProjects(sortedByBudget);

    // At-risk projects (filtered and sorted by risk score descending)
    const atRisk = projects
      .filter(p =>
        p.healthStatus === 'Red' ||
        p.healthStatus === 'Yellow' && p.progress < 50
      )
      .sort((a, b) => {
        const riskA = projectRisks[a.id]?.riskScore || 0;
        const riskB = projectRisks[b.id]?.riskScore || 0;
        return riskB - riskA; // Descending order (highest risk first)
      })
      .slice(0, 8);
    setAtRiskProjects(atRisk);

    // Calculate domain performance (filtered by domain selection)
    const domainsToShow = selectedDomainIds.length === 0
      ? domains
      : domains.filter(d => selectedDomainIds.includes(d.id));

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
  }, [allProjects, allResources, allAllocations, selectedDomainIds, selectedBusinessDecisions, domains, projectRisks]);

  const handleExport = async (format: 'png' | 'pdf') => {
    if (!dashboardRef.current) return;

    try {
      // Temporarily enable presentation mode for export
      setPresentationMode(true);
      setExportMenuAnchor(null);

      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 200));

      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        backgroundColor: null, // Use actual background color from the page
        logging: false,
        useCORS: true,
      });

      const fileName = `dashboard-${activeScenario?.name || 'export'}-${new Date().toISOString().split('T')[0]}`;

      if (format === 'png') {
        // Export as PNG
        const link = document.createElement('a');
        link.download = `${fileName}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        // Export as PDF
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${fileName}.pdf`);
      }

      setPresentationMode(false);
    } catch (error) {
      console.error('Error exporting dashboard:', error);
      setPresentationMode(false);
    }
  };

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

  const formatCompact = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return formatCurrency(value);
  };

  const mainMetrics = [
    {
      title: 'Portfolio Value',
      value: formatCompact(segmentFunctionStats?.totalValue || 0),
      subtitle: `${segmentFunctionStats?.totalSegmentFunctions || 0} Segment Functions`,
      icon: <Business sx={{ fontSize: 40 }} />,
      colorScheme: 'primary',
    },
    {
      title: 'Active Projects',
      value: metrics?.activeProjects || 0,
      subtitle: `${metrics?.averageProgress || 0}% Avg Progress`,
      icon: <Folder sx={{ fontSize: 40 }} />,
      colorScheme: 'secondary',
    },
    {
      title: 'Resource Utilization',
      value: `${resourceMetrics?.averageUtilization || 0}%`,
      subtitle: `${resourceMetrics?.totalResources || 0} Resources`,
      icon: <People sx={{ fontSize: 40 }} />,
      colorScheme: 'info',
    },
    {
      title: 'Budget Status',
      value: formatCompact(Math.abs(metrics?.budgetVariance || 0)),
      subtitle: metrics && metrics.budgetVariance >= 0 ? 'Under Budget' : 'Over Budget',
      icon: metrics && metrics.budgetVariance >= 0 ? <TrendingUp sx={{ fontSize: 40 }} /> : <TrendingDown sx={{ fontSize: 40 }} />,
      colorScheme: metrics && metrics.budgetVariance >= 0 ? 'success' : 'warning',
    },
  ];

  const healthColors: Record<string, any> = {
    Green: 'success',
    Yellow: 'warning',
    Red: 'error',
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 75) return 'success';
    if (score >= 50) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Header with Export Button */}
      <Box sx={{ mb: 3 }}>
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
            <Typography variant="body2" color="text.secondary">
              {activeScenario?.name || 'Portfolio'} • Last updated: {new Date().toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <SharedFilters />
            <IconButton
              onClick={() => setPresentationMode(!presentationMode)}
              color={presentationMode ? 'primary' : 'default'}
              title="Presentation Mode"
            >
              <FullscreenIcon />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={(e) => setExportMenuAnchor(e.currentTarget)}
              size="small"
            >
              Export
            </Button>
            <Menu
              anchorEl={exportMenuAnchor}
              open={Boolean(exportMenuAnchor)}
              onClose={() => setExportMenuAnchor(null)}
            >
              <MenuItem onClick={() => handleExport('png')}>
                <ListItemIcon>
                  <ImageIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Export as PNG" secondary="High-resolution image" />
              </MenuItem>
              <MenuItem onClick={() => handleExport('pdf')}>
                <ListItemIcon>
                  <PdfIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Export as PDF" secondary="Printable document" />
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Box>

      {/* Alert for Over-allocated Resources */}
      {resourceMetrics && resourceMetrics.overAllocatedResources > 0 && !presentationMode && (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
          <strong>{resourceMetrics.overAllocatedResources}</strong> resource(s) over-allocated
        </Alert>
      )}

      {/* Dashboard Content */}
      <Box ref={dashboardRef} sx={{
        bgcolor: presentationMode ? 'background.paper' : 'transparent',
        p: presentationMode ? 3 : 0,
      }}>
        {/* Hero KPI Cards - Single Row */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {mainMetrics.map((metric, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  position: 'relative',
                  overflow: 'visible',
                  boxShadow: presentationMode ? 4 : 2,
                  borderLeft: 4,
                  borderColor: `${metric.colorScheme}.main`,
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease',
                  },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        fontWeight: 600,
                        color: 'text.secondary',
                      }}
                    >
                      {metric.title}
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: `${metric.colorScheme}.lighter`,
                        color: `${metric.colorScheme}.main`,
                        borderRadius: 2,
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {metric.icon}
                    </Box>
                  </Box>
                  <Typography
                    variant="h3"
                    fontWeight="bold"
                    sx={{
                      mb: 0.5,
                      fontSize: '2rem',
                      color: 'text.primary',
                    }}
                  >
                    {metric.value}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.875rem',
                      color: 'text.secondary',
                    }}
                  >
                    {metric.subtitle}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Middle Section - Combined Health & Domain Performance */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Left: Combined Project Health, Status & Priority */}
          <Grid item xs={12} md={5}>
            <Card sx={{ height: '100%', boxShadow: presentationMode ? 4 : 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  Portfolio Health & Status
                </Typography>

                {/* Project Health */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    Health Status
                  </Typography>
                  {metrics && Object.entries(metrics.healthBreakdown).map(([health, count]) => (
                    <Box key={health} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <Box sx={{ width: 100, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: `${healthColors[health]}.main`
                        }} />
                        <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.875rem' }}>
                          {health}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, mx: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={(count / metrics.totalProjects) * 100}
                          color={healthColors[health]}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                      <Typography variant="body2" fontWeight="bold" sx={{ width: 40, textAlign: 'right' }}>
                        {count}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Project Status */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    Status Distribution
                  </Typography>
                  {metrics && Object.entries(metrics.statusBreakdown).slice(0, 4).map(([status, count]) => (
                    <Box key={status} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="body2" sx={{ width: 100, fontSize: '0.875rem' }}>
                        {status}
                      </Typography>
                      <Box sx={{ flex: 1, mx: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={(count / metrics.totalProjects) * 100}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ width: 40, textAlign: 'right', fontSize: '0.875rem' }}>
                        {Math.round((count / metrics.totalProjects) * 100)}%
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Priority */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    Priority Breakdown
                  </Typography>
                  {metrics && Object.entries(metrics.priorityBreakdown).map(([priority, count]) => (
                    <Box key={priority} sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="body2" sx={{ width: 100, fontSize: '0.875rem' }}>
                        {priority}
                      </Typography>
                      <Box sx={{ flex: 1, mx: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={(count / metrics.totalProjects) * 100}
                          color={
                            priority === 'Critical' ? 'error' :
                            priority === 'High' ? 'warning' :
                            priority === 'Medium' ? 'info' : 'primary'
                          }
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                      <Chip
                        label={count}
                        size="small"
                        color={
                          priority === 'Critical' ? 'error' :
                          priority === 'High' ? 'warning' :
                          priority === 'Medium' ? 'info' : 'default'
                        }
                        sx={{ height: 20, fontSize: '0.75rem', minWidth: 40 }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right: Domain Performance */}
          <Grid item xs={12} md={7}>
            <Card sx={{ height: '100%', boxShadow: presentationMode ? 4 : 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  Domain Performance
                </Typography>
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1 }}>Domain</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1 }}>Projects</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1 }}>Budget</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1, minWidth: 120 }}>Progress</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1 }}>Health</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {domainPerformance.map((domain) => (
                        <TableRow key={domain.domainId} hover>
                          <TableCell sx={{ py: 1.5 }}>
                            <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.875rem' }}>
                              {domain.domainName}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1.5 }}>
                            <Chip
                              label={domain.projectCount}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.75rem', minWidth: 32 }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ py: 1.5 }}>
                            <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.875rem' }}>
                              {formatCompact(domain.totalBudget)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={domain.avgProgress}
                                sx={{ flex: 1, height: 6, borderRadius: 3 }}
                              />
                              <Typography variant="body2" sx={{ width: 35, fontSize: '0.875rem' }}>
                                {domain.avgProgress}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1.5 }}>
                            <Chip
                              label={`${domain.healthScore}%`}
                              size="small"
                              color={getHealthScoreColor(domain.healthScore)}
                              sx={{ height: 20, fontSize: '0.75rem', minWidth: 45 }}
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
        </Grid>

        {/* Bottom Section - At-Risk & Top Projects */}
        <Grid container spacing={2}>
          {/* At-Risk Projects */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', boxShadow: presentationMode ? 4 : 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Warning sx={{ mr: 1, color: 'error.main', fontSize: 20 }} />
                  <Typography variant="h6" fontWeight="bold">
                    At-Risk Projects
                  </Typography>
                  <Chip
                    label={atRiskProjects.length}
                    size="small"
                    color="error"
                    sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
                  />
                </Box>
                {atRiskProjects.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      All projects on track!
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer sx={{ maxHeight: 340 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1 }}>Project</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1 }}>Health</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1 }}>Risk</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1 }}>Progress</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {atRiskProjects.map((project) => (
                          <TableRow key={project.id} hover>
                            <TableCell sx={{ py: 1.5 }}>
                              <Typography variant="body2" sx={{ fontSize: '0.875rem' }} noWrap>
                                {project.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {project.fiscalYear}
                              </Typography>
                            </TableCell>
                            <TableCell align="center" sx={{ py: 1.5 }}>
                              <Chip
                                label={project.healthStatus}
                                size="small"
                                color={healthColors[project.healthStatus || '']}
                                sx={{ height: 20, fontSize: '0.75rem', minWidth: 50 }}
                              />
                            </TableCell>
                            <TableCell align="center" sx={{ py: 1.5 }}>
                              {projectRisks[project.id] ? (
                                <Tooltip
                                  title={
                                    <Box sx={{ p: 0.5 }}>
                                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                                        Risk Level: {projectRisks[project.id].riskLevel}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Score: {projectRisks[project.id].riskScore}/100
                                      </Typography>
                                    </Box>
                                  }
                                  placement="left"
                                  arrow
                                >
                                  <Chip
                                    label={projectRisks[project.id].riskScore}
                                    size="small"
                                    color={
                                      projectRisks[project.id].riskLevel === 'Low'
                                        ? 'success'
                                        : projectRisks[project.id].riskLevel === 'Medium'
                                        ? 'warning'
                                        : 'error'
                                    }
                                    sx={{ height: 20, fontSize: '0.75rem', minWidth: 35, cursor: 'help' }}
                                  />
                                </Tooltip>
                              ) : (
                                <Chip label="N/A" size="small" color="default" sx={{ height: 20, fontSize: '0.75rem', minWidth: 35 }} />
                              )}
                            </TableCell>
                            <TableCell align="center" sx={{ py: 1.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={project.progress}
                                  color={project.progress < 30 ? 'error' : project.progress < 70 ? 'warning' : 'success'}
                                  sx={{ width: 60, height: 6, borderRadius: 3 }}
                                />
                                <Typography variant="body2" sx={{ width: 35, fontSize: '0.875rem' }}>
                                  {project.progress}%
                                </Typography>
                              </Box>
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

          {/* Top Projects by Budget */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', boxShadow: presentationMode ? 4 : 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AttachMoney sx={{ mr: 1, color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Top Projects by Budget
                  </Typography>
                </Box>
                <TableContainer sx={{ maxHeight: 340 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1 }}>Project</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1 }}>Budget</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1 }}>Risk</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '0.75rem', py: 1 }}>Progress</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topProjects.map((project) => (
                        <TableRow key={project.id} hover>
                          <TableCell sx={{ py: 1.5 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.875rem' }} noWrap>
                              {project.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {project.fiscalYear}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ py: 1.5 }}>
                            <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.875rem' }}>
                              {formatCompact(project.budget || 0)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1.5 }}>
                            {projectRisks[project.id] ? (
                              <Tooltip
                                title={
                                  <Box sx={{ p: 0.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                                      Risk Level: {projectRisks[project.id].riskLevel}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Score: {projectRisks[project.id].riskScore}/100
                                    </Typography>
                                  </Box>
                                }
                                placement="left"
                                arrow
                              >
                                <Chip
                                  label={projectRisks[project.id].riskScore}
                                  size="small"
                                  color={
                                    projectRisks[project.id].riskLevel === 'Low'
                                      ? 'success'
                                      : projectRisks[project.id].riskLevel === 'Medium'
                                      ? 'warning'
                                      : 'error'
                                  }
                                  sx={{ height: 20, fontSize: '0.75rem', minWidth: 35, cursor: 'help' }}
                                />
                              </Tooltip>
                            ) : (
                              <Chip label="N/A" size="small" color="default" sx={{ height: 20, fontSize: '0.75rem', minWidth: 35 }} />
                            )}
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={project.progress}
                                color={project.progress < 30 ? 'error' : project.progress < 70 ? 'warning' : 'success'}
                                sx={{ width: 60, height: 6, borderRadius: 3 }}
                              />
                              <Typography variant="body2" sx={{ width: 35, fontSize: '0.875rem' }}>
                                {project.progress}%
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
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
