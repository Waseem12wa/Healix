import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'
import { Link } from 'react-router-dom'
import { patientGuideFeatures } from './guide/patientGuideContent'

export default function PatientGuidePage() {
  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
      <Stack spacing={1} sx={{ mb: 4 }}>
        <Chip
          component={Link}
          to="/guide"
          clickable
          icon={<ArrowBackIcon />}
          label="Back to Guide Page"
          sx={{ alignSelf: 'flex-start', bgcolor: 'rgba(14,165,233, 0.1)', color: '#0EA5E9', fontWeight: 600, mb: 1 }}
        />
        <Typography sx={{ fontSize: { xs: '2rem', md: '2.4rem' }, fontWeight: 700, color: '#0F172A' }}>
          Patient Guide
        </Typography>
        <Typography sx={{ color: '#64748B', fontSize: '1rem', maxWidth: 850 }}>
          Select any feature to view a short, simple guide on how to use it. This section is for learning only and does not run the feature.
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
          gap: 2.5,
        }}
      >
        {patientGuideFeatures.map((feature) => (
          <Card
            key={feature.slug}
            component={Link}
            to={`/guide/patient/${feature.slug}`}
            sx={{
              textDecoration: 'none',
              borderRadius: 3,
              border: '1px solid',
              borderColor: '#E2E8F0',
              bgcolor: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                borderColor: '#0EA5E9',
                boxShadow: '0 12px 28px rgba(14,165,233, 0.16)',
              },
            }}
          >
            <CardContent sx={{ p: 3, minHeight: 190, display: 'flex', flexDirection: 'column' }}>
              <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.5 }}>
                <AutoStoriesIcon sx={{ color: '#0EA5E9' }} />
                <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1.02rem' }}>{feature.title}</Typography>
              </Stack>

              <Typography sx={{ color: '#64748B', lineHeight: 1.6, flex: 1 }}>{feature.shortDescription}</Typography>

              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                <Chip
                  label="View guide"
                  size="small"
                  sx={{ bgcolor: 'rgba(14,165,233, 0.1)', color: '#0EA5E9', fontWeight: 600 }}
                />
                <ArrowForwardIcon sx={{ color: '#0EA5E9' }} />
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  )
}
