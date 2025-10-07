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
} from '@mui/material';
import {
  ArrowBack,
  ExpandMore,
  Visibility,
  People as PeopleIcon,
} from '@mui/icons-material';
import axios from 'axios';

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

const PortfolioProjects = () => {
  const { segmentFunctionId } = useParams<{ segmentFunctionId: string }>();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [segmentFunction, setSegmentFunction] = useState<SegmentFunction | null>(null);
  const [loading, setLoading] = useState(true);
  const [openResourcesDialog, setOpenResourcesDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectResources, setProjectResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  useEffect(() => {
    fetchData();
  }, [segmentFunctionId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [segmentFunctionRes, projectsRes] = await Promise.all([
        axios.get(`${API_URL}/segment-functions/${segmentFunctionId}`, config),
        axios.get(`${API_URL}/projects`, config),
      ]);

      setSegmentFunction(segmentFunctionRes.data.data);
      // Filter projects by segmentFunctionId
      const segmentFunctionProjects = projectsRes.data.data.filter(
        (p: Project) => p.segmentFunctionId === parseInt(segmentFunctionId!)
      );
      setProjects(segmentFunctionProjects);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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

  // Group projects by fiscal year
  const projectsByFY = projects.reduce((acc: Record<string, Project[]>, project) => {
    const fy = project.fiscalYear || 'Unknown';
    if (!acc[fy]) acc[fy] = [];
    acc[fy].push(project);
    return acc;
  }, {});

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
      <Box mb={4}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/domain/${segmentFunction?.domainId}/segment-functions`)}
          sx={{ mb: 2 }}
        >
          Back to Segment Functions
        </Button>
        <Typography variant="h4" gutterBottom>
          {segmentFunction?.name}
        </Typography>
        <Typography color="text.secondary">
          {segmentFunction?.description || 'Segment function projects overview'}
        </Typography>
        {segmentFunction?.domain && (
          <Chip label={segmentFunction.domain.name} sx={{ mt: 1 }} />
        )}
      </Box>

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
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Project Name</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Progress</TableCell>
                      <TableCell>Budget</TableCell>
                      <TableCell>Health</TableCell>
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
