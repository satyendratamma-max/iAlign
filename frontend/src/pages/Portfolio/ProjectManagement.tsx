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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  LinearProgress,
  MenuItem,
  Tabs,
  Tab,
  FormControlLabel,
  Checkbox,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Description as TemplateIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { exportToExcel, importFromExcel, generateProjectTemplate } from '../../utils/excelUtils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface Project {
  id: number;
  projectNumber?: string;
  portfolioId?: number;
  domainId?: number;
  name: string;
  description?: string;
  businessProcess?: string;
  functionality?: string;
  status: string;
  priority: string;
  businessDecision?: string;
  businessPriority?: string;
  type?: string;
  fiscalYear?: string;
  progress: number;
  currentPhase?: string;
  budget?: number;
  actualCost?: number;
  forecastedCost?: number;
  plannedOpex?: number;
  plannedCapex?: number;
  totalPlannedCost?: number;
  financialBenefit?: number;
  startDate?: Date;
  endDate?: Date;
  desiredStartDate?: Date;
  desiredCompletionDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  deadline?: Date;
  healthStatus?: string;
  projectManagerId?: number;
  sponsorId?: number;
  needleMover?: string;
  dow?: string;
  investmentClass?: string;
  benefitArea?: string;
  technologyArea?: string;
  enterpriseCategory?: string;
  projectInfrastructureNeeded?: boolean;
  coCreation?: boolean;
  technologyChoice?: string;
  segmentFunction?: string;
  division?: string;
  newOrCarryOver?: string;
  submittedById?: number;
  domainManagerId?: number;
  isActive: boolean;
  domain?: {
    id: number;
    name: string;
  };
  portfolio?: {
    id: number;
    name: string;
  };
}

interface Domain {
  id: number;
  name: string;
}

interface Portfolio {
  id: number;
  name: string;
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

const ProjectManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProject, setCurrentProject] = useState<Partial<Project>>({});
  const [dialogTab, setDialogTab] = useState(0);
  const [openResourcesDialog, setOpenResourcesDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectResources, setProjectResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [filters, setFilters] = useState({
    projectNumber: '',
    name: '',
    domain: '',
    portfolio: '',
    type: '',
    fiscalYear: '',
    status: '',
    priority: '',
    currentPhase: '',
    health: '',
  });

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [projectsRes, domainsRes, portfoliosRes] = await Promise.all([
        axios.get(`${API_URL}/projects`, config),
        axios.get(`${API_URL}/domains`, config),
        axios.get(`${API_URL}/portfolios`, config),
      ]);

      setProjects(projectsRes.data.data);
      setDomains(domainsRes.data.data);
      setPortfolios(portfoliosRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setEditMode(true);
      setCurrentProject(project);
    } else {
      setEditMode(false);
      setCurrentProject({ progress: 0, status: 'Planning', priority: 'Medium' });
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

      if (editMode && currentProject.id) {
        await axios.put(`${API_URL}/projects/${currentProject.id}`, currentProject, config);
      } else {
        await axios.post(`${API_URL}/projects`, currentProject, config);
      }

      fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/projects/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchData();
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const handleViewResources = async (project: Project) => {
    setSelectedProject(project);
    setOpenResourcesDialog(true);
    setLoadingResources(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/allocations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Filter allocations by project ID and map to resources
      const projectAllocations = response.data.data.filter(
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

  const handleExport = () => {
    exportToExcel(projects, 'projects_export');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    importFromExcel(
      file,
      async (data) => {
        try {
          const token = localStorage.getItem('token');
          const config = { headers: { Authorization: `Bearer ${token}` } };

          // Bulk create projects
          for (const project of data) {
            await axios.post(`${API_URL}/projects`, project, config);
          }

          alert(`Successfully imported ${data.length} projects`);
          fetchData();
        } catch (error) {
          console.error('Error importing projects:', error);
          alert('Error importing some projects. Check console for details.');
        }
      },
      (error) => {
        alert(`Import error: ${error}`);
      }
    );

    // Reset input
    event.target.value = '';
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
    return colors[health || ''] || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={{ xs: 2, sm: 3 }}
        gap={{ xs: 2, sm: 0 }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' },
            }}
            gutterBottom
          >
            Project Management
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Manage and track all enterprise projects
          </Typography>
        </Box>
        <Box
          display="flex"
          flexWrap="wrap"
          gap={1}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <Button
            variant="outlined"
            startIcon={<TemplateIcon sx={{ display: { xs: 'none', sm: 'inline' } }} />}
            onClick={generateProjectTemplate}
            size="small"
            sx={{ flex: { xs: '1 1 auto', sm: '0 0 auto' } }}
          >
            Template
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon sx={{ display: { xs: 'none', sm: 'inline' } }} />}
            onClick={handleExport}
            size="small"
            sx={{ flex: { xs: '1 1 auto', sm: '0 0 auto' } }}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadIcon sx={{ display: { xs: 'none', sm: 'inline' } }} />}
            size="small"
            sx={{ flex: { xs: '1 1 auto', sm: '0 0 auto' } }}
          >
            Import
            <input
              type="file"
              hidden
              accept=".csv,.xlsx,.xls"
              onChange={handleImport}
            />
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            size="small"
            sx={{ flex: { xs: '1 1 100%', sm: '0 0 auto' } }}
          >
            Add Project
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: { xs: 800, md: 1200 } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 100 }}>Project #</TableCell>
              <TableCell sx={{ minWidth: 180 }}>Project Name</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Domain</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Portfolio</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Type</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Fiscal Year</TableCell>
              <TableCell sx={{ minWidth: 110 }}>Status</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Priority</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Current Phase</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Progress</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Budget</TableCell>
              <TableCell sx={{ minWidth: 110 }}>Start Date</TableCell>
              <TableCell sx={{ minWidth: 110 }}>End Date</TableCell>
              <TableCell sx={{ minWidth: 90 }}>Health</TableCell>
              <TableCell align="right" sx={{ minWidth: 140 }}>Actions</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <TextField
                  size="small"
                  placeholder="Filter by #"
                  value={filters.projectNumber}
                  onChange={(e) => setFilters({ ...filters, projectNumber: e.target.value })}
                  fullWidth
                />
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  placeholder="Filter by name"
                  value={filters.name}
                  onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                  fullWidth
                />
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  select
                  placeholder="All"
                  value={filters.domain}
                  onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="">All</MenuItem>
                  {domains.map((domain) => (
                    <MenuItem key={domain.id} value={domain.name}>
                      {domain.name}
                    </MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  select
                  placeholder="All"
                  value={filters.portfolio}
                  onChange={(e) => setFilters({ ...filters, portfolio: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="">All</MenuItem>
                  {portfolios.map((portfolio) => (
                    <MenuItem key={portfolio.id} value={portfolio.name}>
                      {portfolio.name}
                    </MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  placeholder="Filter by type"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  fullWidth
                />
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  placeholder="Filter by FY"
                  value={filters.fiscalYear}
                  onChange={(e) => setFilters({ ...filters, fiscalYear: e.target.value })}
                  fullWidth
                />
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  select
                  placeholder="All"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Planning">Planning</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="On Hold">On Hold</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </TextField>
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  select
                  placeholder="All"
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Critical">Critical</MenuItem>
                </TextField>
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  placeholder="Filter by phase"
                  value={filters.currentPhase}
                  onChange={(e) => setFilters({ ...filters, currentPhase: e.target.value })}
                  fullWidth
                />
              </TableCell>
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell>
                <TextField
                  size="small"
                  select
                  placeholder="All"
                  value={filters.health}
                  onChange={(e) => setFilters({ ...filters, health: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Green">Green</MenuItem>
                  <MenuItem value="Yellow">Yellow</MenuItem>
                  <MenuItem value="Red">Red</MenuItem>
                </TextField>
              </TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {projects
              .filter((project) => {
                return (
                  (project.projectNumber || '').toLowerCase().includes(filters.projectNumber.toLowerCase()) &&
                  project.name.toLowerCase().includes(filters.name.toLowerCase()) &&
                  (filters.domain === '' || project.domain?.name === filters.domain) &&
                  (filters.portfolio === '' || project.portfolio?.name === filters.portfolio) &&
                  (filters.type === '' || (project.type || '').toLowerCase().includes(filters.type.toLowerCase())) &&
                  (filters.fiscalYear === '' || (project.fiscalYear || '').toLowerCase().includes(filters.fiscalYear.toLowerCase())) &&
                  (filters.status === '' || project.status === filters.status) &&
                  (filters.priority === '' || project.priority === filters.priority) &&
                  (filters.currentPhase === '' || (project.currentPhase || '').toLowerCase().includes(filters.currentPhase.toLowerCase())) &&
                  (filters.health === '' || project.healthStatus === filters.health)
                );
              })
              .map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {project.projectNumber || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body1" fontWeight="medium">
                    {project.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {project.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  {project.domain?.name || '-'}
                </TableCell>
                <TableCell>
                  {project.portfolio?.name || '-'}
                </TableCell>
                <TableCell>{project.type || '-'}</TableCell>
                <TableCell>{project.fiscalYear || '-'}</TableCell>
                <TableCell>
                  <Chip label={project.status} size="small" color={getStatusColor(project.status)} />
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
                  <Typography variant="body2">
                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={project.healthStatus || 'N/A'}
                    size="small"
                    color={getHealthColor(project.healthStatus) as any}
                  />
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
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenDialog(project)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(project.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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
                label="Domain"
                value={currentProject.domainId || ''}
                onChange={(e) =>
                  setCurrentProject({ ...currentProject, domainId: e.target.value as number })
                }
              >
                <MenuItem value="">None</MenuItem>
                {domains.map((domain) => (
                  <MenuItem key={domain.id} value={domain.id}>
                    {domain.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Portfolio"
                value={currentProject.portfolioId || ''}
                onChange={(e) =>
                  setCurrentProject({ ...currentProject, portfolioId: e.target.value as number })
                }
              >
                <MenuItem value="">None</MenuItem>
                {portfolios.map((portfolio) => (
                  <MenuItem key={portfolio.id} value={portfolio.id}>
                    {portfolio.name}
                  </MenuItem>
                ))}
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Actual Cost"
                type="number"
                value={currentProject.actualCost || ''}
                onChange={(e) =>
                  setCurrentProject({
                    ...currentProject,
                    actualCost: parseFloat(e.target.value) || 0,
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

export default ProjectManagement;
