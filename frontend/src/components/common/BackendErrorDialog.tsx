import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Collapse,
  IconButton,
  Chip,
} from '@mui/material';
import {
  ErrorOutline,
  Refresh,
  ContentCopy,
  ExpandMore,
  ExpandLess,
  SignalWifiOff,
} from '@mui/icons-material';

interface BackendErrorDialogProps {
  open: boolean;
  error: {
    type: 'network' | 'timeout' | 'server';
    message: string;
    endpoint?: string;
    timestamp: string;
    details?: string;
  } | null;
  onRetry: () => void;
  onClose: () => void;
}

const BackendErrorDialog = ({ open, error, onRetry, onClose }: BackendErrorDialogProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!error) return null;

  const handleCopyDetails = () => {
    const errorReport = `
iAlign Error Report
-------------------
Time: ${error.timestamp}
Type: ${error.type}
Endpoint: ${error.endpoint || 'N/A'}
Message: ${error.message}
${error.details ? `Details: ${error.details}` : ''}

Browser: ${navigator.userAgent}
URL: ${window.location.href}
    `.trim();

    navigator.clipboard.writeText(errorReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case 'network':
        return 'Unable to Connect to Server';
      case 'timeout':
        return 'Request Timeout';
      case 'server':
        return 'Server Error';
      default:
        return 'Connection Error';
    }
  };

  const getErrorIcon = () => {
    switch (error.type) {
      case 'network':
        return <SignalWifiOff sx={{ fontSize: 48, color: 'error.main' }} />;
      case 'timeout':
        return <ErrorOutline sx={{ fontSize: 48, color: 'warning.main' }} />;
      default:
        return <ErrorOutline sx={{ fontSize: 48, color: 'error.main' }} />;
    }
  };

  const getUserFriendlyMessage = () => {
    switch (error.type) {
      case 'network':
        return 'The application backend server is not responding. This could be due to:';
      case 'timeout':
        return 'The server is taking too long to respond. This could be due to:';
      case 'server':
        return 'The server encountered an error while processing your request.';
      default:
        return 'An unexpected error occurred.';
    }
  };

  const getPossibleCauses = () => {
    const causes = [];
    switch (error.type) {
      case 'network':
        causes.push('The backend server may be offline or restarting');
        causes.push('Your internet connection may be disrupted');
        causes.push('A firewall or proxy may be blocking the connection');
        break;
      case 'timeout':
        causes.push('The server is experiencing high load');
        causes.push('Your internet connection is slow');
        causes.push('The database may be performing maintenance');
        break;
      case 'server':
        causes.push('An internal server error occurred');
        causes.push('The database may be experiencing issues');
        break;
    }
    return causes;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 6,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={2}>
          {getErrorIcon()}
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {getErrorTitle()}
            </Typography>
            <Chip
              label={error.type.toUpperCase()}
              size="small"
              color="error"
              sx={{ mt: 0.5 }}
            />
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight={500}>
            {error.message}
          </Typography>
        </Alert>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {getUserFriendlyMessage()}
        </Typography>

        <Box component="ul" sx={{ pl: 2, mt: 1, mb: 2 }}>
          {getPossibleCauses().map((cause, index) => (
            <Typography
              component="li"
              key={index}
              variant="body2"
              color="text.secondary"
              sx={{ mb: 0.5 }}
            >
              {cause}
            </Typography>
          ))}
        </Box>

        <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1, mb: 2 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            What you can do:
          </Typography>
          <Typography component="ol" variant="body2" sx={{ pl: 2, m: 0 }}>
            <li>Click "Retry" to try connecting again</li>
            <li>Check your internet connection</li>
            <li>Contact your system administrator if the problem persists</li>
            <li>Copy error details below to include in your support request</li>
          </Typography>
        </Box>

        <Box>
          <Button
            size="small"
            onClick={() => setShowDetails(!showDetails)}
            endIcon={showDetails ? <ExpandLess /> : <ExpandMore />}
            sx={{ mb: 1 }}
          >
            {showDetails ? 'Hide' : 'Show'} Technical Details
          </Button>

          <Collapse in={showDetails}>
            <Box
              sx={{
                bgcolor: 'grey.900',
                color: 'grey.100',
                p: 2,
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                maxHeight: 200,
                overflow: 'auto',
              }}
            >
              <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace' }}>
                <strong>Timestamp:</strong> {error.timestamp}
              </Typography>
              <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace' }}>
                <strong>Error Type:</strong> {error.type}
              </Typography>
              {error.endpoint && (
                <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace' }}>
                  <strong>Endpoint:</strong> {error.endpoint}
                </Typography>
              )}
              {error.details && (
                <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', mt: 1 }}>
                  <strong>Details:</strong>
                  <br />
                  {error.details}
                </Typography>
              )}
            </Box>

            <Button
              size="small"
              startIcon={<ContentCopy />}
              onClick={handleCopyDetails}
              sx={{ mt: 1 }}
              variant="outlined"
              fullWidth
            >
              {copied ? 'Copied!' : 'Copy Error Details'}
            </Button>
          </Collapse>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Dismiss
        </Button>
        <Button
          onClick={() => {
            onRetry();
            onClose();
          }}
          variant="contained"
          startIcon={<Refresh />}
          color="primary"
        >
          Retry Connection
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BackendErrorDialog;
