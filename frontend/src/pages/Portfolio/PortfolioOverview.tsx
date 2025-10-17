import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  Tooltip,
  Divider,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, FolderOpen } from '@mui/icons-material';
import SharedFilters from '../../components/common/SharedFilters';
import PageHeader from '../../components/common/PageHeader';
import ActionBar from '../../components/common/ActionBar';
import FilterPanel from '../../components/common/FilterPanel';
import { useAppSelector } from '../../hooks/redux';
import { useScenario } from '../../contexts/ScenarioContext';
import ConfirmDialog from '../../components/common/ConfirmDialog';
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
  managerId?: number;
  isActive: boolean;
  domain?: {
    id: number;
    name: string;
  };
}

interface Domain {
  id: number;
  name: string;
}

interface Project {
  id: number;
  segmentFunctionId?: number;
  budget?: number;
  forecastedCost?: number;
  actualCost?: number;
}

interface ProjectRiskScore {
  projectId: number;
  projectName: string;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
}

interface RiskDistribution {
  lowRisk: number;
  mediumRisk: number;
  highRisk: number;
  totalProjects: number;
}

interface RiskBreakdown {
  budgetRisk: number;
  scheduleRisk: number;
  resourceRisk: number;
  dependencyRisk: number;
  complexityRisk: number;
  totalScore: number;
  maxRisk: number;
  distribution: RiskDistribution;
  projectRisks: ProjectRiskScore[];
  projectsNeedingAttention: number;
  details: {
    budgetRisk: string;
    scheduleRisk: string;
    resourceRisk: string;
    dependencyRisk: string;
    complexityRisk: string;
  };
}

const PortfolioOverview = () => {
  const { selectedDomainIds, selectedBusinessDecisions } = useAppSelector((state) => state.filters);
  const { activeScenario } = useScenario();
  const [segmentFunctions, setSegmentFunctions] = useState<SegmentFunction[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSegmentFunction, setCurrentSegmentFunction] = useState<Partial<SegmentFunction>>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    segmentFunctionId: number | null;
  }>({ open: false, segmentFunctionId: null });
  const [riskBreakdowns, setRiskBreakdowns] = useState<Record<number, RiskBreakdown>>({});

  const fetchData = async () => {
    if (!activeScenario?.id) {
      console.warn('No active scenario selected for PortfolioOverview');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const scenarioParam = `?scenarioId=${activeScenario.id}`;

      const [segmentFunctionsRes, domainsRes, projectsRes] = await Promise.all([
        axios.get(`${API_URL}/segment-functions`, config),
        axios.get(`${API_URL}/domains`, config),
        axios.get(`${API_URL}/projects${scenarioParam}`, config),
      ]);

      const segmentFunctionsData = segmentFunctionsRes.data.data;
      setSegmentFunctions(segmentFunctionsData);
      setDomains(domainsRes.data.data);
      setProjects(projectsRes.data.data);

      // Fetch risk breakdowns for all segment functions
      fetchRiskBreakdowns(segmentFunctionsData, activeScenario.id, token, config);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRiskBreakdowns = async (
    segmentFunctions: SegmentFunction[],
    scenarioId: number,
    token: string | null,
    config: { headers: { Authorization: string } }
  ) => {
    try {
      const riskPromises = segmentFunctions.map(async (sf) => {
        try {
          const response = await axios.get(
            `${API_URL}/segment-functions/${sf.id}/risk?scenarioId=${scenarioId}`,
            config
          );
          return { id: sf.id, breakdown: response.data.data };
        } catch (error) {
          console.error(`Error fetching risk for segment function ${sf.id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(riskPromises);
      const breakdownsMap: Record<number, RiskBreakdown> = {};

      results.forEach((result) => {
        if (result) {
          breakdownsMap[result.id] = result.breakdown;
        }
      });

      setRiskBreakdowns(breakdownsMap);
    } catch (error) {
      console.error('Error fetching risk breakdowns:', error);
    }
  };

  useEffect(() => {
    if (activeScenario) {
      fetchData();
    }
  }, [activeScenario]);

  const handleOpenDialog = (segmentFunction?: SegmentFunction) => {
    if (segmentFunction) {
      setEditMode(true);
      setCurrentSegmentFunction(segmentFunction);
    } else {
      setEditMode(false);
      setCurrentSegmentFunction({});
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentSegmentFunction({});
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editMode && currentSegmentFunction.id) {
        await axios.put(`${API_URL}/segment-functions/${currentSegmentFunction.id}`, currentSegmentFunction, config);
      } else {
        await axios.post(`${API_URL}/segment-functions`, currentSegmentFunction, config);
      }

      fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error handling segment function:', error);
    }
  };

  const handleDelete = (id: number) => {
    setConfirmDialog({ open: true, segmentFunctionId: id });
  };

  const confirmDelete = async () => {
    if (confirmDialog.segmentFunctionId) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/segment-functions/${confirmDialog.segmentFunctionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchData();
      } catch (error) {
        console.error('Error handling segment function:', error);
      }
    }
    setConfirmDialog({ open: false, segmentFunctionId: null });
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const calculateTotalValue = (segmentFunctionId: number) => {
    const segmentProjects = projects.filter(
      (project) => project.segmentFunctionId === segmentFunctionId
    );

    return segmentProjects.reduce(
      (sum, project) => sum + (project.budget || project.forecastedCost || project.actualCost || 0),
      0
    );
  };

  const renderRiskTooltip = (breakdown: RiskBreakdown) => {
    return (
      <Box sx={{ p: 1, maxWidth: 400 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Risk Score Analysis
        </Typography>
        <Divider sx={{ mb: 1.5 }} />

        {/* Maximum Risk Score - Headline */}
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Maximum Risk:
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color:
            breakdown.maxRisk < 30 ? 'success.main' :
            breakdown.maxRisk < 60 ? 'warning.main' : 'error.main'
          }}>
            {breakdown.maxRisk}/100
          </Typography>
        </Box>

        {/* Risk Distribution */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            Project Distribution:
          </Typography>
          <Box sx={{ pl: 1 }}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary">
                Low Risk (0-30):
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'success.main' }}>
                {breakdown.distribution.lowRisk} projects
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary">
                Medium Risk (31-60):
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'warning.main' }}>
                {breakdown.distribution.mediumRisk} projects
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary">
                High Risk (61-100):
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'error.main' }}>
                {breakdown.distribution.highRisk} projects
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Projects Needing Attention */}
        {breakdown.projectsNeedingAttention > 0 && (
          <Box sx={{ mb: 2, p: 1, bgcolor: 'warning.lighter', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'warning.dark' }}>
              ⚠️ {breakdown.projectsNeedingAttention} {breakdown.projectsNeedingAttention === 1 ? 'project needs' : 'projects need'} attention
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 1.5 }} />

        {/* Aggregate Breakdown for Context */}
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
          Aggregate Risk Factors:
        </Typography>

        <Box sx={{ mb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography variant="caption" color="text.secondary">
              Budget Risk:
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {breakdown.budgetRisk}/25
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem', mb: 0.5 }}>
            {breakdown.details.budgetRisk}
          </Typography>
        </Box>

        <Box sx={{ mb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography variant="caption" color="text.secondary">
              Schedule Risk:
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {breakdown.scheduleRisk}/25
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem', mb: 0.5 }}>
            {breakdown.details.scheduleRisk}
          </Typography>
        </Box>

        <Box sx={{ mb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography variant="caption" color="text.secondary">
              Resource Risk:
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {breakdown.resourceRisk}/20
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem', mb: 0.5 }}>
            {breakdown.details.resourceRisk}
          </Typography>
        </Box>

        <Box sx={{ mb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography variant="caption" color="text.secondary">
              Dependency Risk:
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {breakdown.dependencyRisk}/15
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem', mb: 0.5 }}>
            {breakdown.details.dependencyRisk}
          </Typography>
        </Box>

        <Box sx={{ mb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography variant="caption" color="text.secondary">
              Complexity Risk:
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {breakdown.complexityRisk}/15
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem', mb: 0.5 }}>
            {breakdown.details.complexityRisk}
          </Typography>
        </Box>

        <Divider sx={{ my: 1 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            Aggregate Score:
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {breakdown.totalScore}/100
          </Typography>
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const filteredSegmentFunctions = segmentFunctions.filter((sf) => {
    return (
      (selectedDomainIds.length === 0 || selectedDomainIds.includes(sf.domainId || 0)) &&
      (selectedBusinessDecisions.length === 0)
    );
  });

  return (
    <Box>
      <PageHeader
        title="Portfolio Overview"
        subtitle="Strategic oversight and governance of enterprise IT initiatives"
        icon={<FolderOpen sx={{ fontSize: 32 }} />}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
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
            Add Segment Function
          </Button>
        }
      />

      <FilterPanel title="Filter Segment Functions" defaultExpanded={false}>
        <SharedFilters />
      </FilterPanel>

      <TableContainer component={Paper} sx={{ boxShadow: 2, borderRadius: 1.5 }}>
        <Table>
          <TableHead sx={{ backgroundColor: (theme) => theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.grey[900] }}>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Domain</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Total Value</TableCell>
              <TableCell>ROI Index</TableCell>
              <TableCell>Risk Score</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSegmentFunctions.map((segmentFunction) => (
              <TableRow key={segmentFunction.id}>
                <TableCell>
                  <Typography variant="body1" fontWeight="medium">
                    {segmentFunction.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {segmentFunction.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  {segmentFunction.domain?.name || '-'}
                </TableCell>
                <TableCell>
                  <Chip label={segmentFunction.type || 'N/A'} size="small" />
                </TableCell>
                <TableCell>{formatCurrency(calculateTotalValue(segmentFunction.id))}</TableCell>
                <TableCell>{segmentFunction.roiIndex ? `${segmentFunction.roiIndex}%` : '-'}</TableCell>
                <TableCell>
                  {riskBreakdowns[segmentFunction.id] ? (
                    <Tooltip
                      title={renderRiskTooltip(riskBreakdowns[segmentFunction.id])}
                      placement="left"
                      arrow
                      componentsProps={{
                        tooltip: {
                          sx: {
                            bgcolor: 'background.paper',
                            border: 1,
                            borderColor: 'divider',
                            boxShadow: 3,
                            '& .MuiTooltip-arrow': {
                              color: 'background.paper',
                              '&::before': {
                                border: 1,
                                borderColor: 'divider',
                              },
                            },
                          },
                        },
                      }}
                    >
                      <Chip
                        label={riskBreakdowns[segmentFunction.id].maxRisk}
                        size="small"
                        color={
                          riskBreakdowns[segmentFunction.id].maxRisk < 30
                            ? 'success'
                            : riskBreakdowns[segmentFunction.id].maxRisk < 60
                            ? 'warning'
                            : 'error'
                        }
                        sx={{ cursor: 'help' }}
                      />
                    </Tooltip>
                  ) : (
                    <Chip
                      label={segmentFunction.riskScore || 'N/A'}
                      size="small"
                      color={
                        !segmentFunction.riskScore
                          ? 'default'
                          : segmentFunction.riskScore < 30
                          ? 'success'
                          : segmentFunction.riskScore < 60
                          ? 'warning'
                          : 'error'
                      }
                    />
                  )}
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenDialog(segmentFunction)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(segmentFunction.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Edit Segment Function' : 'Add Segment Function'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={currentSegmentFunction.name || ''}
                onChange={(e) =>
                  setCurrentSegmentFunction({ ...currentSegmentFunction, name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={currentSegmentFunction.description || ''}
                onChange={(e) =>
                  setCurrentSegmentFunction({ ...currentSegmentFunction, description: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Domain"
                value={currentSegmentFunction.domainId || ''}
                onChange={(e) =>
                  setCurrentSegmentFunction({ ...currentSegmentFunction, domainId: e.target.value ? Number(e.target.value) : undefined })
                }
              >
                <MenuItem value="">None</MenuItem>
                {domains.map((domain) => (
                  <MenuItem key={domain.id} value={domain.id}>
                    {domain.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Type"
                value={currentSegmentFunction.type || ''}
                onChange={(e) =>
                  setCurrentSegmentFunction({ ...currentSegmentFunction, type: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ROI Index (%)"
                type="number"
                value={currentSegmentFunction.roiIndex || ''}
                onChange={(e) =>
                  setCurrentSegmentFunction({
                    ...currentSegmentFunction,
                    roiIndex: parseFloat(e.target.value),
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Risk Score"
                type="number"
                value={currentSegmentFunction.riskScore || ''}
                onChange={(e) =>
                  setCurrentSegmentFunction({
                    ...currentSegmentFunction,
                    riskScore: parseInt(e.target.value),
                  })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title="Delete Segment Function"
        message="Are you sure you want to delete this segment function? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDialog({ open: false, segmentFunctionId: null })}
        confirmText="Delete"
        confirmColor="error"
      />
    </Box>
  );
};

export default PortfolioOverview;
