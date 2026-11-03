import { createTheme, type Theme } from '@mui/material/styles';

// ─── Shared Design Tokens ─────────────────────────────────────────────────────

const FONT_FAMILY = '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif';

const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

// ─── Dark Theme ──────────────────────────────────────────────────────────────

export const darkTheme: Theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
    secondary: { main: '#10b981', light: '#34d399', dark: '#059669' },
    background: {
      default: '#0b0f1a',
      paper: '#111827',
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
    },
    divider: 'rgba(255,255,255,0.07)',
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    success: { main: '#10b981' },
    info: { main: '#06b6d4' },
  },
  typography: {
    fontFamily: FONT_FAMILY,
    h1: { fontWeight: 800, letterSpacing: '-0.03em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500, color: '#94a3b8' },
    body1: { fontSize: '0.9375rem' },
    body2: { fontSize: '0.875rem', color: '#94a3b8' },
    caption: { fontSize: '0.75rem', letterSpacing: '0.04em' },
    overline: { fontSize: '0.6875rem', letterSpacing: '0.1em', fontWeight: 600 },
  },
  shape: { borderRadius: BORDER_RADIUS.md },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none', width: 0, height: 0 },
        },
        body: {
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none', width: 0, height: 0 },
        },
        '*': {
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none', width: 0, height: 0 },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(12px)',
          transition: 'box-shadow 0.25s ease, transform 0.25s ease',
          '&:hover': {
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.75rem' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: BORDER_RADIUS.sm,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: { borderRadius: BORDER_RADIUS.sm },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: BORDER_RADIUS.sm },
        notchedOutline: { borderColor: 'rgba(255,255,255,0.1)' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: 'rgba(255,255,255,0.06)' },
        head: { fontWeight: 700, fontSize: '0.8125rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#94a3b8' },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { borderRadius: BORDER_RADIUS.sm, fontSize: '0.8125rem' },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS.sm,
          margin: '2px 8px',
          transition: 'all 0.2s ease',
          '&.Mui-selected': {
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.08) 100%)',
            borderLeft: '3px solid #6366f1',
            '&:hover': {
              background: 'linear-gradient(135deg, rgba(99,102,241,0.28) 0%, rgba(99,102,241,0.12) 100%)',
            },
          },
        },
      },
    },
  },
});

// ─── Light Theme ─────────────────────────────────────────────────────────────

export const lightTheme: Theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
    secondary: { main: '#10b981', light: '#34d399', dark: '#059669' },
    background: {
      default: '#f1f5f9',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
    divider: 'rgba(0,0,0,0.08)',
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    success: { main: '#10b981' },
    info: { main: '#06b6d4' },
  },
  typography: {
    fontFamily: FONT_FAMILY,
    h1: { fontWeight: 800, letterSpacing: '-0.03em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500, color: '#64748b' },
    body1: { fontSize: '0.9375rem' },
    body2: { fontSize: '0.875rem', color: '#64748b' },
    caption: { fontSize: '0.75rem', letterSpacing: '0.04em' },
    overline: { fontSize: '0.6875rem', letterSpacing: '0.1em', fontWeight: 600 },
  },
  shape: { borderRadius: BORDER_RADIUS.md },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none', width: 0, height: 0 },
        },
        body: {
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none', width: 0, height: 0 },
        },
        '*': {
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none', width: 0, height: 0 },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
          transition: 'box-shadow 0.25s ease, transform 0.25s ease',
          '&:hover': {
            boxShadow: '0 8px 32px rgba(99,102,241,0.12)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.75rem' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: BORDER_RADIUS.sm,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: { borderRadius: BORDER_RADIUS.sm },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: BORDER_RADIUS.sm },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 700, fontSize: '0.8125rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#64748b' },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS.sm,
          margin: '2px 8px',
          transition: 'all 0.2s ease',
          '&.Mui-selected': {
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.04) 100%)',
            borderLeft: '3px solid #6366f1',
          },
        },
      },
    },
  },
});
