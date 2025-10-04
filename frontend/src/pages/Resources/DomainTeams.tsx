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
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, People as PeopleIcon } from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface Team {
  id: number;
  domainId: number;
  name: string;
  type?: string;
  leadId?: number;
  location?: string;
  totalMembers?: number;
  utilizationRate?: number;
  monthlyCost?: number;
  isActive: boolean;
}

interface Resource {
  id: number;
  employeeId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  location?: string;
  hourlyRate?: number;
  utilizationRate?: number;
}

const DomainTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<Partial<Team>>({});
  const [openResourcesDialog, setOpenResourcesDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamResources, setTeamResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/teams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeams(response.data.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleOpenDialog = (team?: Team) => {
    if (team) {
      setEditMode(true);
      setCurrentTeam(team);
    } else {
      setEditMode(false);
      setCurrentTeam({});
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentTeam({});
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editMode && currentTeam.id) {
        await axios.put(`${API_URL}/teams/${currentTeam.id}`, currentTeam, config);
      } else {
        await axios.post(`${API_URL}/teams`, currentTeam, config);
      }

      fetchTeams();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving team:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this team?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/teams/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchTeams();
      } catch (error) {
        console.error('Error deleting team:', error);
      }
    }
  };

  const handleViewResources = async (team: Team) => {
    setSelectedTeam(team);
    setOpenResourcesDialog(true);
    setLoadingResources(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/resources`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Filter resources by team ID
      const filteredResources = response.data.data.filter(
        (resource: any) => resource.domainTeamId === team.id
      );
      setTeamResources(filteredResources);
    } catch (error) {
      console.error('Error fetching team resources:', error);
    } finally {
      setLoadingResources(false);
    }
  };

  const handleCloseResourcesDialog = () => {
    setOpenResourcesDialog(false);
    setSelectedTeam(null);
    setTeamResources([]);
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getUtilizationColor = (rate?: number) => {
    if (!rate) return 'default';
    if (rate >= 85) return 'success';
    if (rate >= 70) return 'primary';
    if (rate >= 50) return 'warning';
    return 'error';
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Domain Teams
          </Typography>
          <Typography color="text.secondary">
            Domain-based resource organization and team management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Team
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Team Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Members</TableCell>
              <TableCell>Utilization</TableCell>
              <TableCell>Monthly Cost</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teams.map((team) => (
              <TableRow key={team.id}>
                <TableCell>
                  <Typography variant="body1" fontWeight="medium">
                    {team.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip label={team.type || 'N/A'} size="small" />
                </TableCell>
                <TableCell>{team.location || '-'}</TableCell>
                <TableCell>
                  <Chip label={team.totalMembers || 0} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={team.utilizationRate ? `${team.utilizationRate}%` : 'N/A'}
                    size="small"
                    color={getUtilizationColor(team.utilizationRate) as any}
                  />
                </TableCell>
                <TableCell>{formatCurrency(team.monthlyCost)}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleViewResources(team)}
                    title="View Resources"
                  >
                    <PeopleIcon />
                  </IconButton>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenDialog(team)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(team.id)}
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
        <DialogTitle>{editMode ? 'Edit Team' : 'Add Team'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Team Name"
                value={currentTeam.name || ''}
                onChange={(e) =>
                  setCurrentTeam({ ...currentTeam, name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Type"
                value={currentTeam.type || ''}
                onChange={(e) =>
                  setCurrentTeam({ ...currentTeam, type: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={currentTeam.location || ''}
                onChange={(e) =>
                  setCurrentTeam({ ...currentTeam, location: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Domain ID"
                type="number"
                value={currentTeam.domainId || ''}
                onChange={(e) =>
                  setCurrentTeam({
                    ...currentTeam,
                    domainId: parseInt(e.target.value) || 0,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Members"
                type="number"
                value={currentTeam.totalMembers || ''}
                onChange={(e) =>
                  setCurrentTeam({
                    ...currentTeam,
                    totalMembers: parseInt(e.target.value) || 0,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Utilization Rate (%)"
                type="number"
                value={currentTeam.utilizationRate || ''}
                onChange={(e) =>
                  setCurrentTeam({
                    ...currentTeam,
                    utilizationRate: parseFloat(e.target.value) || 0,
                  })
                }
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Monthly Cost"
                type="number"
                value={currentTeam.monthlyCost || ''}
                onChange={(e) =>
                  setCurrentTeam({
                    ...currentTeam,
                    monthlyCost: parseFloat(e.target.value) || 0,
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

      <Dialog
        open={openResourcesDialog}
        onClose={handleCloseResourcesDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {selectedTeam?.name} - Resources ({teamResources.length})
        </DialogTitle>
        <DialogContent>
          {loadingResources ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : teamResources.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <Typography color="text.secondary">
                No resources assigned to this team
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Hourly Rate</TableCell>
                    <TableCell>Utilization</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teamResources.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell>{resource.employeeId}</TableCell>
                      <TableCell>
                        {resource.firstName} {resource.lastName}
                      </TableCell>
                      <TableCell>{resource.email || '-'}</TableCell>
                      <TableCell>{resource.role || '-'}</TableCell>
                      <TableCell>{resource.location || '-'}</TableCell>
                      <TableCell>{formatCurrency(resource.hourlyRate)}</TableCell>
                      <TableCell>
                        <Chip
                          label={resource.utilizationRate ? `${resource.utilizationRate}%` : 'N/A'}
                          size="small"
                          color={getUtilizationColor(resource.utilizationRate) as any}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResourcesDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DomainTeams;
