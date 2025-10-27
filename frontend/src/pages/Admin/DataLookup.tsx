import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  Alert,
  CircularProgress,
  TableSortLabel,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

type Order = 'asc' | 'desc';

const DataLookup = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderBy, setOrderBy] = useState<string>('id');
  const [order, setOrder] = useState<Order>('asc');

  // Entity data
  const [domains, setDomains] = useState<any[]>([]);
  const [segmentFunctions, setSegmentFunctions] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [
        domainsRes,
        segmentFunctionsRes,
        projectsRes,
        resourcesRes,
        milestonesRes,
        allocationsRes,
      ] = await Promise.all([
        axios.get(`${API_URL}/domains`, config),
        axios.get(`${API_URL}/segment-functions`, config),
        axios.get(`${API_URL}/projects`, config),
        axios.get(`${API_URL}/resources`, config),
        axios.get(`${API_URL}/milestones`, config),
        axios.get(`${API_URL}/allocations`, config),
      ]);

      setDomains(domainsRes.data.data || []);
      setSegmentFunctions(segmentFunctionsRes.data.data || []);
      setProjects(projectsRes.data.data || []);
      setResources(resourcesRes.data.data || []);
      setMilestones(milestonesRes.data.data || []);
      setAllocations(allocationsRes.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setSearchTerm('');
    setOrderBy('id');
    setOrder('asc');
  };

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const getComparator = (order: Order, orderBy: string) => {
    return (a: any, b: any) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Handle numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string values (case-insensitive)
      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();

      if (order === 'asc') {
        return aString.localeCompare(bString);
      } else {
        return bString.localeCompare(aString);
      }
    };
  };

  const filterData = (data: any[], searchFields: string[]) => {
    if (!searchTerm) return data;
    return data.filter((item) =>
      searchFields.some((field) =>
        String(item[field] || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  const sortData = (data: any[]) => {
    return [...data].sort(getComparator(order, orderBy));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Data Lookup Reference
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Reference guide for primary and foreign key IDs when manually importing data.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab label={`Domains (${domains.length})`} />
            <Tab label={`Segment Functions (${segmentFunctions.length})`} />
            <Tab label={`Projects (${projects.length})`} />
            <Tab label={`Resources (${resources.length})`} />
            <Tab label={`Milestones (${milestones.length})`} />
            <Tab label={`Allocations (${allocations.length})`} />
          </Tabs>

          <TextField
            fullWidth
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {/* Domains Tab */}
          <TabPanel value={tabValue} index={0}>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'id'}
                        direction={orderBy === 'id' ? order : 'asc'}
                        onClick={() => handleRequestSort('id')}
                      >
                        <strong>ID</strong>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'name'}
                        direction={orderBy === 'name' ? order : 'asc'}
                        onClick={() => handleRequestSort('name')}
                      >
                        <strong>Domain Name</strong>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'description'}
                        direction={orderBy === 'description' ? order : 'asc'}
                        onClick={() => handleRequestSort('description')}
                      >
                        <strong>Description</strong>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'status'}
                        direction={orderBy === 'status' ? order : 'asc'}
                        onClick={() => handleRequestSort('status')}
                      >
                        <strong>Status</strong>
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortData(filterData(domains, ['id', 'name', 'description'])).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No domains found
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortData(filterData(domains, ['id', 'name', 'description'])).map((domain) => (
                      <TableRow key={domain.id} hover>
                        <TableCell>
                          <Chip label={domain.id} size="small" color="primary" />
                        </TableCell>
                        <TableCell>{domain.name}</TableCell>
                        <TableCell>{domain.description || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={domain.status || 'Active'}
                            size="small"
                            color={domain.status === 'Active' ? 'success' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Segment Functions Tab */}
          <TabPanel value={tabValue} index={1}>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'id'}
                        direction={orderBy === 'id' ? order : 'asc'}
                        onClick={() => handleRequestSort('id')}
                      >
                        <strong>ID</strong>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'name'}
                        direction={orderBy === 'name' ? order : 'asc'}
                        onClick={() => handleRequestSort('name')}
                      >
                        <strong>Segment Function Name</strong>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'domainId'}
                        direction={orderBy === 'domainId' ? order : 'asc'}
                        onClick={() => handleRequestSort('domainId')}
                      >
                        <strong>Domain ID</strong>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell><strong>Domain Name</strong></TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'status'}
                        direction={orderBy === 'status' ? order : 'asc'}
                        onClick={() => handleRequestSort('status')}
                      >
                        <strong>Status</strong>
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortData(filterData(segmentFunctions, ['id', 'name', 'domainId'])).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No segment functions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortData(filterData(segmentFunctions, ['id', 'name', 'domainId'])).map((segmentFunction) => {
                      const domain = domains.find((d) => d.id === segmentFunction.domainId);
                      return (
                        <TableRow key={segmentFunction.id} hover>
                          <TableCell>
                            <Chip label={segmentFunction.id} size="small" color="primary" />
                          </TableCell>
                          <TableCell>{segmentFunction.name}</TableCell>
                          <TableCell>
                            <Chip label={segmentFunction.domainId} size="small" color="secondary" />
                          </TableCell>
                          <TableCell>{domain?.name || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={segmentFunction.status || 'Active'}
                              size="small"
                              color={segmentFunction.status === 'Active' ? 'success' : 'default'}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Projects Tab */}
          <TabPanel value={tabValue} index={2}>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'id'}
                        direction={orderBy === 'id' ? order : 'asc'}
                        onClick={() => handleRequestSort('id')}
                      >
                        <strong>ID</strong>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'name'}
                        direction={orderBy === 'name' ? order : 'asc'}
                        onClick={() => handleRequestSort('name')}
                      >
                        <strong>Project Name</strong>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'segmentFunctionId'}
                        direction={orderBy === 'segmentFunctionId' ? order : 'asc'}
                        onClick={() => handleRequestSort('segmentFunctionId')}
                      >
                        <strong>Segment Function ID</strong>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell><strong>Segment Function Name</strong></TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'status'}
                        direction={orderBy === 'status' ? order : 'asc'}
                        onClick={() => handleRequestSort('status')}
                      >
                        <strong>Status</strong>
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortData(filterData(projects, ['id', 'name', 'segmentFunctionId'])).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No projects found
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortData(filterData(projects, ['id', 'name', 'segmentFunctionId'])).map((project) => {
                      const segmentFunction = segmentFunctions.find((p) => p.id === project.segmentFunctionId);
                      return (
                        <TableRow key={project.id} hover>
                          <TableCell>
                            <Chip label={project.id} size="small" color="primary" />
                          </TableCell>
                          <TableCell>{project.name}</TableCell>
                          <TableCell>
                            <Chip label={project.segmentFunctionId} size="small" color="secondary" />
                          </TableCell>
                          <TableCell>{ segmentFunction?.name || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={project.status || 'Active'}
                              size="small"
                              color={project.status === 'Active' ? 'success' : 'default'}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Resources Tab */}
          <TabPanel value={tabValue} index={3}>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'id'}
                        direction={orderBy === 'id' ? order : 'asc'}
                        onClick={() => handleRequestSort('id')}
                      >
                        <strong>ID</strong>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'employeeId'}
                        direction={orderBy === 'employeeId' ? order : 'asc'}
                        onClick={() => handleRequestSort('employeeId')}
                      >
                        <strong>Employee ID</strong>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'firstName'}
                        direction={orderBy === 'firstName' ? order : 'asc'}
                        onClick={() => handleRequestSort('firstName')}
                      >
                        <strong>Resource Name</strong>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'domainId'}
                        direction={orderBy === 'domainId' ? order : 'asc'}
                        onClick={() => handleRequestSort('domainId')}
                      >
                        <strong>Domain ID</strong>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'segmentFunctionId'}
                        direction={orderBy === 'segmentFunctionId' ? order : 'asc'}
                        onClick={() => handleRequestSort('segmentFunctionId')}
                      >
                        <strong>Segment Function ID</strong>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'role'}
                        direction={orderBy === 'role' ? order : 'asc'}
                        onClick={() => handleRequestSort('role')}
                      >
                        <strong>Role</strong>
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortData(filterData(resources, ['id', 'employeeId', 'firstName', 'lastName', 'role'])).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No resources found
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortData(filterData(resources, ['id', 'employeeId', 'firstName', 'lastName', 'role'])).map((resource) => {
                      return (
                        <TableRow key={resource.id} hover>
                          <TableCell>
                            <Chip label={resource.id} size="small" color="primary" />
                          </TableCell>
                          <TableCell>{resource.employeeId}</TableCell>
                          <TableCell>{resource.firstName} {resource.lastName}</TableCell>
                          <TableCell>
                            {resource.domainId ? <Chip label={resource.domainId} size="small" color="secondary" /> : '-'}
                          </TableCell>
                          <TableCell>
                            {resource.segmentFunctionId ? <Chip label={resource.segmentFunctionId} size="small" color="secondary" /> : '-'}
                          </TableCell>
                          <TableCell>{resource.role || '-'}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Milestones Tab */}
          <TabPanel value={tabValue} index={4}>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'id'}
                        direction={orderBy === 'id' ? order : 'asc'}
                        onClick={() => handleRequestSort('id')}
                      >
                        <strong>ID</strong>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'name'}
                        direction={orderBy === 'name' ? order : 'asc'}
                        onClick={() => handleRequestSort('name')}
                      >
                        <strong>Milestone Name</strong>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'projectId'}
                        direction={orderBy === 'projectId' ? order : 'asc'}
                        onClick={() => handleRequestSort('projectId')}
                      >
                        <strong>Project ID</strong>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell><strong>Project Name</strong></TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'status'}
                        direction={orderBy === 'status' ? order : 'asc'}
                        onClick={() => handleRequestSort('status')}
                      >
                        <strong>Status</strong>
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortData(filterData(milestones, ['id', 'name', 'projectId'])).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No milestones found
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortData(filterData(milestones, ['id', 'name', 'projectId'])).map((milestone) => {
                      const project = projects.find((p) => p.id === milestone.projectId);
                      return (
                        <TableRow key={milestone.id} hover>
                          <TableCell>
                            <Chip label={milestone.id} size="small" color="primary" />
                          </TableCell>
                          <TableCell>{milestone.name}</TableCell>
                          <TableCell>
                            <Chip label={milestone.projectId} size="small" color="secondary" />
                          </TableCell>
                          <TableCell>{project?.name || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={milestone.status || 'Pending'}
                              size="small"
                              color={
                                milestone.status === 'Completed'
                                  ? 'success'
                                  : milestone.status === 'In Progress'
                                  ? 'info'
                                  : 'default'
                              }
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Allocations Tab */}
          <TabPanel value={tabValue} index={5}>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'id'}
                        direction={orderBy === 'id' ? order : 'asc'}
                        onClick={() => handleRequestSort('id')}
                      >
                        <strong>ID</strong>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'resourceId'}
                        direction={orderBy === 'resourceId' ? order : 'asc'}
                        onClick={() => handleRequestSort('resourceId')}
                      >
                        <strong>Resource ID</strong>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell><strong>Resource Name</strong></TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'projectId'}
                        direction={orderBy === 'projectId' ? order : 'asc'}
                        onClick={() => handleRequestSort('projectId')}
                      >
                        <strong>Project ID</strong>
                      </TableSortLabel>
                    </TableCell>
                    <TableCell><strong>Project Name</strong></TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={orderBy === 'allocationPercentage'}
                        direction={orderBy === 'allocationPercentage' ? order : 'asc'}
                        onClick={() => handleRequestSort('allocationPercentage')}
                      >
                        <strong>Allocation %</strong>
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortData(filterData(allocations, ['id', 'resourceId', 'projectId'])).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No allocations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortData(filterData(allocations, ['id', 'resourceId', 'projectId'])).map((allocation) => {
                      const resource = resources.find((r) => r.id === allocation.resourceId);
                      const project = projects.find((p) => p.id === allocation.projectId);
                      return (
                        <TableRow key={allocation.id} hover>
                          <TableCell>
                            <Chip label={allocation.id} size="small" color="primary" />
                          </TableCell>
                          <TableCell>
                            <Chip label={allocation.resourceId} size="small" color="secondary" />
                          </TableCell>
                          <TableCell>
                            {resource ? `${resource.firstName} ${resource.lastName}` : '-'}
                          </TableCell>
                          <TableCell>
                            <Chip label={allocation.projectId} size="small" color="secondary" />
                          </TableCell>
                          <TableCell>{project?.name || '-'}</TableCell>
                          <TableCell>{allocation.allocationPercentage || 0}%</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DataLookup;
