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
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Description as TemplateIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { exportToExcel, importFromExcel, generateResourceTemplate } from '../../utils/excelUtils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface Resource {
  id: number;
  domainId?: number;
  portfolioId?: number;
  domainTeamId?: number;
  employeeId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  location?: string;
  hourlyRate?: number;
  utilizationRate?: number;
  isActive: boolean;
  domain?: {
    id: number;
    name: string;
  };
  portfolio?: {
    id: number;
    name: string;
  };
  domainTeam?: {
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

interface Team {
  id: number;
  name: string;
}

const ResourceOverview = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentResource, setCurrentResource] = useState<Partial<Resource>>({});
  const [filters, setFilters] = useState({
    employeeId: '',
    name: '',
    role: '',
    location: '',
    domain: '',
    portfolio: '',
    domainTeam: '',
  });

  const fetchResources = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [resourcesRes, domainsRes, portfoliosRes, teamsRes] = await Promise.all([
        axios.get(`${API_URL}/resources`, config),
        axios.get(`${API_URL}/domains`, config),
        axios.get(`${API_URL}/portfolios`, config),
        axios.get(`${API_URL}/teams`, config),
      ]);

      setResources(resourcesRes.data.data);
      setDomains(domainsRes.data.data);
      setPortfolios(portfoliosRes.data.data);
      setTeams(teamsRes.data.data);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleOpenDialog = (resource?: Resource) => {
    if (resource) {
      setEditMode(true);
      setCurrentResource(resource);
    } else {
      setEditMode(false);
      setCurrentResource({});
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentResource({});
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editMode && currentResource.id) {
        await axios.put(`${API_URL}/resources/${currentResource.id}`, currentResource, config);
      } else {
        await axios.post(`${API_URL}/resources`, currentResource, config);
      }

      fetchResources();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving resource:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this resource?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/resources/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchResources();
      } catch (error) {
        console.error('Error deleting resource:', error);
      }
    }
  };

  const handleExport = () => {
    exportToExcel(resources, 'resources_export');
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

          // Bulk create resources
          for (const resource of data) {
            await axios.post(`${API_URL}/resources`, resource, config);
          }

          alert(`Successfully imported ${data.length} resources`);
          fetchResources();
        } catch (error) {
          console.error('Error importing resources:', error);
          alert('Error importing some resources. Check console for details.');
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

  const getUtilizationColor = (rate?: number) => {
    if (!rate) return 'default';
    if (rate >= 90) return 'success';
    if (rate >= 70) return 'primary';
    if (rate >= 50) return 'warning';
    return 'error';
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
        <Box>
          <Typography variant="h4" gutterBottom>
            Resource Overview
          </Typography>
          <Typography color="text.secondary">
            Overview of all enterprise resources and utilization
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<TemplateIcon />}
            onClick={generateResourceTemplate}
          >
            Template
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
          >
            Export
          </Button>
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadIcon />}
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
          >
            Add Resource
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Domain</TableCell>
              <TableCell>Portfolio</TableCell>
              <TableCell>Domain Team</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Hourly Rate</TableCell>
              <TableCell>Utilization</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <TextField
                  size="small"
                  placeholder="Filter by ID"
                  value={filters.employeeId}
                  onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
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
                  select
                  placeholder="All"
                  value={filters.domainTeam}
                  onChange={(e) => setFilters({ ...filters, domainTeam: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="">All</MenuItem>
                  {teams.map((team) => (
                    <MenuItem key={team.id} value={team.name}>
                      {team.name}
                    </MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  placeholder="Filter by role"
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  fullWidth
                />
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  placeholder="Filter by location"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  fullWidth
                />
              </TableCell>
              <TableCell />
              <TableCell />
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {resources
              .filter((resource) => {
                const fullName = `${resource.firstName || ''} ${resource.lastName || ''}`.toLowerCase();
                return (
                  resource.employeeId.toLowerCase().includes(filters.employeeId.toLowerCase()) &&
                  fullName.includes(filters.name.toLowerCase()) &&
                  (filters.domain === '' || resource.domain?.name === filters.domain) &&
                  (filters.portfolio === '' || resource.portfolio?.name === filters.portfolio) &&
                  (filters.domainTeam === '' || resource.domainTeam?.name === filters.domainTeam) &&
                  (resource.role || '').toLowerCase().includes(filters.role.toLowerCase()) &&
                  (resource.location || '').toLowerCase().includes(filters.location.toLowerCase())
                );
              })
              .map((resource) => (
              <TableRow key={resource.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {resource.employeeId}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body1">
                    {resource.firstName} {resource.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {resource.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  {resource.domain?.name || '-'}
                </TableCell>
                <TableCell>
                  {resource.portfolio?.name || '-'}
                </TableCell>
                <TableCell>
                  {resource.domainTeam?.name || '-'}
                </TableCell>
                <TableCell>{resource.role || '-'}</TableCell>
                <TableCell>{resource.location || '-'}</TableCell>
                <TableCell>{formatCurrency(resource.hourlyRate)}/hr</TableCell>
                <TableCell>
                  <Chip
                    label={resource.utilizationRate ? `${resource.utilizationRate}%` : 'N/A'}
                    size="small"
                    color={getUtilizationColor(resource.utilizationRate) as any}
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenDialog(resource)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(resource.id)}
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
        <DialogTitle>{editMode ? 'Edit Resource' : 'Add Resource'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Employee ID"
                value={currentResource.employeeId || ''}
                onChange={(e) =>
                  setCurrentResource({ ...currentResource, employeeId: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={currentResource.email || ''}
                onChange={(e) =>
                  setCurrentResource({ ...currentResource, email: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Domain"
                value={currentResource.domainId || ''}
                onChange={(e) =>
                  setCurrentResource({ ...currentResource, domainId: e.target.value as number })
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
                value={currentResource.portfolioId || ''}
                onChange={(e) =>
                  setCurrentResource({ ...currentResource, portfolioId: e.target.value as number })
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
                label="Domain Team"
                value={currentResource.domainTeamId || ''}
                onChange={(e) =>
                  setCurrentResource({ ...currentResource, domainTeamId: e.target.value as number })
                }
              >
                <MenuItem value="">None</MenuItem>
                {teams.map((team) => (
                  <MenuItem key={team.id} value={team.id}>
                    {team.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={currentResource.firstName || ''}
                onChange={(e) =>
                  setCurrentResource({ ...currentResource, firstName: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={currentResource.lastName || ''}
                onChange={(e) =>
                  setCurrentResource({ ...currentResource, lastName: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Role"
                value={currentResource.role || ''}
                onChange={(e) =>
                  setCurrentResource({ ...currentResource, role: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={currentResource.location || ''}
                onChange={(e) =>
                  setCurrentResource({ ...currentResource, location: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hourly Rate"
                type="number"
                value={currentResource.hourlyRate || ''}
                onChange={(e) =>
                  setCurrentResource({
                    ...currentResource,
                    hourlyRate: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Utilization Rate (%)"
                type="number"
                value={currentResource.utilizationRate || ''}
                onChange={(e) =>
                  setCurrentResource({
                    ...currentResource,
                    utilizationRate: parseFloat(e.target.value) || 0,
                  })
                }
                inputProps={{ min: 0, max: 100 }}
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

export default ResourceOverview;
