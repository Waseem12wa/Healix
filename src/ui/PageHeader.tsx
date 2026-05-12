import { Box, Stack, Typography, useTheme, alpha } from '@mui/material'
import { keyframes } from '@mui/system'
import type { ReactNode } from 'react'
import BackButton from './BackButton'

export default function PageHeader({ title, subtitle, after, showBack }: { title: string; subtitle?: ReactNode; after?: ReactNode; showBack?: boolean }) {
  const theme = useTheme()

  const float = keyframes`
    0% { transform: translateY(0) }
    50% { transform: translateY(-10px) }
    100% { transform: translateY(0) }
  `

  const shimmer = keyframes`
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  `

  return (
    <Box sx={{
      position: 'relative',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100vw',
      maxWidth: '100vw',
      overflowX: 'clip',
      background: theme.extras?.gradients?.hero ?? `linear-gradient(140deg, #ECFEFF 0%, #F0FDFA 35%, #EFF6FF 100%)`,
      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
      py: { xs: 8, md: 10 },
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100%',
        background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.03)}, transparent)`,
        backgroundSize: '1000px 100%',
        animation: `${shimmer} 3s infinite linear`,
        pointerEvents: 'none'
      }
    }}>
      {/* Decorative Background Elements */}
      <Box sx={{
        position: 'absolute',
        top: -80,
        right: -80,
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.12)} 0%, transparent 70%)`,
        filter: 'blur(60px)',
        animation: `${float} 8s ease-in-out infinite`,
        zIndex: 0
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: -60,
        left: -60,
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 70%)`,
        filter: 'blur(50px)',
        animation: `${float} 10s ease-in-out infinite`,
        animationDelay: '1s',
        zIndex: 0
      }} />

      {showBack && (
        <Box sx={{
          position: 'fixed',
          left: { xs: 16, md: 24 },
          top: { xs: 16, md: 24 },
          zIndex: 1100
        }}>
          <BackButton />
        </Box>
      )}

      <Box sx={{ maxWidth: 1100, mx: 'auto', px: 2, position: 'relative', zIndex: 1 }}>
        <Stack spacing={2} alignItems="center" textAlign="center">
          {/* Main Title */}
          <Typography
            variant="h2"
            fontWeight={800}
            sx={{
              background: theme.extras?.gradients?.brand ?? `linear-gradient(135deg, #34D399 0%, #06B6D4 50%, #2563EB 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: { xs: '2.5rem', md: '3.75rem' },
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              mb: 1,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -12,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 60,
                height: 4,
                borderRadius: '2px',
                background: `linear-gradient(90deg, #34D399 0%, #06B6D4 50%, #2563EB 100%)`,
                opacity: 0.6
              }
            }}
          >
            {title}
          </Typography>

          {/* Subtitle */}
          {subtitle ? (
            <Typography
              variant="h5"
              sx={{
                display: 'block',
                maxWidth: 720,
                color: theme.palette.text.secondary,
                fontWeight: 400,
                fontSize: { xs: '1.125rem', md: '1.375rem' },
                lineHeight: 1.6,
                mt: 2,
                '& .highlight': {
                  color: theme.palette.primary.main,
                  fontWeight: 600
                }
              }}
            >
              {subtitle}
            </Typography>
          ) : null}

          {/* After Content */}
          {after && (
            <Box sx={{ mt: 3, width: '100%' }}>
              {after}
            </Box>
          )}
        </Stack>
      </Box>
    </Box>
  )
}
