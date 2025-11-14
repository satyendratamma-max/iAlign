import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  LinearProgress,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  PersonAdd as PersonAddIcon,
  Psychology as SuggestIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import axios from 'axios';
import CapabilityBuilder from '../CapabilityBuilder';
import ConfirmDialog from '../common/ConfirmDialog';
import QuickAllocationDialog from '../QuickAllocationDialog';
import { useScenario } from '../../contexts/ScenarioContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface Requirement {
  id: number;
  projectId: number;
  appId: number;
  technologyId: number;
  roleId: number;
  requiredCount: number;
  fulfilledCount: number;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  minYearsExp?: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  startDate?: string;
  endDate?: string;
  description?: string;
  isFulfilled: boolean;
  app?: { id: number; name: string; code: string };
  technology?: { id: number; name: string; code: string };
  role?: { id: number; name: string; code: string; level: string };
}

interface Project {
  id: number;
  name: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

interface EnhancedRequirementsTabProps {
  projectId: number;
  project: Project | null;
}

// Predefined requirement templates
const REQUIREMENT_TEMPLATES = {
  'Web Development Team': [
    { role: 'Frontend Developer', app: 'React', tech: 'TypeScript', count: 3, level: 'Advanced', priority: 'High' },
    { role: 'Backend Developer', app: 'Node.js', tech: 'JavaScript', count: 2, level: 'Expert', priority: 'High' },
    { role: 'UI/UX Designer', app: 'Figma', tech: 'UI Design', count: 1, level: 'Intermediate', priority: 'Medium' },
    { role: 'QA Engineer', app: 'Selenium', tech: 'Testing', count: 2, level: 'Intermediate', priority: 'Medium' },
  ],
  'Data Migration Team': [
    { role: 'Data Engineer', app: 'Python', tech: 'ETL', count: 2, level: 'Expert', priority: 'Critical' },
    { role: 'Database Administrator', app: 'SQL Server', tech: 'SQL', count: 1, level: 'Expert', priority: 'Critical' },
    { role: 'Data Analyst', app: 'Power BI', tech: 'Analytics', count: 1, level: 'Advanced', priority: 'Medium' },
  ],
  'SAP Implementation': [
    { role: 'SAP Consultant', app: 'SAP', tech: 'ABAP', count: 3, level: 'Expert', priority: 'Critical' },
    { role: 'SAP Basis', app: 'SAP', tech: 'Basis', count: 1, level: 'Expert', priority: 'High' },
    { role: 'SAP Functional', app: 'SAP', tech: 'FI/CO', count: 2, level: 'Advanced', priority: 'High' },
  ],
  'DevOps Team': [
    { role: 'DevOps Engineer', app: 'Jenkins', tech: 'CI/CD', count: 2, level: 'Expert', priority: 'High' },
    { role: 'Cloud Architect', app: 'AWS', tech: 'Cloud', count: 1, level: 'Expert', priority: 'Critical' },
    { role: 'Site Reliability Engineer', app: 'Kubernetes', tech: 'Container', count: 1, level: 'Advanced', priority: 'High' },
  ],
};

const EnhancedRequirementsTab = ({ projectId, project }: EnhancedRequirementsTabProps) => {
  const navigate = useNavigate();
  const { currentScenario } = useScenario();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentRequirement, setCurrentRequirement] = useState<Partial<Requirement>>({
    proficiencyLevel: 'Intermediate',
    priority: 'Medium',
    requiredCount: 1,
  });
  const [templateMenuAnchor, setTemplateMenuAnchor] = useState<null | HTMLElement>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    requirementId: number | null;
  }>({ open: false, requirementId: null });
  const [openAllocationDialog, setOpenAllocationDialog] = useState(false);
  const [selectedRequirementForAllocation, setSelectedRequirementForAllocation] = useState<Requirement | null>(null);

  useEffect(() => {
    fetchRequirements();
  }, [projectId]);

  const fetchRequirements = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/project-requirements/project/${projectId}`, config);
      setRequirements(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch requirements');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (requirement?: Requirement) => {
    if (requirement) {
      setEditMode(true);
      setCurrentRequirement(requirement);
    } else {
      setEditMode(false);
      setCurrentRequirement({
        projectId: projectId,
        proficiencyLevel: 'Intermediate',
        priority: 'Medium',
        requiredCount: 1,
        startDate: project?.startDate,
        endDate: project?.endDate,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentRequirement({
      proficiencyLevel: 'Intermediate',
      priority: 'Medium',
      requiredCount: 1,
    });
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editMode && currentRequirement.id) {
        await axios.put(
          `${API_URL}/project-requirements/${currentRequirement.id}`,
          currentRequirement,
          config
        );
        setSuccessMessage('Requirement updated successfully');
      } else {
        await axios.post(`${API_URL}/project-requirements`, currentRequirement, config);
        setSuccessMessage('Requirement added successfully');
      }

      fetchRequirements();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save requirement');
    }
  };

  const handleDelete = (id: number) => {
    setConfirmDialog({ open: true, requirementId: id });
  };

  const confirmDelete = async () => {
    if (confirmDialog.requirementId) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/project-requirements/${confirmDialog.requirementId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccessMessage('Requirement deleted successfully');
        fetchRequirements();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete requirement');
      }
    }
    setConfirmDialog({ open: false, requirementId: null });
  };

  const handleApplyTemplate = async (templateName: string) => {
    setTemplateMenuAnchor(null);
    // Note: This is a simplified version - you'd need to map template data to actual IDs
    setSuccessMessage(`Template "${templateName}" applied. Please review and adjust IDs.`);
  };

  const handleFindAndAllocate = (requirement: Requirement) => {
    // Store the requirement and open Quick Allocation dialog
    setSelectedRequirementForAllocation(requirement);
    setOpenAllocationDialog(true);
  };

  const handleAllocationSaved = async () => {
    setOpenAllocationDialog(false);
    setSelectedRequirementForAllocation(null);
    // Refresh requirements to update fulfilled counts
    await fetchRequirements();
  };

  const handleSuggestResources = (requirement: Requirement) => {
    // Navigate to allocation with AI suggestions
    navigate(`/resources/allocation?projectId=${projectId}&requirementId=${requirement.id}&suggest=true`);
  };

  const handleAddDefaultRequirements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Default requirement specs - we'll match to actual roles in the system
      const defaultSpecs = [
        { keywords: ['manager', 'project manager', 'portfolio manager', 'program manager'], proficiency: 'Expert', priority: 'High' },
        { keywords: ['analyst', 'business analyst', 'functional analyst', 'systems analyst'], proficiency: 'Advanced', priority: 'High' },
        { keywords: ['developer', 'programmer', 'engineer'], proficiency: 'Advanced', priority: 'High' },
        { keywords: ['tester', 'qa', 'quality assurance', 'test engineer'], proficiency: 'Intermediate', priority: 'Medium' },
        { keywords: ['architect', 'technical lead', 'lead developer'], proficiency: 'Expert', priority: 'High' },
      ];

      // Fetch all roles, apps, and technologies to find matching IDs
      const [rolesRes, appsRes, techsRes] = await Promise.all([
        axios.get(`${API_URL}/roles`, config),
        axios.get(`${API_URL}/apps`, config),
        axios.get(`${API_URL}/technologies`, config),
      ]);

      const roles = rolesRes.data.data || [];
      const apps = appsRes.data.data || [];
      const techs = techsRes.data.data || [];

      if (apps.length === 0 || techs.length === 0) {
        setError('No apps or technologies found. Please ensure master data exists.');
        return;
      }

      // Match default specs to actual roles in the system
      const requirementsToCreate = [];
      const usedRoles = new Set<number>(); // Track roles we've already used

      for (const spec of defaultSpecs) {
        // Try to find a role that matches any of the keywords
        const role = roles.find((r: any) => {
          if (usedRoles.has(r.id)) return false; // Skip already used roles
          const roleName = r.name?.toLowerCase() || '';
          return spec.keywords.some(keyword => roleName.includes(keyword.toLowerCase()));
        });

        if (!role) {
          continue; // Skip if no matching role found
        }

        usedRoles.add(role.id); // Mark this role as used

        // Find compatible app and tech for this role
        let compatibleApp = apps[0]; // Start with first app
        let compatibleTech = techs[0]; // Start with first tech

        // If role is specific to an app, use that app
        if (role.appId) {
          compatibleApp = apps.find((a: any) => a.id === role.appId);
          if (!compatibleApp) {
            continue; // Skip this role if required app not found
          }
        }

        // If role is specific to a technology, use that technology
        if (role.technologyId) {
          compatibleTech = techs.find((t: any) => t.id === role.technologyId);
          if (!compatibleTech) {
            continue; // Skip this role if required tech not found
          }
        }

        // If tech is specific to an app, ensure app matches
        if (compatibleTech.appId && compatibleTech.appId !== compatibleApp.id) {
          // Find a tech that's compatible with the role's app
          const alternativeTech = techs.find((t: any) =>
            !t.appId || t.appId === compatibleApp.id
          );
          if (alternativeTech) {
            compatibleTech = alternativeTech;
          } else {
            continue; // Skip this role if no compatible combination found
          }
        }

        requirementsToCreate.push({
          projectId: projectId,
          appId: compatibleApp.id,
          technologyId: compatibleTech.id,
          roleId: role.id,
          requiredCount: 1,
          proficiencyLevel: spec.proficiency,
          priority: spec.priority,
          startDate: project?.startDate,
          endDate: project?.endDate,
          description: `Default requirement for ${role.name}`,
        });
      }

      // Check if we found any roles to create
      if (requirementsToCreate.length === 0) {
        const availableRoleNames = roles.map((r: any) => r.name).slice(0, 15).join(', ');
        setError(
          `Could not find suitable roles matching: Manager, Analyst, Developer, Tester, or Architect. ` +
          `Available roles include: ${availableRoleNames}${roles.length > 15 ? ', and more...' : ''}. ` +
          `Please use 'Add Requirement' to manually select from available roles.`
        );
        return;
      }

      // Log what we're about to create for debugging
      console.log('Creating requirements:', requirementsToCreate);

      // Create all requirements if all roles exist
      const results = await Promise.allSettled(
        requirementsToCreate.map(req =>
          axios.post(`${API_URL}/project-requirements`, req, config)
        )
      );

      // Check for any failures
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        console.error('Failed to create some requirements:', failures);
        const firstError = failures[0] as PromiseRejectedResult;
        const errorMsg = (firstError.reason?.response?.data?.message || firstError.reason?.message || 'Unknown error');
        setError(`Failed to create ${failures.length} requirement(s): ${errorMsg}`);

        // Still show success for the ones that worked
        const successes = results.filter(r => r.status === 'fulfilled').length;
        if (successes > 0) {
          setSuccessMessage(`Added ${successes} of ${requirementsToCreate.length} requirements`);
        }
      } else {
        setSuccessMessage(`Added ${requirementsToCreate.length} default requirements successfully`);
      }

      fetchRequirements();
    } catch (err: any) {
      console.error('Error in handleAddDefaultRequirements:', err);
      setError(err.response?.data?.message || err.message || 'Failed to add default requirements');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = requirements.length;
    const fulfilled = requirements.filter(r => r.isFulfilled).length;
    const critical = requirements.filter(r => r.priority === 'Critical' && !r.isFulfilled).length;
    const totalNeeded = requirements.reduce((sum, r) => sum + r.requiredCount, 0);
    const totalFulfilled = requirements.reduce((sum, r) => sum + r.fulfilledCount, 0);

    return { total, fulfilled, critical, totalNeeded, totalFulfilled };
  }, [requirements]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'error';
      case 'High': return 'warning';
      case 'Medium': return 'info';
      case 'Low': return 'default';
      default: return 'default';
    }
  };

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'Expert': return 'success';
      case 'Advanced': return 'info';
      case 'Intermediate': return 'primary';
      case 'Beginner': return 'default';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="caption">
                Total Requirements
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: stats.fulfilled === stats.total && stats.total > 0 ? 'success.lighter' : 'inherit' }}>
            <CardContent>
              <Typography color="text.secondary" variant="caption">
                Fulfilled
              </Typography>
              <Typography variant="h4" color={stats.fulfilled === stats.total && stats.total > 0 ? 'success.main' : 'inherit'}>
                {stats.fulfilled} / {stats.total}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.total > 0 ? Math.round((stats.fulfilled / stats.total) * 100) : 0}% complete
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: stats.critical > 0 ? 'error.lighter' : 'inherit' }}>
            <CardContent>
              <Typography color="text.secondary" variant="caption">
                Critical Unfulfilled
              </Typography>
              <Typography variant="h4" color={stats.critical > 0 ? 'error.main' : 'inherit'}>
                {stats.critical}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="caption">
                Resources Needed
              </Typography>
              <Typography variant="h4">{stats.totalFulfilled} / {stats.totalNeeded}</Typography>
              <LinearProgress
                variant="determinate"
                value={stats.totalNeeded > 0 ? (stats.totalFulfilled / stats.totalNeeded) * 100 : 0}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Requirements</Typography>
        <Box display="flex" gap={1}>
          <Button
            size="small"
            startIcon={<CopyIcon />}
            onClick={() => setTemplateMenuAnchor(document.getElementById('template-btn'))}
            id="template-btn"
          >
            Template
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={handleAddDefaultRequirements}
            disabled={loading}
          >
            Add Default Requirements
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Requirement
          </Button>
        </Box>
      </Box>

      {/* Template Menu */}
      <Menu
        anchorEl={templateMenuAnchor}
        open={Boolean(templateMenuAnchor)}
        onClose={() => setTemplateMenuAnchor(null)}
      >
        {Object.keys(REQUIREMENT_TEMPLATES).map((templateName) => (
          <MenuItem key={templateName} onClick={() => handleApplyTemplate(templateName)}>
            <ListItemIcon>
              <CopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{templateName}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Success Snackbar */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {/* Requirements Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="5%">Status</TableCell>
              <TableCell width="25%">Capability</TableCell>
              <TableCell width="10%">Level</TableCell>
              <TableCell width="10%">Progress</TableCell>
              <TableCell width="8%">Priority</TableCell>
              <TableCell width="15%">Timeline</TableCell>
              <TableCell width="27%" align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requirements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box py={4}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      No requirements defined yet
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenDialog()}
                      sx={{ mt: 2 }}
                    >
                      Add Your First Requirement
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              requirements.map((req) => {
                const progress = req.requiredCount > 0 ? (req.fulfilledCount / req.requiredCount) * 100 : 0;
                const needsAttention = !req.isFulfilled && req.priority === 'Critical';

                return (
                  <TableRow
                    key={req.id}
                    hover
                    sx={{ bgcolor: needsAttention ? 'error.lighter' : 'inherit' }}
                  >
                    <TableCell>
                      {req.isFulfilled ? (
                        <Tooltip title="Fulfilled">
                          <CheckCircleIcon color="success" />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Needs resources">
                          <WarningIcon color="warning" />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {req.app?.code}/{req.technology?.code}/{req.role?.code}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {req.role?.name}
                          {req.minYearsExp && ` • ${req.minYearsExp}+ yrs exp`}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={req.proficiencyLevel}
                        size="small"
                        color={getProficiencyColor(req.proficiencyLevel) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {req.fulfilledCount} / {req.requiredCount}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          color={progress === 100 ? 'success' : 'primary'}
                          sx={{ mt: 0.5, height: 6, borderRadius: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {Math.round(progress)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={req.priority}
                        size="small"
                        color={getPriorityColor(req.priority) as any}
                      />
                    </TableCell>
                    <TableCell>
                      {req.startDate && req.endDate ? (
                        <Typography variant="caption">
                          {new Date(req.startDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })} -{' '}
                          {new Date(req.endDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" gap={0.5} justifyContent="flex-end">
                        {!req.isFulfilled && (
                          <>
                            <Tooltip title="Find & allocate matching resources">
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                startIcon={<PersonAddIcon />}
                                onClick={() => handleFindAndAllocate(req)}
                              >
                                Allocate
                              </Button>
                            </Tooltip>
                            <Tooltip title="Get AI suggestions for best-fit resources">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleSuggestResources(req)}
                              >
                                <SuggestIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(req)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(req.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Alerts for Critical Requirements */}
      {stats.critical > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="body2" fontWeight="medium">
            {stats.critical} critical requirement(s) need immediate attention!
          </Typography>
          <Typography variant="caption">
            These are high-priority requirements that must be fulfilled to keep the project on track.
          </Typography>
        </Alert>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editMode ? 'Edit Requirement' : 'Add Requirement'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Required Capability
              </Typography>
              <CapabilityBuilder
                value={{
                  appId: currentRequirement.appId || 0,
                  technologyId: currentRequirement.technologyId || 0,
                  roleId: currentRequirement.roleId || 0,
                  proficiencyLevel: 'Intermediate',
                  isPrimary: true,
                }}
                onChange={(capability) => {
                  setCurrentRequirement({
                    ...currentRequirement,
                    appId: capability.appId,
                    technologyId: capability.technologyId,
                    roleId: capability.roleId,
                  });
                }}
                showPrimary={false}
                showProficiencyLevel={false}
                showYearsOfExperience={false}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Proficiency Level"
                value={currentRequirement.proficiencyLevel || 'Intermediate'}
                onChange={(e) =>
                  setCurrentRequirement({
                    ...currentRequirement,
                    proficiencyLevel: e.target.value as any,
                  })
                }
              >
                <MenuItem value="Beginner">Beginner</MenuItem>
                <MenuItem value="Intermediate">Intermediate</MenuItem>
                <MenuItem value="Advanced">Advanced</MenuItem>
                <MenuItem value="Expert">Expert</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Min Years Experience"
                value={currentRequirement.minYearsExp ?? ''}
                onChange={(e) =>
                  setCurrentRequirement({
                    ...currentRequirement,
                    minYearsExp: e.target.value === '' ? undefined : parseInt(e.target.value),
                  })
                }
                inputProps={{ min: 0, max: 50 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Required Count"
                value={currentRequirement.requiredCount || 1}
                onChange={(e) =>
                  setCurrentRequirement({
                    ...currentRequirement,
                    requiredCount: parseInt(e.target.value) || 1,
                  })
                }
                inputProps={{ min: 1 }}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Priority"
                value={currentRequirement.priority || 'Medium'}
                onChange={(e) =>
                  setCurrentRequirement({
                    ...currentRequirement,
                    priority: e.target.value as any,
                  })
                }
                required
              >
                <MenuItem value="Critical">Critical</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={currentRequirement.startDate?.split('T')[0] || ''}
                onChange={(e) =>
                  setCurrentRequirement({
                    ...currentRequirement,
                    startDate: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={currentRequirement.endDate?.split('T')[0] || ''}
                onChange={(e) =>
                  setCurrentRequirement({
                    ...currentRequirement,
                    endDate: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={currentRequirement.description || ''}
                onChange={(e) =>
                  setCurrentRequirement({
                    ...currentRequirement,
                    description: e.target.value,
                  })
                }
                placeholder="Additional details about this requirement..."
                sx={{
                  '& .MuiInputBase-root': {
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'background.paper',
                  },
                  '& .MuiInputBase-input': {
                    color: 'text.primary',
                  },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={
              !currentRequirement.appId ||
              !currentRequirement.technologyId ||
              !currentRequirement.roleId ||
              !currentRequirement.requiredCount
            }
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title="Delete Requirement"
        message="Are you sure you want to delete this requirement? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDialog({ open: false, requirementId: null })}
        confirmText="Delete"
        confirmColor="error"
      />

      {/* Quick Allocation Dialog */}
      <QuickAllocationDialog
        open={openAllocationDialog}
        onClose={() => {
          setOpenAllocationDialog(false);
          setSelectedRequirementForAllocation(null);
        }}
        onSave={handleAllocationSaved}
        resource={null}
        project={project}
        scenarioId={currentScenario?.id || 0}
        allocation={null}
        requirement={selectedRequirementForAllocation}
      />
    </Box>
  );
};

export default EnhancedRequirementsTab;
