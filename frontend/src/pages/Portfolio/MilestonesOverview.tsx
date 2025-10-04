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
  IconButton,
  Alert,
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
} from '@mui/icons-material';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface Milestone {
  id: number;
  projectId: number;
  name: string;
  description?: string;
  status: string;
  dueDate?: string;
  completedDate?: string;
  progress: number;
  owner?: string;
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
}

const MilestonesOverview = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<Partial<Milestone>>({});
  const [filters, setFilters] = useState({
    project: '',
    status: '',
    owner: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [milestonesRes, projectsRes] = await Promise.all([
        axios.get(`${API_URL}/milestones`, config),
        axios.get(`${API_URL}/projects`, config),
      ]);

      setMilestones(milestonesRes.data.data);
      setProjects(projectsRes.data.data);
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

  const generateTemplate = () => {
    const templateData = [
      {
        'Milestone Name': 'Example Milestone',
        'Project Name': 'Enter project name',
        'Description': 'Milestone description',
        'Status': 'Not Started',
        'Progress (%)': 0,
        'Due Date': '2025-12-31',
        'Owner': 'John Doe',
        'Dependencies': 'Previous milestone name',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Milestones Template');

    ws['!cols'] = [
      { wch: 30 },
      { wch: 25 },
      { wch: 40 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 20 },
      { wch: 30 },
    ];

    XLSX.writeFile(wb, 'milestones_template.xlsx');
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const filteredMilestones = milestones.filter((milestone) => {
    return (
      (filters.project === '' || milestone.project?.name === filters.project) &&
      (filters.status === '' || milestone.status === filters.status) &&
      (filters.owner === '' ||
        milestone.owner?.toLowerCase().includes(filters.owner.toLowerCase()))
    );
  });

  const upcomingMilestones = milestones.filter(
    (m) =>
      m.status !== 'Completed' &&
      m.dueDate &&
      new Date(m.dueDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );

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
            Project Milestones
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Track and manage milestones across all projects
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
            onClick={generateTemplate}
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
            Add Milestone
          </Button>
        </Box>
      </Box>

      {upcomingMilestones.length > 0 && (
        <Alert severity="info" sx={{ mb: { xs: 2, sm: 3 } }}>
          <strong>{upcomingMilestones.length}</strong> milestone(s) due within the next 30 days
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: { xs: 700, md: 900 } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 180 }}>Milestone Name</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Project</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Status</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Progress</TableCell>
              <TableCell sx={{ minWidth: 110 }}>Due Date</TableCell>
              <TableCell sx={{ minWidth: 130 }}>Owner</TableCell>
              <TableCell align="right" sx={{ minWidth: 120 }}>Actions</TableCell>
            </TableRow>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>
                <TextField
                  size="small"
                  select
                  placeholder="All"
                  value={filters.project}
                  onChange={(e) => setFilters({ ...filters, project: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="">All</MenuItem>
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.name}>
                      {project.name}
                    </MenuItem>
                  ))}
                </TextField>
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
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMilestones.map((milestone) => (
              <TableRow key={milestone.id} hover>
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
                  {milestone.dueDate ? (
                    <Typography variant="body2">
                      {new Date(milestone.dueDate).toLocaleDateString()}
                    </Typography>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>{milestone.owner || '-'}</TableCell>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Edit Milestone' : 'Add Milestone'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Project"
                required
                value={currentMilestone.projectId || ''}
                onChange={(e) =>
                  setCurrentMilestone({
                    ...currentMilestone,
                    projectId: e.target.value as number,
                  })
                }
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name} ({project.fiscalYear})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
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
                rows={3}
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
                label="Due Date"
                type="date"
                value={
                  currentMilestone.dueDate
                    ? new Date(currentMilestone.dueDate).toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  setCurrentMilestone({
                    ...currentMilestone,
                    dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Owner"
                value={currentMilestone.owner || ''}
                onChange={(e) =>
                  setCurrentMilestone({ ...currentMilestone, owner: e.target.value })
                }
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
