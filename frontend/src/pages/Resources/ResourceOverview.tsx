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
  Upload as UploadIcon,
  Download as DownloadIcon,
  Description as TemplateIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { exportToExcel, importFromExcel, generateResourceTemplate } from '../../utils/excelUtils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface Capability {
  id: number;
  appId: number;
  technologyId: number;
  roleId: number;
  proficiencyLevel: string;
  yearsOfExperience?: number;
  isPrimary: boolean;
  app: {
    id: number;
    name: string;
    code: string;
  };
  technology: {
    id: number;
    name: string;
    code: string;
  };
  role: {
    id: number;
    name: string;
    code: string;
    level: string;
  };
}

interface Resource {
  id: number;
  domainId?: number;
  segmentFunctionId?: number;
  employeeId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  primarySkill?: string;
  secondarySkills?: string;
  role?: string;
  location?: string;
  timezone?: string;
  hourlyRate?: number;
  monthlyCost?: number;
  totalCapacityHours?: number;
  utilizationRate?: number;
  homeLocation?: string;
  isRemote?: boolean;
  isActive: boolean;
  domain?: {
    id: number;
    name: string;
  };
  segmentFunction?: {
    id: number;
    name: string;
  };
  capabilities?: Capability[];
}

interface Domain {
  id: number;
  name: string;
}

interface SegmentFunction {
  id: number;
  name: string;
}

const ResourceOverview = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [segmentFunctions, setSegmentFunctions] = useState<SegmentFunction[]>([]);
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
    segmentFunction: '',
  });

  const fetchResources = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [resourcesRes, domainsRes, segmentFunctionsRes] = await Promise.all([
        axios.get(`${API_URL}/resources`, config),
        axios.get(`${API_URL}/domains`, config),
        axios.get(`${API_URL}/segment-functions`, config),
      ]);

      setResources(resourcesRes.data.data);
      setDomains(domainsRes.data.data);
      setSegmentFunctions(segmentFunctionsRes.data.data);
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
            Resource Overview
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Overview of all enterprise resources and utilization
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
            onClick={generateResourceTemplate}
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
            Add Resource
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: { xs: 800, md: 1000 } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 110 }}>Employee ID</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Name</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Domain</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Segment Function</TableCell>
              <TableCell sx={{ minWidth: 200 }}>Capabilities</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Location</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Hourly Rate</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Utilization</TableCell>
              <TableCell align="right" sx={{ minWidth: 120 }}>Actions</TableCell>
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
                  value={filters.segmentFunction}
                  onChange={(e) => setFilters({ ...filters, segmentFunction: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="">All</MenuItem>
                  {segmentFunctions.map((segmentFunction) => (
                    <MenuItem key={segmentFunction.id} value={segmentFunction.name}>
                      {segmentFunction.name}
                    </MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell />
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
                  (filters.segmentFunction === '' || resource.segmentFunction?.name === filters.segmentFunction) &&
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
                  {resource.segmentFunction?.name || '-'}
                </TableCell>
                <TableCell>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {resource.capabilities && resource.capabilities.length > 0 ? (
                      resource.capabilities.map((capability) => (
                        <Chip
                          key={capability.id}
                          label={`${capability.app.code}/${capability.technology.code}/${capability.role.code}`}
                          size="small"
                          color={capability.isPrimary ? 'primary' : 'default'}
                          sx={{ fontSize: '0.75rem' }}
                          title={`${capability.app.name} - ${capability.technology.name} - ${capability.role.name} (${capability.proficiencyLevel})`}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No capabilities
                      </Typography>
                    )}
                  </Box>
                </TableCell>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>{editMode ? 'Edit Resource' : 'Add Resource'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Employee ID"
                value={currentResource.employeeId || ''}
                onChange={(e) =>
                  setCurrentResource({ ...currentResource, employeeId: e.target.value })
                }
                disabled={editMode}
                helperText={editMode ? 'Employee ID cannot be changed' : 'Unique identifier for the employee'}
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
                  setCurrentResource({ ...currentResource, domainId: e.target.value ? Number(e.target.value) : undefined })
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
                label="Segment Function"
                value={currentResource.segmentFunctionId || ''}
                onChange={(e) =>
                  setCurrentResource({ ...currentResource, segmentFunctionId: e.target.value ? Number(e.target.value) : undefined })
                }
              >
                <MenuItem value="">None</MenuItem>
                {segmentFunctions.map((segmentFunction) => (
                  <MenuItem key={segmentFunction.id} value={segmentFunction.id}>
                    {segmentFunction.name}
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Primary Skill"
                value={currentResource.primarySkill || ''}
                onChange={(e) =>
                  setCurrentResource({ ...currentResource, primarySkill: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Secondary Skills"
                value={currentResource.secondarySkills || ''}
                onChange={(e) =>
                  setCurrentResource({ ...currentResource, secondarySkills: e.target.value })
                }
                placeholder="Comma separated skills"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Timezone"
                value={currentResource.timezone || ''}
                onChange={(e) =>
                  setCurrentResource({ ...currentResource, timezone: e.target.value })
                }
                placeholder="e.g., EST, PST, UTC"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Monthly Cost"
                type="number"
                value={currentResource.monthlyCost || ''}
                onChange={(e) =>
                  setCurrentResource({
                    ...currentResource,
                    monthlyCost: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Capacity Hours"
                type="number"
                value={currentResource.totalCapacityHours || 160}
                onChange={(e) =>
                  setCurrentResource({
                    ...currentResource,
                    totalCapacityHours: parseInt(e.target.value) || 160,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Home Location"
                value={currentResource.homeLocation || ''}
                onChange={(e) =>
                  setCurrentResource({ ...currentResource, homeLocation: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Is Remote"
                value={currentResource.isRemote !== undefined ? (currentResource.isRemote ? 'true' : 'false') : 'false'}
                onChange={(e) =>
                  setCurrentResource({ ...currentResource, isRemote: e.target.value === 'true' })
                }
              >
                <MenuItem value="false">No</MenuItem>
                <MenuItem value="true">Yes</MenuItem>
              </TextField>
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
