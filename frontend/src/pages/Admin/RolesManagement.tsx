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
  Upload as UploadIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { exportToExcel, importFromExcel } from '../../utils/excelUtils';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import TableSkeleton from '../../components/common/TableSkeleton';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface Role {
  id: number;
  appId?: number;
  technologyId?: number;
  name: string;
  code: string;
  level?: string;
  category: string;
  description?: string;
  minYearsExp?: number;
  maxYearsExp?: number;
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

const RolesManagement = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]); // For the form dialog
  const [filterTechnologies, setFilterTechnologies] = useState<Technology[]>([]); // For the filter dropdown
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [filterAppId, setFilterAppId] = useState<number | 'all'>('all');
  const [filterTechId, setFilterTechId] = useState<number | 'all'>('all');
  const [formData, setFormData] = useState({
    appId: undefined as number | undefined,
    technologyId: undefined as number | undefined,
    name: '',
    code: '',
    level: '' as string,
    category: '',
    description: '',
    minYearsExp: undefined as number | undefined,
    maxYearsExp: undefined as number | undefined,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    roleId: number | null;
  }>({ open: false, roleId: null });

  // Loading states for async operations
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchApps();
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [filterAppId, filterTechId]);

  useEffect(() => {
    // Fetch technologies for the filter dropdown when App filter changes
    if (filterAppId !== 'all') {
      fetchFilterTechnologies(filterAppId);
    } else {
      setFilterTechnologies([]);
      setFilterTechId('all');
    }
  }, [filterAppId]);

  useEffect(() => {
    // Fetch technologies for the form dialog when form App changes
    if (formData.appId) {
      fetchTechnologies(formData.appId);
    } else {
      setTechnologies([]);
    }
  }, [formData.appId]);

  const fetchApps = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_URL}/apps`, config);
      setApps(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching apps:', error);
    }
  };

  const fetchTechnologies = async (appId: number) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_URL}/technologies?appId=${appId}`, config);
      setTechnologies(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching technologies:', error);
    }
  };

  const fetchFilterTechnologies = async (appId: number) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_URL}/technologies?appId=${appId}`, config);
      setFilterTechnologies(response.data.data || []);
    } catch (error: any) {
      console.error('Error fetching filter technologies:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      let url = `${API_URL}/roles?`;
      const params = [];
      if (filterAppId !== 'all') params.push(`appId=${filterAppId}`);
      if (filterTechId !== 'all') params.push(`technologyId=${filterTechId}`);
      url += params.join('&');

      const response = await axios.get(url, config);
      setRoles(response.data.data || []);
      setError(null);
    } catch (error: any) {
      setError('Error fetching roles: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setSelectedRole(role);
      setFormData({
        appId: role.appId,
        technologyId: role.technologyId,
        name: role.name,
        code: role.code,
        level: role.level || '',
        category: role.category,
        description: role.description || '',
        minYearsExp: role.minYearsExp,
        maxYearsExp: role.maxYearsExp,
      });
    } else {
      setSelectedRole(null);
      setFormData({
        appId: undefined,
        technologyId: undefined,
        name: '',
        code: '',
        level: '',
        category: '',
        description: '',
        minYearsExp: undefined,
        maxYearsExp: undefined,
      });
    }
    setOpenDialog(true);
    setError(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRole(null);
    setError(null);
  };

  const handleSaveRole = async () => {
    if (submitting) return; // Prevent multiple submissions

    try {
      if (!formData.name || !formData.code || !formData.category) {
        setError('Name, Code, and Category are required');
        return;
      }

      setSubmitting(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const payload = {
        ...formData,
        level: formData.level || undefined,
      };

      if (selectedRole) {
        await axios.put(`${API_URL}/roles/${selectedRole.id}`, payload, config);
        setSuccess('Role updated successfully');
      } else {
        await axios.post(`${API_URL}/roles`, payload, config);
        setSuccess('Role created successfully');
      }

      handleCloseDialog();
      fetchRoles();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError('Error saving role: ' + (error.response?.data?.error?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = (id: number) => {
    setConfirmDialog({ open: true, roleId: id });
  };

  const confirmDeleteRole = async () => {
    if (!confirmDialog.roleId || deleting) return; // Prevent multiple submissions

    try {
      setDeleting(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_URL}/roles/${confirmDialog.roleId}`, config);
      setSuccess('Role deleted successfully');
      fetchRoles();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError('Error deleting role: ' + (error.response?.data?.error?.message || error.message));
    } finally {
      setDeleting(false);
      setConfirmDialog({ open: false, roleId: null });
    }
  };

  const handleExport = () => {
    const exportData = roles.map(role => ({
      id: role.id,
      appId: role.appId || '',
      appName: role.app?.name || 'Global',
      technologyId: role.technologyId || '',
      technologyName: role.technology?.name || '',
      name: role.name,
      code: role.code,
      level: role.level || '',
      category: role.category,
      description: role.description || '',
      minYearsExp: role.minYearsExp || '',
      maxYearsExp: role.maxYearsExp || '',
      isActive: role.isActive,
    }));
    exportToExcel(exportData, 'roles');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || importing) return; // Prevent multiple imports

    setImporting(true);
    importFromExcel(
      file,
      async (data) => {
        try {
          const token = localStorage.getItem('token');
          const config = { headers: { Authorization: `Bearer ${token}` } };

          let successCount = 0;
          let errorCount = 0;

          for (const row of data) {
            try {
              const roleData = {
                appId: row.appId ? parseInt(row.appId) : undefined,
                technologyId: row.technologyId ? parseInt(row.technologyId) : undefined,
                name: row.name,
                code: row.code,
                level: row.level || undefined,
                category: row.category,
                description: row.description,
                minYearsExp: row.minYearsExp ? parseInt(row.minYearsExp) : undefined,
                maxYearsExp: row.maxYearsExp ? parseInt(row.maxYearsExp) : undefined,
              };

              if (row.id) {
                await axios.put(`${API_URL}/roles/${row.id}`, roleData, config);
              } else {
                await axios.post(`${API_URL}/roles`, roleData, config);
              }
              successCount++;
            } catch (error) {
              errorCount++;
              console.error('Error importing row:', row, error);
            }
          }

          setSuccess(`Import completed: ${successCount} successful, ${errorCount} failed`);
          fetchRoles();
          setTimeout(() => setSuccess(null), 5000);
        } catch (error: any) {
          setError('Error importing data: ' + error.message);
        } finally {
          setImporting(false);
        }
      },
      (error) => {
        setError('Error reading file: ' + error);
        setImporting(false);
      }
    );

    event.target.value = '';
  };

  const getRoleType = (role: Role) => {
    if (!role.appId && !role.technologyId) return 'Global';
    if (role.appId && role.technologyId) return 'App + Tech Specific';
    if (role.appId) return 'App Specific';
    return 'Tech Specific';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Roles Management</Typography>
        <Box display="flex" gap={2}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Filter by App</InputLabel>
            <Select
              value={filterAppId}
              onChange={(e) => {
                setFilterAppId(e.target.value as number | 'all');
                setFilterTechId('all');
              }}
              label="Filter by App"
              size="small"
            >
              <MenuItem value="all">All Apps</MenuItem>
              {apps.map((app) => (
                <MenuItem key={app.id} value={app.id}>
                  {app.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }} disabled={filterAppId === 'all'}>
            <InputLabel>Filter by Tech</InputLabel>
            <Select
              value={filterTechId}
              onChange={(e) => setFilterTechId(e.target.value as number | 'all')}
              label="Filter by Tech"
              size="small"
            >
              <MenuItem value="all">All Technologies</MenuItem>
              {filterTechnologies.map((tech) => (
                <MenuItem key={tech.id} value={tech.id}>
                  {tech.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <input
            accept=".csv,.xlsx,.xls"
            style={{ display: 'none' }}
            id="import-roles-file"
            type="file"
            onChange={handleImport}
          />
          <label htmlFor="import-roles-file">
            <Button
              variant="outlined"
              component="span"
              startIcon={importing ? <CircularProgress size={20} /> : <UploadIcon />}
              disabled={importing}
            >
              {importing ? 'Importing...' : 'Import'}
            </Button>
          </label>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={roles.length === 0}
          >
            Export
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Add Role
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {loading ? (
        <TableSkeleton rows={10} columns={10} showHeader={true} />
      ) : (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Actions</TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>App</TableCell>
              <TableCell>Technology</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Experience</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpenDialog(role)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteRole(role.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
                <TableCell>{role.id}</TableCell>
                <TableCell>
                  <strong>{role.name}</strong>
                  {role.description && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      {role.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{role.code}</TableCell>
                <TableCell>
                  <Chip
                    label={getRoleType(role)}
                    size="small"
                    color={
                      getRoleType(role) === 'Global'
                        ? 'secondary'
                        : getRoleType(role) === 'App + Tech Specific'
                        ? 'primary'
                        : 'default'
                    }
                  />
                </TableCell>
                <TableCell>
                  {role.app ? (
                    <Chip label={role.app.name} size="small" />
                  ) : (
                    <span style={{ color: '#999' }}>-</span>
                  )}
                </TableCell>
                <TableCell>
                  {role.technology ? (
                    <Chip label={role.technology.name} size="small" />
                  ) : (
                    <span style={{ color: '#999' }}>-</span>
                  )}
                </TableCell>
                <TableCell>
                  {role.level ? (
                    <Chip label={role.level} color="info" size="small" />
                  ) : (
                    <span style={{ color: '#999' }}>-</span>
                  )}
                </TableCell>
                <TableCell>{role.category}</TableCell>
                <TableCell>
                  {role.minYearsExp !== undefined || role.maxYearsExp !== undefined ? (
                    <>
                      {role.minYearsExp || 0}-{role.maxYearsExp || '∞'} yrs
                    </>
                  ) : (
                    <span style={{ color: '#999' }}>-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {roles.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  No roles found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{selectedRole ? 'Edit Role' : 'Add New Role'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Code"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                inputProps={{ style: { textTransform: 'uppercase' } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Application (Optional)</InputLabel>
                <Select
                  value={formData.appId || ''}
                  onChange={(e) => setFormData({ ...formData, appId: e.target.value ? Number(e.target.value) : undefined, technologyId: undefined })}
                  label="Application (Optional)"
                >
                  <MenuItem value="">
                    <em>Global Role</em>
                  </MenuItem>
                  {apps.map((app) => (
                    <MenuItem key={app.id} value={app.id}>
                      {app.name} ({app.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!formData.appId}>
                <InputLabel>Technology (Optional)</InputLabel>
                <Select
                  value={formData.technologyId || ''}
                  onChange={(e) => setFormData({ ...formData, technologyId: e.target.value ? Number(e.target.value) : undefined })}
                  label="Technology (Optional)"
                >
                  <MenuItem value="">
                    <em>No specific technology</em>
                  </MenuItem>
                  {technologies.map((tech) => (
                    <MenuItem key={tech.id} value={tech.id}>
                      {tech.name} ({tech.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Level"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                <MenuItem value="Junior">Junior</MenuItem>
                <MenuItem value="Mid">Mid</MenuItem>
                <MenuItem value="Senior">Senior</MenuItem>
                <MenuItem value="Lead">Lead</MenuItem>
                <MenuItem value="Principal">Principal</MenuItem>
                <MenuItem value="Architect">Architect</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Category"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Development, Architecture"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Min Years Experience"
                type="number"
                value={formData.minYearsExp || ''}
                onChange={(e) => setFormData({ ...formData, minYearsExp: e.target.value ? parseInt(e.target.value) : undefined })}
                inputProps={{ min: 0, max: 50 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Max Years Experience"
                type="number"
                value={formData.maxYearsExp || ''}
                onChange={(e) => setFormData({ ...formData, maxYearsExp: e.target.value ? parseInt(e.target.value) : undefined })}
                inputProps={{ min: 0, max: 50 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveRole}
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : undefined}
          >
            {submitting ? (selectedRole ? 'Updating...' : 'Creating...') : (selectedRole ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title="Delete Role"
        message="Are you sure you want to delete this role? This action cannot be undone."
        onConfirm={confirmDeleteRole}
        onCancel={() => setConfirmDialog({ open: false, roleId: null })}
        confirmText="Delete"
        confirmColor="error"
        loading={deleting}
        loadingText="Deleting..."
      />
    </Box>
  );
};

export default RolesManagement;
