import { useMemo, useState } from 'react'
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
import NotificationsIcon from '@mui/icons-material/Notifications'
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead'
import CircleIcon from '@mui/icons-material/Circle'
import LaunchIcon from '@mui/icons-material/Launch'
import BackButton from '../ui/BackButton'
import { useNotifications } from '../hooks/useNotifications'
import { useNavigate } from 'react-router-dom'
import { getReviewRequestById } from '../services/reviewService'

const typeLabel = (type: string) => {
  if (type === 'appointment_request') return 'Appointment Request'
  if (type === 'appointment_approved') return 'Appointment Approved'
  if (type === 'appointment_rejected') return 'Appointment Rejected'
  if (type === 'appointment_cancelled') return 'Appointment Cancelled'
  if (type === 'doctor_review_request') return 'Doctor Review Request'
  if (type === 'doctor_review_result') return 'Doctor Review Result'
  return 'Notification'
}

const typeColor = (type: string): 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info' => {
  if (type === 'appointment_approved' || type === 'doctor_review_result') return 'success'
  if (type === 'appointment_rejected') return 'error'
  if (type === 'appointment_request' || type === 'doctor_review_request') return 'warning'
  if (type === 'appointment_cancelled') return 'default'
  return 'info'
}

export default function Notifications() {
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    loadNotifications,
  } = useNotifications()
  const [openingId, setOpeningId] = useState<string | null>(null)

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [notifications])

  const featureToPatientPath: Record<string, string> = {
    ddi: '/tools/drug-interactions',
    dfi: '/tools/drug-food-interactions',
    alternatives: '/tools/drug-alternatives',
    'side-effects': '/tools/side-effects',
    'ai-assistant': '/tools/ai-chatbot',
    'medication-pharmacy': '/shop/medicines',
    'health-summary': '/tools/health-summary',
  }

  const resolveNotificationPath = async (item: { type: string; reviewRequestId?: string }) => {
    if (item.type.startsWith('appointment_')) {
      return '/tools/appointments'
    }

    if ((item.type === 'doctor_review_request' || item.type === 'doctor_review_result') && item.reviewRequestId) {
      try {
        const review = await getReviewRequestById(item.reviewRequestId)
        const role = localStorage.getItem('authRole') || ''
        if (role === 'doctor') {
          return `/doctor-reviews/${review.feature}`
        }
        return featureToPatientPath[review.feature] || '/dashboard'
      } catch {
        // Fall back to dashboards when review metadata fetch is unavailable.
      }
    }

    const role = localStorage.getItem('authRole') || ''
    return role === 'doctor' ? '/doctor-dashboard' : '/dashboard'
  }

  const handleOpenNotification = async (item: { _id: string; read: boolean; type: string; reviewRequestId?: string }) => {
    try {
      setOpeningId(item._id)
      if (!item.read) {
        await markAsRead(item._id)
      }
      const path = await resolveNotificationPath(item)
      navigate(path)
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 2.5, md: 3.5 }, px: { xs: 3, md: 4 } }}>
      <Stack spacing={2.5}>
        <Box>
          <BackButton />
        </Box>

        <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={1.5} flexWrap="wrap">
                <Stack direction="row" alignItems="center" spacing={1.25}>
                  <NotificationsIcon sx={{ color: '#06D6A0' }} />
                  <Box>
                    <Typography sx={{ fontSize: { xs: '1.35rem', md: '1.9rem' }, fontWeight: 900, color: '#1A1A2E' }}>
                      Notifications
                    </Typography>
                    <Typography sx={{ color: '#64748B', fontSize: '0.9rem' }}>
                      {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All notifications are read'}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1}>
                  <Button variant="outlined" onClick={loadNotifications} sx={{ textTransform: 'none' }}>
                    Refresh
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<MarkEmailReadIcon />}
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                    sx={{ textTransform: 'none' }}
                  >
                    Mark all as read
                  </Button>
                </Stack>
              </Stack>

              {loading ? (
                <Stack alignItems="center" justifyContent="center" sx={{ py: 7 }}>
                  <CircularProgress />
                  <Typography sx={{ mt: 1.5, color: '#64748B' }}>Loading notifications...</Typography>
                </Stack>
              ) : sortedNotifications.length === 0 ? (
                <Alert severity="info">
                  No notifications yet. New doctor and appointment updates will appear here.
                </Alert>
              ) : (
                <Stack spacing={1.25}>
                  {sortedNotifications.map((item, index) => (
                    <Box
                      key={item._id}
                      sx={{
                        border: '1px solid #E2E8F0',
                        borderRadius: 2,
                        p: 1.5,
                        bgcolor: item.read ? '#FFFFFF' : '#F8FAFC',
                      }}
                    >
                      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1.2}>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                            {!item.read && <CircleIcon sx={{ color: '#2563EB', fontSize: 10 }} />}
                            <Typography sx={{ fontWeight: 800, color: '#1A1A2E' }}>{item.title}</Typography>
                            <Chip label={typeLabel(item.type)} color={typeColor(item.type)} size="small" />
                          </Stack>

                          <Typography sx={{ fontSize: '0.93rem', color: '#334155', whiteSpace: 'pre-wrap' }}>
                            {item.message}
                          </Typography>

                          <Typography sx={{ fontSize: '0.78rem', color: '#64748B', mt: 0.7 }}>
                            {new Date(item.createdAt).toLocaleString()}
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} alignItems="center" sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}>
                          {!item.read && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => markAsRead(item._id)}
                              sx={{ textTransform: 'none' }}
                            >
                              Mark as read
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<LaunchIcon />}
                            onClick={() => handleOpenNotification(item)}
                            disabled={openingId === item._id}
                            sx={{ textTransform: 'none' }}
                          >
                            {openingId === item._id ? 'Opening...' : 'Open'}
                          </Button>
                        </Stack>
                      </Stack>

                      {index < sortedNotifications.length - 1 && <Divider sx={{ mt: 1.25 }} />}
                    </Box>
                  ))}
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  )
}
