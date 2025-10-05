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

const PortfolioOverview = () => {
  const [segmentFunctions, setSegmentFunctions] = useState<SegmentFunction[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSegmentFunction, setCurrentSegmentFunction] = useState<Partial<SegmentFunction>>({});

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [segmentFunctionsRes, domainsRes] = await Promise.all([
        axios.get(`${API_URL}/segment-functions`, config),
        axios.get(`${API_URL}/domains`, config),
      ]);

      setSegmentFunctions(segmentFunctionsRes.data.data);
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

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this segment function?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/segment-functions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchData();
      } catch (error) {
        console.error('Error handling segment function:', error);
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
          Add Segment Function
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
            {segmentFunctions.map((segmentFunction) => (
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
                <TableCell>{formatCurrency(segmentFunction.totalValue)}</TableCell>
                <TableCell>{segmentFunction.roiIndex ? `${segmentFunction.roiIndex}%` : '-'}</TableCell>
                <TableCell>
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
                  setCurrentSegmentFunction({ ...currentSegmentFunction, domainId: e.target.value as number })
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
                label="Total Value"
                type="number"
                value={currentSegmentFunction.totalValue || ''}
                onChange={(e) =>
                  setCurrentSegmentFunction({
                    ...currentSegmentFunction,
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
    </Box>
  );
};

export default PortfolioOverview;
