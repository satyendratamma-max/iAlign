import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
  LinearProgress,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle,
  RadioButtonUnchecked,
  PlayCircle,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const PHASES = [
  'Requirements',
  'Design',
  'Build',
  'Test',
  'UAT',
  'Go-Live',
  'Hypercare',
];

interface Project {
  id: number;
  name: string;
  status: string;
  currentPhase?: string;
  progress: number;
}

interface Milestone {
  id: number;
  projectId: number;
  phase: string;
  name: string;
  description?: string;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  status: string;
  progress: number;
  dependencies?: string;
  deliverables?: string;
  healthStatus?: string;
}

const MilestoneTracker = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<Partial<Milestone>>({});

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [projectRes, milestonesRes] = await Promise.all([
        axios.get(`${API_URL}/projects/${projectId}`, config),
        axios.get(`${API_URL}/milestones?projectId=${projectId}`, config),
      ]);

      setProject(projectRes.data.data);
      setMilestones(milestonesRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (milestone?: Milestone) => {
    if (milestone) {
      setEditMode(true);
      setCurrentMilestone(milestone);
    } else {
      setEditMode(false);
      setCurrentMilestone({
        status: 'Not Started',
        progress: 0,
        healthStatus: 'Green',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentMilestone({});
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const milestoneData = {
        ...currentMilestone,
        projectId: parseInt(projectId || '0'),
      };

      if (editMode && currentMilestone.id) {
        await axios.put(`${API_URL}/milestones/${currentMilestone.id}`, milestoneData, config);
      } else {
        await axios.post(`${API_URL}/milestones`, milestoneData, config);
      }

      fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving milestone:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this milestone?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/milestones/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchData();
      } catch (error) {
        console.error('Error deleting milestone:', error);
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!project) {
    return (
      <Box p={3}>
        <Typography variant="h5">Project not found</Typography>
      </Box>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'primary' | 'success' | 'error'> = {
      'Not Started': 'default',
      'In Progress': 'primary',
      'Completed': 'success',
      'Delayed': 'error',
      'At Risk': 'error',
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

  const getStepIcon = (milestone?: Milestone) => {
    if (!milestone) return <RadioButtonUnchecked />;
    if (milestone.status === 'Completed') return <CheckCircle color="success" />;
    if (milestone.status === 'In Progress') return <PlayCircle color="primary" />;
    return <RadioButtonUnchecked />;
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString();
  };

  // Sort milestones by phase order
  const sortedMilestones = [...milestones].sort((a, b) => {
    return PHASES.indexOf(a.phase) - PHASES.indexOf(b.phase);
  });

  const activeStep = sortedMilestones.findIndex(m => m.status === 'In Progress');

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box flex={1}>
          <Typography variant="h4" gutterBottom>
            Milestone Tracker
          </Typography>
          <Typography color="text.secondary">
            {project.name} • {project.status} • {project.progress}% Complete
          </Typography>
        </Box>
      </Box>

      {/* Progress Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Project Timeline
          </Typography>
          <Stepper activeStep={activeStep >= 0 ? activeStep : 0} alternativeLabel>
            {PHASES.map((phase) => {
              const milestone = sortedMilestones.find(m => m.phase === phase);
              return (
                <Step key={phase} completed={milestone?.status === 'Completed'}>
                  <StepLabel
                    StepIconComponent={() => getStepIcon(milestone)}
                    optional={
                      milestone && (
                        <Typography variant="caption">
                          {milestone.progress}%
                        </Typography>
                      )
                    }
                  >
                    {phase}
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </CardContent>
      </Card>

      {/* Milestone Cards */}
      <Grid container spacing={3}>
        {sortedMilestones.map((milestone) => (
          <Grid item xs={12} md={6} lg={4} key={milestone.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Chip
                      label={milestone.phase}
                      size="small"
                      color="primary"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="h6">{milestone.name}</Typography>
                  </Box>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(milestone)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(milestone.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" paragraph>
                  {milestone.description || 'No description'}
                </Typography>

                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">Progress</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {milestone.progress}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={milestone.progress}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Box mt={0.5}>
                      <Chip
                        label={milestone.status}
                        size="small"
                        color={getStatusColor(milestone.status)}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Health
                    </Typography>
                    <Box mt={0.5}>
                      <Chip
                        label={milestone.healthStatus || 'N/A'}
                        size="small"
                        color={getHealthColor(milestone.healthStatus) as any}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Planned Dates
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(milestone.plannedStartDate)} →{' '}
                      {formatDate(milestone.plannedEndDate)}
                    </Typography>
                  </Grid>
                  {milestone.actualStartDate && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Actual Dates
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(milestone.actualStartDate)} →{' '}
                        {formatDate(milestone.actualEndDate)}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Edit/Create Milestone Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Edit Milestone' : 'Add Milestone'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Phase"
                value={currentMilestone.phase || ''}
                onChange={(e) =>
                  setCurrentMilestone({ ...currentMilestone, phase: e.target.value })
                }
              >
                {PHASES.map((phase) => (
                  <MenuItem key={phase} value={phase}>
                    {phase}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Milestone Name"
                value={currentMilestone.name || ''}
                onChange={(e) =>
                  setCurrentMilestone({ ...currentMilestone, name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={currentMilestone.description || ''}
                onChange={(e) =>
                  setCurrentMilestone({ ...currentMilestone, description: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Status"
                value={currentMilestone.status || 'Not Started'}
                onChange={(e) =>
                  setCurrentMilestone({ ...currentMilestone, status: e.target.value })
                }
              >
                <MenuItem value="Not Started">Not Started</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Delayed">Delayed</MenuItem>
                <MenuItem value="At Risk">At Risk</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Health Status"
                value={currentMilestone.healthStatus || 'Green'}
                onChange={(e) =>
                  setCurrentMilestone({ ...currentMilestone, healthStatus: e.target.value })
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
                value={currentMilestone.progress || 0}
                onChange={(e) =>
                  setCurrentMilestone({
                    ...currentMilestone,
                    progress: parseInt(e.target.value) || 0,
                  })
                }
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Planned Start Date"
                type="date"
                value={
                  currentMilestone.plannedStartDate
                    ? new Date(currentMilestone.plannedStartDate).toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  setCurrentMilestone({
                    ...currentMilestone,
                    plannedStartDate: new Date(e.target.value) as any,
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Planned End Date"
                type="date"
                value={
                  currentMilestone.plannedEndDate
                    ? new Date(currentMilestone.plannedEndDate).toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  setCurrentMilestone({
                    ...currentMilestone,
                    plannedEndDate: new Date(e.target.value) as any,
                  })
                }
                InputLabelProps={{ shrink: true }}
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

export default MilestoneTracker;
