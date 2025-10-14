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
  FormControlLabel,
  Checkbox,
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface App {
  id: number;
  name: string;
  code: string;
  category: string;
  description?: string;
  vendor?: string;
  isGlobal: boolean;
  status: 'Active' | 'Deprecated' | 'Sunset';
  criticality?: 'Critical' | 'High' | 'Medium' | 'Low';
  isActive: boolean;
  createdDate: string;
  modifiedDate: string;
}

const AppsManagement = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    description: '',
    vendor: '',
    isGlobal: false,
    status: 'Active' as 'Active' | 'Deprecated' | 'Sunset',
    criticality: 'Medium' as 'Critical' | 'High' | 'Medium' | 'Low',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    appId: number | null;
  }>({ open: false, appId: null });

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_URL}/apps`, config);
      setApps(response.data.data || []);
      setError(null);
    } catch (error: any) {
      setError('Error fetching apps: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (app?: App) => {
    if (app) {
      setSelectedApp(app);
      setFormData({
        name: app.name,
        code: app.code,
        category: app.category,
        description: app.description || '',
        vendor: app.vendor || '',
        isGlobal: app.isGlobal,
        status: app.status,
        criticality: app.criticality || 'Medium',
      });
    } else {
      setSelectedApp(null);
      setFormData({
        name: '',
        code: '',
        category: '',
        description: '',
        vendor: '',
        isGlobal: false,
        status: 'Active',
        criticality: 'Medium',
      });
    }
    setOpenDialog(true);
    setError(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedApp(null);
    setError(null);
  };

  const handleSaveApp = async () => {
    try {
      if (!formData.name || !formData.code || !formData.category) {
        setError('Name, Code, and Category are required');
        return;
      }

      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (selectedApp) {
        await axios.put(`${API_URL}/apps/${selectedApp.id}`, formData, config);
        setSuccess('App updated successfully');
      } else {
        await axios.post(`${API_URL}/apps`, formData, config);
        setSuccess('App created successfully');
      }

      handleCloseDialog();
      fetchApps();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError('Error saving app: ' + (error.response?.data?.error?.message || error.message));
    }
  };

  const handleDeleteApp = (id: number) => {
    setConfirmDialog({ open: true, appId: id });
  };

  const confirmDeleteApp = async () => {
    if (confirmDialog.appId) {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.delete(`${API_URL}/apps/${confirmDialog.appId}`, config);
        setSuccess('App deleted successfully');
        fetchApps();
        setTimeout(() => setSuccess(null), 3000);
      } catch (error: any) {
        setError('Error deleting app: ' + (error.response?.data?.error?.message || error.message));
      }
    }
    setConfirmDialog({ open: false, appId: null });
  };

  const handleExport = () => {
    const exportData = apps.map(app => ({
      id: app.id,
      name: app.name,
      code: app.code,
      category: app.category,
      description: app.description || '',
      vendor: app.vendor || '',
      isGlobal: app.isGlobal,
      status: app.status,
      criticality: app.criticality || '',
      isActive: app.isActive,
    }));
    exportToExcel(exportData, 'apps');
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

          let successCount = 0;
          let errorCount = 0;

          for (const row of data) {
            try {
              const appData = {
                name: row.name,
                code: row.code,
                category: row.category,
                description: row.description,
                vendor: row.vendor,
                isGlobal: row.isGlobal === 'true' || row.isGlobal === true,
                status: row.status || 'Active',
                criticality: row.criticality || 'Medium',
              };

              if (row.id) {
                await axios.put(`${API_URL}/apps/${row.id}`, appData, config);
              } else {
                await axios.post(`${API_URL}/apps`, appData, config);
              }
              successCount++;
            } catch (error) {
              errorCount++;
              console.error('Error importing row:', row, error);
            }
          }

          setSuccess(`Import completed: ${successCount} successful, ${errorCount} failed`);
          fetchApps();
          setTimeout(() => setSuccess(null), 5000);
        } catch (error: any) {
          setError('Error importing data: ' + error.message);
        }
      },
      (error) => {
        setError('Error reading file: ' + error);
      }
    );

    event.target.value = '';
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Applications Management</Typography>
        <Box display="flex" gap={2}>
          <input
            accept=".csv,.xlsx,.xls"
            style={{ display: 'none' }}
            id="import-apps-file"
            type="file"
            onChange={handleImport}
          />
          <label htmlFor="import-apps-file">
            <Button variant="outlined" component="span" startIcon={<UploadIcon />}>
              Import
            </Button>
          </label>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={apps.length === 0}
          >
            Export
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Add App
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Criticality</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {apps.map((app) => (
              <TableRow key={app.id}>
                <TableCell>{app.id}</TableCell>
                <TableCell>
                  <strong>{app.name}</strong>
                  {app.description && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      {app.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{app.code}</TableCell>
                <TableCell>{app.category}</TableCell>
                <TableCell>{app.vendor || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={app.status}
                    color={app.status === 'Active' ? 'success' : app.status === 'Deprecated' ? 'warning' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {app.criticality && (
                    <Chip
                      label={app.criticality}
                      color={
                        app.criticality === 'Critical'
                          ? 'error'
                          : app.criticality === 'High'
                          ? 'warning'
                          : 'default'
                      }
                      size="small"
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={app.isGlobal ? 'Global' : 'Specific'}
                    color={app.isGlobal ? 'secondary' : 'primary'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpenDialog(app)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteApp(app.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {apps.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No applications found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{selectedApp ? 'Edit App' : 'Add New App'}</DialogTitle>
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
              <TextField
                fullWidth
                label="Category"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., ERP, CRM, Cloud"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vendor"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Deprecated">Deprecated</MenuItem>
                <MenuItem value="Sunset">Sunset</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Criticality"
                value={formData.criticality}
                onChange={(e) => setFormData({ ...formData, criticality: e.target.value as any })}
              >
                <MenuItem value="Critical">Critical</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isGlobal}
                    onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
                  />
                }
                label="Global Application (available for all resources)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveApp} variant="contained">
            {selectedApp ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title="Delete Application"
        message="Are you sure you want to delete this app? This action cannot be undone."
        onConfirm={confirmDeleteApp}
        onCancel={() => setConfirmDialog({ open: false, appId: null })}
        confirmText="Delete"
        confirmColor="error"
      />
    </Box>
  );
};

export default AppsManagement;
