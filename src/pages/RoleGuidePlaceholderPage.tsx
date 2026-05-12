import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Link } from 'react-router-dom'

type RoleGuidePlaceholderPageProps = {
  roleLabel: string
}

export default function RoleGuidePlaceholderPage({ roleLabel }: RoleGuidePlaceholderPageProps) {
  return (
    <Box sx={{ width: '100%', maxWidth: 900, mx: 'auto' }}>
      <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: '#E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <CardContent sx={{ p: 3.5 }}>
          <Stack spacing={1.5}>
            <Chip
              component={Link}
              to="/guide"
              clickable
              icon={<ArrowBackIcon />}
              label="Back to Guide Page"
              sx={{ alignSelf: 'flex-start', bgcolor: 'rgba(14,165,233, 0.1)', color: '#0EA5E9', fontWeight: 600 }}
            />
            <Typography sx={{ fontSize: { xs: '1.9rem', md: '2.3rem' }, fontWeight: 700, color: '#0F172A' }}>
              {roleLabel} Guide
            </Typography>
            <Typography sx={{ color: '#64748B', lineHeight: 1.7 }}>
              This section will be added next. For now, the complete patient guide is ready with feature-by-feature instructions.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
