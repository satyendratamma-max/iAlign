import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Chip,
} from '@mui/material';
import {
  Folder,
  Add as AddIcon,
  ArrowBack,
  Hub,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface SegmentFunction {
  id: number;
  domainId?: number;
  name: string;
  description?: string;
  type?: string;
  totalValue?: number;
  roiIndex?: number;
  riskScore?: number;
}

interface Project {
  id: number;
  name: string;
  segmentFunctionId?: number;
}

interface DomainImpact {
  id: number;
  projectId: number;
  domainId: number;
  project?: Project;
}

interface Domain {
  id: number;
  name: string;
  description?: string;
}

const PortfolioList = () => {
  const { domainId } = useParams<{ domainId: string }>();
  const navigate = useNavigate();
  const [segmentFunctions, setSegmentFunctions] = useState<SegmentFunction[]>([]);
  const [domain, setDomain] = useState<Domain | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [domainImpacts, setDomainImpacts] = useState<DomainImpact[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newSegmentFunction, setNewSegmentFunction] = useState({
    name: '',
    description: '',
    type: '',
  });

  useEffect(() => {
    fetchData();
  }, [domainId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [domainRes, segmentFunctionsRes, projectsRes, impactsRes] = await Promise.all([
        axios.get(`${API_URL}/domains/${domainId}`, config),
        axios.get(`${API_URL}/segment-functions`, config),
        axios.get(`${API_URL}/projects`, config),
        axios.get(`${API_URL}/project-domain-impacts?domainId=${domainId}`, config),
      ]);

      setDomain(domainRes.data.data);
      // Filter segmentFunctions by domainId
      const domainPortfolios = segmentFunctionsRes.data.data.filter(
        (p: SegmentFunction) => p.domainId === parseInt(domainId!)
      );
      setSegmentFunctions(domainPortfolios);
      setProjects(projectsRes.data.data);
      setDomainImpacts(impactsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewSegmentFunction({ name: '', description: '', type: '' });
  };

  const handleSaveSegmentFunction = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(
        `${API_URL}/segment-functions`,
        { ...newSegmentFunction, domainId: parseInt(domainId!) },
        config
      );
      fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error handling segment function:', error);
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getCrossDomainStats = (segmentFunctionId: number) => {
    // Get projects in this segment function
    const sfProjects = projects.filter(p => p.segmentFunctionId === segmentFunctionId);
    const sfProjectIds = sfProjects.map(p => p.id);

    // Count how many unique projects from this segment function impact other domains (outgoing)
    const impactingProjects = new Set(
      domainImpacts
        .filter(impact => sfProjectIds.includes(impact.projectId))
        .map(impact => impact.projectId)
    );
    const impactingCount = impactingProjects.size;

    // Count how many times this segment function's domain is impacted by other projects (incoming)
    const impactedCount = domainImpacts.filter(
      impact => impact.domainId === parseInt(domainId!)
    ).length;

    return { impactingCount, impactedCount };
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/domains')}
            sx={{ mb: 2 }}
          >
            Back to Domains
          </Button>
          <Typography variant="h4" gutterBottom>
            {domain?.name} Segment Functions
          </Typography>
          <Typography color="text.secondary">
            {domain?.description || 'View and manage segmentFunctions for this domain'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add Segment Function
        </Button>
      </Box>

      <Grid container spacing={3}>
        {segmentFunctions.map((segmentFunction) => (
          <Grid item xs={12} sm={6} md={4} key={segmentFunction.id}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardActionArea
                onClick={() => navigate(`/segment-function/${segmentFunction.id}/projects`)}
                sx={{ height: '100%' }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Box
                      sx={{
                        backgroundColor: 'primary.main',
                        color: 'white',
                        borderRadius: '50%',
                        width: 48,
                        height: 48,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                      }}
                    >
                      <Folder />
                    </Box>
                    <Box flex={1}>
                      <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                        {segmentFunction.name}
                      </Typography>
                      {segmentFunction.type && (
                        <Chip label={segmentFunction.type} size="small" sx={{ mt: 0.5 }} />
                      )}
                    </Box>
                  </Box>

                  {segmentFunction.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {segmentFunction.description}
                    </Typography>
                  )}

                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary">
                      Total Value
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(segmentFunction.totalValue)}
                    </Typography>
                  </Box>

                  {segmentFunction.roiIndex !== undefined && (
                    <Box mt={1}>
                      <Typography variant="caption" color="text.secondary">
                        ROI Index
                      </Typography>
                      <Typography variant="body1">
                        {segmentFunction.roiIndex}%
                      </Typography>
                    </Box>
                  )}

                  {(() => {
                    const crossDomainStats = getCrossDomainStats(segmentFunction.id);
                    return (crossDomainStats.impactingCount > 0 || crossDomainStats.impactedCount > 0) ? (
                      <Box mt={2} display="flex" gap={1.5}>
                        {crossDomainStats.impactingCount > 0 && (
                          <Box
                            flex={1}
                            sx={{
                              bgcolor: 'info.lighter',
                              borderRadius: 1.5,
                              p: 1.5,
                              border: '1px solid',
                              borderColor: 'info.light',
                            }}
                          >
                            <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                              <Hub sx={{ fontSize: 16, color: 'info.main' }} />
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'text.secondary',
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                }}
                              >
                                Impacting
                              </Typography>
                            </Box>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                color: 'info.main',
                              }}
                            >
                              {crossDomainStats.impactingCount}
                            </Typography>
                          </Box>
                        )}
                        {crossDomainStats.impactedCount > 0 && (
                          <Box
                            flex={1}
                            sx={{
                              bgcolor: 'warning.lighter',
                              borderRadius: 1.5,
                              p: 1.5,
                              border: '1px solid',
                              borderColor: 'warning.light',
                            }}
                          >
                            <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                              <Hub sx={{ fontSize: 16, color: 'warning.main' }} />
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'text.secondary',
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                }}
                              >
                                Impacted
                              </Typography>
                            </Box>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                color: 'warning.main',
                              }}
                            >
                              {crossDomainStats.impactedCount}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    ) : null;
                  })()}
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {segmentFunctions.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            No segmentFunctions found for this domain
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click "Add Segment Function" to create one
          </Typography>
        </Box>
      )}

      {/* Add Segment Function Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Segment Function</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Segment Function Name"
              value={newSegmentFunction.name}
              onChange={(e) => setNewSegmentFunction({ ...newSegmentFunction, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={newSegmentFunction.description}
              onChange={(e) => setNewSegmentFunction({ ...newSegmentFunction, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              label="Type"
              value={newSegmentFunction.type}
              onChange={(e) => setNewSegmentFunction({ ...newSegmentFunction, type: e.target.value })}
              margin="normal"
              placeholder="e.g., Strategic, Operational, Tactical"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveSegmentFunction}
            variant="contained"
            disabled={!newSegmentFunction.name}
          >
            Add Segment Function
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PortfolioList;
