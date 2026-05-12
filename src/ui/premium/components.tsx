/**
 * Healix 2026 — Premium Component Primitives
 *
 * Compose pages from these instead of redeclaring inline. Every primitive
 * pulls from `./tokens` so the design system stays consistent.
 */

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  IconButton,
  Skeleton,
  Stack,
  Typography,
  alpha,
} from '@mui/material'
import type { ReactNode, ComponentType, MouseEvent } from 'react'
import { motion } from 'framer-motion'
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded'
import FiberManualRecordRoundedIcon from '@mui/icons-material/FiberManualRecordRounded'
import {
  BRAND_GRADIENT,
  HERO_BG,
  GLASS_SURFACE,
  GLASS_SURFACE_LIGHT,
  SOFT_BORDER,
  AMBIENT_MESH,
  shadows,
  colors,
  accentSoftBg,
  accentSoftBorder,
  accentRing,
  gradientText,
} from './tokens'

/* ------------------------------------------------------------------ */
/*  AmbientBackground — fixed-position mesh layer                      */
/* ------------------------------------------------------------------ */

export function AmbientBackground() {
  return (
    <Box
      aria-hidden
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        backgroundImage: AMBIENT_MESH,
      }}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  GlassSurface — sticky frosted-glass header wrapper                 */
/* ------------------------------------------------------------------ */

export function GlassSurface({ children, sx }: { children: ReactNode; sx?: object }) {
  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        bgcolor: GLASS_SURFACE,
        backdropFilter: 'saturate(180%) blur(16px)',
        WebkitBackdropFilter: 'saturate(180%) blur(16px)',
        borderBottom: SOFT_BORDER,
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}

/* ------------------------------------------------------------------ */
/*  BrandTile — gradient-filled brand mark tile                        */
/* ------------------------------------------------------------------ */

export interface BrandTileProps {
  Icon: ComponentType<any>
  size?: number
  iconSize?: number
  rounded?: number | string
}

export function BrandTile({ Icon, size = 38, iconSize = 22, rounded = '11px' }: BrandTileProps) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: rounded,
        background: BRAND_GRADIENT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 6px 16px rgba(14,165,233,0.32), 0 2px 4px rgba(37,99,235,0.18)',
        flexShrink: 0,
      }}
    >
      <Icon sx={{ color: '#FFFFFF', fontSize: iconSize }} />
    </Box>
  )
}

/* ------------------------------------------------------------------ */
/*  IconTile — soft-accent tinted icon backdrop                        */
/* ------------------------------------------------------------------ */

export interface IconTileProps {
  Icon: ComponentType<any>
  accent?: string
  size?: number
  iconSize?: number
  rounded?: number
}

export function IconTile({
  Icon,
  accent = colors.sky,
  size = 44,
  iconSize = 22,
  rounded = 2,
}: IconTileProps) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: rounded,
        background: accentSoftBg(accent),
        border: accentSoftBorder(accent),
        color: accent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon sx={{ fontSize: iconSize }} />
    </Box>
  )
}

/* ------------------------------------------------------------------ */
/*  GradientRingAvatar — avatar wrapped with a brand-gradient ring     */
/* ------------------------------------------------------------------ */

export interface GradientRingAvatarProps {
  src?: string
  initial?: string
  size?: number
  bgColor?: string
}

export function GradientRingAvatar({
  src,
  initial,
  size = 32,
  bgColor = colors.sky,
}: GradientRingAvatarProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: -2,
          borderRadius: '50%',
          padding: '2px',
          background: BRAND_GRADIENT,
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        },
      }}
    >
      <Avatar
        src={src || undefined}
        sx={{
          width: size,
          height: size,
          bgcolor: bgColor,
          fontWeight: 700,
          fontSize: size * 0.44,
        }}
      >
        {initial?.toUpperCase()}
      </Avatar>
    </Box>
  )
}

/* ------------------------------------------------------------------ */
/*  GradientButton — branded animated CTA                              */
/* ------------------------------------------------------------------ */

export interface GradientButtonProps {
  children: ReactNode
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  startIcon?: ReactNode
  endIcon?: ReactNode
  fullWidth?: boolean
  disabled?: boolean
  size?: 'small' | 'medium' | 'large'
  sx?: object
  type?: 'button' | 'submit'
}

export function GradientButton({
  children,
  onClick,
  startIcon,
  endIcon,
  fullWidth,
  disabled,
  size = 'medium',
  sx,
  type = 'button',
}: GradientButtonProps) {
  const padY = size === 'small' ? 0.85 : size === 'large' ? 1.4 : 1.1
  const fontSize = size === 'small' ? '0.82rem' : size === 'large' ? '1rem' : '0.9rem'

  return (
    <Button
      onClick={onClick}
      type={type}
      fullWidth={fullWidth}
      disabled={disabled}
      startIcon={startIcon}
      endIcon={endIcon}
      sx={{
        textTransform: 'none',
        fontWeight: 700,
        fontSize,
        color: '#FFFFFF',
        background: BRAND_GRADIENT,
        backgroundSize: '200% 200%',
        backgroundPosition: '0% 50%',
        borderRadius: 2,
        py: padY,
        px: 2.5,
        boxShadow: shadows.brandStrong,
        transition: 'all 0.3s ease',
        '&:hover': {
          backgroundPosition: '100% 50%',
          boxShadow: '0 14px 28px rgba(14,165,233,0.40), 0 6px 14px rgba(37,99,235,0.22)',
        },
        '&.Mui-disabled': {
          background: alpha(colors.ink, 0.06),
          color: alpha(colors.ink, 0.35),
          boxShadow: 'none',
        },
        ...sx,
      }}
    >
      {children}
    </Button>
  )
}

/* ------------------------------------------------------------------ */
/*  PillButton — pill-shaped variant                                   */
/* ------------------------------------------------------------------ */

export function PillButton(props: GradientButtonProps) {
  return <GradientButton {...props} sx={{ borderRadius: 999, ...props.sx }} />
}

/* ------------------------------------------------------------------ */
/*  SectionHeader — h2 title + subtitle                                */
/* ------------------------------------------------------------------ */

export interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
      justifyContent="space-between"
      gap={2}
      sx={{ mb: 2 }}
    >
      <Box>
        <Typography
          sx={{
            fontSize: { xs: '1.25rem', md: '1.5rem' },
            fontWeight: 800,
            color: colors.ink,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ fontSize: '0.85rem', color: colors.inkMuted }}>{subtitle}</Typography>
        )}
      </Box>
      {action}
    </Stack>
  )
}

/* ------------------------------------------------------------------ */
/*  PremiumCard — consistent glass card with hover lift                */
/* ------------------------------------------------------------------ */

export interface PremiumCardProps {
  children: ReactNode
  hoverAccent?: string
  onClick?: () => void
  sx?: object
  noPad?: boolean
}

export function PremiumCard({
  children,
  hoverAccent,
  onClick,
  sx,
  noPad,
}: PremiumCardProps) {
  return (
    <Card
      onClick={onClick}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        borderRadius: 3,
        border: SOFT_BORDER,
        bgcolor: GLASS_SURFACE_LIGHT,
        backdropFilter: 'blur(8px)',
        boxShadow: shadows.md,
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
        cursor: onClick ? 'pointer' : undefined,
        ...(hoverAccent && {
          '&:hover': {
            borderColor: alpha(hoverAccent, 0.4),
            boxShadow: accentRing(hoverAccent),
          },
        }),
        ...sx,
      }}
    >
      {noPad ? children : <CardContent sx={{ position: 'relative', p: { xs: 2.5, md: 3 } }}>{children}</CardContent>}
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  StatCard — KPI tile with icon, label, value, optional trend chip   */
/* ------------------------------------------------------------------ */

export interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  trend?: string
  trendUp?: boolean
  Icon: ComponentType<any>
  accent?: string
  loading?: boolean
}

export function StatCard({
  label,
  value,
  hint,
  trend,
  trendUp = true,
  Icon,
  accent = colors.sky,
  loading,
}: StatCardProps) {
  return (
    <PremiumCard hoverAccent={accent} sx={{ height: '100%' }}>
      <Box
        sx={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(accent, 0.18)} 0%, transparent 65%)`,
          pointerEvents: 'none',
        }}
      />
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <IconTile Icon={Icon} accent={accent} />
        {trend && (
          <Chip
            size="small"
            label={trend}
            sx={{
              bgcolor: alpha(trendUp ? colors.success : colors.inkMuted, 0.10),
              color: trendUp ? colors.successDark : colors.inkMuted,
              fontWeight: 700,
              height: 22,
              fontSize: '0.7rem',
            }}
          />
        )}
      </Stack>
      <Typography
        sx={{
          fontSize: '0.78rem',
          fontWeight: 600,
          color: colors.inkMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          mb: 0.5,
        }}
      >
        {label}
      </Typography>
      {loading ? (
        <Skeleton variant="text" sx={{ fontSize: '1.85rem' }} width="60%" />
      ) : (
        <Typography
          sx={{
            fontSize: { xs: '1.7rem', md: '2rem' },
            fontWeight: 800,
            color: colors.ink,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            mb: hint ? 0.75 : 0,
            wordBreak: 'break-word',
          }}
        >
          {value}
        </Typography>
      )}
      {hint && (
        <Typography sx={{ fontSize: '0.75rem', color: colors.inkMuted }}>{hint}</Typography>
      )}
    </PremiumCard>
  )
}

/* ------------------------------------------------------------------ */
/*  ToolCard — feature tile with mesh corner + arrow CTA              */
/* ------------------------------------------------------------------ */

export interface ToolCardProps {
  label: string
  description: string
  Icon: ComponentType<any>
  accent?: string
  onClick?: () => void
  badge?: ReactNode
  cta?: string
  metric?: string
  height?: number
}

export function ToolCard({
  label,
  description,
  Icon,
  accent = colors.sky,
  onClick,
  badge,
  cta = 'Open tool',
  metric,
  height = 220,
}: ToolCardProps) {
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
      <Card
        onClick={onClick}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          height,
          display: 'flex',
          flexDirection: 'column',
          textDecoration: 'none',
          borderRadius: 3,
          border: SOFT_BORDER,
          bgcolor: alpha('#FFFFFF', 0.88),
          backdropFilter: 'blur(8px)',
          boxShadow: shadows.md,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: alpha(accent, 0.4),
            boxShadow: `0 16px 40px ${alpha(accent, 0.22)}`,
          },
          '&:hover .tool-arrow': { transform: 'translate(2px, -2px)' },
          '&:hover .tool-mesh': { opacity: 1 },
        }}
      >
        <Box
          className="tool-mesh"
          sx={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(accent, 0.22)} 0%, transparent 65%)`,
            opacity: 0.6,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
          }}
        />
        <CardContent sx={{ position: 'relative', flex: 1, p: { xs: 2.5, md: 3 } }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
            <IconTile Icon={Icon} accent={accent} size={48} iconSize={24} />
            {badge}
          </Stack>
          <Typography
            sx={{ fontSize: '1rem', fontWeight: 700, color: colors.ink, lineHeight: 1.3, mb: 0.75 }}
          >
            {label}
          </Typography>
          <Typography
            sx={{ fontSize: '0.82rem', color: colors.inkMuted, lineHeight: 1.55, mb: metric ? 1.5 : 0 }}
          >
            {description}
          </Typography>
          {metric && (
            <Chip
              size="small"
              label={metric}
              sx={{
                bgcolor: alpha(accent, 0.10),
                color: accent,
                fontWeight: 800,
                fontSize: '0.72rem',
                height: 22,
                border: `1px solid ${alpha(accent, 0.2)}`,
              }}
            />
          )}
        </CardContent>
        <Box
          sx={{
            position: 'relative',
            px: { xs: 2.5, md: 3 },
            pb: 2.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            sx={{ fontSize: '0.78rem', fontWeight: 700, color: accent, letterSpacing: '0.02em' }}
          >
            {cta}
          </Typography>
          <Box
            className="tool-arrow"
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: alpha(accent, 0.12),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accent,
              transition: 'transform 0.25s ease',
            }}
          >
            <ArrowOutwardRoundedIcon sx={{ fontSize: 16 }} />
          </Box>
        </Box>
      </Card>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  HeroCard — greeting / banner card with gradient mesh + side panel */
/* ------------------------------------------------------------------ */

export interface HeroCardProps {
  eyebrow?: string
  EyebrowIcon?: ComponentType<any>
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  side?: ReactNode
}

export function HeroCard({
  eyebrow: eyebrowText,
  EyebrowIcon,
  title,
  subtitle,
  actions,
  side,
}: HeroCardProps) {
  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 4,
        border: SOFT_BORDER,
        background: HERO_BG,
        boxShadow: shadows.md,
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: -120,
          right: -100,
          width: 420,
          height: 420,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(52,211,153,0.22) 0%, transparent 60%)',
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          bottom: -100,
          left: '40%',
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 60%)',
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }}
      />
      <CardContent sx={{ position: 'relative', p: { xs: 3, md: 4.5 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          gap={3}
        >
          <Box sx={{ flex: 1 }}>
            {eyebrowText && (
              <Chip
                size="small"
                icon={EyebrowIcon ? <EyebrowIcon sx={{ fontSize: 14 }} /> : undefined}
                label={eyebrowText}
                sx={{
                  bgcolor: alpha('#FFFFFF', 0.65),
                  backdropFilter: 'blur(8px)',
                  border: SOFT_BORDER,
                  color: colors.indigo,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  fontSize: '0.65rem',
                  height: 24,
                  mb: 2,
                  '& .MuiChip-icon': { color: colors.cyan },
                }}
              />
            )}
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: '1.75rem', sm: '2.15rem', md: '2.6rem' },
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.025em',
                color: colors.ink,
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                sx={{
                  fontSize: { xs: '0.95rem', md: '1.05rem' },
                  color: colors.inkMuted,
                  mt: 1.25,
                  maxWidth: 640,
                  lineHeight: 1.6,
                }}
              >
                {subtitle}
              </Typography>
            )}
            {actions && (
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ mt: 3, flexWrap: 'wrap', gap: 1 }}
              >
                {actions}
              </Stack>
            )}
          </Box>
          {side && (
            <Box
              sx={{
                flexShrink: 0,
                minWidth: { md: 280 },
                bgcolor: alpha('#FFFFFF', 0.7),
                backdropFilter: 'blur(12px)',
                border: SOFT_BORDER,
                borderRadius: 3,
                p: 2.5,
              }}
            >
              {side}
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  StatusChip — generic semantic chip                                 */
/* ------------------------------------------------------------------ */

export type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

const statusColorMap: Record<StatusVariant, { color: string; bg: string }> = {
  success: { color: colors.successDark, bg: alpha(colors.success, 0.12) },
  warning: { color: colors.warningDark, bg: alpha(colors.warning, 0.14) },
  error:   { color: colors.errorDark,   bg: alpha(colors.error,   0.12) },
  info:    { color: colors.indigo,      bg: alpha(colors.sky,     0.12) },
  neutral: { color: colors.inkMuted,    bg: alpha(colors.ink,     0.06) },
}

export function StatusChip({
  variant = 'neutral',
  label,
  Icon,
  size = 'small',
}: {
  variant?: StatusVariant
  label: string
  Icon?: ComponentType<any>
  size?: 'small' | 'medium'
}) {
  const m = statusColorMap[variant]
  return (
    <Chip
      size={size}
      icon={Icon ? <Icon sx={{ fontSize: '0.85rem !important' }} /> : undefined}
      label={label}
      sx={{
        bgcolor: m.bg,
        color: m.color,
        fontWeight: 700,
        fontSize: '0.7rem',
        height: 22,
        '& .MuiChip-icon': { color: m.color, ml: 0.5 },
      }}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  LiveStatusChip — animated dot + status text                        */
/* ------------------------------------------------------------------ */

export function LiveStatusChip({
  loading,
  label,
}: {
  loading?: boolean
  label: string
}) {
  return (
    <Chip
      size="small"
      icon={
        <FiberManualRecordRoundedIcon
          sx={{ fontSize: '0.6rem !important', color: loading ? colors.warning : colors.success }}
        />
      }
      label={label}
      sx={{
        bgcolor: alpha('#FFFFFF', 0.75),
        backdropFilter: 'blur(6px)',
        border: SOFT_BORDER,
        fontWeight: 600,
        fontSize: '0.75rem',
        height: 28,
        color: colors.ink,
      }}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  ChartTooltip — premium recharts tooltip                            */
/* ------------------------------------------------------------------ */

export function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <Box
      sx={{
        background: alpha('#FFFFFF', 0.96),
        backdropFilter: 'blur(8px)',
        border: SOFT_BORDER,
        borderRadius: 2,
        px: 1.75,
        py: 1.25,
        boxShadow: shadows.lg,
        minWidth: 140,
      }}
    >
      <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: colors.ink, mb: 0.75 }}>
        {label}
      </Typography>
      {payload.map((p: any, i: number) => (
        <Stack key={i} direction="row" alignItems="center" spacing={1} sx={{ fontSize: '0.78rem' }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color || p.stroke || p.fill }} />
          <Typography sx={{ fontSize: '0.78rem', color: colors.inkMuted, flex: 1 }}>{p.name}</Typography>
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: colors.ink }}>{p.value}</Typography>
        </Stack>
      ))}
    </Box>
  )
}

/* ------------------------------------------------------------------ */
/*  Re-export Container so pages can import the whole stack from one  */
/* ------------------------------------------------------------------ */

export { Container as PageContainer }
