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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface Technology {
  id: number;
  appId?: number;
  name: string;
  code: string;
  category: string;
  stackType: string;
  description?: string;
  vendor?: string;
  version?: string;
  isActive: boolean;
  createdDate: string;
  modifiedDate: string;
  app?: {
    id: number;
    name: string;
    code: string;
  };
}

interface App {
  id: number;
  name: string;
  code: string;
  isGlobal: boolean;
}

const TechnologiesManagement = () => {
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTechnology, setSelectedTechnology] = useState<Technology | null>(null);
  const [filterAppId, setFilterAppId] = useState<number | 'all'>('all');
  const [formData, setFormData] = useState({
    appId: undefined as number | undefined,
    name: '',
    code: '',
    category: '',
    stackType: 'Backend' as string,
    description: '',
    vendor: '',
    version: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    technologyId: number | null;
  }>({ open: false, technologyId: null });

  // Loading states for async operations
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchApps();
    fetchTechnologies();
  }, []);

  useEffect(() => {
    fetchTechnologies();
  }, [filterAppId]);

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

  const fetchTechnologies = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      let url = `${API_URL}/technologies`;
      if (filterAppId !== 'all') {
        url += `?appId=${filterAppId}`;
      }

      const response = await axios.get(url, config);
      setTechnologies(response.data.data || []);
      setError(null);
    } catch (error: any) {
      setError('Error fetching technologies: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (technology?: Technology) => {
    if (technology) {
      setSelectedTechnology(technology);
      setFormData({
        appId: technology.appId,
        name: technology.name,
        code: technology.code,
        category: technology.category,
        stackType: technology.stackType,
        description: technology.description || '',
        vendor: technology.vendor || '',
        version: technology.version || '',
      });
    } else {
      setSelectedTechnology(null);
      setFormData({
        appId: undefined,
        name: '',
        code: '',
        category: '',
        stackType: 'Backend',
        description: '',
        vendor: '',
        version: '',
      });
    }
    setOpenDialog(true);
    setError(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTechnology(null);
    setError(null);
  };

  const handleSaveTechnology = async () => {
    if (submitting) return; // Prevent multiple submissions

    try {
      if (!formData.name || !formData.code || !formData.category || !formData.stackType) {
        setError('Name, Code, Category, and Stack Type are required');
        return;
      }

      setSubmitting(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (selectedTechnology) {
        await axios.put(`${API_URL}/technologies/${selectedTechnology.id}`, formData, config);
        setSuccess('Technology updated successfully');
      } else {
        await axios.post(`${API_URL}/technologies`, formData, config);
        setSuccess('Technology created successfully');
      }

      handleCloseDialog();
      fetchTechnologies();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError('Error saving technology: ' + (error.response?.data?.error?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTechnology = (id: number) => {
    setConfirmDialog({ open: true, technologyId: id });
  };

  const confirmDeleteTechnology = async () => {
    if (!confirmDialog.technologyId || deleting) return; // Prevent multiple submissions

    try {
      setDeleting(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`${API_URL}/technologies/${confirmDialog.technologyId}`, config);
      setSuccess('Technology deleted successfully');
      fetchTechnologies();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError('Error deleting technology: ' + (error.response?.data?.error?.message || error.message));
    } finally {
      setDeleting(false);
      setConfirmDialog({ open: false, technologyId: null });
    }
  };

  const handleExport = () => {
    const exportData = technologies.map(tech => ({
      id: tech.id,
      appId: tech.appId || '',
      appName: tech.app?.name || 'Global',
      name: tech.name,
      code: tech.code,
      category: tech.category,
      stackType: tech.stackType,
      description: tech.description || '',
      vendor: tech.vendor || '',
      version: tech.version || '',
      isActive: tech.isActive,
    }));
    exportToExcel(exportData, 'technologies');
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
              const techData = {
                appId: row.appId ? parseInt(row.appId) : undefined,
                name: row.name,
                code: row.code,
                category: row.category,
                stackType: row.stackType,
                description: row.description,
                vendor: row.vendor,
                version: row.version,
              };

              if (row.id) {
                await axios.put(`${API_URL}/technologies/${row.id}`, techData, config);
              } else {
                await axios.post(`${API_URL}/technologies`, techData, config);
              }
              successCount++;
            } catch (error) {
              errorCount++;
              console.error('Error importing row:', row, error);
            }
          }

          setSuccess(`Import completed: ${successCount} successful, ${errorCount} failed`);
          fetchTechnologies();
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
        <Typography variant="h4">Technologies Management</Typography>
        <Box display="flex" gap={2}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by App</InputLabel>
            <Select
              value={filterAppId}
              onChange={(e) => setFilterAppId(e.target.value as number | 'all')}
              label="Filter by App"
              size="small"
            >
              <MenuItem value="all">All Technologies</MenuItem>
              {apps.map((app) => (
                <MenuItem key={app.id} value={app.id}>
                  {app.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <input
            accept=".csv,.xlsx,.xls"
            style={{ display: 'none' }}
            id="import-technologies-file"
            type="file"
            onChange={handleImport}
          />
          <label htmlFor="import-technologies-file">
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
            disabled={technologies.length === 0}
          >
            Export
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Add Technology
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
              <TableCell>Actions</TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>App</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Stack Type</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Version</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {technologies.map((tech) => (
              <TableRow key={tech.id}>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpenDialog(tech)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteTechnology(tech.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
                <TableCell>{tech.id}</TableCell>
                <TableCell>
                  <strong>{tech.name}</strong>
                  {tech.description && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      {tech.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{tech.code}</TableCell>
                <TableCell>
                  {tech.app ? (
                    <Chip label={tech.app.name} color="primary" size="small" />
                  ) : (
                    <Chip label="Global" color="secondary" size="small" />
                  )}
                </TableCell>
                <TableCell>{tech.category}</TableCell>
                <TableCell>
                  <Chip
                    label={tech.stackType}
                    size="small"
                    color={
                      tech.stackType === 'Frontend'
                        ? 'info'
                        : tech.stackType === 'Backend'
                        ? 'success'
                        : 'default'
                    }
                  />
                </TableCell>
                <TableCell>{tech.vendor || '-'}</TableCell>
                <TableCell>{tech.version || '-'}</TableCell>
              </TableRow>
            ))}
            {technologies.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No technologies found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{selectedTechnology ? 'Edit Technology' : 'Add New Technology'}</DialogTitle>
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
                  onChange={(e) => setFormData({ ...formData, appId: e.target.value ? Number(e.target.value) : undefined })}
                  label="Application (Optional)"
                >
                  <MenuItem value="">
                    <em>Global Technology</em>
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
              <TextField
                fullWidth
                select
                label="Stack Type"
                required
                value={formData.stackType}
                onChange={(e) => setFormData({ ...formData, stackType: e.target.value })}
              >
                <MenuItem value="Frontend">Frontend</MenuItem>
                <MenuItem value="Backend">Backend</MenuItem>
                <MenuItem value="Database">Database</MenuItem>
                <MenuItem value="Infrastructure">Infrastructure</MenuItem>
                <MenuItem value="Tool">Tool</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Category"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Language, Framework, Database"
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Version"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="e.g., 3.11, 18.x"
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
            onClick={handleSaveTechnology}
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : undefined}
          >
            {submitting ? (selectedTechnology ? 'Updating...' : 'Creating...') : (selectedTechnology ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title="Delete Technology"
        message="Are you sure you want to delete this technology? This action cannot be undone."
        onConfirm={confirmDeleteTechnology}
        onCancel={() => setConfirmDialog({ open: false, technologyId: null })}
        confirmText="Delete"
        confirmColor="error"
        loading={deleting}
        loadingText="Deleting..."
      />
    </Box>
  );
};

export default TechnologiesManagement;
