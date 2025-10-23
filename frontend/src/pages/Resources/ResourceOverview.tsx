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
  Autocomplete,
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
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { exportToExcel, importFromExcel, generateResourceTemplate } from '../../utils/excelUtils';
import PageHeader from '../../components/common/PageHeader';
import ActionBar from '../../components/common/ActionBar';
import CompactFilterBar from '../../components/common/CompactFilterBar';
import FilterPresets from '../../components/common/FilterPresets';
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

interface Project {
  id: number;
  name: string;
  businessDecision?: string;
  domain?: {
    id: number;
    name: string;
  };
}

interface Allocation {
  id: number;
  resourceId: number;
  projectId: number;
  resourceCapabilityId?: number;
  projectRequirementId?: number;
  allocationPercentage: number;
  allocationType: string;
  startDate?: string;
  endDate?: string;
  matchScore?: number;
  project?: Project;
  resourceCapability?: Capability;
  projectRequirement?: {
    id: number;
    appId: number;
    technologyId: number;
    roleId: number;
    proficiencyLevel: string;
    app: { id: number; name: string; code: string };
    technology: { id: number; name: string; code: string };
    role: { id: number; name: string; code: string };
  };
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentResource, setCurrentResource] = useState<Partial<Resource>>({});
  const [currentCapabilities, setCurrentCapabilities] = useState<Capability[]>([]);
  const [newCapabilities, setNewCapabilities] = useState<NewCapability[]>([]);
  const [capabilitiesToDelete, setCapabilitiesToDelete] = useState<number[]>([]);
  const [openAllocationsDialog, setOpenAllocationsDialog] = useState(false);
  const [selectedResourceForAllocations, setSelectedResourceForAllocations] = useState<Resource | null>(null);
  const [resourceAllocations, setResourceAllocations] = useState<Allocation[]>([]);
  const [openAllocationEditDialog, setOpenAllocationEditDialog] = useState(false);
  const [currentAllocation, setCurrentAllocation] = useState<Partial<Allocation>>({});
  const [allocationEditMode, setAllocationEditMode] = useState(false);
  const [projectRequirements, setProjectRequirements] = useState<any[]>([]);
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
      const scenarioParam = `?scenarioId=${activeScenario.id}`;

      // Resources are shared across scenarios, but projects are scenario-specific
      const [resourcesRes, domainsRes, segmentFunctionsRes, appsRes, techsRes, rolesRes, projectsRes] = await Promise.all([
        axios.get(`${API_URL}/resources`, config),
        axios.get(`${API_URL}/domains`, config),
        axios.get(`${API_URL}/segment-functions`, config),
        axios.get(`${API_URL}/apps`, config),
        axios.get(`${API_URL}/technologies`, config),
        axios.get(`${API_URL}/roles`, config),
        axios.get(`${API_URL}/projects${scenarioParam}`, config),
      ]);

      setResources(resourcesRes.data.data);
      setDomains(domainsRes.data.data);
      setSegmentFunctions(segmentFunctionsRes.data.data);
      setApps(appsRes.data.data);
      setTechnologies(techsRes.data.data);
      setRoles(rolesRes.data.data);
      setProjects(projectsRes.data.data);
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

  // Allocation Management Functions
  const handleOpenAllocationsDialog = async (resource: Resource) => {
    setSelectedResourceForAllocations(resource);
    setOpenAllocationsDialog(true);
    await fetchResourceAllocations(resource.id);
  };

  const handleCloseAllocationsDialog = () => {
    setOpenAllocationsDialog(false);
    setSelectedResourceForAllocations(null);
    setResourceAllocations([]);
  };

  const fetchResourceAllocations = async (resourceId: number) => {
    if (!activeScenario?.id) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const scenarioParam = `?scenarioId=${activeScenario.id}`;

      const response = await axios.get(`${API_URL}/allocations${scenarioParam}`, config);
      const allAllocations = response.data.data || [];

      // Filter allocations for this specific resource
      const filtered = allAllocations.filter((alloc: Allocation) => alloc.resourceId === resourceId);
      setResourceAllocations(filtered);
    } catch (error) {
      console.error('Error fetching resource allocations:', error);
    }
  };

  const handleOpenAllocationEditDialog = async (allocation?: Allocation) => {
    if (allocation) {
      setAllocationEditMode(true);
      setCurrentAllocation(allocation);

      // Load project requirements for the allocated project
      if (allocation.projectId) {
        await loadProjectRequirements(allocation.projectId);
      }
    } else {
      setAllocationEditMode(false);
      setCurrentAllocation({
        resourceId: selectedResourceForAllocations?.id,
        allocationPercentage: 50,
        allocationType: 'Shared',
      });
      setProjectRequirements([]);
    }
    setOpenAllocationEditDialog(true);
  };

  const handleCloseAllocationEditDialog = () => {
    setOpenAllocationEditDialog(false);
    setCurrentAllocation({});
    setProjectRequirements([]);
    setAllocationEditMode(false);
  };

  const loadProjectRequirements = async (projectId: number) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/project-requirements/project/${projectId}`, config);
      setProjectRequirements(res.data.data || []);
    } catch (err) {
      console.error('Error loading project requirements:', err);
    }
  };

  const handleSaveAllocation = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const allocationData = {
        ...currentAllocation,
        scenarioId: activeScenario?.id,
      };

      if (allocationEditMode && currentAllocation.id) {
        await axios.put(`${API_URL}/allocations/${currentAllocation.id}`, allocationData, config);
      } else {
        await axios.post(`${API_URL}/allocations`, allocationData, config);
      }

      await fetchResourceAllocations(selectedResourceForAllocations!.id);
      handleCloseAllocationEditDialog();
    } catch (error) {
      console.error('Error saving allocation:', error);
      alert('Error saving allocation. Please check the console for details.');
    }
  };

  const handleDeleteAllocation = async (allocationId: number) => {
    if (!confirm('Are you sure you want to delete this allocation?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/allocations/${allocationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchResourceAllocations(selectedResourceForAllocations!.id);
    } catch (error) {
      console.error('Error deleting allocation:', error);
      alert('Error deleting allocation. Please check the console for details.');
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

  // Get unique business decisions from projects
  const uniqueBusinessDecisions = Array.from(
    new Set(projects.map((p) => p.businessDecision).filter(Boolean))
  ) as string[];

  return (
    <Box>
      <PageHeader
        title="Resource Overview"
        subtitle="Overview of all enterprise resources and utilization"
        icon={<PeopleIcon sx={{ fontSize: 32 }} />}
        compact
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

      <CompactFilterBar
        domains={domains}
        businessDecisions={uniqueBusinessDecisions}
        extraActions={<FilterPresets />}
      />

      <TableContainer component={Paper} sx={{ overflowX: 'auto', boxShadow: 2, borderRadius: 1.5 }}>
        <Table sx={{ minWidth: { xs: 800, md: 1000 } }}>
          <TableHead sx={{ backgroundColor: (theme) => theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.grey[900] }}>
            <TableRow>
              <TableCell align="right" sx={{ minWidth: 120 }}>Actions</TableCell>
              <TableCell sx={{ minWidth: 110 }}>Employee ID</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Name</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Domain</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Segment Function</TableCell>
              <TableCell sx={{ minWidth: 200 }}>Capabilities</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Location</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Hourly Rate</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Utilization</TableCell>
            </TableRow>
            <TableRow>
              <TableCell />
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
                <Autocomplete
                  size="small"
                  options={['', ...segmentFunctions.map(sf => sf.name)]}
                  value={filters.segmentFunction || ''}
                  onChange={(_, newValue) => setFilters({ ...filters, segmentFunction: newValue || '' })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="All Segment Functions"
                      size="small"
                    />
                  )}
                  getOptionLabel={(option) => option === '' ? 'All Segment Functions' : option}
                  fullWidth
                />
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
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenDialog(resource)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      startIcon={<AssignmentIcon />}
                      onClick={() => handleOpenAllocationsDialog(resource)}
                      color="primary"
                    >
                      Allocations
                    </Button>
                  </Box>
                </TableCell>
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
                  <Paper
                    key={cap.id}
                    sx={{
                      p: 2,
                      mb: 2,
                      backgroundColor: (theme) =>
                        theme.palette.mode === 'light'
                          ? theme.palette.grey[100]
                          : theme.palette.grey[800],
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                    }}
                  >
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
                  <Paper
                    key={newCap.tempId}
                    sx={{
                      p: 2,
                      mb: 2,
                      backgroundColor: (theme) =>
                        theme.palette.mode === 'light'
                          ? theme.palette.primary.light + '20'
                          : theme.palette.primary.dark + '40',
                      border: (theme) => `1px solid ${theme.palette.primary.main}`,
                    }}
                  >
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
                  <Paper
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      backgroundColor: (theme) =>
                        theme.palette.mode === 'light'
                          ? theme.palette.grey[50]
                          : theme.palette.grey[900],
                      border: (theme) => `1px dashed ${theme.palette.divider}`,
                    }}
                  >
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

      {/* Allocations Management Dialog */}
      <Dialog
        open={openAllocationsDialog}
        onClose={handleCloseAllocationsDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Manage Allocations - {selectedResourceForAllocations?.firstName} {selectedResourceForAllocations?.lastName}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenAllocationEditDialog()}
              size="small"
            >
              Add Allocation
            </Button>
          </Box>

          {resourceAllocations.length === 0 ? (
            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
                backgroundColor: (theme) =>
                  theme.palette.mode === 'light'
                    ? theme.palette.grey[50]
                    : theme.palette.grey[900],
                border: (theme) => `1px dashed ${theme.palette.divider}`,
              }}
            >
              <Typography color="text.secondary">
                No allocations found for this resource. Click "Add Allocation" to assign to a project.
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Project</TableCell>
                    <TableCell>Capability</TableCell>
                    <TableCell>Requirement</TableCell>
                    <TableCell>Match Score</TableCell>
                    <TableCell>Allocation %</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Timeline</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resourceAllocations.map((allocation) => (
                    <TableRow key={allocation.id}>
                      <TableCell>
                        <Typography variant="body2">{allocation.project?.name}</Typography>
                      </TableCell>
                      <TableCell>
                        {allocation.resourceCapability ? (
                          <Chip
                            label={`${allocation.resourceCapability.app.code}/${allocation.resourceCapability.technology.code}/${allocation.resourceCapability.role.code}`}
                            size="small"
                            color={allocation.resourceCapability.isPrimary ? 'primary' : 'default'}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {allocation.projectRequirement ? (
                          <Chip
                            label={`${allocation.projectRequirement.app.code}/${allocation.projectRequirement.technology.code}/${allocation.projectRequirement.role.code}`}
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {allocation.matchScore ? (
                          <Chip
                            label={`${allocation.matchScore}%`}
                            size="small"
                            color={
                              allocation.matchScore >= 80
                                ? 'success'
                                : allocation.matchScore >= 60
                                ? 'primary'
                                : allocation.matchScore >= 40
                                ? 'warning'
                                : 'error'
                            }
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={`${allocation.allocationPercentage}%`} size="small" />
                      </TableCell>
                      <TableCell>{allocation.allocationType}</TableCell>
                      <TableCell>
                        {allocation.startDate && allocation.endDate ? (
                          <Typography variant="caption">
                            {new Date(allocation.startDate).toLocaleDateString()} -{' '}
                            {new Date(allocation.endDate).toLocaleDateString()}
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => handleOpenAllocationEditDialog(allocation)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteAllocation(allocation.id)}
                            color="error"
                          >
                            Delete
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAllocationsDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Allocation Dialog */}
      <Dialog
        open={openAllocationEditDialog}
        onClose={handleCloseAllocationEditDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{allocationEditMode ? 'Edit Allocation' : 'Add Allocation'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Project"
                required
                value={currentAllocation.projectId || ''}
                onChange={async (e) => {
                  const projectId = Number(e.target.value);
                  setCurrentAllocation({
                    ...currentAllocation,
                    projectId,
                    projectRequirementId: undefined,
                  });
                  await loadProjectRequirements(projectId);
                }}
              >
                <MenuItem value="">Select Project</MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Resource Capability"
                value={currentAllocation.resourceCapabilityId || ''}
                onChange={(e) =>
                  setCurrentAllocation({
                    ...currentAllocation,
                    resourceCapabilityId: Number(e.target.value) || undefined,
                  })
                }
              >
                <MenuItem value="">None</MenuItem>
                {(selectedResourceForAllocations?.capabilities || []).map((cap) => (
                  <MenuItem key={cap.id} value={cap.id}>
                    {cap.app.code}/{cap.technology.code}/{cap.role.code} ({cap.proficiencyLevel})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Project Requirement"
                value={currentAllocation.projectRequirementId || ''}
                onChange={(e) =>
                  setCurrentAllocation({
                    ...currentAllocation,
                    projectRequirementId: Number(e.target.value) || undefined,
                  })
                }
                disabled={!currentAllocation.projectId}
              >
                <MenuItem value="">None</MenuItem>
                {projectRequirements.map((req: any) => (
                  <MenuItem key={req.id} value={req.id}>
                    {req.app.code}/{req.technology.code}/{req.role.code} ({req.proficiencyLevel})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Allocation %"
                required
                value={currentAllocation.allocationPercentage || 50}
                onChange={(e) =>
                  setCurrentAllocation({
                    ...currentAllocation,
                    allocationPercentage: parseInt(e.target.value),
                  })
                }
                inputProps={{ min: 1, max: 100 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Allocation Type"
                required
                value={currentAllocation.allocationType || 'Shared'}
                onChange={(e) =>
                  setCurrentAllocation({
                    ...currentAllocation,
                    allocationType: e.target.value,
                  })
                }
              >
                <MenuItem value="Shared">Shared</MenuItem>
                <MenuItem value="Dedicated">Dedicated</MenuItem>
                <MenuItem value="On-Demand">On-Demand</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={currentAllocation.startDate?.split('T')[0] || ''}
                onChange={(e) =>
                  setCurrentAllocation({
                    ...currentAllocation,
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
                value={currentAllocation.endDate?.split('T')[0] || ''}
                onChange={(e) =>
                  setCurrentAllocation({
                    ...currentAllocation,
                    endDate: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAllocationEditDialog}>Cancel</Button>
          <Button
            onClick={handleSaveAllocation}
            variant="contained"
            disabled={!currentAllocation.projectId}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResourceOverview;
