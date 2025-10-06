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

const DataLookup = () => {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
  };

  const filterData = (data: any[], searchFields: string[]) => {
    if (!searchTerm) return data;
    return data.filter((item) =>
      searchFields.some((field) =>
        String(item[field] || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
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
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Domain Name</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filterData(domains, ['id', 'name', 'description']).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No domains found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filterData(domains, ['id', 'name', 'description']).map((domain) => (
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
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Segment Function Name</strong></TableCell>
                    <TableCell><strong>Domain ID</strong></TableCell>
                    <TableCell><strong>Domain Name</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filterData(segmentFunctions, ['id', 'name', 'domainId']).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No segment functions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filterData(segmentFunctions, ['id', 'name', 'domainId']).map((segmentFunction) => {
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
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Project Name</strong></TableCell>
                    <TableCell><strong>Segment Function ID</strong></TableCell>
                    <TableCell><strong>Segment Function Name</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filterData(projects, ['id', 'name', 'segmentFunctionId']).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No projects found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filterData(projects, ['id', 'name', 'segmentFunctionId']).map((project) => {
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
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Employee ID</strong></TableCell>
                    <TableCell><strong>Resource Name</strong></TableCell>
                    <TableCell><strong>Domain ID</strong></TableCell>
                    <TableCell><strong>Segment Function ID</strong></TableCell>
                    <TableCell><strong>Role</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filterData(resources, ['id', 'employeeId', 'firstName', 'lastName', 'role']).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No resources found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filterData(resources, ['id', 'employeeId', 'firstName', 'lastName', 'role']).map((resource) => {
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
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Milestone Name</strong></TableCell>
                    <TableCell><strong>Project ID</strong></TableCell>
                    <TableCell><strong>Project Name</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filterData(milestones, ['id', 'name', 'projectId']).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No milestones found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filterData(milestones, ['id', 'name', 'projectId']).map((milestone) => {
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
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Resource ID</strong></TableCell>
                    <TableCell><strong>Resource Name</strong></TableCell>
                    <TableCell><strong>Project ID</strong></TableCell>
                    <TableCell><strong>Project Name</strong></TableCell>
                    <TableCell><strong>Allocation %</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filterData(allocations, ['id', 'resourceId', 'projectId']).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No allocations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filterData(allocations, ['id', 'resourceId', 'projectId']).map((allocation) => {
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
                          <TableCell>{resource?.name || '-'}</TableCell>
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
