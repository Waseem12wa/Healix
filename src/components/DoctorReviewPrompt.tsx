import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import EditNoteIcon from '@mui/icons-material/EditNote'
import HourglassTopIcon from '@mui/icons-material/HourglassTop'
import { createReviewRequest, getReviewRequestById, type DoctorReviewRequest, type ReviewFeature } from '../services/reviewService'

type Props = {
  feature: ReviewFeature
  patientQuery: string
  aiResultText: string
  aiResultData?: unknown
}

const statusLabel = (status: DoctorReviewRequest['status']) => {
  if (status === 'approved') return 'Approved'
  if (status === 'rejected') return 'Rejected'
  if (status === 'modified') return 'Modified'
  return 'Pending Doctor Review'
}

const statusIcon = (status: DoctorReviewRequest['status']) => {
  if (status === 'approved') return <CheckCircleIcon fontSize="small" />
  if (status === 'rejected') return <CancelIcon fontSize="small" />
  if (status === 'modified') return <EditNoteIcon fontSize="small" />
  return <HourglassTopIcon fontSize="small" />
}

const statusColor = (status: DoctorReviewRequest['status']) => {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'error'
  if (status === 'modified') return 'info'
  return 'warning'
}

export default function DoctorReviewPrompt({ feature, patientQuery, aiResultText, aiResultData }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [request, setRequest] = useState<DoctorReviewRequest | null>(null)

  const canSubmit = useMemo(() => {
    const role = localStorage.getItem('authRole')
    return role === 'patient' && aiResultText.trim().length > 0
  }, [aiResultText])

  useEffect(() => {
    if (!request?.id || request.status !== 'pending') return

    const intervalId = window.setInterval(async () => {
      try {
        const latest = await getReviewRequestById(request.id)
        setRequest(latest)
      } catch {
        // keep polling quietly
      }
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [request?.id, request?.status])

  const onConfirm = async () => {
    if (!canSubmit) return

    try {
      setSubmitting(true)
      setError(null)
      const created = await createReviewRequest({
        feature,
        patientQuery,
        aiResultText,
        aiResultData,
      })
      setRequest(created)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send request to assigned doctor')
    } finally {
      setSubmitting(false)
    }
  }

  if (!canSubmit) {
    return null
  }

  return (
    <Card sx={{ borderRadius: 2.5, border: '1px dashed #9CA3AF', mt: 2 }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Typography sx={{ fontWeight: 700, color: '#1F2937' }}>
            You can confirm this with your assigned doctor. Otherwise, you may proceed at your own discretion.
          </Typography>

          {request ? (
            <Box>
              <Chip
                icon={statusIcon(request.status)}
                color={statusColor(request.status)}
                label={statusLabel(request.status)}
                sx={{ fontWeight: 700 }}
              />
              {request.doctorActionMessage && (
                <Alert severity="info" sx={{ mt: 1.5 }}>
                  Doctor note: {request.doctorActionMessage}
                </Alert>
              )}
              {request.status === 'modified' && request.modifiedResultText && (
                <Alert severity="warning" sx={{ mt: 1.5 }}>
                  Modified result: {request.modifiedResultText}
                </Alert>
              )}
            </Box>
          ) : (
            <Button
              variant="contained"
              onClick={onConfirm}
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
              sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
            >
              {submitting ? 'Sending to doctor...' : 'Confirm with Doctor'}
            </Button>
          )}

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </CardContent>
    </Card>
  )
}
