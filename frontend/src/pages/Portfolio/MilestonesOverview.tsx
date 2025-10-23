import { useState, useEffect, useMemo } from 'react';
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
  IconButton,
  Alert,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Description as TemplateIcon,
  CheckCircle,
  Schedule,
  Warning,
  Flag as FlagIcon,
} from '@mui/icons-material';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { generateMilestoneTemplate } from '../../utils/excelUtils';
import PageHeader from '../../components/common/PageHeader';
import ActionBar from '../../components/common/ActionBar';
import CompactFilterBar from '../../components/common/CompactFilterBar';
import FilterPresets from '../../components/common/FilterPresets';
import { useScenario } from '../../contexts/ScenarioContext';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { setDomainFilter, setBusinessDecisionFilter, clearAllFilters } from '../../store/slices/filtersSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface Milestone {
  id: number;
  projectId: number;
  ownerId?: number;
  name: string;
  description?: string;
  status: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  dueDate?: string;
  completedDate?: string;
  progress: number;
  owner?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  dependencies?: string;
  project?: {
    id: number;
    name: string;
    fiscalYear?: string;
  };
}

interface Project {
  id: number;
  name: string;
  fiscalYear?: string;
  domainId?: number;
  businessDecision?: string;
  domain?: {
    id: number;
    name: string;
  };
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface Domain {
  id: number;
  name: string;
}

const MilestonesOverview = () => {
  const { activeScenario } = useScenario();
  const dispatch = useAppDispatch();
  const { selectedDomainIds, selectedBusinessDecisions } = useAppSelector((state) => state.filters);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<Partial<Milestone>>({});
  const [filters, setFilters] = useState({
    project: '',
    status: '',
    owner: '',
    domainId: '',
    businessDecision: '',
  });

  useEffect(() => {
    if (activeScenario) {
      fetchData();
    }
  }, [activeScenario]);

  const fetchData = async () => {
    // Guard: Don't fetch data without an active scenario
    if (!activeScenario?.id) {
      console.warn('fetchData called without activeScenario - skipping');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const scenarioParam = `?scenarioId=${activeScenario.id}`;

      const [milestonesRes, projectsRes, usersRes, domainsRes] = await Promise.all([
        axios.get(`${API_URL}/milestones${scenarioParam}`, config),
        axios.get(`${API_URL}/projects${scenarioParam}`, config),
        axios.get(`${API_URL}/users`, config),
        axios.get(`${API_URL}/domains`, config),
      ]);

      setMilestones(milestonesRes.data.data);
      setProjects(projectsRes.data.data);
      setUsers(usersRes.data.data || []);
      setDomains(domainsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (milestone?: Milestone) => {
    if (milestone) {
      setEditMode(true);
      setCurrentMilestone(milestone);
    } else {
      setEditMode(false);
      setCurrentMilestone({
        status: 'Not Started',
        progress: 0,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentMilestone({});
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editMode && currentMilestone.id) {
        await axios.put(
          `${API_URL}/milestones/${currentMilestone.id}`,
          currentMilestone,
          config
        );
      } else {
        await axios.post(`${API_URL}/milestones`, currentMilestone, config);
      }

      fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving milestone:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this milestone?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/milestones/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchData();
      } catch (error) {
        console.error('Error deleting milestone:', error);
      }
    }
  };

  const handleExport = () => {
    const exportData = milestones.map((m) => ({
      'Milestone Name': m.name,
      'Project': m.project?.name || '',
      'Fiscal Year': m.project?.fiscalYear || '',
      'Description': m.description || '',
      'Status': m.status,
      'Progress (%)': m.progress,
      'Due Date': m.dueDate ? new Date(m.dueDate).toLocaleDateString() : '',
      'Completed Date': m.completedDate ? new Date(m.completedDate).toLocaleDateString() : '',
      'Owner': m.owner || '',
      'Dependencies': m.dependencies || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Milestones');

    const colWidths = [
      { wch: 30 },
      { wch: 25 },
      { wch: 12 },
      { wch: 40 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 20 },
      { wch: 30 },
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `milestones_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };


  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        let successCount = 0;
        let errorCount = 0;

        for (const row of jsonData as any[]) {
          try {
            const project = projects.find(
              (p) => p.name === row['Project Name']
            );

            if (!project) {
              errorCount++;
              continue;
            }

            const milestoneData = {
              projectId: project.id,
              name: row['Milestone Name'],
              description: row['Description'],
              status: row['Status'] || 'Not Started',
              progress: row['Progress (%)'] || 0,
              dueDate: row['Due Date'] ? new Date(row['Due Date']).toISOString() : undefined,
              owner: row['Owner'],
              dependencies: row['Dependencies'],
            };

            await axios.post(`${API_URL}/milestones`, milestoneData, config);
            successCount++;
          } catch (error) {
            errorCount++;
          }
        }

        alert(
          `Import completed!\nSuccess: ${successCount}\nErrors: ${errorCount}`
        );
        fetchData();
      } catch (error) {
        alert('Error importing file. Please check the format.');
      }
    };

    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
      'Not Started': 'default',
      'In Progress': 'primary',
      'Completed': 'success',
      'At Risk': 'warning',
      'Delayed': 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle fontSize="small" />;
      case 'In Progress':
        return <Schedule fontSize="small" />;
      case 'At Risk':
      case 'Delayed':
        return <Warning fontSize="small" />;
      default:
        return null;
    }
  };

  // Apply global filters first, then local filters
  const filteredMilestones = useMemo(() => {
    let filtered = milestones;

    // Apply global domain filter
    if (selectedDomainIds.length > 0) {
      filtered = filtered.filter(m => {
        const project = projects.find(p => p.id === m.projectId);
        return project && selectedDomainIds.includes(project.domainId!);
      });
    }

    // Apply global business decision filter
    if (selectedBusinessDecisions.length > 0) {
      filtered = filtered.filter(m => {
        const project = projects.find(p => p.id === m.projectId);
        return project && selectedBusinessDecisions.includes(project.businessDecision!);
      });
    }

    // Apply local filters
    filtered = filtered.filter((milestone) => {
      const ownerName = milestone.owner
        ? `${milestone.owner.firstName} ${milestone.owner.lastName}`.toLowerCase()
        : '';

      const project = projects.find(p => p.id === milestone.projectId);

      return (
        (filters.project === '' || milestone.project?.name === filters.project) &&
        (filters.status === '' || milestone.status === filters.status) &&
        (filters.owner === '' || ownerName.includes(filters.owner.toLowerCase())) &&
        (filters.domainId === '' || project?.domainId?.toString() === filters.domainId) &&
        (filters.businessDecision === '' || project?.businessDecision === filters.businessDecision)
      );
    });

    return filtered;
  }, [milestones, projects, selectedDomainIds, selectedBusinessDecisions, filters]);

  // Extract unique business decisions for filter options
  const uniqueBusinessDecisions = Array.from(
    new Set(projects.map((p) => p.businessDecision).filter(Boolean))
  ) as string[];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const upcomingMilestones = milestones.filter(
    (m) =>
      m.status !== 'Completed' &&
      m.dueDate &&
      new Date(m.dueDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );

  return (
    <Box>
      <PageHeader
        title="Project Milestones"
        subtitle="Track and manage milestones across all projects"
        icon={<FlagIcon sx={{ fontSize: 32 }} />}
        compact
      />

      {upcomingMilestones.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>{upcomingMilestones.length}</strong> milestone(s) due within the next 30 days
        </Alert>
      )}

      <ActionBar elevation={1}>
        <Button
          variant="outlined"
          startIcon={<TemplateIcon />}
          onClick={generateMilestoneTemplate}
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
          Add Milestone
        </Button>
      </ActionBar>

      <CompactFilterBar
        domains={domains}
        businessDecisions={uniqueBusinessDecisions}
        extraActions={<FilterPresets />}
      />

      <TableContainer component={Paper} sx={{ overflowX: 'auto', boxShadow: 2, borderRadius: 1.5 }}>
        <Table sx={{ minWidth: { xs: 700, md: 900 } }}>
          <TableHead sx={{ backgroundColor: (theme) => theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.grey[900] }}>
            <TableRow>
              <TableCell align="right" sx={{ minWidth: 120 }}>Actions</TableCell>
              <TableCell sx={{ minWidth: 180 }}>Milestone Name</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Project</TableCell>
              <TableCell sx={{ minWidth: 130 }}>Domain</TableCell>
              <TableCell sx={{ minWidth: 140 }}>Business Decision</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Status</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Progress</TableCell>
              <TableCell sx={{ minWidth: 130 }}>Planned End Date</TableCell>
              <TableCell sx={{ minWidth: 130 }}>Owner</TableCell>
            </TableRow>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>
                <Autocomplete
                  size="small"
                  options={['', ...projects.map(p => p.name)]}
                  value={filters.project || ''}
                  onChange={(_, newValue) => setFilters({ ...filters, project: newValue || '' })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="All Projects"
                      size="small"
                    />
                  )}
                  getOptionLabel={(option) => option === '' ? 'All Projects' : option}
                  fullWidth
                />
              </TableCell>
              <TableCell>
                <Autocomplete
                  size="small"
                  options={['', ...domains.map(d => d.id.toString())]}
                  value={filters.domainId || ''}
                  onChange={(_, newValue) => setFilters({ ...filters, domainId: newValue || '' })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="All Domains"
                      size="small"
                    />
                  )}
                  getOptionLabel={(option) => {
                    if (option === '') return 'All Domains';
                    const domain = domains.find(d => d.id.toString() === option);
                    return domain?.name || option;
                  }}
                  fullWidth
                />
              </TableCell>
              <TableCell>
                <Autocomplete
                  size="small"
                  options={['', ...Array.from(new Set(projects.map(p => p.businessDecision).filter(Boolean))) as string[]]}
                  value={filters.businessDecision || ''}
                  onChange={(_, newValue) => setFilters({ ...filters, businessDecision: newValue || '' })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="All Decisions"
                      size="small"
                    />
                  )}
                  getOptionLabel={(option) => option === '' ? 'All Decisions' : option}
                  fullWidth
                />
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  select
                  placeholder="All"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Not Started">Not Started</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="At Risk">At Risk</MenuItem>
                  <MenuItem value="Delayed">Delayed</MenuItem>
                </TextField>
              </TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell>
                <TextField
                  size="small"
                  placeholder="Filter by owner"
                  value={filters.owner}
                  onChange={(e) => setFilters({ ...filters, owner: e.target.value })}
                  fullWidth
                />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMilestones.map((milestone) => (
              <TableRow key={milestone.id} hover>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleOpenDialog(milestone)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(milestone.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {milestone.name}
                  </Typography>
                  {milestone.description && (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {milestone.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{milestone.project?.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {milestone.project?.fiscalYear}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {(() => {
                      const project = projects.find(p => p.id === milestone.projectId);
                      const domain = domains.find(d => d.id === project?.domainId);
                      return domain?.name || '-';
                    })()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {(() => {
                      const project = projects.find(p => p.id === milestone.projectId);
                      return project?.businessDecision || '-';
                    })()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={milestone.status}
                    size="small"
                    color={getStatusColor(milestone.status)}
                    icon={getStatusIcon(milestone.status) || undefined}
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 100,
                        height: 6,
                        bgcolor: 'grey.300',
                        borderRadius: 3,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          width: `${milestone.progress}%`,
                          height: '100%',
                          bgcolor: 'primary.main',
                        }}
                      />
                    </Box>
                    <Typography variant="body2">{milestone.progress}%</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {milestone.plannedEndDate ? (
                    <Typography variant="body2">
                      {new Date(milestone.plannedEndDate).toLocaleDateString()}
                    </Typography>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {milestone.owner ? (
                    <Typography variant="body2">
                      {milestone.owner.firstName} {milestone.owner.lastName}
                    </Typography>
                  ) : (
                    '-'
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredMilestones.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No milestones found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {milestones.length === 0
                ? 'Click "Add Milestone" to create one'
                : 'Try adjusting your filters'}
            </Typography>
          </Box>
        )}
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Edit Milestone' : 'Add Milestone'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              {editMode ? (
                <TextField
                  fullWidth
                  label="Project"
                  value={projects.find(p => p.id === currentMilestone.projectId)?.name || ''}
                  disabled
                  helperText="Project cannot be changed when editing"
                />
              ) : (
                <Autocomplete
                  fullWidth
                  options={projects}
                  getOptionLabel={(option) => `${option.name} (${option.fiscalYear || 'N/A'})`}
                  value={projects.find(p => p.id === currentMilestone.projectId) || null}
                  onChange={(_, newValue) => {
                    setCurrentMilestone({
                      ...currentMilestone,
                      projectId: newValue?.id,
                    });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Project"
                      required
                      placeholder="Search projects..."
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {option.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.fiscalYear} • {option.domain?.name || 'No domain'}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Milestone Name"
                required
                value={currentMilestone.name || ''}
                onChange={(e) =>
                  setCurrentMilestone({ ...currentMilestone, name: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={currentMilestone.description || ''}
                onChange={(e) =>
                  setCurrentMilestone({ ...currentMilestone, description: e.target.value })
                }
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Status"
                value={currentMilestone.status || 'Not Started'}
                onChange={(e) =>
                  setCurrentMilestone({ ...currentMilestone, status: e.target.value })
                }
              >
                <MenuItem value="Not Started">Not Started</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="At Risk">At Risk</MenuItem>
                <MenuItem value="Delayed">Delayed</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Progress (%)"
                type="number"
                value={currentMilestone.progress || 0}
                onChange={(e) =>
                  setCurrentMilestone({
                    ...currentMilestone,
                    progress: parseInt(e.target.value) || 0,
                  })
                }
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Planned Start Date"
                type="date"
                value={
                  currentMilestone.plannedStartDate
                    ? new Date(currentMilestone.plannedStartDate).toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  setCurrentMilestone({
                    ...currentMilestone,
                    plannedStartDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Planned End Date"
                type="date"
                value={
                  currentMilestone.plannedEndDate
                    ? new Date(currentMilestone.plannedEndDate).toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  setCurrentMilestone({
                    ...currentMilestone,
                    plannedEndDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Autocomplete
                fullWidth
                options={users}
                getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                value={users.find(u => u.id === currentMilestone.ownerId) || null}
                onChange={(_, newValue) => {
                  setCurrentMilestone({
                    ...currentMilestone,
                    ownerId: newValue?.id,
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Owner"
                    placeholder="Search users..."
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {option.firstName} {option.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.role} • {option.email}
                      </Typography>
                    </Box>
                  </li>
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dependencies"
                value={currentMilestone.dependencies || ''}
                onChange={(e) =>
                  setCurrentMilestone({ ...currentMilestone, dependencies: e.target.value })
                }
                helperText="List milestone dependencies separated by commas"
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

export default MilestonesOverview;
