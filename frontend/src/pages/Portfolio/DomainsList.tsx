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
  TrendingUp,
  People,
  AttachMoney,
  Add as AddIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface Domain {
  id: number;
  name: string;
  type?: string;
  location?: string;
  manager?: {
    firstName: string;
    lastName: string;
  };
}

const DomainsList = () => {
  const navigate = useNavigate();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newDomain, setNewDomain] = useState({
    name: '',
    description: '',
    location: '',
  });

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.get(`${API_URL}/domains`, config);
      setDomains(response.data.data);
    } catch (error) {
      console.error('Error fetching domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewDomain({ name: '', description: '', location: '' });
  };

  const handleSaveDomain = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(`${API_URL}/domains`, newDomain, config);
      fetchDomains();
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Domain Portfolios
          </Typography>
          <Typography color="text.secondary">
            Select a domain to view its portfolio, projects, and team capacity
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add Domain
        </Button>
      </Box>

      <Grid container spacing={3}>
        {domains.map((domain) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={domain.id}>
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
                onClick={() => navigate(`/domain/${domain.id}/portfolios`)}
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
                      <Business />
                    </Box>
                    <Box>
                      <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                        {domain.name}
                      </Typography>
                      {domain.location && (
                        <Typography variant="caption" color="text.secondary">
                          {domain.location}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {domain.manager && (
                    <Box mt={2}>
                      <Typography variant="caption" color="text.secondary">
                        Manager
                      </Typography>
                      <Typography variant="body2">
                        {domain.manager.firstName} {domain.manager.lastName}
                      </Typography>
                    </Box>
                  )}

                  <Box mt={2}>
                    <Chip
                      label="View Portfolio"
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
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
            <TextField
              fullWidth
              label="Location"
              value={newDomain.location}
              onChange={(e) => setNewDomain({ ...newDomain, location: e.target.value })}
              margin="normal"
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
