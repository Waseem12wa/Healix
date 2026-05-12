import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormHelperText,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import BackButton from '../ui/BackButton'
import { deleteReviewRequest, getMyReviewRequests, takeReviewAction, type DoctorReviewRequest, type ReviewFeature } from '../services/reviewService'

type Props = {
  feature: ReviewFeature
}

const FEATURE_LABELS: Record<ReviewFeature, string> = {
  ddi: 'Drug-Drug Interaction',
  dfi: 'Drug-Food Interaction',
  alternatives: 'Drug Alternatives',
  'side-effects': 'Side Effects',
  'ai-assistant': 'AI Health Assistant',
  'medication-pharmacy': 'Medication / Pharmacy',
  'health-summary': 'Record Summarization',
}

const panelStyle = {
  borderRadius: 2,
  border: '1px solid #E2E8F0',
  backgroundColor: '#F8FAFC',
  p: 1.5,
}

const renderDdiDetails = (data: any) => {
  if (!Array.isArray(data) || data.length === 0) return null

  return (
    <Stack spacing={1}>
      <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Clinical Pair Results</Typography>
      {data.map((item: any, index: number) => (
        <Box key={`${item.drug1 || 'd1'}-${item.drug2 || 'd2'}-${index}`} sx={panelStyle}>
          <Typography sx={{ fontWeight: 700, color: '#1E293B' }}>
            {item.drug1} + {item.drug2}
          </Typography>
          <Typography sx={{ fontSize: '0.86rem', color: '#475569' }}>
            Severity: {item.severityLabel || item.severity} | Risk: {item.percentage}%
          </Typography>
        </Box>
      ))}
    </Stack>
  )
}

const renderDfiDetails = (data: any) => {
  if (!Array.isArray(data) || data.length === 0) return null

  return (
    <Stack spacing={1}>
      <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Medication-Food Combinations</Typography>
      {data.map((item: any, index: number) => (
        <Box key={`${item.medicine || 'm'}-${item.food || 'f'}-${index}`} sx={panelStyle}>
          <Typography sx={{ fontWeight: 700, color: '#1E293B' }}>
            {item.medicine} + {item.food}
          </Typography>
          <Typography sx={{ fontSize: '0.86rem', color: '#475569' }}>
            Severity: {item.severityLabel || item.severity} | Risk: {item.percentage}%
          </Typography>
        </Box>
      ))}
    </Stack>
  )
}

const renderAlternativesDetails = (data: any) => {
  const alternatives = Array.isArray(data?.alternatives) ? data.alternatives : []
  if (alternatives.length === 0) return null

  return (
    <Stack spacing={1}>
      <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Suggested Alternatives</Typography>
      {alternatives.map((item: any, index: number) => (
        <Box key={`${item.name || 'alt'}-${index}`} sx={panelStyle}>
          <Typography sx={{ fontWeight: 700, color: '#1E293B' }}>{item.name}</Typography>
          <Typography sx={{ fontSize: '0.86rem', color: '#475569' }}>
            Similarity: {item.similarity}% | Category: {item.category || 'N/A'} | Price: {item.actualSellingPrice ?? item.price ?? 'N/A'}
          </Typography>
        </Box>
      ))}
    </Stack>
  )
}

const renderSideEffectsDetails = (data: any) => {
  if (!Array.isArray(data) || data.length === 0) return null

  return (
    <Stack spacing={1}>
      <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Predicted Side Effects (with percentages)</Typography>
      {data.map((prediction: any, index: number) => (
        <Box key={`${prediction.medicine || 'med'}-${index}`} sx={panelStyle}>
          <Typography sx={{ fontWeight: 700, color: '#1E293B', mb: 0.5 }}>
            Medicine: {prediction.medicine || 'N/A'}
          </Typography>
          {Array.isArray(prediction.sideEffects) && prediction.sideEffects.length > 0 ? (
            <Stack spacing={0.6}>
              {prediction.sideEffects.map((effect: any, effectIndex: number) => (
                <Typography key={`${effect.effect || 'effect'}-${effectIndex}`} sx={{ fontSize: '0.85rem', color: '#475569' }}>
                  • {effect.effect} | Severity: {effect.severity} | Percentage: {effect.percentage}%
                </Typography>
              ))}
            </Stack>
          ) : (
            <Typography sx={{ fontSize: '0.85rem', color: '#64748B' }}>
              No side effects listed for this prediction.
            </Typography>
          )}
        </Box>
      ))}
    </Stack>
  )
}

const renderAiAssistantDetails = (data: any) => {
  if (!data || typeof data !== 'object') return null

  const actions = Array.isArray(data.actions) ? data.actions : []

  return (
    <Box sx={panelStyle}>
      <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', mb: 0.5 }}>Assistant Metadata</Typography>
      {actions.length > 0 ? (
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
          {actions.map((action: any, index: number) => (
            <Chip key={`${action.label || 'action'}-${index}`} label={action.label || 'Action'} size="small" variant="outlined" />
          ))}
        </Stack>
      ) : (
        <Typography sx={{ fontSize: '0.85rem', color: '#64748B' }}>No shortcut actions attached.</Typography>
      )}
    </Box>
  )
}

const renderMedicationDetails = (data: any) => {
  const medicines = Array.isArray(data?.medicines) ? data.medicines : []
  if (medicines.length === 0) return null

  return (
    <Stack spacing={1}>
      <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>Top Medicines in Patient View</Typography>
      {medicines.map((medicine: any, index: number) => (
        <Box key={`${medicine._id || medicine.medicineName || 'med'}-${index}`} sx={panelStyle}>
          <Typography sx={{ fontWeight: 700, color: '#1E293B' }}>{medicine.medicineName}</Typography>
          <Typography sx={{ fontSize: '0.86rem', color: '#475569' }}>
            Price: {medicine.sellingPrice} | Stock: {medicine.quantity} | Category: {medicine.category || 'N/A'}
          </Typography>
        </Box>
      ))}
    </Stack>
  )
}

const renderHealthSummaryDetails = (data: any) => {
  if (!data || typeof data !== 'object') return null

  const conditions = Array.isArray(data?.medicalSummary?.identified_conditions) ? data.medicalSummary.identified_conditions : []
  const medications = Array.isArray(data?.medicalSummary?.suggested_medications) ? data.medicalSummary.suggested_medications : []
  const actions = Array.isArray(data?.medicalSummary?.recommended_actions) ? data.medicalSummary.recommended_actions : []

  return (
    <Stack spacing={1}>
      <Box sx={panelStyle}>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', mb: 0.5 }}>Summary File</Typography>
        <Typography sx={{ fontSize: '0.86rem', color: '#475569' }}>{data.fileName || 'Uploaded record'}</Typography>
      </Box>

      {conditions.length > 0 && (
        <Box sx={panelStyle}>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', mb: 0.5 }}>Identified Conditions</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
            {conditions.map((condition: string, index: number) => (
              <Chip key={`${condition}-${index}`} label={condition} size="small" color="secondary" variant="outlined" />
            ))}
          </Stack>
        </Box>
      )}

      {medications.length > 0 && (
        <Box sx={panelStyle}>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', mb: 0.5 }}>Suggested Medications</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
            {medications.map((medication: string, index: number) => (
              <Chip key={`${medication}-${index}`} label={medication} size="small" variant="outlined" />
            ))}
          </Stack>
        </Box>
      )}

      {actions.length > 0 && (
        <Box sx={panelStyle}>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', mb: 0.5 }}>Recommended Actions</Typography>
          <Stack spacing={0.4}>
            {actions.map((entry: string, index: number) => (
              <Typography key={`${entry}-${index}`} sx={{ fontSize: '0.85rem', color: '#475569' }}>• {entry}</Typography>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  )
}

const renderProfessionalDetails = (feature: ReviewFeature, aiResultData: unknown) => {
  const data = aiResultData as any

  if (feature === 'ddi') return renderDdiDetails(data)
  if (feature === 'dfi') return renderDfiDetails(data)
  if (feature === 'alternatives') return renderAlternativesDetails(data)
  if (feature === 'side-effects') return renderSideEffectsDetails(data)
  if (feature === 'ai-assistant') return renderAiAssistantDetails(data)
  if (feature === 'medication-pharmacy') return renderMedicationDetails(data)
  if (feature === 'health-summary') return renderHealthSummaryDetails(data)
  return null
}

export default function DoctorFeatureReviews({ feature }: Props) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<DoctorReviewRequest[]>([])
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)
  const [modifyTextById, setModifyTextById] = useState<Record<string, string>>({})
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'modified'>('all')
  const lastItemsSignatureRef = useRef('')

  const load = async (options?: { silent?: boolean }) => {
    const silent = Boolean(options?.silent)
    try {
      if (!silent) {
        setLoading(true)
        setError(null)
      }
      const data = await getMyReviewRequests({ limit: 200, feature })
      const nextItems = Array.isArray(data) ? data : []
      const nextSignature = nextItems.map((item) => `${item.id}:${item.status}:${item.updatedAt}`).join('|')

      if (nextSignature !== lastItemsSignatureRef.current) {
        lastItemsSignatureRef.current = nextSignature
        setItems(nextItems)
      }
    } catch (err: any) {
      if (!silent) {
        setError(err?.response?.data?.message || 'Failed to load feature review requests')
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    load()

    const intervalId = window.setInterval(() => {
      if (!document.hidden) {
        load({ silent: true })
      }
    }, 15000)

    return () => window.clearInterval(intervalId)
  }, [feature])

  const title = useMemo(() => FEATURE_LABELS[feature], [feature])
  const filteredItems = useMemo(() => {
    if (statusFilter === 'all') return items
    return items.filter((item) => item.status === statusFilter)
  }, [items, statusFilter])

  const handleAction = async (item: DoctorReviewRequest, action: 'approved' | 'rejected' | 'modified') => {
    try {
      setActionLoadingId(item.id)
      const modifiedResultText = modifyTextById[item.id] || ''
      await takeReviewAction(item.id, {
        action,
        doctorActionMessage: action === 'modified' ? 'Modified and approved by doctor' : `Marked as ${action} by doctor`,
        modifiedResultText: action === 'modified' ? modifiedResultText : undefined,
      })
      setItems((prev) => prev.map((request) => (
        request.id === item.id
          ? {
              ...request,
              status: action,
              doctorActionMessage: action === 'modified' ? 'Modified and approved by doctor' : `Marked as ${action} by doctor`,
              modifiedResultText: action === 'modified' ? modifiedResultText : '',
              reviewedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : request
      )))
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to process doctor action')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDelete = async (item: DoctorReviewRequest) => {
    try {
      setDeleteLoadingId(item.id)
      setError(null)
      await deleteReviewRequest(item.id)
      setItems((prev) => prev.filter((request) => request.id !== item.id))
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete request')
    } finally {
      setDeleteLoadingId(null)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(140deg, #ECFEFF 0%, #F0FDFA 35%, #EFF6FF 100%)', py: 4, px: 2 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <BackButton />

        <Stack spacing={3} sx={{ mt: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A' }}>
                {title} Reviews
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                Review patient requests and decide whether to approve, reject, modify, or manually delete.
              </Typography>
            </Box>
            <Button variant="outlined" onClick={() => { load() }} sx={{ textTransform: 'none' }}>
              Refresh
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
            <Chip label="All" color={statusFilter === 'all' ? 'primary' : 'default'} onClick={() => setStatusFilter('all')} clickable />
            <Chip label="Pending" color={statusFilter === 'pending' ? 'warning' : 'default'} onClick={() => setStatusFilter('pending')} clickable />
            <Chip label="Approved" color={statusFilter === 'approved' ? 'success' : 'default'} onClick={() => setStatusFilter('approved')} clickable />
            <Chip label="Rejected" color={statusFilter === 'rejected' ? 'error' : 'default'} onClick={() => setStatusFilter('rejected')} clickable />
            <Chip label="Modified" color={statusFilter === 'modified' ? 'info' : 'default'} onClick={() => setStatusFilter('modified')} clickable />
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}

          {loading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
              <CircularProgress />
              <Typography sx={{ mt: 2, color: '#64748B' }}>Loading saved requests...</Typography>
            </Stack>
          ) : filteredItems.length === 0 ? (
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #E2E8F0' }}>
              <CardContent>
                <Typography sx={{ fontSize: '1rem', color: '#0F172A', fontWeight: 700 }}>
                  No requests found for selected filter
                </Typography>
                <Typography sx={{ fontSize: '0.9rem', color: '#64748B', mt: 0.5 }}>
                  Patient confirmations in this feature remain here until deleted manually.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Stack spacing={2}>
              {filteredItems.map((item) => {
                const modifyText = modifyTextById[item.id] || ''
                const busy = actionLoadingId === item.id || deleteLoadingId === item.id
                const isPending = item.status === 'pending'

                return (
                  <Card key={item.id} elevation={0} sx={{ borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(15,23,42,0.05)' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={1.5}>
                        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1}>
                          <Box>
                            <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>
                              Patient: {item.patientName}
                            </Typography>
                            <Typography sx={{ fontSize: '0.85rem', color: '#64748B' }}>{item.patientEmail}</Typography>
                          </Box>
                          <Chip label={item.featureLabel || title} sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }} />
                        </Stack>

                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
                          <Chip
                            label={item.status.toUpperCase()}
                            color={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'error' : item.status === 'modified' ? 'info' : 'warning'}
                            size="small"
                          />
                          <Typography sx={{ fontSize: '0.78rem', color: '#64748B' }}>
                            Requested: {new Date(item.createdAt).toLocaleString()}
                          </Typography>
                        </Stack>

                        <Box>
                          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', mb: 0.4 }}>Patient Query</Typography>
                          <Typography sx={{ fontSize: '0.9rem', color: '#1F2937' }}>
                            {item.patientQuery || 'N/A'}
                          </Typography>
                        </Box>

                        <Box>
                          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', mb: 0.4 }}>AI-Generated Result</Typography>
                          <Typography sx={{ fontSize: '0.9rem', color: '#1F2937', whiteSpace: 'pre-wrap' }}>
                            {item.aiResultText}
                          </Typography>
                        </Box>

                        {item.modifiedResultText && (
                          <Alert severity="warning">Modified result: {item.modifiedResultText}</Alert>
                        )}

                        {item.doctorActionMessage && (
                          <Alert severity="info">Doctor comment: {item.doctorActionMessage}</Alert>
                        )}

                        {renderProfessionalDetails(item.feature, item.aiResultData)}

                        {isPending ? (
                          <>
                            <TextField
                              label="Modify result (optional)"
                              multiline
                              minRows={2}
                              value={modifyText}
                              onChange={(event) => {
                                const value = event.target.value
                                setModifyTextById((prev) => ({ ...prev, [item.id]: value }))
                              }}
                            />
                            <FormHelperText>Required only when using Modify.</FormHelperText>

                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                              <Button
                                variant="contained"
                                color="success"
                                onClick={() => handleAction(item, 'approved')}
                                disabled={busy}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="contained"
                                color="error"
                                onClick={() => handleAction(item, 'rejected')}
                                disabled={busy}
                              >
                                Reject
                              </Button>
                              <Button
                                variant="contained"
                                color="info"
                                onClick={() => handleAction(item, 'modified')}
                                disabled={busy || !modifyText.trim()}
                              >
                                Modify
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                onClick={() => handleDelete(item)}
                                disabled={busy}
                              >
                                Delete
                              </Button>
                            </Stack>
                          </>
                        ) : (
                          <>
                            <Divider />
                            <Stack direction="row" spacing={1}>
                              <Button
                                variant="outlined"
                                color="error"
                                onClick={() => handleDelete(item)}
                                disabled={busy}
                              >
                                Delete
                              </Button>
                            </Stack>
                          </>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                )
              })}
            </Stack>
          )}
        </Stack>
      </Box>
    </Box>
  )
}
