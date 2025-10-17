import React, { ReactNode } from 'react';
import { Box, Paper, ButtonGroup, Divider, useTheme, alpha } from '@mui/material';

interface ActionBarProps {
  children: ReactNode;
  elevation?: number;
}

const ActionBar: React.FC<ActionBarProps> = ({ children, elevation = 0 }) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={elevation}
      sx={{
        mb: 2,
        p: 1.5,
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(8px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 1.5,
      }}
    >
      <Box
        display="flex"
        flexWrap="wrap"
        gap={1.5}
        alignItems="center"
        justifyContent={{ xs: 'center', sm: 'flex-start' }}
      >
        {children}
      </Box>
    </Paper>
  );
};

export const ActionGroup: React.FC<{ children: ReactNode; divider?: boolean }> = ({
  children,
  divider = false,
}) => {
  return (
    <>
      <ButtonGroup
        variant="outlined"
        size="small"
        sx={{
          '& .MuiButton-root': {
            textTransform: 'none',
            fontWeight: 500,
          },
        }}
      >
        {children}
      </ButtonGroup>
      {divider && (
        <Divider
          orientation="vertical"
          flexItem
          sx={{
            mx: 0.5,
            display: { xs: 'none', sm: 'block' },
          }}
        />
      )}
    </>
  );
};

export default ActionBar;
