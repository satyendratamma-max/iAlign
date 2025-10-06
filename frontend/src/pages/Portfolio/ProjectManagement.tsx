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
  LinearProgress,
  MenuItem,
  Tabs,
  Tab,
  FormControlLabel,
  Checkbox,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Description as TemplateIcon,
  People as PeopleIcon,
  ViewList as ViewListIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { exportToExcel, importFromExcel, generateProjectTemplate } from '../../utils/excelUtils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface Project {
  id: number;
  projectNumber?: string;
  segmentFunctionId?: number;
  domainId?: number;
  name: string;
  description?: string;
  businessProcess?: string;
  functionality?: string;
  status: string;
  priority: string;
  businessDecision?: string;
  businessPriority?: string;
  type?: string;
  fiscalYear?: string;
  progress: number;
  currentPhase?: string;
  budget?: number;
  actualCost?: number;
  forecastedCost?: number;
  plannedOpex?: number;
  plannedCapex?: number;
  totalPlannedCost?: number;
  financialBenefit?: number;
  startDate?: Date;
  endDate?: Date;
  desiredStartDate?: Date;
  desiredCompletionDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  deadline?: Date;
  healthStatus?: string;
  projectManagerId?: number;
  sponsorId?: number;
  needleMover?: string;
  dow?: string;
  investmentClass?: string;
  benefitArea?: string;
  technologyArea?: string;
  enterpriseCategory?: string;
  projectInfrastructureNeeded?: boolean;
  coCreation?: boolean;
  technologyChoice?: string;
  segmentFunction?: string;
  division?: string;
  newOrCarryOver?: string;
  submittedById?: number;
  domainManagerId?: number;
  isActive: boolean;
  domain?: {
    id: number;
    name: string;
  };
  segmentFunctionData?: {
    id: number;
    name: string;
  };
}

interface Domain {
  id: number;
  name: string;
}

interface SegmentFunction {
  id: number;
  name: string;
}

interface Resource {
  id: number;
  employeeId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  primarySkill?: string;
  allocationPercentage?: number;
  roleOnProject?: string;
}

interface Milestone {
  id: number;
  projectId: number;
  name: string;
  description?: string;
  status: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  owner?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

const ProjectManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [segmentFunctions, setSegmentFunctions] = useState<SegmentFunction[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProject, setCurrentProject] = useState<Partial<Project>>({});
  const [dialogTab, setDialogTab] = useState(0);
  const [openResourcesDialog, setOpenResourcesDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectResources, setProjectResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'gantt'>('list');
  const [ganttSidebarWidth, setGanttSidebarWidth] = useState(300);
  const [filters, setFilters] = useState({
    projectNumber: '',
    name: '',
    domain: [] as string[],
    segmentFunction: [] as string[],
    type: '',
    fiscalYear: [] as string[],
    status: [] as string[],
    priority: '',
    currentPhase: '',
    health: [] as string[],
  });

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [projectsRes, domainsRes, segmentFunctionsRes, milestonesRes] = await Promise.all([
        axios.get(`${API_URL}/projects`, config),
        axios.get(`${API_URL}/domains`, config),
        axios.get(`${API_URL}/segment-functions`, config),
        axios.get(`${API_URL}/milestones`, config),
      ]);

      setProjects(projectsRes.data.data);
      setDomains(domainsRes.data.data);
      setSegmentFunctions(segmentFunctionsRes.data.data);
      setMilestones(milestonesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setEditMode(true);
      setCurrentProject(project);
    } else {
      setEditMode(false);
      setCurrentProject({ progress: 0, status: 'Planning', priority: 'Medium' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentProject({});
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editMode && currentProject.id) {
        await axios.put(`${API_URL}/projects/${currentProject.id}`, currentProject, config);
      } else {
        await axios.post(`${API_URL}/projects`, currentProject, config);
      }

      fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/projects/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchData();
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const handleViewResources = async (project: Project) => {
    setSelectedProject(project);
    setOpenResourcesDialog(true);
    setLoadingResources(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/allocations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Filter allocations by project ID and map to resources
      const projectAllocations = response.data.data.filter(
        (allocation: any) => allocation.projectId === project.id
      );

      const resources = projectAllocations.map((allocation: any) => ({
        id: allocation.resource?.id,
        employeeId: allocation.resource?.employeeId,
        firstName: allocation.resource?.firstName,
        lastName: allocation.resource?.lastName,
        email: allocation.resource?.email,
        role: allocation.resource?.role,
        primarySkill: allocation.resource?.primarySkill,
        allocationPercentage: allocation.allocationPercentage,
        roleOnProject: allocation.roleOnProject,
      }));

      setProjectResources(resources);
    } catch (error) {
      console.error('Error fetching project resources:', error);
    } finally {
      setLoadingResources(false);
    }
  };

  const handleCloseResourcesDialog = () => {
    setOpenResourcesDialog(false);
    setSelectedProject(null);
    setProjectResources([]);
  };

  const handleExport = () => {
    exportToExcel(projects, 'projects_export');
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

          // Bulk create projects
          for (const project of data) {
            await axios.post(`${API_URL}/projects`, project, config);
          }

          alert(`Successfully imported ${data.length} projects`);
          fetchData();
        } catch (error) {
          console.error('Error importing projects:', error);
          alert('Error importing some projects. Check console for details.');
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
      'Planning': 'default',
      'In Progress': 'primary',
      'Completed': 'success',
      'On Hold': 'warning',
      'Cancelled': 'error',
    };
    return colors[status] || 'default';
  };

  const getHealthColor = (health?: string) => {
    const colors: Record<string, 'success' | 'warning' | 'error'> = {
      'Green': 'success',
      'Yellow': 'warning',
      'Red': 'error',
    };
    return colors[health || ''] || 'default';
  };

  // Get unique fiscal years from projects
  const uniqueFiscalYears = Array.from(new Set(projects.map(p => p.fiscalYear).filter(Boolean))) as string[];

  // Filter projects based on current filters
  const filteredProjects = projects.filter((project) => {
    return (
      (project.projectNumber || '').toLowerCase().includes(filters.projectNumber.toLowerCase()) &&
      project.name.toLowerCase().includes(filters.name.toLowerCase()) &&
      (filters.domain.length === 0 || filters.domain.includes(project.domain?.name || '')) &&
      (filters.segmentFunction.length === 0 || filters.segmentFunction.includes(project.segmentFunctionData?.name || '')) &&
      (filters.type === '' || (project.type || '').toLowerCase().includes(filters.type.toLowerCase())) &&
      (filters.fiscalYear.length === 0 || filters.fiscalYear.includes(project.fiscalYear || '')) &&
      (filters.status.length === 0 || filters.status.includes(project.status)) &&
      (filters.priority === '' || project.priority === filters.priority) &&
      (filters.currentPhase === '' || (project.currentPhase || '').toLowerCase().includes(filters.currentPhase.toLowerCase())) &&
      (filters.health.length === 0 || filters.health.includes(project.healthStatus || ''))
    );
  });

  // Gantt Chart Helper Functions
  const getDateRange = () => {
    const allDates: Date[] = [];

    // Only consider filtered projects and their milestones
    const filteredProjectIds = filteredProjects.map(p => p.id);
    const relevantMilestones = milestones.filter(m => filteredProjectIds.includes(m.projectId));

    filteredProjects.forEach(project => {
      if (project.startDate) allDates.push(new Date(project.startDate));
      if (project.endDate) allDates.push(new Date(project.endDate));
      if (project.desiredStartDate) allDates.push(new Date(project.desiredStartDate));
      if (project.desiredCompletionDate) allDates.push(new Date(project.desiredCompletionDate));
    });

    relevantMilestones.forEach(milestone => {
      if (milestone.plannedStartDate) allDates.push(new Date(milestone.plannedStartDate));
      if (milestone.plannedEndDate) allDates.push(new Date(milestone.plannedEndDate));
    });

    if (allDates.length === 0) {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31)
      };
    }

    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

    // Calculate dynamic padding based on date range
    const rangeInDays = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);

    // Smart padding: smaller padding for shorter ranges, larger for longer ranges
    let paddingMonths = 1;
    if (rangeInDays < 90) {
      paddingMonths = 0.5; // 2 weeks for ranges under 3 months
    } else if (rangeInDays < 180) {
      paddingMonths = 1; // 1 month for ranges under 6 months
    } else if (rangeInDays > 730) {
      paddingMonths = 2; // 2 months for ranges over 2 years
    }

    // Apply padding
    const startPadded = new Date(minDate);
    const endPadded = new Date(maxDate);
    startPadded.setDate(startPadded.getDate() - (paddingMonths * 30));
    endPadded.setDate(endPadded.getDate() + (paddingMonths * 30));

    return { start: startPadded, end: endPadded };
  };

  const calculatePosition = (date: Date | undefined, rangeStart: Date, rangeEnd: Date) => {
    if (!date) return 0;
    const d = new Date(date);
    const totalRange = rangeEnd.getTime() - rangeStart.getTime();
    const position = ((d.getTime() - rangeStart.getTime()) / totalRange) * 100;
    return Math.max(0, Math.min(100, position));
  };

  const calculateWidth = (start: Date | undefined, end: Date | undefined, rangeStart: Date, rangeEnd: Date) => {
    if (!start || !end) return 0;
    const startPos = calculatePosition(start, rangeStart, rangeEnd);
    const endPos = calculatePosition(end, rangeStart, rangeEnd);
    return Math.max(1, endPos - startPos);
  };

  const getMonthMarkers = (rangeStart: Date, rangeEnd: Date) => {
    const markers: { position: number; label: string; isQuarter?: boolean }[] = [];
    const current = new Date(rangeStart);
    current.setDate(1);

    // Calculate total months in range
    const totalMonths = (rangeEnd.getFullYear() - rangeStart.getFullYear()) * 12 +
                        (rangeEnd.getMonth() - rangeStart.getMonth());

    // Determine interval based on range
    let interval = 1; // Show every month
    if (totalMonths > 24) interval = 3; // Show quarters if more than 2 years
    if (totalMonths > 60) interval = 6; // Show half-years if more than 5 years

    let monthCount = 0;
    while (current <= rangeEnd) {
      if (monthCount % interval === 0) {
        const position = calculatePosition(current, rangeStart, rangeEnd);
        const label = interval >= 3
          ? current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
          : current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        markers.push({ position, label, isQuarter: interval >= 3 });
      }
      current.setMonth(current.getMonth() + 1);
      monthCount++;
    }

    return markers;
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
            Project Management
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Manage and track all enterprise projects
          </Typography>
        </Box>
        <Box
          display="flex"
          flexWrap="wrap"
          gap={1}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <Button
            variant={viewMode === 'list' ? 'contained' : 'outlined'}
            startIcon={<ViewListIcon sx={{ display: { xs: 'none', sm: 'inline' } }} />}
            onClick={() => setViewMode('list')}
            size="small"
            sx={{ flex: { xs: '1 1 auto', sm: '0 0 auto' } }}
          >
            List
          </Button>
          <Button
            variant={viewMode === 'gantt' ? 'contained' : 'outlined'}
            startIcon={<TimelineIcon sx={{ display: { xs: 'none', sm: 'inline' } }} />}
            onClick={() => setViewMode('gantt')}
            size="small"
            sx={{ flex: { xs: '1 1 auto', sm: '0 0 auto' } }}
          >
            Gantt
          </Button>
          <Button
            variant="outlined"
            startIcon={<TemplateIcon sx={{ display: { xs: 'none', sm: 'inline' } }} />}
            onClick={generateProjectTemplate}
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
            Add Project
          </Button>
        </Box>
      </Box>

      {viewMode === 'list' ? (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: { xs: 800, md: 1200 } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 100 }}>Project #</TableCell>
              <TableCell sx={{ minWidth: 180 }}>Project Name</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Domain</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Segment Function</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Type</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Fiscal Year</TableCell>
              <TableCell sx={{ minWidth: 110 }}>Status</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Priority</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Current Phase</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Progress</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Budget</TableCell>
              <TableCell sx={{ minWidth: 110 }}>Start Date</TableCell>
              <TableCell sx={{ minWidth: 110 }}>End Date</TableCell>
              <TableCell sx={{ minWidth: 90 }}>Health</TableCell>
              <TableCell align="right" sx={{ minWidth: 140 }}>Actions</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <TextField
                  size="small"
                  placeholder="Filter by #"
                  value={filters.projectNumber}
                  onChange={(e) => setFilters({ ...filters, projectNumber: e.target.value })}
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
                  onChange={(e) => setFilters({ ...filters, domain: e.target.value as string[] })}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) =>
                      (selected as string[]).length > 0 ? `${(selected as string[]).length} selected` : 'All'
                  }}
                  fullWidth
                >
                  {domains.map((domain) => (
                    <MenuItem key={domain.id} value={domain.name}>
                      <Checkbox checked={filters.domain.indexOf(domain.name) > -1} size="small" />
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
                  onChange={(e) => setFilters({ ...filters, segmentFunction: e.target.value as string[] })}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) =>
                      (selected as string[]).length > 0 ? `${(selected as string[]).length} selected` : 'All'
                  }}
                  fullWidth
                >
                  {segmentFunctions.map((segmentFunction) => (
                    <MenuItem key={segmentFunction.id} value={segmentFunction.name}>
                      <Checkbox checked={filters.segmentFunction.indexOf(segmentFunction.name) > -1} size="small" />
                      {segmentFunction.name}
                    </MenuItem>
                  ))}
                </TextField>
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  placeholder="Filter by type"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  fullWidth
                />
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  select
                  placeholder="All"
                  value={filters.fiscalYear}
                  onChange={(e) => setFilters({ ...filters, fiscalYear: e.target.value as string[] })}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) =>
                      (selected as string[]).length > 0 ? `${(selected as string[]).length} selected` : 'All'
                  }}
                  fullWidth
                >
                  {uniqueFiscalYears.map((year) => (
                    <MenuItem key={year} value={year}>
                      <Checkbox checked={filters.fiscalYear.indexOf(year) > -1} size="small" />
                      {year}
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
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as string[] })}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) =>
                      (selected as string[]).length > 0 ? `${(selected as string[]).length} selected` : 'All'
                  }}
                  fullWidth
                >
                  <MenuItem value="Planning">
                    <Checkbox checked={filters.status.indexOf('Planning') > -1} size="small" />
                    Planning
                  </MenuItem>
                  <MenuItem value="In Progress">
                    <Checkbox checked={filters.status.indexOf('In Progress') > -1} size="small" />
                    In Progress
                  </MenuItem>
                  <MenuItem value="On Hold">
                    <Checkbox checked={filters.status.indexOf('On Hold') > -1} size="small" />
                    On Hold
                  </MenuItem>
                  <MenuItem value="Completed">
                    <Checkbox checked={filters.status.indexOf('Completed') > -1} size="small" />
                    Completed
                  </MenuItem>
                  <MenuItem value="Cancelled">
                    <Checkbox checked={filters.status.indexOf('Cancelled') > -1} size="small" />
                    Cancelled
                  </MenuItem>
                </TextField>
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  select
                  placeholder="All"
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Critical">Critical</MenuItem>
                </TextField>
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  placeholder="Filter by phase"
                  value={filters.currentPhase}
                  onChange={(e) => setFilters({ ...filters, currentPhase: e.target.value })}
                  fullWidth
                />
              </TableCell>
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell>
                <TextField
                  size="small"
                  select
                  placeholder="All"
                  value={filters.health}
                  onChange={(e) => setFilters({ ...filters, health: e.target.value as string[] })}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) =>
                      (selected as string[]).length > 0 ? `${(selected as string[]).length} selected` : 'All'
                  }}
                  fullWidth
                >
                  <MenuItem value="Green">
                    <Checkbox checked={filters.health.indexOf('Green') > -1} size="small" />
                    Green
                  </MenuItem>
                  <MenuItem value="Yellow">
                    <Checkbox checked={filters.health.indexOf('Yellow') > -1} size="small" />
                    Yellow
                  </MenuItem>
                  <MenuItem value="Red">
                    <Checkbox checked={filters.health.indexOf('Red') > -1} size="small" />
                    Red
                  </MenuItem>
                </TextField>
              </TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProjects.map((project) => (
              <TableRow key={project.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {project.projectNumber || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body1" fontWeight="medium">
                    {project.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {project.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  {project.domain?.name || '-'}
                </TableCell>
                <TableCell>
                  {project.segmentFunctionData?.name || '-'}
                </TableCell>
                <TableCell>{project.type || '-'}</TableCell>
                <TableCell>{project.fiscalYear || '-'}</TableCell>
                <TableCell>
                  <Chip label={project.status} size="small" color={getStatusColor(project.status)} />
                </TableCell>
                <TableCell>
                  <Chip label={project.priority} size="small" variant="outlined" />
                </TableCell>
                <TableCell>{project.currentPhase || '-'}</TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LinearProgress
                      variant="determinate"
                      value={project.progress}
                      sx={{ width: 100, height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="body2">{project.progress}%</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{formatCurrency(project.budget)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Spent: {formatCurrency(project.actualCost)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={project.healthStatus || 'N/A'}
                    size="small"
                    color={getHealthColor(project.healthStatus) as any}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleViewResources(project)}
                    title="View Resources"
                  >
                    <PeopleIcon />
                  </IconButton>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenDialog(project)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(project.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      ) : (
        <Paper sx={{ p: 2, overflowX: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Project Timeline
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Sidebar Width:
              </Typography>
              <Button
                size="small"
                variant={ganttSidebarWidth === 200 ? 'contained' : 'outlined'}
                onClick={() => setGanttSidebarWidth(200)}
                sx={{ minWidth: 60, px: 1, py: 0.5 }}
              >
                Compact
              </Button>
              <Button
                size="small"
                variant={ganttSidebarWidth === 300 ? 'contained' : 'outlined'}
                onClick={() => setGanttSidebarWidth(300)}
                sx={{ minWidth: 60, px: 1, py: 0.5 }}
              >
                Normal
              </Button>
              <Button
                size="small"
                variant={ganttSidebarWidth === 400 ? 'contained' : 'outlined'}
                onClick={() => setGanttSidebarWidth(400)}
                sx={{ minWidth: 60, px: 1, py: 0.5 }}
              >
                Wide
              </Button>
            </Box>
          </Box>

          {/* Gantt Filters */}
          <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f9fafb', borderRadius: 1, border: '1px solid #e5e7eb' }}>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  size="small"
                  fullWidth
                  label="Project #"
                  placeholder="Search..."
                  value={filters.projectNumber}
                  onChange={(e) => setFilters({ ...filters, projectNumber: e.target.value })}
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  size="small"
                  fullWidth
                  label="Project Name"
                  placeholder="Search..."
                  value={filters.name}
                  onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                  sx={{ bgcolor: 'white' }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  size="small"
                  select
                  fullWidth
                  label="Domain"
                  value={filters.domain}
                  onChange={(e) => setFilters({ ...filters, domain: e.target.value as string[] })}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value} size="small" sx={{ height: 20 }} />
                        ))}
                      </Box>
                    ),
                  }}
                  sx={{ bgcolor: 'white' }}
                >
                  {domains.map((domain) => (
                    <MenuItem key={domain.id} value={domain.name}>
                      <Checkbox checked={filters.domain.indexOf(domain.name) > -1} size="small" />
                      {domain.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  size="small"
                  select
                  fullWidth
                  label="Segment Function"
                  value={filters.segmentFunction}
                  onChange={(e) => setFilters({ ...filters, segmentFunction: e.target.value as string[] })}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value} size="small" sx={{ height: 20 }} />
                        ))}
                      </Box>
                    ),
                  }}
                  sx={{ bgcolor: 'white' }}
                >
                  {segmentFunctions.map((sf) => (
                    <MenuItem key={sf.id} value={sf.name}>
                      <Checkbox checked={filters.segmentFunction.indexOf(sf.name) > -1} size="small" />
                      {sf.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  size="small"
                  select
                  fullWidth
                  label="Status"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as string[] })}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value} size="small" sx={{ height: 20 }} />
                        ))}
                      </Box>
                    ),
                  }}
                  sx={{ bgcolor: 'white' }}
                >
                  <MenuItem value="Planning">
                    <Checkbox checked={filters.status.indexOf('Planning') > -1} size="small" />
                    Planning
                  </MenuItem>
                  <MenuItem value="In Progress">
                    <Checkbox checked={filters.status.indexOf('In Progress') > -1} size="small" />
                    In Progress
                  </MenuItem>
                  <MenuItem value="Completed">
                    <Checkbox checked={filters.status.indexOf('Completed') > -1} size="small" />
                    Completed
                  </MenuItem>
                  <MenuItem value="On Hold">
                    <Checkbox checked={filters.status.indexOf('On Hold') > -1} size="small" />
                    On Hold
                  </MenuItem>
                  <MenuItem value="Cancelled">
                    <Checkbox checked={filters.status.indexOf('Cancelled') > -1} size="small" />
                    Cancelled
                  </MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  size="small"
                  select
                  fullWidth
                  label="Health Status"
                  value={filters.health}
                  onChange={(e) => setFilters({ ...filters, health: e.target.value as string[] })}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value} size="small" sx={{ height: 20 }} />
                        ))}
                      </Box>
                    ),
                  }}
                  sx={{ bgcolor: 'white' }}
                >
                  <MenuItem value="Green">
                    <Checkbox checked={filters.health.indexOf('Green') > -1} size="small" />
                    Green
                  </MenuItem>
                  <MenuItem value="Yellow">
                    <Checkbox checked={filters.health.indexOf('Yellow') > -1} size="small" />
                    Yellow
                  </MenuItem>
                  <MenuItem value="Red">
                    <Checkbox checked={filters.health.indexOf('Red') > -1} size="small" />
                    Red
                  </MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  size="small"
                  select
                  fullWidth
                  label="Fiscal Year"
                  value={filters.fiscalYear}
                  onChange={(e) => setFilters({ ...filters, fiscalYear: e.target.value as string[] })}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value} size="small" sx={{ height: 20 }} />
                        ))}
                      </Box>
                    ),
                  }}
                  sx={{ bgcolor: 'white' }}
                >
                  {uniqueFiscalYears.map((year) => (
                    <MenuItem key={year} value={year}>
                      <Checkbox checked={filters.fiscalYear.indexOf(year) > -1} size="small" />
                      {year}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={() => setFilters({
                    projectNumber: '',
                    name: '',
                    domain: [],
                    segmentFunction: [],
                    type: '',
                    fiscalYear: [],
                    status: [],
                    priority: '',
                    currentPhase: '',
                    health: [],
                  })}
                  sx={{ height: '40px' }}
                >
                  Clear All
                </Button>
              </Grid>
            </Grid>
          </Box>

          {(() => {
            const dateRange = getDateRange();
            const monthMarkers = getMonthMarkers(dateRange.start, dateRange.end);

            return (
              <Box>
                {/* Timeline Header */}
                <Box sx={{ display: 'flex' }}>
                  <Box sx={{ width: ganttSidebarWidth, flexShrink: 0, pr: 1 }} />
                  <Box sx={{ flex: 1, position: 'relative', height: 35, mb: 1, borderBottom: '2px solid #e0e0e0' }}>
                    {monthMarkers.map((marker, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          position: 'absolute',
                          left: `${marker.position}%`,
                          transform: 'translateX(-50%)',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: 'text.secondary',
                          textAlign: 'center',
                        }}
                      >
                        {marker.label}
                        <Box
                          sx={{
                            position: 'absolute',
                            left: '50%',
                            top: 18,
                            width: 1,
                            height: 12,
                            bgcolor: '#e0e0e0',
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ width: 100, flexShrink: 0 }} />
                </Box>

                {/* Projects and Milestones */}
                {filteredProjects.map((project) => {
                  const projectMilestones = milestones.filter(m => m.projectId === project.id);
                  const projectStart = project.startDate || project.desiredStartDate;
                  const projectEnd = project.endDate || project.desiredCompletionDate;

                  return (
                    <Box key={project.id} sx={{ mb: 0.5, pb: 0.5, borderBottom: '1px solid #f8f8f8' }}>
                      {/* Project Row with Milestones */}
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: ganttSidebarWidth, flexShrink: 0, pr: 1 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '0.7rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'block',
                            }}
                            title={`${project.projectNumber || `PRJ-${project.id}`} - ${project.name}`}
                          >
                            <Box component="span" sx={{ fontWeight: 600, mr: 0.5 }}>
                              {project.projectNumber || `PRJ-${project.id}`}
                            </Box>
                            <Box component="span" sx={{ color: 'text.secondary' }}>
                              {project.name}
                            </Box>
                          </Typography>
                        </Box>
                        <Box sx={{ flex: 1, position: 'relative', height: 28 }}>
                          {/* Project Bar */}
                          {projectStart && projectEnd && (
                            <Box
                              sx={{
                                position: 'absolute',
                                left: `${calculatePosition(new Date(projectStart), dateRange.start, dateRange.end)}%`,
                                width: `${calculateWidth(new Date(projectStart), new Date(projectEnd), dateRange.start, dateRange.end)}%`,
                                height: 18,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                bgcolor: project.healthStatus === 'Green' ? '#4caf50' :
                                        project.healthStatus === 'Yellow' ? '#ff9800' :
                                        project.healthStatus === 'Red' ? '#f44336' : '#2196f3',
                                borderRadius: 0.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '0.6rem',
                                fontWeight: 600,
                                px: 0.5,
                                boxShadow: 1,
                                zIndex: 1,
                              }}
                            >
                              {project.progress}%
                            </Box>
                          )}

                          {/* Milestone Markers */}
                          {projectMilestones.map((milestone) => {
                            const milestoneDate = milestone.plannedEndDate;
                            if (!milestoneDate) return null;

                            const formattedDate = new Date(milestoneDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            });

                            return (
                              <Box
                                key={milestone.id}
                                sx={{
                                  position: 'absolute',
                                  left: `${calculatePosition(new Date(milestoneDate), dateRange.start, dateRange.end)}%`,
                                  top: '50%',
                                  transform: 'translate(-50%, -50%) rotate(45deg)',
                                  width: 11,
                                  height: 11,
                                  bgcolor: milestone.status === 'Completed' ? '#66bb6a' :
                                          milestone.status === 'In Progress' ? '#42a5f5' : '#9e9e9e',
                                  border: '2px solid white',
                                  boxShadow: 1,
                                  zIndex: 2,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    transform: 'translate(-50%, -50%) rotate(45deg) scale(1.5)',
                                    zIndex: 3,
                                  },
                                }}
                                title={`${milestone.name} - ${formattedDate}`}
                              />
                            );
                          })}
                        </Box>
                        <Box sx={{ width: 100, textAlign: 'center', pl: 1 }}>
                          <Chip
                            label={project.status}
                            size="small"
                            color={getStatusColor(project.status)}
                            sx={{ fontSize: '0.6rem', height: 18 }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  );
                })}

                {/* Legend */}
                <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid #e0e0e0', display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', mb: 0.5, display: 'block' }}>
                      Project Health:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 16, height: 12, bgcolor: '#4caf50', borderRadius: 0.5 }} />
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Healthy</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 16, height: 12, bgcolor: '#ff9800', borderRadius: 0.5 }} />
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>At Risk</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 16, height: 12, bgcolor: '#f44336', borderRadius: 0.5 }} />
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Critical</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 16, height: 12, bgcolor: '#2196f3', borderRadius: 0.5 }} />
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>No Status</Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', mb: 0.5, display: 'block' }}>
                      Milestones:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 10, height: 10, bgcolor: '#66bb6a', transform: 'rotate(45deg)', border: '1px solid white', boxShadow: 1 }} />
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Completed</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 10, height: 10, bgcolor: '#42a5f5', transform: 'rotate(45deg)', border: '1px solid white', boxShadow: 1 }} />
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>In Progress</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 10, height: 10, bgcolor: '#9e9e9e', transform: 'rotate(45deg)', border: '1px solid white', boxShadow: 1 }} />
                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Pending</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            );
          })()}
        </Paper>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Edit Project' : 'Add Project'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Project Name"
                value={currentProject.name || ''}
                onChange={(e) =>
                  setCurrentProject({ ...currentProject, name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={currentProject.description || ''}
                onChange={(e) =>
                  setCurrentProject({ ...currentProject, description: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Domain"
                value={currentProject.domainId || ''}
                onChange={(e) =>
                  setCurrentProject({ ...currentProject, domainId: e.target.value as number })
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
                value={currentProject.segmentFunctionId || ''}
                onChange={(e) =>
                  setCurrentProject({ ...currentProject, segmentFunctionId: e.target.value as number })
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
                select
                fullWidth
                label="Status"
                value={currentProject.status || 'Planning'}
                onChange={(e) =>
                  setCurrentProject({ ...currentProject, status: e.target.value })
                }
              >
                <MenuItem value="Planning">Planning</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="On Hold">On Hold</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Priority"
                value={currentProject.priority || 'Medium'}
                onChange={(e) =>
                  setCurrentProject({ ...currentProject, priority: e.target.value })
                }
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Critical">Critical</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Progress (%)"
                type="number"
                value={currentProject.progress || 0}
                onChange={(e) =>
                  setCurrentProject({
                    ...currentProject,
                    progress: parseInt(e.target.value) || 0,
                  })
                }
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Health Status"
                value={currentProject.healthStatus || 'Green'}
                onChange={(e) =>
                  setCurrentProject({ ...currentProject, healthStatus: e.target.value })
                }
              >
                <MenuItem value="Green">Green</MenuItem>
                <MenuItem value="Yellow">Yellow</MenuItem>
                <MenuItem value="Red">Red</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Budget"
                type="number"
                value={currentProject.budget || ''}
                onChange={(e) =>
                  setCurrentProject({
                    ...currentProject,
                    budget: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Actual Cost"
                type="number"
                value={currentProject.actualCost || ''}
                onChange={(e) =>
                  setCurrentProject({
                    ...currentProject,
                    actualCost: parseFloat(e.target.value) || 0,
                  })
                }
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

      <Dialog
        open={openResourcesDialog}
        onClose={handleCloseResourcesDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {selectedProject?.name} - Allocated Resources ({projectResources.length})
        </DialogTitle>
        <DialogContent>
          {loadingResources ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : projectResources.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <Typography color="text.secondary">
                No resources allocated to this project
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Primary Skill</TableCell>
                    <TableCell>Role on Project</TableCell>
                    <TableCell>Allocation %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {projectResources.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell>{resource.employeeId}</TableCell>
                      <TableCell>
                        {resource.firstName} {resource.lastName}
                      </TableCell>
                      <TableCell>{resource.email || '-'}</TableCell>
                      <TableCell>
                        <Chip label={resource.primarySkill || 'N/A'} size="small" />
                      </TableCell>
                      <TableCell>{resource.roleOnProject || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${resource.allocationPercentage || 0}%`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResourcesDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectManagement;
