import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { ProjectDependency } from '../../services/dependencyService';

interface Project {
  id: number;
  projectNumber?: string;
  name: string;
}

interface Milestone {
  id: number;
  name: string;
  milestoneDate?: Date;
  endDate?: Date;
  projectId: number;
}

interface DependencyManagerDialogProps {
  open: boolean;
  onClose: () => void;
  dependencies: ProjectDependency[];
  projects: Project[];
  milestones: Milestone[];
  onDelete: (id: number) => void;
  onAddNew: () => void;
}

const DependencyManagerDialog: React.FC<DependencyManagerDialogProps> = ({
  open,
  onClose,
  dependencies,
  projects,
  milestones,
  onDelete,
  onAddNew,
}) => {
  const getEntityLabel = (type: 'project' | 'milestone', id: number, point: 'start' | 'end') => {
    if (type === 'project') {
      const project = projects.find((p) => p.id === id);
      if (!project) return `Unknown Project (${id})`;
      return `${project.projectNumber} - ${project.name} (${point})`;
    } else {
      const milestone = milestones.find((m) => m.id === id);
      if (!milestone) return `Unknown Milestone (${id})`;
      const project = projects.find((p) => p.id === milestone.projectId);
      return `${milestone.name} - ${project?.projectNumber || 'Unknown'} (${point})`;
    }
  };

  const getDependencyTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      FS: '#1976d2',
      SS: '#388e3c',
      FF: '#f57c00',
      SF: '#d32f2f',
    };
    return colors[type] || '#757575';
  };

  const getDependencyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      FS: 'Finish → Start',
      SS: 'Start → Start',
      FF: 'Finish → Finish',
      SF: 'Start → Finish',
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Manage Dependencies</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={onAddNew} size="small">
            Add New Dependency
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        {dependencies.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No dependencies found. Click "Add New Dependency" to create one.
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Predecessor</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Successor</TableCell>
                  <TableCell align="center">Lag (Days)</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dependencies.map((dep) => (
                  <TableRow key={dep.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {getEntityLabel(dep.predecessorType, dep.predecessorId, dep.predecessorPoint)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dep.predecessorType === 'project' ? 'Project' : 'Milestone'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getDependencyTypeLabel(dep.dependencyType)}
                        size="small"
                        sx={{
                          bgcolor: getDependencyTypeColor(dep.dependencyType),
                          color: 'white',
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getEntityLabel(dep.successorType, dep.successorId, dep.successorPoint)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dep.successorType === 'project' ? 'Project' : 'Milestone'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={dep.lagDays === 0 ? '0' : dep.lagDays > 0 ? `+${dep.lagDays}` : dep.lagDays}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontWeight: 500,
                          color: dep.lagDays > 0 ? '#f57c00' : dep.lagDays < 0 ? '#388e3c' : 'inherit',
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => onDelete(dep.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DependencyManagerDialog;
