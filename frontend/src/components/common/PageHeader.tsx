import React, { ReactNode } from 'react';
import { Box, Typography, Paper, useTheme, alpha } from '@mui/material';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  gradient?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  actions,
  gradient = true,
}) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={2}
      sx={{
        mb: 3,
        p: { xs: 2, sm: 3 },
        background: gradient
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(
              theme.palette.primary.main,
              0.02
            )} 100%)`
          : theme.palette.background.paper,
        borderLeft: gradient ? `4px solid ${theme.palette.primary.main}` : 'none',
        borderRadius: 2,
      }}
    >
      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        gap={2}
      >
        <Box display="flex" alignItems="center" gap={2} flex={1}>
          {icon && (
            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                color: 'white',
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              {icon}
            </Box>
          )}
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                color: theme.palette.text.primary,
                lineHeight: 1.2,
                mb: subtitle ? 0.5 : 0,
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                  fontWeight: 400,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        {actions && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            {actions}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default PageHeader;
