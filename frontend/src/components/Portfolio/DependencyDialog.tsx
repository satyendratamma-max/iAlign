import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
} from '@mui/material';

interface Project {
  id: number;
  projectNumber?: string;
  name: string;
  startDate?: Date;
  endDate?: Date;
}

interface Milestone {
  id: number;
  name: string;
  milestoneDate?: Date;
  endDate?: Date;
  projectId: number;
}

interface DependencyDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (dependency: DependencyFormData) => Promise<void>;
  projects: Project[];
  milestones: Milestone[];
}

export interface DependencyFormData {
  predecessorType: 'project' | 'milestone';
  predecessorId: number;
  predecessorPoint: 'start' | 'end';
  successorType: 'project' | 'milestone';
  successorId: number;
  successorPoint: 'start' | 'end';
  dependencyType: 'FS' | 'SS' | 'FF' | 'SF';
  lagDays: number;
}

const DependencyDialog: React.FC<DependencyDialogProps> = ({
  open,
  onClose,
  onSave,
  projects,
  milestones,
}) => {
  const [formData, setFormData] = useState<DependencyFormData>({
    predecessorType: 'project',
    predecessorId: 0,
    predecessorPoint: 'end',
    successorType: 'project',
    successorId: 0,
    successorPoint: 'start',
    dependencyType: 'FS',
    lagDays: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        predecessorType: 'project',
        predecessorId: 0,
        predecessorPoint: 'end',
        successorType: 'project',
        successorId: 0,
        successorPoint: 'start',
        dependencyType: 'FS',
        lagDays: 0,
      });
      setError('');
    }
  }, [open]);

  const handleChange = (field: keyof DependencyFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError('');
  };

  const handleSubmit = async () => {
    // Validation
    if (formData.predecessorId === 0) {
      setError('Please select a predecessor');
      return;
    }
    if (formData.successorId === 0) {
      setError('Please select a successor');
      return;
    }
    if (
      formData.predecessorType === formData.successorType &&
      formData.predecessorId === formData.successorId
    ) {
      setError('Cannot create a dependency from an entity to itself');
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create dependency');
    } finally {
      setLoading(false);
    }
  };

  // Get available items based on type
  const getPredecessorItems = () => {
    return formData.predecessorType === 'project' ? projects : milestones;
  };

  const getSuccessorItems = () => {
    return formData.successorType === 'project' ? projects : milestones;
  };

  // Get label for item
  const getItemLabel = (item: Project | Milestone, type: 'project' | 'milestone') => {
    if (type === 'project') {
      const project = item as Project;
      return `${project.projectNumber || `PRJ-${project.id}`} - ${project.name}`;
    } else {
      const milestone = item as Milestone;
      const project = projects.find((p) => p.id === milestone.projectId);
      return `${milestone.name} - ${project?.projectNumber || `PRJ-${milestone.projectId}`}`;
    }
  };

  const dependencyTypeDescriptions = {
    FS: 'Finish-to-Start: Predecessor must finish before successor starts',
    SS: 'Start-to-Start: Both must start at the same time (with lag)',
    FF: 'Finish-to-Finish: Both must finish at the same time (with lag)',
    SF: 'Start-to-Finish: Predecessor must start before successor finishes',
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Project Dependency</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}

          {/* Predecessor Section */}
          <Typography variant="subtitle2" color="primary">
            Predecessor (From)
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.predecessorType}
                label="Type"
                onChange={(e) => {
                  handleChange('predecessorType', e.target.value);
                  handleChange('predecessorId', 0);
                }}
              >
                <MenuItem value="project">Project</MenuItem>
                <MenuItem value="milestone">Milestone</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ flex: 1 }}>
              <InputLabel>Select {formData.predecessorType}</InputLabel>
              <Select
                value={formData.predecessorId}
                label={`Select ${formData.predecessorType}`}
                onChange={(e) => handleChange('predecessorId', e.target.value)}
              >
                <MenuItem value={0}>-- Select --</MenuItem>
                {getPredecessorItems().map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {getItemLabel(item, formData.predecessorType)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Point</InputLabel>
              <Select
                value={formData.predecessorPoint}
                label="Point"
                onChange={(e) => handleChange('predecessorPoint', e.target.value)}
              >
                <MenuItem value="start">Start</MenuItem>
                <MenuItem value="end">End</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Successor Section */}
          <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
            Successor (To)
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.successorType}
                label="Type"
                onChange={(e) => {
                  handleChange('successorType', e.target.value);
                  handleChange('successorId', 0);
                }}
              >
                <MenuItem value="project">Project</MenuItem>
                <MenuItem value="milestone">Milestone</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ flex: 1 }}>
              <InputLabel>Select {formData.successorType}</InputLabel>
              <Select
                value={formData.successorId}
                label={`Select ${formData.successorType}`}
                onChange={(e) => handleChange('successorId', e.target.value)}
              >
                <MenuItem value={0}>-- Select --</MenuItem>
                {getSuccessorItems().map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {getItemLabel(item, formData.successorType)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Point</InputLabel>
              <Select
                value={formData.successorPoint}
                label="Point"
                onChange={(e) => handleChange('successorPoint', e.target.value)}
              >
                <MenuItem value="start">Start</MenuItem>
                <MenuItem value="end">End</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Dependency Type and Lag */}
          <Typography variant="subtitle2" color="primary" sx={{ mt: 2 }}>
            Dependency Details
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl sx={{ flex: 1 }}>
              <InputLabel>Dependency Type</InputLabel>
              <Select
                value={formData.dependencyType}
                label="Dependency Type"
                onChange={(e) => handleChange('dependencyType', e.target.value)}
              >
                <MenuItem value="FS">FS - Finish to Start</MenuItem>
                <MenuItem value="SS">SS - Start to Start</MenuItem>
                <MenuItem value="FF">FF - Finish to Finish</MenuItem>
                <MenuItem value="SF">SF - Start to Finish</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Lag Days"
              type="number"
              value={formData.lagDays}
              onChange={(e) => handleChange('lagDays', parseInt(e.target.value) || 0)}
              sx={{ minWidth: 150 }}
              helperText="Positive = delay, Negative = lead"
            />
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            {dependencyTypeDescriptions[formData.dependencyType]}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Creating...' : 'Create Dependency'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DependencyDialog;
