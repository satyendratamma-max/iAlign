import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  Chip,
  CircularProgress,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore,
  TrendingUp,
  People,
  AttachMoney,
  Assessment,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useScenario } from '../../contexts/ScenarioContext';
import { fetchAllPages } from '../../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface Domain {
  id: number;
  name: string;
  type?: string;
  location?: string;
  manager?: {
    firstName: string;
    lastName: string;
  };
}

interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  priority: string;
  fiscalYear?: string;
  progress: number;
  currentPhase?: string;
  budget?: number;
  actualCost?: number;
  forecastedCost?: number;
  healthStatus?: string;
  type?: string;
  startDate?: Date;
  endDate?: Date;
  segmentFunctionId?: number;
}

interface Team {
  id: number;
  name: string;
  skillType?: string;
  totalMembers?: number;
  utilizationRate?: number;
  monthlyCost?: number;
  totalCapacityHours?: number;
}

interface ProjectRiskScore {
  projectId: number;
  projectName: string;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
}

const DomainPortfolioOverview = () => {
  const { domainId } = useParams<{ domainId: string }>();
  const { activeScenario } = useScenario();
  const [domain, setDomain] = useState<Domain | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProject, setCurrentProject] = useState<Partial<Project>>({});
  const [projectRisks, setProjectRisks] = useState<Record<number, ProjectRiskScore>>({});

  useEffect(() => {
    if (activeScenario) {
      fetchDomainData();
    }
  }, [domainId, activeScenario]);

  const fetchDomainData = async () => {
    if (!activeScenario?.id) {
      console.warn('No active scenario selected for DomainPortfolioOverview');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [domainRes, fetchedProjects, teamsRes] = await Promise.all([
        axios.get(`${API_URL}/domains/${domainId}`, config),
        fetchAllPages(`${API_URL}/projects`, { ...config, params: { scenarioId: activeScenario.id, domainId } }),
        axios.get(`${API_URL}/teams?domainId=${domainId}`, config),
      ]);

      setDomain(domainRes.data.data);
      setProjects(fetchedProjects);
      setTeams(teamsRes.data.data);

      // Fetch risk data for all segment functions in this domain
      const uniqueSegmentFunctionIds = [...new Set(
        fetchedProjects
          .filter((p: Project) => p.segmentFunctionId)
          .map((p: Project) => p.segmentFunctionId)
      )];

      if (uniqueSegmentFunctionIds.length > 0) {
        fetchRiskData(uniqueSegmentFunctionIds, activeScenario.id, token, config);
      }
    } catch (error) {
      console.error('Error fetching domain data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRiskData = async (
    segmentFunctionIds: (number | undefined)[],
    scenarioId: number,
    token: string | null,
    config: { headers: { Authorization: string } }
  ) => {
    try {
      const riskPromises = segmentFunctionIds
        .filter((id): id is number => id !== undefined)
        .map(segmentFunctionId =>
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

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setEditMode(true);
      setCurrentProject(project);
    } else {
      setEditMode(false);
      setCurrentProject({
        status: 'Planning',
        priority: 'Medium',
        progress: 0,
        healthStatus: 'Green',
        fiscalYear: 'FY25',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentProject({});
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const projectData = {
        ...currentProject,
        domainId: parseInt(domainId || '0'),
      };

      if (editMode && currentProject.id) {
        await axios.put(`${API_URL}/projects/${currentProject.id}`, projectData, config);
      } else {
        await axios.post(`${API_URL}/projects`, projectData, config);
      }

      fetchDomainData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!domain) {
    return (
      <Box p={3}>
        <Typography variant="h5">Domain not found</Typography>
      </Box>
    );
  }

  // Calculate metrics
  const totalProjects = projects.length;
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalActualCost = projects.reduce((sum, p) => sum + (p.actualCost || 0), 0);
  const avgProgress = projects.reduce((sum, p) => sum + p.progress, 0) / totalProjects || 0;
  const totalResources = teams.reduce((sum, t) => sum + (t.totalMembers || 0), 0);
  const avgUtilization = teams.reduce((sum, t) => sum + (t.utilizationRate || 0), 0) / teams.length || 0;

  // Group projects by fiscal year
  const projectsByFY = projects.reduce((acc: any, project) => {
    const fy = project.fiscalYear || 'Unknown';
    if (!acc[fy]) acc[fy] = [];
    acc[fy].push(project);
    return acc;
  }, {});

  const fiscalYears = ['FY24', 'FY25', 'FY26', 'FY27'].filter(fy => projectsByFY[fy]);

  const formatCurrency = (value: number) => {
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
    return colors[health || ''] || 'default';
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {domain.name} Domain Portfolio
          </Typography>
          <Typography color="text.secondary">
            {domain.location} • {domain.manager?.firstName} {domain.manager?.lastName}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Project
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Projects
                  </Typography>
                  <Typography variant="h4">{totalProjects}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Avg {Math.round(avgProgress)}% progress
                  </Typography>
                </Box>
                <Box sx={{ color: 'primary.main' }}>
                  <Assessment />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Budget
                  </Typography>
                  <Typography variant="h4">{formatCurrency(totalBudget)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Spent: {formatCurrency(totalActualCost)}
                  </Typography>
                </Box>
                <Box sx={{ color: 'success.main' }}>
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
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Team Resources
                  </Typography>
                  <Typography variant="h4">{totalResources}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {teams.length} teams
                  </Typography>
                </Box>
                <Box sx={{ color: 'info.main' }}>
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
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Avg Utilization
                  </Typography>
                  <Typography variant="h4">{Math.round(avgUtilization)}%</Typography>
                  <Typography variant="caption" color="success.main">
                    ↑ Capacity available
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

      {/* Tabs for different views */}
      <Card>
        <Tabs value={selectedTab} onChange={(_, v) => setSelectedTab(v)}>
          <Tab label="Projects by Fiscal Year" />
          <Tab label="Team Capacity" />
        </Tabs>

        {/* Projects by Fiscal Year Tab */}
        {selectedTab === 0 && (
          <Box p={3}>
            {fiscalYears.map((fy) => (
              <Accordion key={fy} defaultExpanded={fy === 'FY25'}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">
                    {fy} ({projectsByFY[fy].length} projects)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Project Name</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Priority</TableCell>
                          <TableCell>Phase</TableCell>
                          <TableCell>Progress</TableCell>
                          <TableCell>Budget</TableCell>
                          <TableCell>Health</TableCell>
                          <TableCell>Risk Score</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {projectsByFY[fy].map((project: Project) => (
                          <TableRow key={project.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {project.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {project.type}
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
                            <TableCell>{project.currentPhase || '-'}</TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <LinearProgress
                                  variant="determinate"
                                  value={project.progress}
                                  sx={{ width: 80, height: 6, borderRadius: 3 }}
                                />
                                <Typography variant="caption">{project.progress}%</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {formatCurrency(project.budget || 0)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Spent: {formatCurrency(project.actualCost || 0)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={project.healthStatus || 'N/A'}
                                size="small"
                                color={getHealthColor(project.healthStatus) as any}
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
                            <TableCell align="right">
                              <Button
                                size="small"
                                startIcon={<EditIcon />}
                                onClick={() => handleOpenDialog(project)}
                              >
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}

        {/* Team Capacity Tab */}
        {selectedTab === 1 && (
          <Box p={3}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Team Name</TableCell>
                    <TableCell>Skill Type</TableCell>
                    <TableCell>Members</TableCell>
                    <TableCell>Capacity (hrs/mo)</TableCell>
                    <TableCell>Utilization</TableCell>
                    <TableCell>Monthly Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {team.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={team.skillType || 'N/A'} size="small" />
                      </TableCell>
                      <TableCell>{team.totalMembers || 0}</TableCell>
                      <TableCell>{team.totalCapacityHours || 0}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LinearProgress
                            variant="determinate"
                            value={team.utilizationRate || 0}
                            sx={{
                              width: 80,
                              height: 6,
                              borderRadius: 3,
                              '& .MuiLinearProgress-bar': {
                                backgroundColor:
                                  (team.utilizationRate || 0) >= 85
                                    ? 'success.main'
                                    : (team.utilizationRate || 0) >= 70
                                    ? 'primary.main'
                                    : 'warning.main',
                              },
                            }}
                          />
                          <Typography variant="caption">
                            {team.utilizationRate || 0}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{formatCurrency(team.monthlyCost || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Card>

      {/* Edit/Create Project Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Edit Project' : 'Add Project'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Project Name"
                value={currentProject.name || ''}
                onChange={(e) =>
                  setCurrentProject({ ...currentProject, name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={currentProject.description || ''}
                onChange={(e) =>
                  setCurrentProject({ ...currentProject, description: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Fiscal Year"
                value={currentProject.fiscalYear || 'FY25'}
                onChange={(e) =>
                  setCurrentProject({ ...currentProject, fiscalYear: e.target.value })
                }
              >
                <MenuItem value="FY24">FY24</MenuItem>
                <MenuItem value="FY25">FY25</MenuItem>
                <MenuItem value="FY26">FY26</MenuItem>
                <MenuItem value="FY27">FY27</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Status"
                value={currentProject.status || 'Planning'}
                onChange={(e) =>
                  setCurrentProject({ ...currentProject, status: e.target.value })
                }
              >
                <MenuItem value="Planning">Planning</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="On Hold">On Hold</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Priority"
                value={currentProject.priority || 'Medium'}
                onChange={(e) =>
                  setCurrentProject({ ...currentProject, priority: e.target.value })
                }
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Critical">Critical</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Health Status"
                value={currentProject.healthStatus || 'Green'}
                onChange={(e) =>
                  setCurrentProject({ ...currentProject, healthStatus: e.target.value })
                }
              >
                <MenuItem value="Green">Green</MenuItem>
                <MenuItem value="Yellow">Yellow</MenuItem>
                <MenuItem value="Red">Red</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Progress (%)"
                type="number"
                value={currentProject.progress || 0}
                onChange={(e) =>
                  setCurrentProject({
                    ...currentProject,
                    progress: parseInt(e.target.value) || 0,
                  })
                }
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Budget"
                type="number"
                value={currentProject.budget || ''}
                onChange={(e) =>
                  setCurrentProject({
                    ...currentProject,
                    budget: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DomainPortfolioOverview;
