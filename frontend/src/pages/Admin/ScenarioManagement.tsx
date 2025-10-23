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
  IconButton,
  Tooltip,
  Alert,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as CloneIcon,
  Publish as PublishIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CheckCircle,
  Schedule,
  Download as DownloadIcon,
  Description as TemplateIcon,
} from '@mui/icons-material';
import scenarioApi, { Scenario, CreateScenarioRequest, CloneScenarioRequest } from '../../services/scenarioApi';
import { exportToExcel, generateScenarioTemplate } from '../../utils/excelUtils';
import { useScenario } from '../../contexts/ScenarioContext';
import { useAppSelector } from '../../hooks/redux';

const ScenarioManagement = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { refreshScenarios } = useScenario();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openCloneDialog, setOpenCloneDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);

  // Loading states for async operations
  const [submitting, setSubmitting] = useState(false);
  const [publishingScenarioId, setPublishingScenarioId] = useState<number | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateScenarioRequest>({
    name: '',
    description: '',
  });
  const [cloneForm, setCloneForm] = useState<CloneScenarioRequest>({
    name: '',
    description: '',
  });

  const isAdmin = user?.role === 'Administrator' || user?.role === 'Domain Manager';

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      setLoading(true);
      const data = await scenarioApi.getAll();
      setScenarios(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load scenarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScenario = async () => {
    if (submitting) return; // Prevent multiple submissions

    try {
      setSubmitting(true);
      await scenarioApi.create(createForm);
      setSuccess('Scenario created successfully');
      setOpenCreateDialog(false);
      setCreateForm({ name: '', description: '' });
      await fetchScenarios();
      await refreshScenarios();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create scenario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloneScenario = async () => {
    if (!selectedScenario || submitting) return; // Prevent multiple submissions

    try {
      setSubmitting(true);
      await scenarioApi.clone(selectedScenario.id, cloneForm);
      setSuccess('Scenario cloned successfully');
      setOpenCloneDialog(false);
      setCloneForm({ name: '', description: '' });
      setSelectedScenario(null);
      await fetchScenarios();
      await refreshScenarios();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to clone scenario');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishScenario = async (scenario: Scenario) => {
    if (publishingScenarioId !== null) return; // Prevent multiple submissions

    try {
      setPublishingScenarioId(scenario.id);
      await scenarioApi.publish(scenario.id);
      setSuccess('Scenario published successfully');
      await fetchScenarios();
      await refreshScenarios();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to publish scenario');
    } finally {
      setPublishingScenarioId(null);
    }
  };

  const handleDeleteScenario = async () => {
    if (!selectedScenario || submitting) return; // Prevent multiple submissions

    try {
      setSubmitting(true);
      await scenarioApi.delete(selectedScenario.id);
      setSuccess('Scenario deleted successfully');
      setOpenDeleteDialog(false);
      setSelectedScenario(null);
      await fetchScenarios();
      await refreshScenarios();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete scenario');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const handleExportScenarios = () => {
    const exportData = scenarios.map((s) => ({
      name: s.name,
      description: s.description || '',
      status: s.status,
      createdBy: s.creator ? `${s.creator.firstName} ${s.creator.lastName}` : '',
      createdDate: formatDate(s.createdDate),
      publishedDate: formatDate(s.publishedDate),
    }));
    exportToExcel(exportData, 'scenarios_export');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const userPlannedScenarios = scenarios.filter(
    (s) => s.status === 'planned' && s.createdBy === user?.id
  ).length;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Scenario Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Download template">
            <IconButton onClick={generateScenarioTemplate} color="primary">
              <TemplateIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export scenarios">
            <IconButton onClick={handleExportScenarios} color="primary">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh scenarios">
            <IconButton onClick={fetchScenarios} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
            disabled={userPlannedScenarios >= 2 && !isAdmin}
          >
            Create Scenario
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {userPlannedScenarios >= 2 && !isAdmin && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You have reached the maximum limit of 2 planned scenarios. Please delete or publish an existing scenario before creating a new one.
        </Alert>
      )}

      {/* Scenarios Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Scenarios
              </Typography>
              <Typography variant="h4">{scenarios.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Published Scenarios
              </Typography>
              <Typography variant="h4">
                {scenarios.filter((s) => s.status === 'published').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Your Planned Scenarios
              </Typography>
              <Typography variant="h4">{userPlannedScenarios} / 2</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Scenarios Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="right">Actions</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell>Created Date</TableCell>
              <TableCell>Published Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scenarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No scenarios found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              scenarios.map((scenario) => (
                <TableRow key={scenario.id}>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Tooltip title="Clone scenario">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedScenario(scenario);
                            setCloneForm({
                              name: `${scenario.name} (Copy)`,
                              description: scenario.description,
                            });
                            setOpenCloneDialog(true);
                          }}
                          disabled={userPlannedScenarios >= 2 && !isAdmin}
                        >
                          <CloneIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {scenario.status === 'planned' && isAdmin && (
                        <Tooltip title="Publish scenario">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handlePublishScenario(scenario)}
                            disabled={publishingScenarioId !== null}
                          >
                            {publishingScenarioId === scenario.id ? (
                              <CircularProgress size={16} />
                            ) : (
                              <PublishIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      )}

                      {scenario.status === 'planned' &&
                        (scenario.createdBy === user?.id || isAdmin) && (
                          <Tooltip title="Delete scenario">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setSelectedScenario(scenario);
                                setOpenDeleteDialog(true);
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {scenario.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {scenario.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={scenario.status === 'published' ? <CheckCircle /> : <Schedule />}
                      label={scenario.status}
                      size="small"
                      color={scenario.status === 'published' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {scenario.creator
                        ? `${scenario.creator.firstName} ${scenario.creator.lastName}`
                        : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatDate(scenario.createdDate)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatDate(scenario.publishedDate)}</Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Scenario Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Scenario</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Scenario Name"
            type="text"
            fullWidth
            required
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={createForm.description}
            onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateScenario}
            variant="contained"
            disabled={!createForm.name.trim() || submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : undefined}
          >
            {submitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clone Scenario Dialog */}
      <Dialog open={openCloneDialog} onClose={() => setOpenCloneDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Clone Scenario: {selectedScenario?.name}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Scenario Name"
            type="text"
            fullWidth
            required
            value={cloneForm.name}
            onChange={(e) => setCloneForm({ ...cloneForm, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={cloneForm.description}
            onChange={(e) => setCloneForm({ ...cloneForm, description: e.target.value })}
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            This will create a complete copy of all projects, resources, milestones, and dependencies from the selected scenario.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCloneDialog(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleCloneScenario}
            variant="contained"
            disabled={!cloneForm.name?.trim() || submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : undefined}
          >
            {submitting ? 'Cloning...' : 'Clone'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Scenario Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete Scenario</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the scenario "{selectedScenario?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteScenario}
            variant="contained"
            color="error"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : undefined}
          >
            {submitting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScenarioManagement;
