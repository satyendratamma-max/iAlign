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
  MenuItem,
  IconButton,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import axios from 'axios';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import TableSkeleton from '../../components/common/TableSkeleton';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface DefaultRequirement {
  id: number;
  appId: number;
  technologyId: number;
  roleId: number;
  requiredCount: number;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  minYearsExp?: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdDate: string;
  modifiedDate: string;
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
    level?: string;
  };
}

interface App {
  id: number;
  name: string;
  code: string;
}

interface Technology {
  id: number;
  appId?: number;
  name: string;
  code: string;
}

interface Role {
  id: number;
  appId?: number;
  technologyId?: number;
  name: string;
  code: string;
  level?: string;
}

const DefaultRequirementsConfig = () => {
  const [requirements, setRequirements] = useState<DefaultRequirement[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<DefaultRequirement | null>(null);
  const [filterAppId, setFilterAppId] = useState<number | 'all'>('all');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requirementToDelete, setRequirementToDelete] = useState<DefaultRequirement | null>(null);

  const [formData, setFormData] = useState({
    appId: '' as number | '',
    technologyId: '' as number | '',
    roleId: '' as number | '',
    requiredCount: 1,
    proficiencyLevel: 'Intermediate' as 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert',
    minYearsExp: '' as number | '',
    priority: 'Medium' as 'Critical' | 'High' | 'Medium' | 'Low',
    description: '',
  });

  // Get auth token from localStorage
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  // Fetch all data
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [reqRes, appsRes, techsRes, rolesRes] = await Promise.all([
        axios.get(`${API_URL}/default-requirements`, getAuthHeaders()),
        axios.get(`${API_URL}/apps`, getAuthHeaders()),
        axios.get(`${API_URL}/technologies`, getAuthHeaders()),
        axios.get(`${API_URL}/roles`, getAuthHeaders()),
      ]);

      setRequirements(reqRes.data.data || []);
      setApps(appsRes.data.data || []);
      setTechnologies(techsRes.data.data || []);
      setRoles(rolesRes.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Filter technologies based on selected app
  const getFilteredTechnologies = (appId: number | '') => {
    if (!appId) return technologies;
    return technologies.filter((t) => !t.appId || t.appId === appId);
  };

  // Filter roles based on selected app and technology
  const getFilteredRoles = (appId: number | '', technologyId: number | '') => {
    return roles.filter((r) => {
      if (appId && r.appId && r.appId !== appId) return false;
      if (technologyId && r.technologyId && r.technologyId !== technologyId) return false;
      return true;
    });
  };

  // Filter requirements for display
  const getFilteredRequirements = () => {
    if (filterAppId === 'all') return requirements;
    return requirements.filter((r) => r.appId === filterAppId);
  };

  const handleOpenDialog = (requirement?: DefaultRequirement) => {
    if (requirement) {
      setSelectedRequirement(requirement);
      setFormData({
        appId: requirement.appId,
        technologyId: requirement.technologyId,
        roleId: requirement.roleId,
        requiredCount: requirement.requiredCount,
        proficiencyLevel: requirement.proficiencyLevel,
        minYearsExp: requirement.minYearsExp || '',
        priority: requirement.priority,
        description: requirement.description || '',
      });
    } else {
      setSelectedRequirement(null);
      setFormData({
        appId: '',
        technologyId: '',
        roleId: '',
        requiredCount: 1,
        proficiencyLevel: 'Intermediate',
        minYearsExp: '',
        priority: 'Medium',
        description: '',
      });
    }
    setOpenDialog(true);
    setError('');
    setSuccess('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRequirement(null);
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Reset dependent fields when parent changes
      if (field === 'appId') {
        newData.technologyId = '';
        newData.roleId = '';
      } else if (field === 'technologyId') {
        newData.roleId = '';
      }

      return newData;
    });
  };

  const handleSubmit = async () => {
    try {
      setError('');
      setSuccess('');

      // Validate required fields
      if (!formData.appId || !formData.technologyId || !formData.roleId) {
        setError('App, Technology, and Role are required');
        return;
      }

      const payload = {
        appId: formData.appId,
        technologyId: formData.technologyId,
        roleId: formData.roleId,
        requiredCount: formData.requiredCount,
        proficiencyLevel: formData.proficiencyLevel,
        minYearsExp: formData.minYearsExp || undefined,
        priority: formData.priority,
        description: formData.description || undefined,
      };

      if (selectedRequirement) {
        // Update existing requirement
        await axios.put(
          `${API_URL}/default-requirements/${selectedRequirement.id}`,
          payload,
          getAuthHeaders()
        );
        setSuccess('Default requirement updated successfully');
      } else {
        // Create new requirement
        await axios.post(`${API_URL}/default-requirements`, payload, getAuthHeaders());
        setSuccess('Default requirement created successfully');
      }

      await fetchAll();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save default requirement');
    }
  };

  const handleDeleteClick = (requirement: DefaultRequirement) => {
    setRequirementToDelete(requirement);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!requirementToDelete) return;

    try {
      setError('');
      setSuccess('');
      await axios.delete(
        `${API_URL}/default-requirements/${requirementToDelete.id}`,
        getAuthHeaders()
      );
      setSuccess('Default requirement deleted successfully');
      await fetchAll();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete default requirement');
    } finally {
      setDeleteDialogOpen(false);
      setRequirementToDelete(null);
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
        return 'error';
      case 'Advanced':
        return 'warning';
      case 'Intermediate':
        return 'info';
      case 'Beginner':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Default Requirements Configuration
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Default Requirement
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by App</InputLabel>
          <Select
            value={filterAppId}
            onChange={(e) => setFilterAppId(e.target.value as number | 'all')}
            label="Filter by App"
          >
            <MenuItem value="all">All Apps</MenuItem>
            {apps.map((app) => (
              <MenuItem key={app.id} value={app.id}>
                {app.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        {loading ? (
          <TableSkeleton rows={5} columns={8} />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>App</TableCell>
                <TableCell>Technology</TableCell>
                <TableCell>Role</TableCell>
                <TableCell align="center">Count</TableCell>
                <TableCell>Proficiency</TableCell>
                <TableCell>Min Years</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getFilteredRequirements().length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No default requirements configured
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                getFilteredRequirements().map((req) => (
                  <TableRow key={req.id} hover>
                    <TableCell>{req.app?.name || `ID: ${req.appId}`}</TableCell>
                    <TableCell>{req.technology?.name || `ID: ${req.technologyId}`}</TableCell>
                    <TableCell>
                      {req.role?.name || `ID: ${req.roleId}`}
                      {req.role?.level && (
                        <Chip
                          label={req.role.level}
                          size="small"
                          sx={{ ml: 1 }}
                          variant="outlined"
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={req.requiredCount} color="primary" size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={req.proficiencyLevel}
                        color={getProficiencyColor(req.proficiencyLevel)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{req.minYearsExp || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={req.priority}
                        color={getPriorityColor(req.priority)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(req)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(req)}
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
        )}
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedRequirement ? 'Edit Default Requirement' : 'Add Default Requirement'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>App</InputLabel>
                <Select
                  value={formData.appId}
                  onChange={(e) => handleChange('appId', e.target.value)}
                  label="App"
                >
                  {apps.map((app) => (
                    <MenuItem key={app.id} value={app.id}>
                      {app.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required disabled={!formData.appId}>
                <InputLabel>Technology</InputLabel>
                <Select
                  value={formData.technologyId}
                  onChange={(e) => handleChange('technologyId', e.target.value)}
                  label="Technology"
                >
                  {getFilteredTechnologies(formData.appId).map((tech) => (
                    <MenuItem key={tech.id} value={tech.id}>
                      {tech.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required disabled={!formData.appId}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.roleId}
                  onChange={(e) => handleChange('roleId', e.target.value)}
                  label="Role"
                >
                  {getFilteredRoles(formData.appId, formData.technologyId).map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name} {role.level && `(${role.level})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Required Count"
                value={formData.requiredCount}
                onChange={(e) => handleChange('requiredCount', parseInt(e.target.value))}
                required
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Proficiency Level</InputLabel>
                <Select
                  value={formData.proficiencyLevel}
                  onChange={(e) => handleChange('proficiencyLevel', e.target.value)}
                  label="Proficiency Level"
                >
                  <MenuItem value="Beginner">Beginner</MenuItem>
                  <MenuItem value="Intermediate">Intermediate</MenuItem>
                  <MenuItem value="Advanced">Advanced</MenuItem>
                  <MenuItem value="Expert">Expert</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Minimum Years Experience"
                value={formData.minYearsExp}
                onChange={(e) => handleChange('minYearsExp', e.target.value ? parseInt(e.target.value) : '')}
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  label="Priority"
                >
                  <MenuItem value="Critical">Critical</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedRequirement ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Default Requirement"
        message={`Are you sure you want to delete this default requirement: ${requirementToDelete?.app?.name} / ${requirementToDelete?.technology?.name} / ${requirementToDelete?.role?.name}?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setRequirementToDelete(null);
        }}
      />
    </Box>
  );
};

export default DefaultRequirementsConfig;
