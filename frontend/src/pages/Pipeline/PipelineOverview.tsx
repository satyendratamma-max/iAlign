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
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  TrendingUp,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface Project {
  id: number;
  name: string;
  status: string;
  priority: string;
  progress: number;
  healthStatus?: string;
  type?: string;
}

const PipelineOverview = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/projects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProjects(response.data.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const activeProjects = projects.filter(p => p.status === 'In Progress');
  const completedProjects = projects.filter(p => p.status === 'Completed');
  const plannedProjects = projects.filter(p => p.status === 'Planning');
  const onHoldProjects = projects.filter(p => p.status === 'On Hold');

  const healthBreakdown = projects.reduce((acc: any, p) => {
    const health = p.healthStatus || 'Unknown';
    acc[health] = (acc[health] || 0) + 1;
    return acc;
  }, {});

  const avgProgress = projects.reduce((sum, p) => sum + p.progress, 0) / projects.length || 0;

  const getHealthColor = (health?: string) => {
    const colors: Record<string, 'success' | 'warning' | 'error'> = {
      'Green': 'success',
      'Yellow': 'warning',
      'Red': 'error',
    };
    return colors[health || ''] || 'default';
  };

  const healthIcons: Record<string, JSX.Element> = {
    Green: <CheckCircle />,
    Yellow: <Warning />,
    Red: <ErrorIcon />,
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Pipeline Overview
      </Typography>
      <Typography color="text.secondary" mb={3}>
        Multi-platform infrastructure and environment management
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Active Projects
              </Typography>
              <Typography variant="h4">{activeProjects.length}</Typography>
              <Chip label="In Progress" size="small" color="primary" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Completed
              </Typography>
              <Typography variant="h4">{completedProjects.length}</Typography>
              <Chip label="Done" size="small" color="success" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Planning
              </Typography>
              <Typography variant="h4">{plannedProjects.length}</Typography>
              <Chip label="Upcoming" size="small" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2">
                Average Progress
              </Typography>
              <Typography variant="h4">{Math.round(avgProgress)}%</Typography>
              <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                <TrendingUp fontSize="small" color="success" />
                <Typography variant="caption" color="success.main">
                  Overall health
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Project Pipeline */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Project Pipeline
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Project</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Progress</TableCell>
                      <TableCell>Health</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {projects.slice(0, 6).map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {project.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={project.status} size="small" />
                        </TableCell>
                        <TableCell>{project.type || '-'}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LinearProgress
                              variant="determinate"
                              value={project.progress}
                              sx={{ width: 80, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="caption">{project.progress}%</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={project.healthStatus || 'N/A'}
                            size="small"
                            color={getHealthColor(project.healthStatus) as any}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Health Status */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pipeline Health
              </Typography>
              <Box sx={{ mt: 2 }}>
                {Object.entries(healthBreakdown).map(([health, count]) => (
                  <Box
                    key={health}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                      p: 1.5,
                      borderRadius: 1,
                      bgcolor: 'background.default',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ color: `${getHealthColor(health)}.main` }}>
                        {healthIcons[health]}
                      </Box>
                      <Typography>{health}</Typography>
                    </Box>
                    <Chip
                      label={count}
                      size="small"
                      color={getHealthColor(health) as any}
                    />
                  </Box>
                ))}
              </Box>

              {onHoldProjects.length > 0 && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    ⚠️ {onHoldProjects.length} project(s) on hold
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Requires attention
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PipelineOverview;
