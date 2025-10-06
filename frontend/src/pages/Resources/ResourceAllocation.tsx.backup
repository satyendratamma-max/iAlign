import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
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
  Select,
  FormControl,
  InputLabel,
  Alert,
  Slider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Description as TemplateIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { exportToExcel, importFromExcel, generateResourceTemplate } from '../../utils/excelUtils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface Resource {
  id: number;
  employeeId: string;
  firstName?: string;
  lastName?: string;
  primarySkill?: string;
  domainTeamId?: number;
  domainTeam?: {
    id: number;
    name: string;
    skillType: string;
  };
}

interface Project {
  id: number;
  name: string;
  status: string;
  fiscalYear?: string;
  domainId?: number;
  domain?: {
    name: string;
  };
}

interface Allocation {
  id: number;
  projectId: number;
  resourceId: number;
  domainTeamId?: number;
  allocationType: string;
  allocationPercentage: number;
  allocatedHours?: number;
  startDate?: Date;
  endDate?: Date;
  roleOnProject?: string;
  billableRate?: number;
  resource?: Resource;
  project?: Project;
  domainTeam?: {
    id: number;
    name: string;
    skillType: string;
  };
}

const ResourceAllocation = () => {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentAllocation, setCurrentAllocation] = useState<Partial<Allocation>>({});
  const [filterFiscalYear, setFilterFiscalYear] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [filterSkill, setFilterSkill] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [allocationsRes, resourcesRes, projectsRes] = await Promise.all([
        axios.get(`${API_URL}/allocations`, config),
        axios.get(`${API_URL}/resources`, config),
        axios.get(`${API_URL}/projects`, config),
      ]);

      setAllocations(allocationsRes.data.data);
      setResources(resourcesRes.data.data);
      setProjects(projectsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (allocation?: Allocation) => {
    if (allocation) {
      setEditMode(true);
      setCurrentAllocation(allocation);
    } else {
      setEditMode(false);
      setCurrentAllocation({
        allocationType: 'Shared',
        allocationPercentage: 50,
        allocatedHours: 80,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentAllocation({});
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editMode && currentAllocation.id) {
        await axios.put(
          `${API_URL}/allocations/${currentAllocation.id}`,
          currentAllocation,
          config
        );
      } else {
        await axios.post(`${API_URL}/allocations`, currentAllocation, config);
      }

      fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving allocation:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this allocation?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/allocations/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchData();
      } catch (error) {
        console.error('Error deleting allocation:', error);
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
          fetchData();
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Calculate resource utilization
  const resourceUtilization = resources.map((resource) => {
    const resourceAllocations = allocations.filter((a) => a.resourceId === resource.id);
    const totalAllocation = resourceAllocations.reduce(
      (sum, a) => sum + a.allocationPercentage,
      0
    );
    return {
      resource,
      totalAllocation,
      allocations: resourceAllocations,
      isOverAllocated: totalAllocation > 100,
    };
  });

  // Apply filters
  let filteredAllocations = allocations;
  if (filterFiscalYear) {
    filteredAllocations = filteredAllocations.filter(
      (a) => a.project?.fiscalYear === filterFiscalYear
    );
  }
  if (filterDomain) {
    filteredAllocations = filteredAllocations.filter(
      (a) => a.project?.domain?.name === filterDomain
    );
  }
  if (filterSkill) {
    filteredAllocations = filteredAllocations.filter(
      (a) => a.resource?.primarySkill === filterSkill
    );
  }

  // Get unique values for filters
  const fiscalYears = [...new Set(projects.map((p) => p.fiscalYear).filter(Boolean))];
  const domains = [...new Set(projects.map((p) => p.domain?.name).filter(Boolean))];
  const skills = [...new Set(resources.map((r) => r.primarySkill).filter(Boolean))];

  // Count over-allocated resources
  const overAllocatedCount = resourceUtilization.filter((r) => r.isOverAllocated).length;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Resource Allocation Matrix
          </Typography>
          <Typography color="text.secondary">
            Manage resource allocation across projects and domains
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
            Add Allocation
          </Button>
        </Box>
      </Box>

      {/* Alert for over-allocation */}
      {overAllocatedCount > 0 && (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
          {overAllocatedCount} resource(s) are over-allocated (&gt;100%)
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Total Allocations
              </Typography>
              <Typography variant="h4">{allocations.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Active Resources
              </Typography>
              <Typography variant="h4">{resources.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Active Projects
              </Typography>
              <Typography variant="h4">{projects.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Over-Allocated
              </Typography>
              <Typography variant="h4" color={overAllocatedCount > 0 ? 'error' : 'inherit'}>
                {overAllocatedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Fiscal Year</InputLabel>
                <Select
                  value={filterFiscalYear}
                  label="Fiscal Year"
                  onChange={(e) => setFilterFiscalYear(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {fiscalYears.map((fy) => (
                    <MenuItem key={fy} value={fy}>
                      {fy}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Domain</InputLabel>
                <Select
                  value={filterDomain}
                  label="Domain"
                  onChange={(e) => setFilterDomain(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {domains.map((domain) => (
                    <MenuItem key={domain} value={domain}>
                      {domain}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Skill Type</InputLabel>
                <Select
                  value={filterSkill}
                  label="Skill Type"
                  onChange={(e) => setFilterSkill(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {skills.map((skill) => (
                    <MenuItem key={skill} value={skill}>
                      {skill}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Allocation Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Resource Allocations
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Resource</TableCell>
                  <TableCell>Skill</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Domain</TableCell>
                  <TableCell>Allocation %</TableCell>
                  <TableCell>Hours/Month</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAllocations.map((allocation) => {
                  const resourceUtil = resourceUtilization.find(
                    (r) => r.resource.id === allocation.resourceId
                  );
                  const isOverAllocated = resourceUtil?.isOverAllocated || false;

                  return (
                    <TableRow
                      key={allocation.id}
                      sx={{
                        backgroundColor: isOverAllocated ? 'error.lighter' : 'inherit',
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {allocation.resource?.firstName} {allocation.resource?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {allocation.resource?.employeeId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={allocation.resource?.primarySkill || 'N/A'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{allocation.project?.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {allocation.project?.fiscalYear}
                        </Typography>
                      </TableCell>
                      <TableCell>{allocation.project?.domain?.name || '-'}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography
                            variant="body2"
                            color={isOverAllocated ? 'error' : 'inherit'}
                          >
                            {allocation.allocationPercentage}%
                          </Typography>
                          {isOverAllocated && <Warning color="error" fontSize="small" />}
                        </Box>
                      </TableCell>
                      <TableCell>{allocation.allocatedHours || '-'}</TableCell>
                      <TableCell>
                        <Chip label={allocation.allocationType} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{allocation.roleOnProject || '-'}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenDialog(allocation)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(allocation.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Edit/Create Allocation Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Edit Allocation' : 'Add Allocation'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Resource</InputLabel>
                <Select
                  value={currentAllocation.resourceId || ''}
                  label="Resource"
                  onChange={(e) => {
                    const selectedResource = resources.find(r => r.id === e.target.value);
                    setCurrentAllocation({
                      ...currentAllocation,
                      resourceId: e.target.value as number,
                      domainTeamId: selectedResource?.domainTeamId,
                    });
                  }}
                >
                  {resources.map((resource) => (
                    <MenuItem key={resource.id} value={resource.id}>
                      {resource.firstName} {resource.lastName} ({resource.primarySkill})
                      {resource.domainTeam && ` - ${resource.domainTeam.name}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Project</InputLabel>
                <Select
                  value={currentAllocation.projectId || ''}
                  label="Project"
                  onChange={(e) =>
                    setCurrentAllocation({
                      ...currentAllocation,
                      projectId: e.target.value as number,
                    })
                  }
                >
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name} ({project.fiscalYear})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>
                Allocation Percentage: {currentAllocation.allocationPercentage || 0}%
              </Typography>
              <Slider
                value={currentAllocation.allocationPercentage || 0}
                onChange={(_, value) =>
                  setCurrentAllocation({
                    ...currentAllocation,
                    allocationPercentage: value as number,
                  })
                }
                step={5}
                marks
                min={0}
                max={100}
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Allocated Hours (per month)"
                type="number"
                value={currentAllocation.allocatedHours || ''}
                onChange={(e) =>
                  setCurrentAllocation({
                    ...currentAllocation,
                    allocatedHours: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Allocation Type"
                value={currentAllocation.allocationType || 'Shared'}
                onChange={(e) =>
                  setCurrentAllocation({
                    ...currentAllocation,
                    allocationType: e.target.value,
                  })
                }
              >
                <MenuItem value="Dedicated">Dedicated</MenuItem>
                <MenuItem value="Shared">Shared</MenuItem>
                <MenuItem value="On-Demand">On-Demand</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Role on Project"
                value={currentAllocation.roleOnProject || ''}
                onChange={(e) =>
                  setCurrentAllocation({
                    ...currentAllocation,
                    roleOnProject: e.target.value,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={
                  currentAllocation.startDate
                    ? new Date(currentAllocation.startDate).toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  setCurrentAllocation({
                    ...currentAllocation,
                    startDate: new Date(e.target.value) as any,
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={
                  currentAllocation.endDate
                    ? new Date(currentAllocation.endDate).toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  setCurrentAllocation({
                    ...currentAllocation,
                    endDate: new Date(e.target.value) as any,
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

export default ResourceAllocation;
