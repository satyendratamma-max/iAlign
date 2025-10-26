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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import CompactFilterBar from '../../components/common/CompactFilterBar';
import FilterPresets from '../../components/common/FilterPresets';
import PageHeader from '../../components/common/PageHeader';
import { useAppSelector } from '../../hooks/redux';
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
  Hub,
} from '@mui/icons-material';
import axios from 'axios';
import { useScenario } from '../../contexts/ScenarioContext';
// Removed fetchAllPages import - using single request instead

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
  businessDecision?: string;
  segmentFunctionId?: number;
  segmentFunctionData?: {
    domainId?: number;
  };
}

interface DomainImpact {
  id: number;
  projectId: number;
  domainId: number;
  impactType: string;
  impactLevel: string;
}

interface DomainStats {
  domainId: number;
  domainName: string;
  totalProjects: number;
  activeProjects: number;
  totalBudget: number;
}

const DomainsList = () => {
  const navigate = useNavigate();
  const { selectedDomainIds, selectedBusinessDecisions } = useAppSelector((state) => state.filters);
  const { activeScenario } = useScenario();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [domainStats, setDomainStats] = useState<Map<number, DomainStats>>(new Map());
  const [projects, setProjects] = useState<Project[]>([]);
  const [domainImpacts, setDomainImpacts] = useState<DomainImpact[]>([]);
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

  const getDomainColor = () => {
    return {
      bg: 'primary.main',      // Theme-aware primary color
      icon: 'primary.main'      // Theme-aware primary color
    };
  };

  useEffect(() => {
    if (activeScenario) {
      fetchData();
    }
  }, [activeScenario]);

  const fetchData = async () => {
    if (!activeScenario?.id) {
      console.warn('No active scenario selected for DomainsList');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [domainsResponse, statsResponse, projectsResponse, impactsResponse] = await Promise.all([
        axios.get(`${API_URL}/domains`, config),
        // SERVER-SIDE STATS: Get accurate per-domain counts
        axios.get(`${API_URL}/domains/stats`, {
          ...config,
          params: { scenarioId: activeScenario.id }
        }),
        // Still fetch some projects for business decision filtering (limited)
        axios.get(`${API_URL}/projects`, {
          ...config,
          params: { scenarioId: activeScenario.id, limit: 500 }
        }),
        axios.get(`${API_URL}/project-domain-impacts`, config),
      ]);

      setDomains(domainsResponse.data.data);

      // Convert stats array to Map for O(1) lookup
      const statsMap = new Map<number, DomainStats>();
      (statsResponse.data.data || []).forEach((stat: DomainStats) => {
        statsMap.set(stat.domainId, stat);
      });
      setDomainStats(statsMap);

      setProjects(projectsResponse.data.data || []);
      setDomainImpacts(impactsResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDomainStatsForDisplay = (domainId: number) => {
    // Get server-calculated stats (accurate counts regardless of dataset size)
    const stats = domainStats.get(domainId);

    if (!stats) {
      return { activeProjects: 0, totalProjects: 0, totalBudget: 0, impactingCount: 0, impactedCount: 0 };
    }

    // For cross-domain impacts, still use client-side calculation (needs project IDs)
    // This is approximate for large datasets but acceptable since it's supplementary info
    const domainProjects = projects.filter(p => p.domainId === domainId);
    const domainProjectIds = domainProjects.map(p => p.id);

    const impactingOtherDomains = new Set(
      domainImpacts
        .filter(impact => domainProjectIds.includes(impact.projectId))
        .map(impact => impact.projectId)
    );
    const impactingCount = impactingOtherDomains.size;

    const impactedByOtherDomains = domainImpacts.filter(
      impact => impact.domainId === domainId
    );
    const impactedCount = impactedByOtherDomains.length;

    return {
      activeProjects: stats.activeProjects,
      totalProjects: stats.totalProjects,
      totalBudget: stats.totalBudget,
      impactingCount,
      impactedCount
    };
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

  // Get unique business decisions from projects
  const uniqueBusinessDecisions = Array.from(
    new Set(projects.map((p) => p.businessDecision).filter(Boolean))
  ) as string[];

  const filteredDomains = domains.filter((domain) => {
    // Get projects for this domain (only direct domainId match)
    const domainProjects = projects.filter(
      (project) => project.domainId === domain.id
    );

    // Check if any project matches the business decision filter
    const matchesBusinessDecision =
      selectedBusinessDecisions.length === 0 ||
      domainProjects.some((project) =>
        selectedBusinessDecisions.includes(project.businessDecision || '')
      );

    return (
      (selectedDomainIds.length === 0 || selectedDomainIds.includes(domain.id)) &&
      matchesBusinessDecision
    );
  });

  return (
    <Box>
      <PageHeader
        title="Domains"
        subtitle="Select a domain to view its segment functions, projects, and team capacity"
        icon={<Business sx={{ fontSize: 32 }} />}
        compact
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            size="small"
            sx={{
              px: 3,
              fontWeight: 600,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
              },
            }}
          >
            Add Domain
          </Button>
        }
      />

      <CompactFilterBar
        domains={domains}
        businessDecisions={uniqueBusinessDecisions}
        extraActions={<FilterPresets />}
      />

      <Grid container spacing={{ xs: 2, sm: 2, md: 3 }}>
        {filteredDomains.map((domain) => {
          const stats = getDomainStatsForDisplay(domain.id);
          const icon = getDomainIcon(domain.name);
          const colors = getDomainColor();
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={domain.id}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backgroundColor: 'background.paper',
                  border: '2px solid',
                  borderColor: 'transparent',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: (theme) => `0 20px 40px ${theme.palette.primary.main}30`,
                    borderColor: 'primary.main',
                  },
                }}
              >
                <CardActionArea
                  onClick={() => navigate(`/domain/${domain.id}/segment-functions`)}
                  sx={{ height: '100%' }}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                    <Box display="flex" alignItems="center" mb={2.5}>
                      <Box
                        sx={{
                          backgroundColor: colors.bg,
                          color: 'primary.contrastText',
                          borderRadius: 3,
                          width: { xs: 56, sm: 60, md: 64 },
                          height: { xs: 56, sm: 60, md: 64 },
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          boxShadow: (theme) => `0 8px 20px ${theme.palette.primary.main}35`,
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

                    <Box display="flex" flexDirection="column" gap={2} mt={2.5}>
                      <Box display="flex" gap={2}>
                        <Box
                          flex={1}
                          sx={{
                            bgcolor: 'background.default',
                            borderRadius: 2,
                            p: { xs: 1.5, sm: 1.5 },
                            border: '1px solid',
                            borderColor: 'divider',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: 'primary.main',
                              bgcolor: (theme) => theme.palette.mode === 'dark'
                                ? 'rgba(25, 118, 210, 0.08)'
                                : 'primary.lighter',
                            }
                          }}
                        >
                          <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                            <Folder sx={{ fontSize: 18, color: 'primary.main' }} />
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
                            {stats.totalProjects}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {stats.activeProjects} active
                          </Typography>
                        </Box>
                        <Box
                          flex={1}
                          sx={{
                            bgcolor: 'background.default',
                            borderRadius: 2,
                            p: { xs: 1.5, sm: 1.5 },
                            border: '1px solid',
                            borderColor: 'divider',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: 'primary.main',
                              bgcolor: (theme) => theme.palette.mode === 'dark'
                                ? 'rgba(25, 118, 210, 0.08)'
                                : 'primary.lighter',
                            }
                          }}
                        >
                          <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                            <AttachMoney sx={{ fontSize: 18, color: 'primary.main' }} />
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
                      {(stats.impactingCount > 0 || stats.impactedCount > 0) && (
                        <Box display="flex" gap={2}>
                          {stats.impactingCount > 0 && (
                            <Box
                              flex={1}
                              sx={{
                                bgcolor: 'info.lighter',
                                borderRadius: 2,
                                p: { xs: 1.5, sm: 1.5 },
                                border: '1px solid',
                                borderColor: 'info.light',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  borderColor: 'info.main',
                                  bgcolor: (theme) => theme.palette.mode === 'dark'
                                    ? 'rgba(2, 136, 209, 0.12)'
                                    : 'info.lighter',
                                }
                              }}
                            >
                              <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                                <Hub sx={{ fontSize: 18, color: 'info.main' }} />
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: 'text.secondary',
                                    fontWeight: 600,
                                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                  }}
                                >
                                  Impacting Others
                                </Typography>
                              </Box>
                              <Typography
                                variant="h5"
                                sx={{
                                  fontWeight: 700,
                                  color: 'info.main',
                                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                                }}
                              >
                                {stats.impactingCount}
                              </Typography>
                            </Box>
                          )}
                          {stats.impactedCount > 0 && (
                            <Box
                              flex={1}
                              sx={{
                                bgcolor: 'warning.lighter',
                                borderRadius: 2,
                                p: { xs: 1.5, sm: 1.5 },
                                border: '1px solid',
                                borderColor: 'warning.light',
                                transition: 'all 0.2s',
                                '&:hover': {
                                  borderColor: 'warning.main',
                                  bgcolor: (theme) => theme.palette.mode === 'dark'
                                    ? 'rgba(255, 167, 38, 0.12)'
                                    : 'warning.lighter',
                                }
                              }}
                            >
                              <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                                <Hub sx={{ fontSize: 18, color: 'warning.main' }} />
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: 'text.secondary',
                                    fontWeight: 600,
                                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                  }}
                                >
                                  Impacted By Others
                                </Typography>
                              </Box>
                              <Typography
                                variant="h5"
                                sx={{
                                  fontWeight: 700,
                                  color: 'warning.main',
                                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                                }}
                              >
                                {stats.impactedCount}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}
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

      {filteredDomains.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            No domains found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {domains.length === 0 ? 'Click "Add Domain" to create a new domain' : 'Try adjusting your filters'}
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
