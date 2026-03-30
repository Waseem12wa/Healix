import { useEffect, useMemo, useState } from 'react'
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import EditNoteIcon from '@mui/icons-material/EditNote'
import HourglassTopIcon from '@mui/icons-material/HourglassTop'
import { createReviewRequest, deleteReviewRequest, getMyReviewRequests, getReviewRequestById, type DoctorReviewRequest, type ReviewFeature } from '../services/reviewService'

type Props = {
  feature: ReviewFeature
  patientQuery: string
  aiResultText: string
  aiResultData?: unknown
  onStatusChange?: (status: DoctorReviewRequest['status']) => void
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

export default function DoctorReviewPrompt({ feature, patientQuery, aiResultText, aiResultData, onStatusChange }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [hideConfirmForCurrentResult, setHideConfirmForCurrentResult] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [request, setRequest] = useState<DoctorReviewRequest | null>(null)
  const [history, setHistory] = useState<DoctorReviewRequest[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'modified'>('all')

  const isPatient = useMemo(() => {
    const role = localStorage.getItem('authRole')
    return role === 'patient'
  }, [])

  const normalizedQuery = patientQuery.trim()
  const normalizedResultText = aiResultText.trim()

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [history])

  const filteredHistory = useMemo(() => {
    if (statusFilter === 'all') return sortedHistory
    return sortedHistory.filter((item) => item.status === statusFilter)
  }, [sortedHistory, statusFilter])

  const hasCurrentRequestInHistory = useMemo(() => {
    if (!normalizedResultText) return false
    return sortedHistory.some((item) => item.patientQuery.trim() === normalizedQuery && item.aiResultText.trim() === normalizedResultText)
  }, [sortedHistory, normalizedQuery, normalizedResultText])

  const canConfirmCurrentResult = normalizedResultText.length > 0 && !hasCurrentRequestInHistory && !hideConfirmForCurrentResult
  const shouldHidePanel = !canConfirmCurrentResult && !historyLoading && history.length === 0

  const showDoctorConfirmMessage = !request || request.status === 'pending'

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

  useEffect(() => {
    if (request?.status) {
      onStatusChange?.(request.status)
    }
  }, [request?.status, onStatusChange])

  useEffect(() => {
    if (!isPatient) return

    let mounted = true

    const loadHistory = async (withLoader = false) => {
      try {
        if (withLoader) {
          setHistoryLoading(true)
        }
        const items = await getMyReviewRequests({ feature, limit: 50 })
        if (!mounted) return
        setHistory(Array.isArray(items) ? items : [])
      } catch {
        if (!mounted) return
        // Keep the prompt usable even if history lookup temporarily fails.
      } finally {
        if (withLoader && mounted) {
          setHistoryLoading(false)
        }
      }
    }

    loadHistory(true)

    const intervalId = window.setInterval(() => {
      loadHistory(false)
    }, 7000)

    return () => {
      mounted = false
      window.clearInterval(intervalId)
    }
  }, [isPatient, feature])

  useEffect(() => {
    if (!history.length) {
      setRequest(null)
      return
    }

    const latest = sortedHistory[0]
    setRequest((prev) => {
      if (!prev) return latest
      const fromHistory = sortedHistory.find((item) => item.id === prev.id)
      return fromHistory || latest
    })
  }, [sortedHistory])

  useEffect(() => {
    setHideConfirmForCurrentResult(false)
  }, [normalizedQuery, normalizedResultText])

  const onConfirm = async () => {
    if (!isPatient || !canConfirmCurrentResult) return

    try {
      setHideConfirmForCurrentResult(true)
      setSubmitting(true)
      setError(null)
      const created = await createReviewRequest({
        feature,
        patientQuery,
        aiResultText,
        aiResultData,
      })
      setRequest(created)
      setHistory((prev) => [created, ...prev.filter((item) => item.id !== created.id)])
    } catch (err: any) {
      setHideConfirmForCurrentResult(false)
      setError(err?.response?.data?.message || 'Failed to send request to assigned doctor')
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (id: string) => {
    try {
      setDeletingId(id)
      setError(null)
      await deleteReviewRequest(id)
      setHistory((prev) => prev.filter((item) => item.id !== id))
      setRequest((prev) => (prev?.id === id ? null : prev))
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete request')
    } finally {
      setDeletingId(null)
    }
  }

  if (!isPatient) {
    return null
  }

  if (shouldHidePanel) {
    return null
  }

  return (
    <Card sx={{ borderRadius: 2.5, border: '1px dashed #9CA3AF', mt: 2 }}>
      <CardContent>
        <Stack spacing={1.5}>
          {showDoctorConfirmMessage && canConfirmCurrentResult && (
            <Typography sx={{ fontWeight: 700, color: '#1F2937' }}>
              You can confirm this with your assigned doctor. Otherwise, you may proceed at your own discretion.
            </Typography>
          )}

          {canConfirmCurrentResult ? (
            <Button
              variant="contained"
              onClick={onConfirm}
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
              sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
            >
              {submitting ? 'Sending to doctor...' : 'Confirm with Doctor'}
            </Button>
          ) : normalizedResultText ? null : (
            <Typography sx={{ fontSize: '0.86rem', color: '#6B7280' }}>
              Perform a search in this feature to create a new doctor confirmation request.
            </Typography>
          )}

          <Divider />

          <Box>
            <Typography sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
              Request History
            </Typography>

            {!historyLoading && sortedHistory.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1, mb: 1.2 }}>
                <Chip label="All" color={statusFilter === 'all' ? 'primary' : 'default'} onClick={() => setStatusFilter('all')} clickable size="small" />
                <Chip label="Pending" color={statusFilter === 'pending' ? 'warning' : 'default'} onClick={() => setStatusFilter('pending')} clickable size="small" />
                <Chip label="Approved" color={statusFilter === 'approved' ? 'success' : 'default'} onClick={() => setStatusFilter('approved')} clickable size="small" />
                <Chip label="Rejected" color={statusFilter === 'rejected' ? 'error' : 'default'} onClick={() => setStatusFilter('rejected')} clickable size="small" />
                <Chip label="Modified" color={statusFilter === 'modified' ? 'info' : 'default'} onClick={() => setStatusFilter('modified')} clickable size="small" />
              </Stack>
            )}

            {historyLoading ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} />
                <Typography sx={{ fontSize: '0.9rem', color: '#6B7280' }}>
                  Loading your previous requests...
                </Typography>
              </Stack>
            ) : sortedHistory.length === 0 ? (
              <Typography sx={{ fontSize: '0.9rem', color: '#6B7280' }}>
                No previous doctor confirmations found for this feature.
              </Typography>
            ) : filteredHistory.length === 0 ? (
              <Typography sx={{ fontSize: '0.9rem', color: '#6B7280' }}>
                No requests found for selected filter.
              </Typography>
            ) : (
              <Stack spacing={1.2}>
                {filteredHistory.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      border: '1px solid #E5E7EB',
                      borderRadius: 2,
                      p: 1.2,
                      backgroundColor: '#F9FAFB',
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      sx={{ mb: 0.8 }}
                    >
                      <Chip
                        icon={statusIcon(item.status)}
                        color={statusColor(item.status)}
                        label={statusLabel(item.status)}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                      <Typography sx={{ fontSize: '0.78rem', color: '#6B7280' }}>
                        {new Date(item.createdAt).toLocaleString()}
                      </Typography>
                    </Stack>

                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>
                      Query
                    </Typography>
                    <Typography sx={{ fontSize: '0.9rem', color: '#1F2937', mb: 0.8 }}>
                      {item.patientQuery || 'N/A'}
                    </Typography>

                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>
                      Result
                    </Typography>
                    <Typography sx={{ fontSize: '0.86rem', color: '#111827', whiteSpace: 'pre-wrap', mb: 0.8 }}>
                      {item.aiResultText}
                    </Typography>

                    {item.status === 'modified' && item.modifiedResultText && (
                      <Alert severity="warning" sx={{ mb: 0.8 }}>
                        Modified result: {item.modifiedResultText}
                      </Alert>
                    )}

                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>
                      Doctor Comment
                    </Typography>
                    <Typography sx={{ fontSize: '0.86rem', color: '#4B5563' }}>
                      {item.doctorActionMessage || 'No response yet'}
                    </Typography>

                    <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() => onDelete(item.id)}
                        disabled={deletingId === item.id}
                      >
                        {deletingId === item.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </CardContent>
    </Card>
  )
}
