import { createTheme } from '@mui/material/styles'

export type ThemeMode = 'light' | 'dark'

// Modern Teal Design System: Professional, trustworthy, tech-forward
export const createAppTheme = (mode: ThemeMode = 'light') => createTheme({
  palette: {
    mode,
    primary: { 
      main: '#00B4D8', // Primary Teal
      light: '#90E0EF', // Light Teal (Accent)
      dark: '#0096C7', // Deep Teal (Secondary)
      contrastText: '#FFFFFF'
    },
    secondary: { 
      main: '#0096C7', // Deep Teal
      light: '#00B4D8',
      dark: '#0077B6',
      contrastText: '#FFFFFF'
    },
    success: { 
      main: '#06D6A0', // Success Green
      light: '#4ECDC4',
      dark: '#04A777'
    },
    error: { 
      main: '#EF476F', // Error Red
      light: '#FF6B9D',
      dark: '#D62839'
    },
    warning: { 
      main: '#FFD166', // Warning Amber
      light: '#FFE5A6',
      dark: '#FFC43D'
    },
    info: { 
      main: '#00B4D8', // Info Teal
      light: '#90E0EF',
      dark: '#0096C7'
    },
    background: mode === 'dark'
      ? {
          default: '#0B1220',
          paper: '#111827',
        }
      : {
          default: '#F5F5F7', // Light Neutral
          paper: '#FFFFFF',
        },
    text: mode === 'dark'
      ? {
          primary: '#E2E8F0',
          secondary: '#94A3B8',
        }
      : {
          primary: '#1A1A2E', // Dark Gray (Neutral)
          secondary: '#64748B',
        },
    grey: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A'
    }
  },
  shape: { borderRadius: 8 }, // Modern 8px border radius
  spacing: 4, // Base spacing unit (4px)
  typography: {
    fontFamily: '"Geist Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    h1: { 
      fontWeight: 600, 
      fontSize: '32px', // 2rem
      lineHeight: 1.5,
      letterSpacing: '-0.02em',
      color: '#1A1A2E'
    },
    h2: { 
      fontWeight: 600, 
      fontSize: '24px', // 1.5rem
      lineHeight: 1.5,
      letterSpacing: '-0.01em',
      color: '#1A1A2E'
    },
    h3: { 
      fontWeight: 600, 
      fontSize: '18px', // 1.125rem
      lineHeight: 1.5,
      color: '#1A1A2E'
    },
    h4: { 
      fontWeight: 600, 
      fontSize: '16px', // 1rem
      lineHeight: 1.5,
      color: '#1A1A2E'
    },
    h5: { 
      fontWeight: 600, 
      fontSize: '16px',
      lineHeight: 1.5
    },
    h6: { 
      fontWeight: 600, 
      fontSize: '16px',
      lineHeight: 1.5
    },
    body1: { 
      fontSize: '16px',
      lineHeight: 1.5,
      fontWeight: 400
    },
    body2: { 
      fontSize: '14px',
      lineHeight: 1.5,
      fontWeight: 400
    },
    subtitle1: {
      fontSize: '16px',
      fontWeight: 500,
      lineHeight: 1.5
    },
    subtitle2: {
      fontSize: '14px',
      fontWeight: 500,
      lineHeight: 1.5
    },
    button: { 
      textTransform: 'none', 
      fontWeight: 600,
      fontSize: '16px',
      letterSpacing: '0.01em'
    },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { 
          borderRadius: 8,
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: 600,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0, 180, 216, 0.3)'
          },
          '&:focus-visible': {
            outline: '2px solid #00B4D8',
            outlineOffset: '2px'
          }
        },
        contained: {
          boxShadow: '0 2px 8px rgba(0, 180, 216, 0.2)',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0, 180, 216, 0.4)'
          }
        }
      },
    },
    MuiPaper: {
      styleOverrides: { 
        root: { 
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
        } 
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0, 180, 216, 0.15)',
            transform: 'translateY(-4px)',
            borderColor: 'rgba(0, 180, 216, 0.2)'
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.2s ease',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#00B4D8'
              }
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: '2px',
                borderColor: '#00B4D8'
              }
            }
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#00B4D8'
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: '14px'
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          animation: 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }
      }
    }
  },
})

// Add keyframes for animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `
  document.head.appendChild(style)
}



