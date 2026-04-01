import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Link } from 'react-router-dom'

const guideRoles = [
  {
    title: 'As a Patient',
    description: 'Learn each patient feature with short and practical steps.',
    href: '/guide/patient',
    icon: <LocalHospitalIcon sx={{ color: '#00B4D8' }} />,
    cta: 'Open Patient Guide',
    active: true,
  },
  {
    title: 'As a Doctor',
    description: 'Learn real doctor workflows, review flow, reminders, and appointment actions.',
    href: '/guide/doctor',
    icon: <MedicalServicesIcon sx={{ color: '#06D6A0' }} />,
    cta: 'Open Doctor Guide',
    active: true,
  },
  {
    title: 'As a Provider',
    description: 'Learn real provider workflows for overview, medicines, orders, and payments.',
    href: '/guide/provider',
    icon: <LocalPharmacyIcon sx={{ color: '#FFB703' }} />,
    cta: 'Open Provider Guide',
    active: true,
  },
]

export default function GuidePage() {
  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      <Box
        sx={{
          textAlign: 'center',
          mb: 5,
          py: { xs: 4, md: 6 },
          borderRadius: 4,
          background: 'radial-gradient(circle at top right, rgba(0, 180, 216, 0.14) 0%, rgba(0, 180, 216, 0.04) 40%, transparent 75%)',
        }}
      >
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: { xs: '2.4rem', md: '4rem' },
            letterSpacing: '-0.02em',
            lineHeight: 1.08,
            color: '#1A1A2E',
          }}
        >
          Your Guide,
          <Box component="span" sx={{ display: 'block', color: '#00A8CC' }}>
            Simplified.
          </Box>
        </Typography>
        <Typography sx={{ color: '#5F7695', fontSize: { xs: '1.02rem', md: '1.35rem' }, maxWidth: 860, mx: 'auto', mt: 2 }}>
          Choose your role to view clear, feature-by-feature guidance. No login is required.
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
          gap: 3,
        }}
      >
        {guideRoles.map((role) => (
          <Card
            key={role.title}
            component={role.active ? Link : 'div'}
            to={role.active ? role.href : undefined}
            sx={{
              textDecoration: 'none',
              borderRadius: 3,
              border: '1px solid',
              borderColor: '#E2E8F0',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              minHeight: 230,
              transition: 'all 0.25s ease',
              '&:hover': role.active
                ? {
                    transform: 'translateY(-4px)',
                    borderColor: '#00B4D8',
                    boxShadow: '0 12px 28px rgba(0, 180, 216, 0.16)',
                  }
                : undefined,
            }}
          >
            <CardContent sx={{ p: 3.25, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.12) 0%, rgba(6, 214, 160, 0.08) 100%)',
                  }}
                >
                  {role.icon}
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#1A1A2E' }}>{role.title}</Typography>
              </Stack>

              <Typography sx={{ color: '#64748B', lineHeight: 1.6, flex: 1 }}>{role.description}</Typography>

              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2.5 }}>
                <Chip
                  label={role.active ? role.cta : 'Coming soon'}
                  size="small"
                  sx={{
                    bgcolor: role.active ? 'rgba(0, 180, 216, 0.1)' : '#F5F5F7',
                    color: role.active ? '#00B4D8' : '#64748B',
                    fontWeight: 600,
                  }}
                />
                {role.active && <ArrowForwardIcon sx={{ color: '#00B4D8' }} />}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  )
}
