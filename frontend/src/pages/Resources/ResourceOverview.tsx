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
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Description as TemplateIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { exportToExcel, importFromExcel, generateResourceTemplate } from '../../utils/excelUtils';
import SharedFilters from '../../components/common/SharedFilters';
import PageHeader from '../../components/common/PageHeader';
import ActionBar from '../../components/common/ActionBar';
import FilterPanel from '../../components/common/FilterPanel';
import { useAppSelector } from '../../hooks/redux';
import { useScenario } from '../../contexts/ScenarioContext';
import { People as PeopleIcon } from '@mui/icons-material';

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
  joiningDate?: string;
  endOfServiceDate?: string;
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

interface App {
  id: number;
  name: string;
  code: string;
}

interface Technology {
  id: number;
  name: string;
  code: string;
}

interface RoleItem {
  id: number;
  name: string;
  code: string;
  level: string;
}

interface NewCapability {
  tempId: string;
  appId: number;
  technologyId: number;
  roleId: number;
  proficiencyLevel: string;
  yearsOfExperience: number;
  isPrimary: boolean;
}

const ResourceOverview = () => {
  const { selectedDomainIds } = useAppSelector((state) => state.filters);
  const { activeScenario } = useScenario();
  const [resources, setResources] = useState<Resource[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [segmentFunctions, setSegmentFunctions] = useState<SegmentFunction[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentResource, setCurrentResource] = useState<Partial<Resource>>({});
  const [currentCapabilities, setCurrentCapabilities] = useState<Capability[]>([]);
  const [newCapabilities, setNewCapabilities] = useState<NewCapability[]>([]);
  const [capabilitiesToDelete, setCapabilitiesToDelete] = useState<number[]>([]);
  const [filters, setFilters] = useState({
    employeeId: '',
    name: '',
    role: '',
    location: '',
    segmentFunction: '',
  });

  const fetchResources = async () => {
    if (!activeScenario) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Resources are shared across scenarios, no scenarioId filtering needed
      const [resourcesRes, domainsRes, segmentFunctionsRes, appsRes, techsRes, rolesRes] = await Promise.all([
        axios.get(`${API_URL}/resources`, config),
        axios.get(`${API_URL}/domains`, config),
        axios.get(`${API_URL}/segment-functions`, config),
        axios.get(`${API_URL}/apps`, config),
        axios.get(`${API_URL}/technologies`, config),
        axios.get(`${API_URL}/roles`, config),
      ]);

      setResources(resourcesRes.data.data);
      setDomains(domainsRes.data.data);
      setSegmentFunctions(segmentFunctionsRes.data.data);
      setApps(appsRes.data.data);
      setTechnologies(techsRes.data.data);
      setRoles(rolesRes.data.data);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeScenario) {
      fetchResources();
    }
  }, [activeScenario]);

  const handleOpenDialog = (resource?: Resource) => {
    if (resource) {
      setEditMode(true);
      setCurrentResource(resource);
      setCurrentCapabilities(resource.capabilities || []);
    } else {
      setEditMode(false);
      setCurrentResource({});
      setCurrentCapabilities([]);
    }
    setNewCapabilities([]);
    setCapabilitiesToDelete([]);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentResource({});
    setCurrentCapabilities([]);
    setNewCapabilities([]);
    setCapabilitiesToDelete([]);
  };

  const handleAddCapability = () => {
    const newCap: NewCapability = {
      tempId: `temp_${Date.now()}`,
      appId: apps[0]?.id || 0,
      technologyId: technologies[0]?.id || 0,
      roleId: roles[0]?.id || 0,
      proficiencyLevel: 'Beginner',
      yearsOfExperience: 0,
      isPrimary: false,
    };
    setNewCapabilities([...newCapabilities, newCap]);
  };

  const handleUpdateNewCapability = (tempId: string, field: string, value: any) => {
    setNewCapabilities(newCapabilities.map(cap =>
      cap.tempId === tempId ? { ...cap, [field]: value } : cap
    ));
  };

  const handleDeleteNewCapability = (tempId: string) => {
    setNewCapabilities(newCapabilities.filter(cap => cap.tempId !== tempId));
  };

  const handleDeleteExistingCapability = (capabilityId: number) => {
    setCapabilitiesToDelete([...capabilitiesToDelete, capabilityId]);
    setCurrentCapabilities(currentCapabilities.filter(cap => cap.id !== capabilityId));
  };

  const handleTogglePrimaryCapability = (capabilityId: number) => {
    setCurrentCapabilities(currentCapabilities.map(cap => ({
      ...cap,
      isPrimary: cap.id === capabilityId ? !cap.isPrimary : false,
    })));
  };

  const handleToggleNewPrimaryCapability = (tempId: string) => {
    setNewCapabilities(newCapabilities.map(cap => ({
      ...cap,
      isPrimary: cap.tempId === tempId ? !cap.isPrimary : false,
    })));
  };

  const handleUpdateExistingCapability = (capabilityId: number, field: string, value: any) => {
    setCurrentCapabilities(currentCapabilities.map(cap =>
      cap.id === capabilityId ? { ...cap, [field]: value } : cap
    ));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Save resource basic info
      let resourceId = currentResource.id;
      if (editMode && currentResource.id) {
        await axios.put(`${API_URL}/resources/${currentResource.id}`, currentResource, config);
      } else {
        const response = await axios.post(`${API_URL}/resources`, currentResource, config);
        resourceId = response.data.data.id;
      }

      // Delete capabilities marked for deletion
      for (const capId of capabilitiesToDelete) {
        await axios.delete(`${API_URL}/resource-capabilities/${capId}`, config);
      }

      // Update existing capabilities
      for (const cap of currentCapabilities) {
        await axios.put(`${API_URL}/resource-capabilities/${cap.id}`, {
          proficiencyLevel: cap.proficiencyLevel,
          yearsOfExperience: cap.yearsOfExperience,
          isPrimary: cap.isPrimary,
        }, config);
      }

      // Create new capabilities
      for (const newCap of newCapabilities) {
        await axios.post(`${API_URL}/resource-capabilities`, {
          resourceId,
          appId: newCap.appId,
          technologyId: newCap.technologyId,
          roleId: newCap.roleId,
          proficiencyLevel: newCap.proficiencyLevel,
          yearsOfExperience: newCap.yearsOfExperience,
          isPrimary: newCap.isPrimary,
        }, config);
      }

      fetchResources();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving resource:', error);
      alert('Error saving resource. Please check the console for details.');
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

          // Bulk create resources (shared across scenarios, no scenarioId)
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
      <PageHeader
        title="Resource Overview"
        subtitle="Overview of all enterprise resources and utilization"
        icon={<PeopleIcon sx={{ fontSize: 32 }} />}
      />

      <ActionBar elevation={1}>
        <Button
          variant="outlined"
          startIcon={<TemplateIcon />}
          onClick={generateResourceTemplate}
          size="small"
        >
          Template
        </Button>

        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          size="small"
        >
          Export
        </Button>

        <Button
          variant="outlined"
          component="label"
          startIcon={<UploadIcon />}
          size="small"
        >
          Import
          <input
            type="file"
            hidden
            accept=".csv,.xlsx,.xls"
            onChange={handleImport}
          />
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          size="small"
          sx={{
            px: 3,
            fontWeight: 600,
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4,
            },
          }}
        >
          Add Resource
        </Button>
      </ActionBar>

      <FilterPanel title="Filter Resources" defaultExpanded={true}>
        <SharedFilters />
      </FilterPanel>

      <TableContainer component={Paper} sx={{ overflowX: 'auto', boxShadow: 2, borderRadius: 1.5 }}>
        <Table sx={{ minWidth: { xs: 800, md: 1000 } }}>
          <TableHead sx={{ backgroundColor: (theme) => theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.grey[900] }}>
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
              <TableCell />
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
                  (selectedDomainIds.length === 0 || selectedDomainIds.includes(resource.domainId || 0)) &&
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
        <DialogContent dividers sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
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
                label="Joining Date"
                type="date"
                value={currentResource.joiningDate?.split('T')[0] || ''}
                onChange={(e) =>
                  setCurrentResource({ ...currentResource, joiningDate: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                helperText="Date when employee joined the organization"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End of Service Date"
                type="date"
                value={currentResource.endOfServiceDate?.split('T')[0] || ''}
                onChange={(e) =>
                  setCurrentResource({ ...currentResource, endOfServiceDate: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
                helperText="Date when employee leaves the organization (optional)"
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

            {/* Capabilities Management Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 3 }} />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight="bold">
                    Capabilities (App/Technology/Role)
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddCapability}
                    size="small"
                  >
                    Add Capability
                  </Button>
                </Box>

                {/* Existing Capabilities */}
                {currentCapabilities.map((cap) => (
                  <Paper key={cap.id} sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={2}>
                        <TextField
                          select
                          fullWidth
                          label="App"
                          size="small"
                          value={cap.appId}
                          onChange={(e) => handleUpdateExistingCapability(cap.id, 'appId', Number(e.target.value))}
                        >
                          {apps.map((app) => (
                            <MenuItem key={app.id} value={app.id}>
                              {app.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          select
                          fullWidth
                          label="Technology"
                          size="small"
                          value={cap.technologyId}
                          onChange={(e) => handleUpdateExistingCapability(cap.id, 'technologyId', Number(e.target.value))}
                        >
                          {technologies.map((tech) => (
                            <MenuItem key={tech.id} value={tech.id}>
                              {tech.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          select
                          fullWidth
                          label="Role"
                          size="small"
                          value={cap.roleId}
                          onChange={(e) => handleUpdateExistingCapability(cap.id, 'roleId', Number(e.target.value))}
                        >
                          {roles.map((role) => (
                            <MenuItem key={role.id} value={role.id}>
                              {role.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          select
                          fullWidth
                          label="Proficiency"
                          size="small"
                          value={cap.proficiencyLevel}
                          onChange={(e) => handleUpdateExistingCapability(cap.id, 'proficiencyLevel', e.target.value)}
                        >
                          <MenuItem value="Beginner">Beginner</MenuItem>
                          <MenuItem value="Intermediate">Intermediate</MenuItem>
                          <MenuItem value="Advanced">Advanced</MenuItem>
                          <MenuItem value="Expert">Expert</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={1.5}>
                        <TextField
                          fullWidth
                          label="Years"
                          type="number"
                          size="small"
                          value={cap.yearsOfExperience || 0}
                          onChange={(e) => handleUpdateExistingCapability(cap.id, 'yearsOfExperience', Number(e.target.value))}
                          inputProps={{ min: 0 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={1} display="flex" justifyContent="center">
                        <Button
                          size="small"
                          onClick={() => handleTogglePrimaryCapability(cap.id)}
                          startIcon={cap.isPrimary ? <StarIcon /> : <StarBorderIcon />}
                          color={cap.isPrimary ? 'primary' : 'inherit'}
                          title={cap.isPrimary ? 'Primary capability' : 'Set as primary'}
                        >
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={1.5} display="flex" justifyContent="center">
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteExistingCapability(cap.id)}
                        >
                          Delete
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}

                {/* New Capabilities */}
                {newCapabilities.map((newCap) => (
                  <Paper key={newCap.tempId} sx={{ p: 2, mb: 2, backgroundColor: '#e3f2fd' }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={2}>
                        <TextField
                          select
                          fullWidth
                          label="App"
                          size="small"
                          value={newCap.appId}
                          onChange={(e) => handleUpdateNewCapability(newCap.tempId, 'appId', Number(e.target.value))}
                        >
                          {apps.map((app) => (
                            <MenuItem key={app.id} value={app.id}>
                              {app.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          select
                          fullWidth
                          label="Technology"
                          size="small"
                          value={newCap.technologyId}
                          onChange={(e) => handleUpdateNewCapability(newCap.tempId, 'technologyId', Number(e.target.value))}
                        >
                          {technologies.map((tech) => (
                            <MenuItem key={tech.id} value={tech.id}>
                              {tech.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          select
                          fullWidth
                          label="Role"
                          size="small"
                          value={newCap.roleId}
                          onChange={(e) => handleUpdateNewCapability(newCap.tempId, 'roleId', Number(e.target.value))}
                        >
                          {roles.map((role) => (
                            <MenuItem key={role.id} value={role.id}>
                              {role.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          select
                          fullWidth
                          label="Proficiency"
                          size="small"
                          value={newCap.proficiencyLevel}
                          onChange={(e) => handleUpdateNewCapability(newCap.tempId, 'proficiencyLevel', e.target.value)}
                        >
                          <MenuItem value="Beginner">Beginner</MenuItem>
                          <MenuItem value="Intermediate">Intermediate</MenuItem>
                          <MenuItem value="Advanced">Advanced</MenuItem>
                          <MenuItem value="Expert">Expert</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={1.5}>
                        <TextField
                          fullWidth
                          label="Years"
                          type="number"
                          size="small"
                          value={newCap.yearsOfExperience}
                          onChange={(e) => handleUpdateNewCapability(newCap.tempId, 'yearsOfExperience', Number(e.target.value))}
                          inputProps={{ min: 0 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={1} display="flex" justifyContent="center">
                        <Button
                          size="small"
                          onClick={() => handleToggleNewPrimaryCapability(newCap.tempId)}
                          startIcon={newCap.isPrimary ? <StarIcon /> : <StarBorderIcon />}
                          color={newCap.isPrimary ? 'primary' : 'inherit'}
                          title={newCap.isPrimary ? 'Primary capability' : 'Set as primary'}
                        >
                        </Button>
                      </Grid>
                      <Grid item xs={12} sm={1.5} display="flex" justifyContent="center">
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteNewCapability(newCap.tempId)}
                        >
                          Delete
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}

                {currentCapabilities.length === 0 && newCapabilities.length === 0 && (
                  <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#f9f9f9' }}>
                    <Typography color="text.secondary">
                      No capabilities added yet. Click "Add Capability" to assign App/Technology/Role combinations.
                    </Typography>
                  </Paper>
                )}
              </Box>
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
