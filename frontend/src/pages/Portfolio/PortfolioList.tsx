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
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface Portfolio {
  id: number;
  domainId?: number;
  name: string;
  description?: string;
  type?: string;
  totalValue?: number;
  roiIndex?: number;
  riskScore?: number;
}

interface Domain {
  id: number;
  name: string;
  description?: string;
}

const PortfolioList = () => {
  const { domainId } = useParams<{ domainId: string }>();
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [domain, setDomain] = useState<Domain | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newPortfolio, setNewPortfolio] = useState({
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

      const [domainRes, portfoliosRes] = await Promise.all([
        axios.get(`${API_URL}/domains/${domainId}`, config),
        axios.get(`${API_URL}/portfolios`, config),
      ]);

      setDomain(domainRes.data.data);
      // Filter portfolios by domainId
      const domainPortfolios = portfoliosRes.data.data.filter(
        (p: Portfolio) => p.domainId === parseInt(domainId!)
      );
      setPortfolios(domainPortfolios);
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
    setNewPortfolio({ name: '', description: '', type: '' });
  };

  const handleSavePortfolio = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(
        `${API_URL}/portfolios`,
        { ...newPortfolio, domainId: parseInt(domainId!) },
        config
      );
      fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error creating portfolio:', error);
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
            {domain?.name} Portfolios
          </Typography>
          <Typography color="text.secondary">
            {domain?.description || 'View and manage portfolios for this domain'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add Portfolio
        </Button>
      </Box>

      <Grid container spacing={3}>
        {portfolios.map((portfolio) => (
          <Grid item xs={12} sm={6} md={4} key={portfolio.id}>
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
                onClick={() => navigate(`/portfolio/${portfolio.id}/projects`)}
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
                        {portfolio.name}
                      </Typography>
                      {portfolio.type && (
                        <Chip label={portfolio.type} size="small" sx={{ mt: 0.5 }} />
                      )}
                    </Box>
                  </Box>

                  {portfolio.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {portfolio.description}
                    </Typography>
                  )}

                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary">
                      Total Value
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(portfolio.totalValue)}
                    </Typography>
                  </Box>

                  {portfolio.roiIndex !== undefined && (
                    <Box mt={1}>
                      <Typography variant="caption" color="text.secondary">
                        ROI Index
                      </Typography>
                      <Typography variant="body1">
                        {portfolio.roiIndex}%
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {portfolios.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary">
            No portfolios found for this domain
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click "Add Portfolio" to create one
          </Typography>
        </Box>
      )}

      {/* Add Portfolio Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Portfolio</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Portfolio Name"
              value={newPortfolio.name}
              onChange={(e) => setNewPortfolio({ ...newPortfolio, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={newPortfolio.description}
              onChange={(e) => setNewPortfolio({ ...newPortfolio, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              label="Type"
              value={newPortfolio.type}
              onChange={(e) => setNewPortfolio({ ...newPortfolio, type: e.target.value })}
              margin="normal"
              placeholder="e.g., Strategic, Operational, Tactical"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSavePortfolio}
            variant="contained"
            disabled={!newPortfolio.name}
          >
            Add Portfolio
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PortfolioList;
