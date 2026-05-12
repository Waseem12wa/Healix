/**
 * Healix 2026 — Premium Design Tokens
 *
 * Single source of truth for all visual primitives across the platform.
 * Import from `@/ui/premium` (or relative path) instead of inlining.
 *
 *   import { BRAND_GRADIENT, HERO_BG, SOFT_BORDER, PREMIUM_SHADOW } from '../ui/premium'
 */

import { alpha } from '@mui/material/styles'

/* ------------------------------------------------------------------ */
/*  CORE PALETTE                                                       */
/* ------------------------------------------------------------------ */

export const colors = {
  // Mint → Teal → Blue brand spine
  mint:    '#34D399',
  emerald: '#10B981',
  cyan:    '#06B6D4',
  sky:     '#0EA5E9',
  blue:    '#2563EB',
  indigo:  '#1D4ED8',
  navy:    '#1E3A8A',

  // Semantic
  success: '#10B981',
  successDark: '#059669',
  warning: '#F59E0B',
  warningDark: '#92400E',
  error:   '#F43F5E',
  errorDark: '#E11D48',
  info:    '#06B6D4',

  // Neutrals
  ink:        '#0F172A',
  inkMuted:   '#475569',
  inkDisabled:'#94A3B8',
  border:     '#E2E8F0',
  surface:    '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  surfaceMid: '#F1F5F9',
} as const

/* ------------------------------------------------------------------ */
/*  SIGNATURE GRADIENTS                                                */
/* ------------------------------------------------------------------ */

export const BRAND_GRADIENT =
  'linear-gradient(135deg, #34D399 0%, #06B6D4 50%, #2563EB 100%)'

export const BRAND_GRADIENT_REVERSE =
  'linear-gradient(135deg, #2563EB 0%, #06B6D4 50%, #34D399 100%)'

export const HERO_BG =
  'linear-gradient(140deg, #ECFEFF 0%, #F0FDFA 35%, #EFF6FF 100%)'

export const BRAND_GRADIENT_SOFT =
  'linear-gradient(135deg, rgba(52,211,153,0.14) 0%, rgba(6,182,212,0.14) 50%, rgba(37,99,235,0.14) 100%)'

export const ROSE_GRADIENT =
  'linear-gradient(135deg, #FB7185 0%, #F43F5E 100%)'

export const AMBIENT_MESH =
  'radial-gradient(900px 500px at -10% -10%, rgba(52,211,153,0.10) 0%, transparent 60%),' +
  'radial-gradient(700px 400px at 110% 0%, rgba(37,99,235,0.10) 0%, transparent 60%),' +
  'radial-gradient(600px 400px at 50% 110%, rgba(6,182,212,0.08) 0%, transparent 60%)'

/* ------------------------------------------------------------------ */
/*  SURFACES & BORDERS                                                 */
/* ------------------------------------------------------------------ */

export const GLASS_SURFACE = alpha('#FFFFFF', 0.72)
export const GLASS_SURFACE_LIGHT = alpha('#FFFFFF', 0.85)
export const GLASS_SURFACE_HEAVY = alpha('#FFFFFF', 0.92)

export const SOFT_BORDER = '1px solid rgba(15,23,42,0.06)'
export const SOFT_BORDER_HOVER = '1px solid rgba(14,165,233,0.40)'

/* ------------------------------------------------------------------ */
/*  ELEVATION (shadow scale)                                           */
/* ------------------------------------------------------------------ */

export const shadows = {
  /** Subtle 1px hairline shadow */
  xs: '0 1px 2px rgba(15,23,42,0.04)',
  /** Standard card shadow */
  sm: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.04)',
  /** Premium card resting state */
  md: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06)',
  /** Elevated card / popover */
  lg: '0 12px 32px rgba(15,23,42,0.10)',
  /** Modal / large surface */
  xl: '0 16px 40px rgba(15,23,42,0.12)',
  /** Hover state on branded elements */
  brand: '0 12px 32px rgba(14,165,233,0.22)',
  /** Pressed/active branded button */
  brandStrong: '0 10px 24px rgba(14,165,233,0.32), 0 4px 10px rgba(37,99,235,0.18)',
  /** Light branded glow */
  brandSoft: '0 6px 16px rgba(14,165,233,0.28)',
  /** Rose / error glow */
  rose: '0 6px 16px rgba(244,63,94,0.28)',
} as const

/** Convenience alias matching the inline constant used across pages */
export const PREMIUM_SHADOW = shadows.md

/* ------------------------------------------------------------------ */
/*  RADIUS SCALE                                                       */
/* ------------------------------------------------------------------ */

export const radius = {
  sm: 1.25,   // 10px (chips, small buttons)
  md: 2,      // 16px (icon tiles, inputs)
  lg: 2.5,    // 20px (cards)
  xl: 3,      // 24px (premium cards)
  '2xl': 4,   // 32px (hero cards)
  pill: 999,  // pill / fully rounded
} as const

/* ------------------------------------------------------------------ */
/*  TIMING / EASING                                                    */
/* ------------------------------------------------------------------ */

export const timing = {
  fast: '0.18s ease',
  base: '0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  smooth: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '0.4s cubic-bezier(0.4, 0, 0.2, 1)',
} as const

/* ------------------------------------------------------------------ */
/*  TYPOGRAPHY UTILITIES                                               */
/* ------------------------------------------------------------------ */

/** sx-spread to render text with the brand gradient applied */
export const gradientText = {
  background: BRAND_GRADIENT,
  WebkitBackgroundClip: 'text' as const,
  backgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
}

/** Standard "small caps" eyebrow / overline label */
export const eyebrow = {
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  color: colors.inkMuted,
}

/* ------------------------------------------------------------------ */
/*  HELPER: build a soft accent gradient bg for icon tiles             */
/* ------------------------------------------------------------------ */

export const accentSoftBg = (accent: string) =>
  `linear-gradient(135deg, ${alpha(accent, 0.18)} 0%, ${alpha(accent, 0.06)} 100%)`

export const accentSoftBorder = (accent: string) =>
  `1px solid ${alpha(accent, 0.25)}`

export const accentRing = (accent: string) =>
  `0 12px 32px ${alpha(accent, 0.18)}`

/* ------------------------------------------------------------------ */
/*  TIME-OF-DAY GREETING (single source)                               */
/* ------------------------------------------------------------------ */

export const getGreeting = (): 'Good morning' | 'Good afternoon' | 'Good evening' => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
