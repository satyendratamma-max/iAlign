import { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  Folder,
  AttachMoney,
  TrendingDown,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface DashboardMetrics {
  totalProjects: number;
  activeProjects: number;
  totalBudget: number;
  totalActualCost: number;
  budgetVariance: number;
  averageProgress: number;
  statusBreakdown: Record<string, number>;
  healthBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
}

interface PortfolioStats {
  totalPortfolios: number;
  totalValue: number;
  averageROI: number;
  averageRisk: number;
}

const Dashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };

        const [projectMetrics, portfolioData] = await Promise.all([
          axios.get(`${API_URL}/projects/dashboard/metrics`, config),
          axios.get(`${API_URL}/portfolios/stats`, config),
        ]);

        setMetrics(projectMetrics.data.data);
        setPortfolioStats(portfolioData.data.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const mainMetrics = [
    {
      title: 'Total Portfolio Value',
      value: portfolioStats ? formatCurrency(portfolioStats.totalValue) : '$0',
      icon: <TrendingUp />,
      subtitle: `${portfolioStats?.totalPortfolios || 0} portfolios`,
      color: 'primary.main',
    },
    {
      title: 'Active Projects',
      value: metrics?.activeProjects || 0,
      icon: <Folder />,
      subtitle: `${metrics?.totalProjects || 0} total projects`,
      color: 'info.main',
    },
    {
      title: 'Total Budget',
      value: metrics ? formatCurrency(metrics.totalBudget) : '$0',
      icon: <AttachMoney />,
      subtitle: `${metrics?.averageProgress || 0}% avg progress`,
      color: 'success.main',
    },
    {
      title: 'Budget Variance',
      value: metrics ? formatCurrency(metrics.budgetVariance) : '$0',
      icon: metrics && metrics.budgetVariance >= 0 ? <TrendingUp /> : <TrendingDown />,
      subtitle: `${portfolioStats ? portfolioStats.averageROI.toFixed(1) : 0}% avg ROI`,
      color: metrics && metrics.budgetVariance >= 0 ? 'success.main' : 'error.main',
    },
  ];

  const healthColors: Record<string, string> = {
    Green: 'success',
    Yellow: 'warning',
    Red: 'error',
  };

  const healthIcons: Record<string, JSX.Element> = {
    Green: <CheckCircle />,
    Yellow: <Warning />,
    Red: <ErrorIcon />,
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Executive Dashboard
      </Typography>

      {/* Main Metrics */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {mainMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      {metric.title}
                    </Typography>
                    <Typography variant="h4" component="div">
                      {metric.value}
                    </Typography>
                    <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                      {metric.subtitle}
                    </Typography>
                  </Box>
                  <Box sx={{ color: metric.color }}>{metric.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Project Status & Health */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Project Status
              </Typography>
              <Box sx={{ mt: 2 }}>
                {metrics &&
                  Object.entries(metrics.statusBreakdown).map(([status, count]) => (
                    <Box
                      key={status}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography>{status}</Typography>
                      <Chip label={count} size="small" />
                    </Box>
                  ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Project Health
              </Typography>
              <Box sx={{ mt: 2 }}>
                {metrics &&
                  Object.entries(metrics.healthBreakdown).map(([health, count]) => (
                    <Box
                      key={health}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ color: `${healthColors[health]}.main` }}>
                          {healthIcons[health]}
                        </Box>
                        <Typography>{health}</Typography>
                      </Box>
                      <Chip
                        label={count}
                        size="small"
                        color={healthColors[health] as any}
                      />
                    </Box>
                  ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
