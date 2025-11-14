import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

interface NavigationPromptProps {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Navigation Prompt Dialog
 *
 * Displays a warning dialog when user attempts to navigate away with unsaved changes
 *
 * @param open - Whether the dialog is open
 * @param message - Warning message to display
 * @param onConfirm - Callback when user confirms navigation (leave page)
 * @param onCancel - Callback when user cancels navigation (stay on page)
 */
const NavigationPrompt: React.FC<NavigationPromptProps> = ({
  open,
  message,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="navigation-prompt-title"
      aria-describedby="navigation-prompt-description"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle
        id="navigation-prompt-title"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: 'warning.main',
        }}
      >
        <WarningIcon />
        Unsaved Changes
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="navigation-prompt-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} variant="outlined" color="primary">
          Stay on Page
        </Button>
        <Button onClick={onConfirm} variant="contained" color="warning" autoFocus>
          Leave Page
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NavigationPrompt;
