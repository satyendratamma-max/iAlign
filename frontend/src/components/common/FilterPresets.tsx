import { useState, useEffect } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Chip,
  Box,
  Tooltip,
} from '@mui/material';
import {
  BookmarkBorder as BookmarkIcon,
  Bookmark as BookmarkFilledIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import {
  setDomainFilter,
  setBusinessDecisionFilter,
} from '../../store/slices/filtersSlice';

interface FilterPreset {
  id: string;
  name: string;
  domainIds: number[];
  businessDecisions: string[];
  createdAt: string;
}

const FilterPresets = () => {
  const dispatch = useAppDispatch();
  const { selectedDomainIds, selectedBusinessDecisions } = useAppSelector(
    (state) => state.filters
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');

  // Load presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('filterPresets');
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load filter presets:', e);
      }
    }
  }, []);

  // Save presets to localStorage
  const savePresets = (newPresets: FilterPreset[]) => {
    localStorage.setItem('filterPresets', JSON.stringify(newPresets));
    setPresets(newPresets);
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      domainIds: selectedDomainIds,
      businessDecisions: selectedBusinessDecisions,
      createdAt: new Date().toISOString(),
    };

    const updated = [...presets, newPreset];
    savePresets(updated);
    setPresetName('');
    setSaveDialogOpen(false);
    handleClose();
  };

  const handleLoadPreset = (preset: FilterPreset) => {
    dispatch(setDomainFilter(preset.domainIds));
    dispatch(setBusinessDecisionFilter(preset.businessDecisions));
    handleClose();
  };

  const handleDeletePreset = (presetId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const updated = presets.filter((p) => p.id !== presetId);
    savePresets(updated);
  };

  const hasActiveFilters =
    selectedDomainIds.length > 0 || selectedBusinessDecisions.length > 0;

  return (
    <>
      <Tooltip title="Filter Presets">
        <IconButton
          size="small"
          onClick={handleClick}
          color={presets.length > 0 ? 'primary' : 'default'}
          sx={{ height: 28, width: 28 }}
        >
          {presets.length > 0 ? (
            <BookmarkFilledIcon fontSize="small" />
          ) : (
            <BookmarkIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { minWidth: 250 },
        }}
      >
        {/* Save Current Filters */}
        {hasActiveFilters && (
          <>
            <MenuItem onClick={() => setSaveDialogOpen(true)}>
              <ListItemIcon>
                <AddIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Save Current Filters" />
            </MenuItem>
            <Divider />
          </>
        )}

        {/* Saved Presets */}
        {presets.length === 0 ? (
          <MenuItem disabled>
            <ListItemText
              primary="No saved presets"
              secondary="Apply filters and save them"
            />
          </MenuItem>
        ) : (
          presets.map((preset) => (
            <MenuItem key={preset.id} onClick={() => handleLoadPreset(preset)}>
              <ListItemText
                primary={preset.name}
                secondary={
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {preset.domainIds.length > 0 && (
                      <Chip
                        label={`${preset.domainIds.length} domains`}
                        size="small"
                        sx={{ height: 18, fontSize: '0.7rem' }}
                      />
                    )}
                    {preset.businessDecisions.length > 0 && (
                      <Chip
                        label={`${preset.businessDecisions.length} decisions`}
                        size="small"
                        sx={{ height: 18, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                }
                secondaryTypographyProps={{ component: 'div' }}
              />
              <IconButton
                size="small"
                onClick={(e) => handleDeletePreset(preset.id, e)}
                sx={{ ml: 1 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </MenuItem>
          ))
        )}
      </Menu>

      {/* Save Preset Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Filter Preset</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Preset Name"
            fullWidth
            variant="outlined"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSavePreset();
              }
            }}
            placeholder="e.g., Engineering FY25"
          />
          <Box sx={{ mt: 2 }}>
            <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 1 }}>
              Current filters:
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selectedDomainIds.length > 0 && (
                <Chip
                  label={`${selectedDomainIds.length} domain(s)`}
                  size="small"
                  color="primary"
                />
              )}
              {selectedBusinessDecisions.length > 0 && (
                <Chip
                  label={`${selectedBusinessDecisions.length} decision(s)`}
                  size="small"
                  color="secondary"
                />
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSavePreset}
            variant="contained"
            disabled={!presetName.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FilterPresets;
