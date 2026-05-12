import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import HistoryIcon from '@mui/icons-material/History'
import RefreshIcon from '@mui/icons-material/Refresh'
import BackButton from '../ui/BackButton'
import { getPatientActivities } from '../services/patientService'

type ActivityItem = {
  _id?: string
  category?: string
  title?: string
  details?: string
  createdAt?: string
}

const isFeatureReviewActivity = (activity: ActivityItem) => {
  const category = String(activity.category || '').toLowerCase()
  const text = `${activity.title || ''} ${activity.details || ''}`.toLowerCase()

  if (category === 'doctor-review' || category === 'review-request') {
    return true
  }

  return /doctor review|review request|approved your request|rejected your request|modified your result/.test(text)
}

export default function DoctorHistory() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadActivities = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getPatientActivities(undefined, 100)
      setActivities(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to load doctor history. Please try again.')
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadActivities()
  }, [])

  const visibleActivities = activities.filter((activity) => !isFeatureReviewActivity(activity))

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 2.5, md: 3.5 }, px: { xs: 3, md: 4 } }}>
      <Stack spacing={2.5}>
        <Box>
          <BackButton />
        </Box>

        <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.5} sx={{ mb: 2.5 }}>
              <Stack direction="row" alignItems="center" spacing={1.25}>
                <HistoryIcon sx={{ color: '#10B981' }} />
                <Typography sx={{ fontSize: { xs: '1.45rem', md: '2rem' }, fontWeight: 900, color: '#10B981' }}>
                  Doctor Activity History
                </Typography>
              </Stack>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={loadActivities}
                sx={{ borderRadius: 2 }}
              >
                Refresh
              </Button>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={28} />
              </Box>
            ) : visibleActivities.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No history items to show here.
              </Typography>
            ) : (
              <Stack spacing={1.25}>
                {visibleActivities.map((activity, index) => (
                  <Box key={activity._id || index}>
                    <Stack direction="row" justifyContent="space-between" alignItems="start" gap={1.5}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>
                          {activity.title || 'Untitled activity'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          {activity.createdAt ? new Date(activity.createdAt).toLocaleString() : ''}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={activity.category || 'other'}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Stack>
                    {activity.details && (
                      <Typography variant="body2" sx={{ mt: 0.75, color: 'text.secondary' }}>
                        {activity.details}
                      </Typography>
                    )}
                    {index < visibleActivities.length - 1 && <Divider sx={{ mt: 1.25 }} />}
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  )
}
