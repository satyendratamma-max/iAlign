import { createTheme } from '@mui/material/styles';

type PaletteMode = 'light' | 'dark';

export const getDesignTokens = (mode: PaletteMode) => ({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light mode palette
          primary: {
            main: '#6366f1',
            light: '#818cf8',
            dark: '#4f46e5',
            contrastText: '#fff',
          },
          secondary: {
            main: '#10b981',
            light: '#34d399',
            dark: '#059669',
          },
          error: {
            main: '#ef4444',
            light: '#f87171',
            dark: '#dc2626',
            lighter: '#fee2e2',
          },
          warning: {
            main: '#f59e0b',
            light: '#fbbf24',
            dark: '#d97706',
            lighter: '#fef3c7',
          },
          info: {
            main: '#06b6d4',
            light: '#22d3ee',
            dark: '#0891b2',
            lighter: '#cffafe',
          },
          success: {
            main: '#10b981',
            light: '#34d399',
            dark: '#059669',
            lighter: '#d1fae5',
          },
          background: {
            default: '#f8fafc',
            paper: '#ffffff',
          },
          text: {
            primary: '#0f172a',
            secondary: '#64748b',
          },
          action: {
            hover: 'rgba(0, 0, 0, 0.04)',
          },
          divider: 'rgba(0, 0, 0, 0.12)',
        }
      : {
          // Dark mode palette
          primary: {
            main: '#818cf8',
            light: '#a5b4fc',
            dark: '#6366f1',
            contrastText: '#fff',
          },
          secondary: {
            main: '#34d399',
            light: '#6ee7b7',
            dark: '#10b981',
          },
          error: {
            main: '#f87171',
            light: '#fca5a5',
            dark: '#ef4444',
            lighter: 'rgba(248, 113, 113, 0.15)',
          },
          warning: {
            main: '#fbbf24',
            light: '#fcd34d',
            dark: '#f59e0b',
            lighter: 'rgba(251, 191, 36, 0.15)',
          },
          info: {
            main: '#22d3ee',
            light: '#67e8f9',
            dark: '#06b6d4',
            lighter: 'rgba(34, 211, 238, 0.15)',
          },
          success: {
            main: '#34d399',
            light: '#6ee7b7',
            dark: '#10b981',
            lighter: 'rgba(16, 185, 129, 0.15)',
          },
          background: {
            default: '#0f172a',
            paper: '#1e293b',
          },
          text: {
            primary: '#f1f5f9',
            secondary: '#cbd5e1',
          },
          action: {
            hover: 'rgba(255, 255, 255, 0.08)',
          },
          divider: 'rgba(255, 255, 255, 0.12)',
        }),
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          borderRadius: 10,
          fontWeight: 600,
          padding: '10px 20px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        } as any,
        sizeSmall: {
          padding: '6px 12px',
          fontSize: '0.8125rem',
        } as any,
        contained: {
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          },
        } as any,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: mode === 'light'
            ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
            : '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: mode === 'light'
            ? '0 1px 3px 0 rgb(0 0 0 / 0.1)'
            : '0 2px 4px 0 rgb(0 0 0 / 0.3)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: mode === 'light'
            ? '1px solid rgba(0,0,0,0.08)'
            : '1px solid rgba(255,255,255,0.08)',
        },
      },
    },
  },
});

export const createAppTheme = (mode: PaletteMode) => {
  return createTheme(getDesignTokens(mode));
};
