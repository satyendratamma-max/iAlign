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
  TextField,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Download as DownloadIcon,
  People,
  PersonAdd,
  Login,
} from '@mui/icons-material';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

const Reports = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    role: '',
    status: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.get(`${API_URL}/users`, config);
      setUsers(response.data.data || []);
    } catch (error: any) {
      setError('Error fetching users: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (filter.role && user.role !== filter.role) return false;
    if (filter.status === 'active' && !user.isActive) return false;
    if (filter.status === 'inactive' && user.isActive) return false;
    return true;
  });

  const metrics = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.isActive).length,
    inactiveUsers: users.filter((u) => !u.isActive).length,
    recentLogins: users.filter(
      (u) =>
        u.lastLoginAt &&
        new Date(u.lastLoginAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length,
  };

  const roleBreakdown = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleExport = () => {
    const exportData = filteredUsers.map((user) => ({
      Username: user.username,
      'First Name': user.firstName || '',
      'Last Name': user.lastName || '',
      Email: user.email,
      Role: user.role,
      Status: user.isActive ? 'Active' : 'Inactive',
      'Last Login': user.lastLoginAt
        ? new Date(user.lastLoginAt).toLocaleString()
        : 'Never',
      'Account Created': new Date(user.createdAt).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'User Report');

    ws['!cols'] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 15 },
      { wch: 10 },
      { wch: 20 },
      { wch: 15 },
    ];

    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `user_report_${date}.xlsx`);
  };

  const formatLastLogin = (lastLoginAt?: string) => {
    if (!lastLoginAt) return 'Never';
    const date = new Date(lastLoginAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Administrator':
        return 'error';
      case 'Manager':
        return 'warning';
      case 'User':
        return 'primary';
      case 'Viewer':
        return 'default';
      default:
        return 'default';
    }
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
            User Activity Report
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Monitor user activity, roles, and access patterns
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
        >
          Export Report
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Metrics Cards */}
      <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Card
            sx={{
              height: '100%',
              borderLeft: 4,
              borderColor: 'primary.main',
              '&:hover': {
                boxShadow: 6,
                transform: 'translateY(-2px)',
                transition: 'all 0.3s ease',
              },
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    fontWeight: 600,
                    color: 'text.secondary',
                  }}
                >
                  Total Users
                </Typography>
                <Box
                  sx={{
                    bgcolor: 'primary.lighter',
                    color: 'primary.main',
                    borderRadius: 2,
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <People sx={{ fontSize: 28 }} />
                </Box>
              </Box>
              <Typography variant="h3" fontWeight="bold" color="text.primary">
                {metrics.totalUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card
            sx={{
              height: '100%',
              borderLeft: 4,
              borderColor: 'success.main',
              '&:hover': {
                boxShadow: 6,
                transform: 'translateY(-2px)',
                transition: 'all 0.3s ease',
              },
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    fontWeight: 600,
                    color: 'text.secondary',
                  }}
                >
                  Active Users
                </Typography>
                <Box
                  sx={{
                    bgcolor: 'success.lighter',
                    color: 'success.main',
                    borderRadius: 2,
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PersonAdd sx={{ fontSize: 28 }} />
                </Box>
              </Box>
              <Typography variant="h3" fontWeight="bold" color="text.primary">
                {metrics.activeUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card
            sx={{
              height: '100%',
              borderLeft: 4,
              borderColor: 'warning.main',
              '&:hover': {
                boxShadow: 6,
                transform: 'translateY(-2px)',
                transition: 'all 0.3s ease',
              },
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    fontWeight: 600,
                    color: 'text.secondary',
                  }}
                >
                  Inactive Users
                </Typography>
                <Box
                  sx={{
                    bgcolor: 'warning.lighter',
                    color: 'warning.main',
                    borderRadius: 2,
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <People sx={{ fontSize: 28 }} />
                </Box>
              </Box>
              <Typography variant="h3" fontWeight="bold" color="text.primary">
                {metrics.inactiveUsers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card
            sx={{
              height: '100%',
              borderLeft: 4,
              borderColor: 'info.main',
              '&:hover': {
                boxShadow: 6,
                transform: 'translateY(-2px)',
                transition: 'all 0.3s ease',
              },
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    fontWeight: 600,
                    color: 'text.secondary',
                  }}
                >
                  Recent Logins (7d)
                </Typography>
                <Box
                  sx={{
                    bgcolor: 'info.lighter',
                    color: 'info.main',
                    borderRadius: 2,
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Login sx={{ fontSize: 28 }} />
                </Box>
              </Box>
              <Typography variant="h3" fontWeight="bold" color="text.primary">
                {metrics.recentLogins}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Role Breakdown */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            User Distribution by Role
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {Object.entries(roleBreakdown).map(([role, count]) => (
              <Grid item xs={6} sm={3} key={role}>
                <Box textAlign="center">
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    {count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {role}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Filters */}
      <Box
        display="flex"
        gap={2}
        mb={3}
        flexDirection={{ xs: 'column', sm: 'row' }}
      >
        <TextField
          select
          label="Filter by Role"
          value={filter.role}
          onChange={(e) => setFilter({ ...filter, role: e.target.value })}
          sx={{ minWidth: 200 }}
          size="small"
        >
          <MenuItem value="">All Roles</MenuItem>
          <MenuItem value="Administrator">Administrator</MenuItem>
          <MenuItem value="Manager">Manager</MenuItem>
          <MenuItem value="User">User</MenuItem>
          <MenuItem value="Viewer">Viewer</MenuItem>
        </TextField>
        <TextField
          select
          label="Filter by Status"
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          sx={{ minWidth: 200 }}
          size="small"
        >
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </TextField>
      </Box>

      {/* User Activity Table */}
      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: { xs: 800, md: 1000 } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 120 }}>Username</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Name</TableCell>
              <TableCell sx={{ minWidth: 180 }}>Email</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Role</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Status</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Last Login</TableCell>
              <TableCell sx={{ minWidth: 140 }}>Account Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {user.username}
                  </Typography>
                </TableCell>
                <TableCell>
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    color={getRoleColor(user.role)}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.isActive ? 'Active' : 'Inactive'}
                    color={user.isActive ? 'success' : 'default'}
                    size="small"
                    variant={user.isActive ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    color={
                      user.lastLoginAt &&
                      new Date(user.lastLoginAt) >
                        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                        ? 'success.main'
                        : 'text.secondary'
                    }
                  >
                    {formatLastLogin(user.lastLoginAt)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredUsers.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            No users found matching the filters
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Reports;
