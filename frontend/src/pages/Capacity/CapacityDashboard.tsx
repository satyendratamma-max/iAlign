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
  LinearProgress,
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
}

interface Team {
  id: number;
  name: string;
  type?: string;
  location?: string;
  totalMembers?: number;
  utilizationRate?: number;
  monthlyCost?: number;
}

const CapacityDashboard = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [resourcesRes, teamsRes] = await Promise.all([
          axios.get(`${API_URL}/resources`, config),
          axios.get(`${API_URL}/teams`, config),
        ]);

        setResources(resourcesRes.data.data);
        setTeams(teamsRes.data.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const totalResources = resources.length;
  const avgUtilization = resources.reduce((sum, r) => sum + (r.utilizationRate || 0), 0) / totalResources || 0;
  const totalTeams = teams.length;
  const totalMembers = teams.reduce((sum, t) => sum + (t.totalMembers || 0), 0);
  const totalMonthlyCost = teams.reduce((sum, t) => sum + (Number(t.monthlyCost) || 0), 0);
  const avgHourlyRate = resources.reduce((sum, r) => sum + (r.hourlyRate || 0), 0) / totalResources || 0;

  const utilizationBreakdown = {
    high: resources.filter(r => (r.utilizationRate || 0) >= 85).length,
    medium: resources.filter(r => (r.utilizationRate || 0) >= 70 && (r.utilizationRate || 0) < 85).length,
    low: resources.filter(r => (r.utilizationRate || 0) < 70).length,
  };

  const getUtilizationColor = (rate?: number) => {
    if (!rate) return 'default';
    if (rate >= 85) return 'success';
    if (rate >= 70) return 'primary';
    return 'warning';
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
      <Typography variant="h4" gutterBottom>
        Capacity Dashboard
      </Typography>
      <Typography color="text.secondary" mb={3}>
        Unified capacity planning with predictive analytics
      </Typography>

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
                    {totalMembers} team members
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
                    Across {totalTeams} teams
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
                  Team Overview
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {totalTeams} teams with {totalMembers} total members
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
