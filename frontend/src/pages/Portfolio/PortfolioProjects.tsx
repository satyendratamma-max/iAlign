import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Button,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableSortLabel,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack,
  ExpandMore,
  Visibility,
  People as PeopleIcon,
  Hub,
  Folder as FolderIcon,
} from '@mui/icons-material';
import axios from 'axios';
import Paper from '@mui/material/Paper';
import PageHeader from '../../components/common/PageHeader';
import { useScenario } from '../../contexts/ScenarioContext';
import { fetchAllPages } from '../../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface Project {
  id: number;
  segmentFunctionId?: number;
  name: string;
  description?: string;
  status: string;
  priority: string;
  fiscalYear?: string;
  progress: number;
  budget?: number;
  actualCost?: number;
  healthStatus?: string;
}

interface SegmentFunction {
  id: number;
  name: string;
  description?: string;
  domainId?: number;
  domain?: {
    name: string;
  };
}

interface Resource {
  id: number;
  employeeId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  primarySkill?: string;
  allocationPercentage?: number;
  roleOnProject?: string;
}

interface DomainImpact {
  id: number;
  projectId: number;
  domainId: number;
  impactType: string;
  impactLevel: string;
  domain?: {
    id: number;
    name: string;
  };
}

interface ProjectRiskScore {
  projectId: number;
  projectName: string;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
}

type OrderDirection = 'asc' | 'desc';
type SortableColumn = 'name' | 'status' | 'priority' | 'progress' | 'budget' | 'risk';

const PortfolioProjects = () => {
  const { segmentFunctionId } = useParams<{ segmentFunctionId: string }>();
  const navigate = useNavigate();
  const { activeScenario } = useScenario();
  const [projects, setProjects] = useState<Project[]>([]);
  const [segmentFunction, setSegmentFunction] = useState<SegmentFunction | null>(null);
  const [domainImpacts, setDomainImpacts] = useState<DomainImpact[]>([]);
  const [loading, setLoading] = useState(true);
  const [openResourcesDialog, setOpenResourcesDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectResources, setProjectResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [orderBy, setOrderBy] = useState<SortableColumn>('name');
  const [order, setOrder] = useState<OrderDirection>('asc');
  const [projectRisks, setProjectRisks] = useState<Record<number, ProjectRiskScore>>({});

  useEffect(() => {
    if (activeScenario) {
      fetchData();
    }
  }, [segmentFunctionId, activeScenario]);

  const fetchData = async () => {
    if (!activeScenario?.id) {
      console.warn('No active scenario selected for PortfolioProjects');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [segmentFunctionRes, allProjects, impactsRes] = await Promise.all([
        axios.get(`${API_URL}/segment-functions/${segmentFunctionId}`, config),
        fetchAllPages(`${API_URL}/projects`, { ...config, params: { scenarioId: activeScenario.id } }),
        axios.get(`${API_URL}/project-domain-impacts`, config),
      ]);

      setSegmentFunction(segmentFunctionRes.data.data);
      // Filter projects by segmentFunctionId
      const segmentFunctionProjects = allProjects.filter(
        (p: Project) => p.segmentFunctionId === parseInt(segmentFunctionId!)
      );
      setProjects(segmentFunctionProjects);
      setDomainImpacts(impactsRes.data.data || []);

      // Fetch risk data for the segment function
      fetchRiskData(activeScenario.id, token, config);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRiskData = async (
    scenarioId: number,
    token: string | null,
    config: { headers: { Authorization: string } }
  ) => {
    try {
      const response = await axios.get(
        `${API_URL}/segment-functions/${segmentFunctionId}/risk?scenarioId=${scenarioId}`,
        config
      );

      const riskData = response.data.data;
      if (riskData.projectRisks && Array.isArray(riskData.projectRisks)) {
        const risksMap: Record<number, ProjectRiskScore> = {};
        riskData.projectRisks.forEach((risk: ProjectRiskScore) => {
          risksMap[risk.projectId] = risk;
        });
        setProjectRisks(risksMap);
      }
    } catch (error) {
      console.error('Error fetching risk data:', error);
    }
  };

  const handleViewResources = async (project: Project) => {
    if (!activeScenario?.id) {
      console.warn('No active scenario selected');
      return;
    }

    setSelectedProject(project);
    setOpenResourcesDialog(true);
    setLoadingResources(true);

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const allAllocations = await fetchAllPages(`${API_URL}/allocations`, {
        ...config,
        params: { scenarioId: activeScenario.id }
      });

      // Filter allocations by project ID and map to resources
      const projectAllocations = allAllocations.filter(
        (allocation: any) => allocation.projectId === project.id
      );

      const resources = projectAllocations.map((allocation: any) => ({
        id: allocation.resource?.id,
        employeeId: allocation.resource?.employeeId,
        firstName: allocation.resource?.firstName,
        lastName: allocation.resource?.lastName,
        email: allocation.resource?.email,
        role: allocation.resource?.role,
        primarySkill: allocation.resource?.primarySkill,
        allocationPercentage: allocation.allocationPercentage,
        roleOnProject: allocation.roleOnProject,
      }));

      setProjectResources(resources);
    } catch (error) {
      console.error('Error fetching project resources:', error);
    } finally {
      setLoadingResources(false);
    }
  };

  const handleCloseResourcesDialog = () => {
    setOpenResourcesDialog(false);
    setSelectedProject(null);
    setProjectResources([]);
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
      'Planning': 'default',
      'In Progress': 'primary',
      'Completed': 'success',
      'On Hold': 'warning',
      'Cancelled': 'error',
    };
    return colors[status] || 'default';
  };

  const getHealthColor = (health?: string) => {
    const colors: Record<string, 'success' | 'warning' | 'error'> = {
      'Green': 'success',
      'Yellow': 'warning',
      'Red': 'error',
    };
    return colors[health || ''] || undefined;
  };

  const getProjectDomainImpacts = (projectId: number) => {
    return domainImpacts.filter(impact => impact.projectId === projectId);
  };

  const handleRequestSort = (property: SortableColumn) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortProjects = (projectsToSort: Project[]): Project[] => {
    return [...projectsToSort].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (orderBy) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'status':
          aValue = a.status?.toLowerCase() || '';
          bValue = b.status?.toLowerCase() || '';
          break;
        case 'priority':
          const priorityOrder: Record<string, number> = {
            'Critical': 4,
            'High': 3,
            'Medium': 2,
            'Low': 1,
          };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        case 'progress':
          aValue = a.progress || 0;
          bValue = b.progress || 0;
          break;
        case 'budget':
          aValue = a.budget || 0;
          bValue = b.budget || 0;
          break;
        case 'risk':
          aValue = projectRisks[a.id]?.riskScore || 0;
          bValue = projectRisks[b.id]?.riskScore || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return order === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Group projects by fiscal year and apply sorting within each group
  const projectsByFY = projects.reduce((acc: Record<string, Project[]>, project) => {
    const fy = project.fiscalYear || 'Unknown';
    if (!acc[fy]) acc[fy] = [];
    acc[fy].push(project);
    return acc;
  }, {});

  // Sort projects within each fiscal year group
  Object.keys(projectsByFY).forEach(fy => {
    projectsByFY[fy] = sortProjects(projectsByFY[fy]);
  });

  const fiscalYears = Object.keys(projectsByFY).sort();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(`/domain/${segmentFunction?.domainId}/segment-functions`)}
        variant="outlined"
        size="small"
        sx={{ mb: 2 }}
      >
        Back to Segment Functions
      </Button>

      <PageHeader
        title={segmentFunction?.name || 'Segment Function Projects'}
        subtitle={
          segmentFunction?.description || 'Segment function projects overview'
        }
        icon={<FolderIcon sx={{ fontSize: 32 }} />}
        compact
      />

      {segmentFunction?.domain && (
        <Box sx={{ mb: 3 }}>
          <Chip label={segmentFunction.domain.name} color="primary" variant="outlined" />
        </Box>
      )}

      {/* Projects grouped by Fiscal Year */}
      {fiscalYears.length > 0 ? (
        fiscalYears.map((fy) => (
          <Accordion key={fy} defaultExpanded={fy === 'FY25'} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">
                {fy} ({projectsByFY[fy].length} projects)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} sx={{ boxShadow: 2, borderRadius: 1.5 }}>
                <Table>
                  <TableHead sx={{ backgroundColor: (theme) => theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.grey[900] }}>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'name'}
                          direction={orderBy === 'name' ? order : 'asc'}
                          onClick={() => handleRequestSort('name')}
                        >
                          Project Name
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'status'}
                          direction={orderBy === 'status' ? order : 'asc'}
                          onClick={() => handleRequestSort('status')}
                        >
                          Status
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'priority'}
                          direction={orderBy === 'priority' ? order : 'asc'}
                          onClick={() => handleRequestSort('priority')}
                        >
                          Priority
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'progress'}
                          direction={orderBy === 'progress' ? order : 'asc'}
                          onClick={() => handleRequestSort('progress')}
                        >
                          Progress
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'budget'}
                          direction={orderBy === 'budget' ? order : 'asc'}
                          onClick={() => handleRequestSort('budget')}
                        >
                          Budget
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Health</TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'risk'}
                          direction={orderBy === 'risk' ? order : 'asc'}
                          onClick={() => handleRequestSort('risk')}
                        >
                          Risk Score
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>Cross-Domain</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {projectsByFY[fy].map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {project.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {project.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={project.status}
                            size="small"
                            color={getStatusColor(project.status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip label={project.priority} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LinearProgress
                              variant="determinate"
                              value={project.progress}
                              sx={{ width: 100, height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="body2">{project.progress}%</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{formatCurrency(project.budget)}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Spent: {formatCurrency(project.actualCost)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={project.healthStatus || 'N/A'}
                            size="small"
                            color={getHealthColor(project.healthStatus)}
                          />
                        </TableCell>
                        <TableCell>
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
                                sx={{ cursor: 'help' }}
                              />
                            </Tooltip>
                          ) : (
                            <Chip label="N/A" size="small" color="default" />
                          )}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const impacts = getProjectDomainImpacts(project.id);
                            return impacts.length > 0 ? (
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <Hub sx={{ fontSize: 16, color: 'info.main' }} />
                                <Chip
                                  label={`${impacts.length} domain${impacts.length > 1 ? 's' : ''}`}
                                  size="small"
                                  color="info"
                                  variant="outlined"
                                />
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">-</Typography>
                            );
                          })()}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewResources(project)}
                            title="View Resources"
                          >
                            <PeopleIcon />
                          </IconButton>
                          <Button
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() => navigate(`/projects/${project.id}/milestones`)}
                          >
                            View Milestones
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))
      ) : (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            No projects found in this segment function
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Projects can be assigned to this segment function from the Project Management page
          </Typography>
        </Box>
      )}

      <Dialog
        open={openResourcesDialog}
        onClose={handleCloseResourcesDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {selectedProject?.name} - Allocated Resources ({projectResources.length})
        </DialogTitle>
        <DialogContent>
          {loadingResources ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : projectResources.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <Typography color="text.secondary">
                No resources allocated to this project
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Primary Skill</TableCell>
                    <TableCell>Role on Project</TableCell>
                    <TableCell>Allocation %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {projectResources.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell>{resource.employeeId}</TableCell>
                      <TableCell>
                        {resource.firstName} {resource.lastName}
                      </TableCell>
                      <TableCell>{resource.email || '-'}</TableCell>
                      <TableCell>
                        <Chip label={resource.primarySkill || 'N/A'} size="small" />
                      </TableCell>
                      <TableCell>{resource.roleOnProject || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${resource.allocationPercentage || 0}%`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResourcesDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PortfolioProjects;
