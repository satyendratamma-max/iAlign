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
  CircularProgress,
  LinearProgress,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import {
  People,
  TrendingUp,
  AttachMoney,
  Speed,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface Resource {
  id: number;
  employeeId: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  location?: string;
  hourlyRate?: number;
  utilizationRate?: number;
  domainId?: number;
}

interface Allocation {
  id: number;
  resourceId: number;
  projectId: number;
  allocationPercentage: number;
}

interface Domain {
  id: number;
  name: string;
}

const CapacityDashboard = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [resourcesRes, allocationsRes, domainsRes] = await Promise.all([
          axios.get(`${API_URL}/resources`, config),
          axios.get(`${API_URL}/allocations`, config),
          axios.get(`${API_URL}/domains`, config),
        ]);

        const allResources = resourcesRes.data.data || [];
        const allAllocations = allocationsRes.data.data || [];

        setDomains(domainsRes.data.data || []);

        // Filter resources by domain if selected
        const filteredResources = selectedDomainId === 'all'
          ? allResources
          : allResources.filter((r: Resource) => r.domainId === selectedDomainId);

        // Filter allocations to match filtered resources
        const filteredResourceIds = filteredResources.map((r: Resource) => r.id);
        const filteredAllocations = selectedDomainId === 'all'
          ? allAllocations
          : allAllocations.filter((a: Allocation) => filteredResourceIds.includes(a.resourceId));

        setResources(filteredResources);
        setAllocations(filteredAllocations);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDomainId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const totalResources = resources.length;
  const avgUtilization = resources.reduce((sum, r) => sum + (r.utilizationRate || 0), 0) / totalResources || 0;

  // Calculate actual utilization from allocations
  const resourceUtilization = new Map<number, number>();
  allocations.forEach(allocation => {
    const current = resourceUtilization.get(allocation.resourceId) || 0;
    resourceUtilization.set(allocation.resourceId, current + allocation.allocationPercentage);
  });

  const allocatedResources = resourceUtilization.size;
  const totalAllocations = allocations.length;

  // Calculate monthly cost based on resources
  const totalMonthlyCost = resources.reduce((sum, r) => {
    const monthlyHours = 160; // Standard work month
    return sum + ((r.hourlyRate || 0) * monthlyHours);
  }, 0);

  const avgHourlyRate = resources.reduce((sum, r) => sum + (r.hourlyRate || 0), 0) / totalResources || 0;

  const utilizationBreakdown = {
    high: resources.filter(r => (r.utilizationRate || 0) >= 85).length,
    medium: resources.filter(r => (r.utilizationRate || 0) >= 70 && (r.utilizationRate || 0) < 85).length,
    low: resources.filter(r => (r.utilizationRate || 0) < 70).length,
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Capacity Dashboard
          </Typography>
          <Typography color="text.secondary">
            Unified capacity planning with predictive analytics
          </Typography>
        </Box>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="capacity-domain-filter-label">Filter by Domain</InputLabel>
          <Select
            labelId="capacity-domain-filter-label"
            value={selectedDomainId}
            label="Filter by Domain"
            onChange={(e) => setSelectedDomainId(e.target.value as number | 'all')}
          >
            <MenuItem value="all">All Domains</MenuItem>
            {domains.map((domain) => (
              <MenuItem key={domain.id} value={domain.id}>
                {domain.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Resources
                  </Typography>
                  <Typography variant="h4">{totalResources}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {allocatedResources} actively allocated
                  </Typography>
                </Box>
                <Box sx={{ color: 'primary.main' }}>
                  <People />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Avg Utilization
                  </Typography>
                  <Typography variant="h4">{Math.round(avgUtilization)}%</Typography>
                  <Typography variant="caption" color="success.main">
                    ↑ Optimal range
                  </Typography>
                </Box>
                <Box sx={{ color: 'success.main' }}>
                  <Speed />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Monthly Cost
                  </Typography>
                  <Typography variant="h4">{formatCurrency(totalMonthlyCost)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {totalResources} resources
                  </Typography>
                </Box>
                <Box sx={{ color: 'info.main' }}>
                  <AttachMoney />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Avg Hourly Rate
                  </Typography>
                  <Typography variant="h4">{formatCurrency(avgHourlyRate)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Per resource
                  </Typography>
                </Box>
                <Box sx={{ color: 'warning.main' }}>
                  <TrendingUp />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Resource Utilization */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resource Utilization
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Rate</TableCell>
                      <TableCell>Utilization</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resources.slice(0, 8).map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {resource.firstName} {resource.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {resource.employeeId}
                          </Typography>
                        </TableCell>
                        <TableCell>{resource.role || '-'}</TableCell>
                        <TableCell>{resource.location || '-'}</TableCell>
                        <TableCell>{formatCurrency(resource.hourlyRate || 0)}/hr</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LinearProgress
                              variant="determinate"
                              value={resource.utilizationRate || 0}
                              sx={{
                                width: 80,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: 'grey.200',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor:
                                    (resource.utilizationRate || 0) >= 85
                                      ? 'success.main'
                                      : (resource.utilizationRate || 0) >= 70
                                      ? 'primary.main'
                                      : 'warning.main',
                                },
                              }}
                            />
                            <Typography variant="caption">
                              {resource.utilizationRate || 0}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Capacity Breakdown */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Capacity Breakdown
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">High Utilization (≥85%)</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {utilizationBreakdown.high}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(utilizationBreakdown.high / totalResources) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                    color="success"
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">Medium (70-84%)</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {utilizationBreakdown.medium}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(utilizationBreakdown.medium / totalResources) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                    color="primary"
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">Low (&lt;70%)</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {utilizationBreakdown.low}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(utilizationBreakdown.low / totalResources) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                    color="warning"
                  />
                </Box>
              </Box>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  Allocation Overview
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {totalAllocations} active allocations across {allocatedResources} resources
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CapacityDashboard;
