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
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
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

const PortfolioOverview = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPortfolio, setCurrentPortfolio] = useState<Partial<Portfolio>>({});

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [portfoliosRes, domainsRes] = await Promise.all([
        axios.get(`${API_URL}/portfolios`, config),
        axios.get(`${API_URL}/domains`, config),
      ]);

      setPortfolios(portfoliosRes.data.data);
      setDomains(domainsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDialog = (portfolio?: Portfolio) => {
    if (portfolio) {
      setEditMode(true);
      setCurrentPortfolio(portfolio);
    } else {
      setEditMode(false);
      setCurrentPortfolio({});
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentPortfolio({});
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editMode && currentPortfolio.id) {
        await axios.put(`${API_URL}/portfolios/${currentPortfolio.id}`, currentPortfolio, config);
      } else {
        await axios.post(`${API_URL}/portfolios`, currentPortfolio, config);
      }

      fetchData();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving portfolio:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this portfolio?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/portfolios/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchData();
      } catch (error) {
        console.error('Error deleting portfolio:', error);
      }
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Portfolio Overview
          </Typography>
          <Typography color="text.secondary">
            Strategic oversight and governance of enterprise IT initiatives
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Portfolio
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
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
            {portfolios.map((portfolio) => (
              <TableRow key={portfolio.id}>
                <TableCell>
                  <Typography variant="body1" fontWeight="medium">
                    {portfolio.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {portfolio.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  {portfolio.domain?.name || '-'}
                </TableCell>
                <TableCell>
                  <Chip label={portfolio.type || 'N/A'} size="small" />
                </TableCell>
                <TableCell>{formatCurrency(portfolio.totalValue)}</TableCell>
                <TableCell>{portfolio.roiIndex ? `${portfolio.roiIndex}%` : '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={portfolio.riskScore || 'N/A'}
                    size="small"
                    color={
                      !portfolio.riskScore
                        ? 'default'
                        : portfolio.riskScore < 30
                        ? 'success'
                        : portfolio.riskScore < 60
                        ? 'warning'
                        : 'error'
                    }
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenDialog(portfolio)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(portfolio.id)}
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
        <DialogTitle>{editMode ? 'Edit Portfolio' : 'Add Portfolio'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={currentPortfolio.name || ''}
                onChange={(e) =>
                  setCurrentPortfolio({ ...currentPortfolio, name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={currentPortfolio.description || ''}
                onChange={(e) =>
                  setCurrentPortfolio({ ...currentPortfolio, description: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Domain"
                value={currentPortfolio.domainId || ''}
                onChange={(e) =>
                  setCurrentPortfolio({ ...currentPortfolio, domainId: e.target.value as number })
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
                value={currentPortfolio.type || ''}
                onChange={(e) =>
                  setCurrentPortfolio({ ...currentPortfolio, type: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Value"
                type="number"
                value={currentPortfolio.totalValue || ''}
                onChange={(e) =>
                  setCurrentPortfolio({
                    ...currentPortfolio,
                    totalValue: parseFloat(e.target.value),
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ROI Index (%)"
                type="number"
                value={currentPortfolio.roiIndex || ''}
                onChange={(e) =>
                  setCurrentPortfolio({
                    ...currentPortfolio,
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
                value={currentPortfolio.riskScore || ''}
                onChange={(e) =>
                  setCurrentPortfolio({
                    ...currentPortfolio,
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
    </Box>
  );
};

export default PortfolioOverview;
