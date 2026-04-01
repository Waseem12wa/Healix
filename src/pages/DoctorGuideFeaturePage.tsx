import { Alert, Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates'
import { Link, useParams } from 'react-router-dom'
import { doctorGuideFeatureMap } from './guide/doctorGuideContent'

export default function DoctorGuideFeaturePage() {
  const { featureSlug } = useParams()
  const feature = featureSlug ? doctorGuideFeatureMap[featureSlug] : undefined

  if (!feature) {
    return (
      <Box sx={{ width: '100%', maxWidth: 900, mx: 'auto' }}>
        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: '#E2E8F0' }}>
          <CardContent>
            <Typography sx={{ fontWeight: 700, color: '#1A1A2E', mb: 1 }}>Guide not found</Typography>
            <Typography sx={{ color: '#64748B', mb: 2 }}>The requested doctor feature guide is not available.</Typography>
            <Chip
              component={Link}
              to="/guide/doctor"
              clickable
              icon={<ArrowBackIcon />}
              label="Back to Doctor Guide"
              sx={{ bgcolor: 'rgba(0, 180, 216, 0.1)', color: '#00B4D8', fontWeight: 600 }}
            />
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 950, mx: 'auto' }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Chip
          component={Link}
          to="/guide/doctor"
          clickable
          icon={<ArrowBackIcon />}
          label="Back to Doctor Guide"
          sx={{ alignSelf: 'flex-start', bgcolor: 'rgba(0, 180, 216, 0.1)', color: '#00B4D8', fontWeight: 600 }}
        />
        <Typography sx={{ fontSize: { xs: '2rem', md: '2.4rem' }, fontWeight: 700, color: '#1A1A2E' }}>{feature.title}</Typography>
        <Typography sx={{ color: '#64748B', fontSize: '1rem' }}>{feature.shortDescription}</Typography>
      </Stack>

      <Alert
        severity="info"
        sx={{ mb: 3, borderRadius: 2, bgcolor: 'rgba(0, 180, 216, 0.08)', color: '#1A1A2E', border: '1px solid rgba(0, 180, 216, 0.2)' }}
      >
        This is a guide-only page. It explains workflow only and does not perform doctor actions.
      </Alert>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: '#E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography sx={{ fontWeight: 700, color: '#1A1A2E', mb: 1 }}>Why to use it</Typography>
            <Typography sx={{ color: '#64748B', lineHeight: 1.7 }}>{feature.whyUse}</Typography>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: '#E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <TipsAndUpdatesIcon sx={{ color: '#06D6A0' }} />
              <Typography sx={{ fontWeight: 700, color: '#1A1A2E' }}>Helpful Tips</Typography>
            </Stack>
            <Stack spacing={1.2}>
              {feature.tips.map((tip) => (
                <Typography key={tip} sx={{ color: '#64748B', lineHeight: 1.6 }}>
                  • {tip}
                </Typography>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ mt: 2.5, borderRadius: 3, border: '1px solid', borderColor: '#E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography sx={{ fontWeight: 700, color: '#1A1A2E', mb: 2 }}>How to use it</Typography>
          <Stack spacing={1.4}>
            {feature.steps.map((step, index) => (
              <Stack key={step} direction="row" spacing={1.2} alignItems="flex-start">
                <CheckCircleIcon sx={{ color: '#00B4D8', mt: '2px' }} fontSize="small" />
                <Typography sx={{ color: '#64748B', lineHeight: 1.7 }}>
                  {index + 1}. {step}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
