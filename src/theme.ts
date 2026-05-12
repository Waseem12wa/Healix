import { createTheme } from '@mui/material/styles'

export type ThemeMode = 'light' | 'dark'

// Healix 2026 — Premium Hospital Design System
// Signature gradient: Mint → Teal → Royal Blue
// Use via `theme.palette` and `theme.extras.gradients` in `sx` props.
export const gradients = {
  brand: 'linear-gradient(135deg, #34D399 0%, #06B6D4 50%, #2563EB 100%)',
  brandSoft: 'linear-gradient(135deg, rgba(52,211,153,0.14) 0%, rgba(6,182,212,0.14) 50%, rgba(37,99,235,0.14) 100%)',
  brandReverse: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 50%, #34D399 100%)',
  hero: 'linear-gradient(140deg, #ECFEFF 0%, #F0FDFA 35%, #EFF6FF 100%)',
  surface: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
  card: 'linear-gradient(135deg, rgba(52,211,153,0.06) 0%, rgba(6,182,212,0.06) 50%, rgba(37,99,235,0.06) 100%)',
  ring: 'linear-gradient(135deg, #34D399, #06B6D4, #2563EB)',
  mint: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
  teal: 'linear-gradient(135deg, #22D3EE 0%, #06B6D4 100%)',
  blue: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
  rose: 'linear-gradient(135deg, #FB7185 0%, #F43F5E 100%)',
  amber: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)',
  sunrise: 'linear-gradient(135deg, #5EEAD4 0%, #60A5FA 100%)',
  glass: 'linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.55) 100%)',
} as const

export type AppGradients = typeof gradients

// Augment MUI Theme with our custom `extras` slot
declare module '@mui/material/styles' {
  interface Theme {
    extras: { gradients: AppGradients; tokens: typeof tokens }
  }
  interface ThemeOptions {
    extras?: { gradients: AppGradients; tokens: typeof tokens }
  }
}

// Premium design tokens — single source of truth (mirrors src/ui/premium/tokens.ts)
const tokens = {
  colors: {
    mint: '#34D399',
    emerald: '#10B981',
    cyan: '#06B6D4',
    sky: '#0EA5E9',
    blue: '#2563EB',
    indigo: '#1D4ED8',
    navy: '#1E3A8A',
    success: '#10B981',
    successDark: '#059669',
    warning: '#F59E0B',
    warningDark: '#92400E',
    error: '#F43F5E',
    errorDark: '#E11D48',
    info: '#06B6D4',
    ink: '#0F172A',
    inkMuted: '#475569',
    inkDisabled: '#94A3B8',
    border: '#E2E8F0',
    surface: '#FFFFFF',
    surfaceAlt: '#F8FAFC',
    surfaceMid: '#F1F5F9',
  },
  shadows: {
    xs: '0 1px 2px rgba(15,23,42,0.04)',
    sm: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.04)',
    md: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06)',
    lg: '0 12px 32px rgba(15,23,42,0.10)',
    xl: '0 16px 40px rgba(15,23,42,0.12)',
    brand: '0 12px 32px rgba(14,165,233,0.22)',
    brandStrong: '0 10px 24px rgba(14,165,233,0.32), 0 4px 10px rgba(37,99,235,0.18)',
    brandSoft: '0 6px 16px rgba(14,165,233,0.28)',
    rose: '0 6px 16px rgba(244,63,94,0.28)',
  },
  radius: {
    sm: 1.25,
    md: 2,
    lg: 2.5,
    xl: 3,
    '2xl': 4,
    pill: 999,
  },
  glass: {
    surface: 'rgba(255,255,255,0.72)',
    light: 'rgba(255,255,255,0.85)',
    heavy: 'rgba(255,255,255,0.92)',
  },
  border: {
    soft: '1px solid rgba(15,23,42,0.06)',
    softHover: '1px solid rgba(14,165,233,0.40)',
  },
} as const

export const createAppTheme = (mode: ThemeMode = 'light') => createTheme({
  extras: { gradients, tokens },
  palette: {
    mode,
    primary: {
      main: '#0EA5E9',   // Sky 500 — Healix primary
      light: '#67E8F9',  // Cyan 300
      dark: '#1D4ED8',   // Royal Blue 700
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#14B8A6',   // Teal 500
      light: '#5EEAD4',  // Teal 300
      dark: '#0F766E',   // Teal 700
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#10B981',   // Emerald 500
      light: '#6EE7B7',
      dark: '#059669',
    },
    error: {
      main: '#F43F5E',   // Rose 500
      light: '#FB7185',
      dark: '#E11D48',
    },
    warning: {
      main: '#F59E0B',   // Amber 500
      light: '#FCD34D',
      dark: '#B45309',
    },
    info: {
      main: '#06B6D4',   // Cyan 500
      light: '#67E8F9',
      dark: '#0E7490',
    },
    background: mode === 'dark'
      ? {
          default: '#0B1220',
          paper: '#111827',
        }
      : {
          default: '#F1F5F9', // Slate 100
          paper: '#FFFFFF',
        },
    text: mode === 'dark'
      ? {
          primary: '#E2E8F0',
          secondary: '#94A3B8',
        }
      : {
          primary: '#0F172A', // Slate 900
          secondary: '#475569', // Slate 600
        },
    divider: mode === 'dark' ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.08)',
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
      900: '#0F172A',
    },
  },
  shape: { borderRadius: 14 }, // Softer, premium 14px radius
  spacing: 4, // Base spacing unit (4px)
  typography: {
    fontFamily: '"Geist Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '32px',
      lineHeight: 1.25,
      letterSpacing: '-0.025em',
      color: '#0F172A'
    },
    h2: {
      fontWeight: 700,
      fontSize: '24px',
      lineHeight: 1.3,
      letterSpacing: '-0.02em',
      color: '#0F172A'
    },
    h3: {
      fontWeight: 700,
      fontSize: '18px',
      lineHeight: 1.4,
      letterSpacing: '-0.01em',
      color: '#0F172A'
    },
    h4: {
      fontWeight: 600,
      fontSize: '16px',
      lineHeight: 1.4,
      color: '#0F172A'
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
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            'radial-gradient(1200px 600px at -10% -10%, rgba(52,211,153,0.10) 0%, transparent 60%),' +
            'radial-gradient(900px 500px at 110% 10%, rgba(37,99,235,0.10) 0%, transparent 60%),' +
            'radial-gradient(800px 500px at 50% 110%, rgba(6,182,212,0.08) 0%, transparent 60%)',
          backgroundAttachment: 'fixed',
        }
      }
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 22px',
          fontSize: '15px',
          fontWeight: 600,
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:focus-visible': {
            outline: '2px solid #0EA5E9',
            outlineOffset: '2px'
          }
        },
        contained: {
          color: '#FFFFFF',
          background: gradients.brand,
          backgroundSize: '200% 200%',
          backgroundPosition: '0% 50%',
          boxShadow: '0 6px 18px rgba(14,165,233,0.28), 0 2px 6px rgba(37,99,235,0.18)',
          '&:hover': {
            backgroundPosition: '100% 50%',
            transform: 'translateY(-1px)',
            boxShadow: '0 10px 24px rgba(14,165,233,0.36), 0 4px 10px rgba(37,99,235,0.22)'
          }
        },
        outlined: {
          borderWidth: 1.5,
          '&:hover': { borderWidth: 1.5, transform: 'translateY(-1px)' }
        },
        text: {
          '&:hover': { background: 'rgba(14,165,233,0.08)' }
        }
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
          boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)'
        }
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 10px 30px rgba(15,23,42,0.06)',
          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.35s cubic-bezier(0.4,0,0.2,1), border-color 0.35s ease',
          border: '1px solid rgba(15,23,42,0.06)',
          '&:hover': {
            boxShadow: '0 12px 36px rgba(14,165,233,0.18), 0 4px 12px rgba(37,99,235,0.10)',
            transform: 'translateY(-3px)',
            borderColor: 'rgba(14,165,233,0.28)'
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#F8FAFC',
            transition: 'all 0.2s ease',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(15,23,42,0.10)' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#0EA5E9' },
            '&.Mui-focused': {
              backgroundColor: '#FFFFFF',
              '& .MuiOutlinedInput-notchedOutline': { borderWidth: '2px', borderColor: '#0EA5E9' }
            }
          },
          '& .MuiInputLabel-root.Mui-focused': { color: '#0EA5E9' }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999, fontWeight: 600, fontSize: '13px' }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 20, animation: 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }
      }
    },
    MuiAppBar: {
      styleOverrides: { root: { backgroundImage: 'none' } }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          background: 'rgba(15,23,42,0.92)',
          backdropFilter: 'blur(8px)',
          fontSize: 12,
          fontWeight: 500,
          borderRadius: 8,
          padding: '6px 10px'
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



