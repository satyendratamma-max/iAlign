import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import axios from 'axios';
import CapabilityBuilder from '../../components/CapabilityBuilder';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface Requirement {
  id: number;
  projectId: number;
  appId: number;
  technologyId: number;
  roleId: number;
  requiredCount: number;
  fulfilledCount: number;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  minYearsExp?: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  startDate?: string;
  endDate?: string;
  description?: string;
  isFulfilled: boolean;
  app?: {
    id: number;
    name: string;
    code: string;
  };
  technology?: {
    id: number;
    name: string;
    code: string;
  };
  role?: {
    id: number;
    name: string;
    code: string;
    level: string;
  };
}

interface Project {
  id: number;
  name: string;
  status: string;
}

const ProjectRequirements = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentRequirement, setCurrentRequirement] = useState<Partial<Requirement>>({
    proficiencyLevel: 'Intermediate',
    priority: 'Medium',
    requiredCount: 1,
  });

  useEffect(() => {
    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [projectRes, requirementsRes] = await Promise.all([
        axios.get(`${API_URL}/projects/${projectId}`, config),
        axios.get(`${API_URL}/project-requirements/project/${projectId}`, config),
      ]);

      setProject(projectRes.data.data);
      setRequirements(requirementsRes.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (requirement?: Requirement) => {
    if (requirement) {
      setEditMode(true);
      setCurrentRequirement(requirement);
    } else {
      setEditMode(false);
      setCurrentRequirement({
        projectId: parseInt(projectId!),
        proficiencyLevel: 'Intermediate',
        priority: 'Medium',
        requiredCount: 1,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentRequirement({
      proficiencyLevel: 'Intermediate',
      priority: 'Medium',
      requiredCount: 1,
    });
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editMode && currentRequirement.id) {
        await axios.put(
          `${API_URL}/project-requirements/${currentRequirement.id}`,
          currentRequirement,
          config
        );
      } else {
        await axios.post(`${API_URL}/project-requirements`, currentRequirement, config);
      }

      fetchData();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save requirement');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this requirement?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/project-requirements/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchData();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete requirement');
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'error';
      case 'High':
        return 'warning';
      case 'Medium':
        return 'info';
      case 'Low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'Expert':
        return 'success';
      case 'Advanced':
        return 'info';
      case 'Intermediate':
        return 'primary';
      case 'Beginner':
        return 'default';
      default:
        return 'default';
    }
  };

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
            Project Requirements
          </Typography>
          {project && (
            <Typography variant="body1" color="text.secondary">
              {project.name} - Define skill requirements for resource allocation
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Requirement
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Capability</TableCell>
                  <TableCell>Proficiency</TableCell>
                  <TableCell>Min Years Exp</TableCell>
                  <TableCell>Required</TableCell>
                  <TableCell>Fulfilled</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Timeline</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requirements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body2" color="text.secondary" py={3}>
                        No requirements defined. Click "Add Requirement" to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  requirements.map((req) => (
                    <TableRow key={req.id} hover>
                      <TableCell>
                        {req.isFulfilled ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <WarningIcon color="warning" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {req.app?.code}/{req.technology?.code}/{req.role?.code}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {req.app?.name} - {req.technology?.name} - {req.role?.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={req.proficiencyLevel}
                          size="small"
                          color={getProficiencyColor(req.proficiencyLevel) as any}
                        />
                      </TableCell>
                      <TableCell>{req.minYearsExp || '-'}</TableCell>
                      <TableCell>
                        <Chip label={req.requiredCount} size="small" color="primary" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={req.fulfilledCount}
                          size="small"
                          color={req.fulfilledCount >= req.requiredCount ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={req.priority}
                          size="small"
                          color={getPriorityColor(req.priority) as any}
                        />
                      </TableCell>
                      <TableCell>
                        {req.startDate && req.endDate ? (
                          <Typography variant="caption">
                            {new Date(req.startDate).toLocaleDateString()} -{' '}
                            {new Date(req.endDate).toLocaleDateString()}
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(req)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(req.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Edit Requirement' : 'Add Requirement'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Required Capability
              </Typography>
              <CapabilityBuilder
                value={{
                  appId: currentRequirement.appId || 0,
                  technologyId: currentRequirement.technologyId || 0,
                  roleId: currentRequirement.roleId || 0,
                  proficiencyLevel: 'Intermediate',
                  isPrimary: true,
                }}
                onChange={(capability) => {
                  setCurrentRequirement({
                    ...currentRequirement,
                    appId: capability.appId,
                    technologyId: capability.technologyId,
                    roleId: capability.roleId,
                  });
                }}
                showPrimary={false}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Proficiency Level"
                value={currentRequirement.proficiencyLevel || 'Intermediate'}
                onChange={(e) =>
                  setCurrentRequirement({
                    ...currentRequirement,
                    proficiencyLevel: e.target.value as any,
                  })
                }
              >
                <MenuItem value="Beginner">Beginner</MenuItem>
                <MenuItem value="Intermediate">Intermediate</MenuItem>
                <MenuItem value="Advanced">Advanced</MenuItem>
                <MenuItem value="Expert">Expert</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Min Years Experience"
                value={currentRequirement.minYearsExp || ''}
                onChange={(e) =>
                  setCurrentRequirement({
                    ...currentRequirement,
                    minYearsExp: parseInt(e.target.value) || undefined,
                  })
                }
                inputProps={{ min: 0, max: 50 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Required Count"
                value={currentRequirement.requiredCount || 1}
                onChange={(e) =>
                  setCurrentRequirement({
                    ...currentRequirement,
                    requiredCount: parseInt(e.target.value) || 1,
                  })
                }
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Priority"
                value={currentRequirement.priority || 'Medium'}
                onChange={(e) =>
                  setCurrentRequirement({
                    ...currentRequirement,
                    priority: e.target.value as any,
                  })
                }
              >
                <MenuItem value="Critical">Critical</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={currentRequirement.startDate?.split('T')[0] || ''}
                onChange={(e) =>
                  setCurrentRequirement({
                    ...currentRequirement,
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
                value={currentRequirement.endDate?.split('T')[0] || ''}
                onChange={(e) =>
                  setCurrentRequirement({
                    ...currentRequirement,
                    endDate: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={currentRequirement.description || ''}
                onChange={(e) =>
                  setCurrentRequirement({
                    ...currentRequirement,
                    description: e.target.value,
                  })
                }
                placeholder="Additional details about this requirement..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={
              !currentRequirement.appId ||
              !currentRequirement.technologyId ||
              !currentRequirement.roleId
            }
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectRequirements;
