import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  CircularProgress,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Business,
  AttachMoney,
  Add as AddIcon,
  Folder,
  Engineering,
  Link,
  Build,
  ShoppingCart,
  VerifiedUser,
  LocalShipping,
  CalendarMonth,
  Storefront,
  Support,
  Groups,
  AccountBalance,
  Cloud,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface Domain {
  id: number;
  name: string;
  type?: string;
  budget?: number;
  manager?: {
    firstName: string;
    lastName: string;
  };
}

interface Project {
  id: number;
  name: string;
  status: string;
  domainId?: number;
  budget?: number;
  portfolios?: Array<{
    domainId?: number;
  }>;
}

const DomainsList = () => {
  const navigate = useNavigate();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newDomain, setNewDomain] = useState({
    name: '',
    description: '',
  });

  const getDomainIcon = (domainName: string) => {
    const name = domainName.toLowerCase();
    const iconMap: { [key: string]: JSX.Element } = {
      engineering: <Engineering />,
      vc: <Link />,
      make: <Build />,
      buy: <ShoppingCart />,
      quality: <VerifiedUser />,
      logistics: <LocalShipping />,
      plan: <CalendarMonth />,
      sales: <Storefront />,
      service: <Support />,
      hr: <Groups />,
      finance: <AccountBalance />,
      infrastructure: <Cloud />,
    };

    return iconMap[name] || <Business />;
  };

  const getDomainColor = (domainName: string) => {
    const name = domainName.toLowerCase();
    const colorMap: { [key: string]: { bg: string; gradient: string; icon: string } } = {
      engineering: {
        bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        gradient: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        icon: '#667eea'
      },
      vc: {
        bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        gradient: 'linear-gradient(135deg, rgba(240, 147, 251, 0.1) 0%, rgba(245, 87, 108, 0.1) 100%)',
        icon: '#f093fb'
      },
      make: {
        bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        gradient: 'linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.1) 100%)',
        icon: '#4facfe'
      },
      buy: {
        bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        gradient: 'linear-gradient(135deg, rgba(67, 233, 123, 0.1) 0%, rgba(56, 249, 215, 0.1) 100%)',
        icon: '#43e97b'
      },
      quality: {
        bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        gradient: 'linear-gradient(135deg, rgba(250, 112, 154, 0.1) 0%, rgba(254, 225, 64, 0.1) 100%)',
        icon: '#fa709a'
      },
      logistics: {
        bg: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        gradient: 'linear-gradient(135deg, rgba(48, 207, 208, 0.1) 0%, rgba(51, 8, 103, 0.1) 100%)',
        icon: '#30cfd0'
      },
      plan: {
        bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        gradient: 'linear-gradient(135deg, rgba(168, 237, 234, 0.1) 0%, rgba(254, 214, 227, 0.1) 100%)',
        icon: '#5ed5d0'
      },
      sales: {
        bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        gradient: 'linear-gradient(135deg, rgba(255, 154, 158, 0.1) 0%, rgba(254, 207, 239, 0.1) 100%)',
        icon: '#ff9a9e'
      },
      service: {
        bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        gradient: 'linear-gradient(135deg, rgba(255, 236, 210, 0.1) 0%, rgba(252, 182, 159, 0.1) 100%)',
        icon: '#fcb69f'
      },
      hr: {
        bg: 'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
        gradient: 'linear-gradient(135deg, rgba(255, 110, 127, 0.1) 0%, rgba(191, 233, 255, 0.1) 100%)',
        icon: '#ff6e7f'
      },
      finance: {
        bg: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
        gradient: 'linear-gradient(135deg, rgba(224, 195, 252, 0.1) 0%, rgba(142, 197, 252, 0.1) 100%)',
        icon: '#8ec5fc'
      },
      infrastructure: {
        bg: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
        gradient: 'linear-gradient(135deg, rgba(251, 194, 235, 0.1) 0%, rgba(166, 193, 238, 0.1) 100%)',
        icon: '#a6c1ee'
      },
    };

    return colorMap[name] || {
      bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      gradient: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
      icon: '#667eea'
    };
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [domainsResponse, projectsResponse] = await Promise.all([
        axios.get(`${API_URL}/domains`, config),
        axios.get(`${API_URL}/projects`, config),
      ]);

      setDomains(domainsResponse.data.data);
      setProjects(projectsResponse.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDomainStats = (domainId: number) => {
    const domainProjects = projects.filter(
      (project) =>
        project.domainId === domainId ||
        project.portfolios?.some(p => p.domainId === domainId)
    );

    const activeProjects = domainProjects.filter(
      (project) => project.status === 'In Progress' || project.status === 'Planning'
    ).length;

    const totalBudget = domainProjects.reduce(
      (sum, project) => sum + (project.budget || 0),
      0
    );

    return { activeProjects, totalBudget };
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewDomain({ name: '', description: '' });
  };

  const handleSaveDomain = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(`${API_URL}/domains`, newDomain, config);
      fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error creating domain:', error);
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
        mb={{ xs: 3, sm: 4 }}
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
            Domain Portfolios
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Select a domain to view its portfolio, projects, and team capacity
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
          sx={{
            alignSelf: { xs: 'stretch', sm: 'auto' },
            whiteSpace: 'nowrap',
          }}
        >
          Add Domain
        </Button>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 2, md: 3 }}>
        {domains.map((domain) => {
          const stats = getDomainStats(domain.id);
          const icon = getDomainIcon(domain.name);
          const colors = getDomainColor(domain.name);
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={domain.id}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: colors.gradient,
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                    borderColor: colors.icon,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => navigate(`/domain/${domain.id}/portfolios`)}
                  sx={{ height: '100%' }}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                    <Box display="flex" alignItems="center" mb={2.5}>
                      <Box
                        sx={{
                          background: colors.bg,
                          color: 'white',
                          borderRadius: 3,
                          width: { xs: 56, sm: 60, md: 64 },
                          height: { xs: 56, sm: 60, md: 64 },
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          boxShadow: `0 8px 24px ${colors.icon}40`,
                          '& svg': {
                            fontSize: { xs: 28, sm: 30, md: 32 }
                          }
                        }}
                      >
                        {icon}
                      </Box>
                      <Box flex={1}>
                        <Typography
                          variant="h6"
                          sx={{
                            mb: 0,
                            fontWeight: 700,
                            fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                            lineHeight: 1.2,
                          }}
                        >
                          {domain.name}
                        </Typography>
                      </Box>
                    </Box>

                    <Box display="flex" gap={2} mt={2.5}>
                      <Box
                        flex={1}
                        sx={{
                          bgcolor: 'background.paper',
                          borderRadius: 2,
                          p: { xs: 1.5, sm: 1.5 },
                          border: '1px solid',
                          borderColor: 'divider',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: colors.icon,
                            bgcolor: `${colors.icon}10`,
                          }
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                          <Folder sx={{ fontSize: 18, color: colors.icon }} />
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              fontWeight: 600,
                              fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            }}
                          >
                            Projects
                          </Typography>
                        </Box>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 700,
                            color: 'text.primary',
                            fontSize: { xs: '1.25rem', sm: '1.5rem' },
                          }}
                        >
                          {stats.activeProjects}
                        </Typography>
                      </Box>
                      <Box
                        flex={1}
                        sx={{
                          bgcolor: 'background.paper',
                          borderRadius: 2,
                          p: { xs: 1.5, sm: 1.5 },
                          border: '1px solid',
                          borderColor: 'divider',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: '#10b981',
                            bgcolor: '#10b98110',
                          }
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                          <AttachMoney sx={{ fontSize: 18, color: '#10b981' }} />
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              fontWeight: 600,
                              fontSize: { xs: '0.7rem', sm: '0.75rem' },
                            }}
                          >
                            Budget
                          </Typography>
                        </Box>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 700,
                            color: 'text.primary',
                            fontSize: { xs: '1.25rem', sm: '1.5rem' },
                          }}
                        >
                          ${(stats.totalBudget / 1000000).toFixed(1)}M
                        </Typography>
                      </Box>
                    </Box>

                    {domain.manager && (
                      <Box
                        mt={2.5}
                        pt={2}
                        sx={{ borderTop: '1px solid', borderColor: 'divider' }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            fontSize: '0.7rem',
                          }}
                        >
                          Manager
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, mt: 0.5, color: 'text.primary' }}
                        >
                          {domain.manager.firstName} {domain.manager.lastName}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {domains.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            No domains found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click "Add Domain" to create a new domain
          </Typography>
        </Box>
      )}

      {/* Add Domain Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Domain</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Domain Name"
              value={newDomain.name}
              onChange={(e) => setNewDomain({ ...newDomain, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={newDomain.description}
              onChange={(e) => setNewDomain({ ...newDomain, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveDomain}
            variant="contained"
            disabled={!newDomain.name}
          >
            Add Domain
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DomainsList;
