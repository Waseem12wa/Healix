import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Typography,
  useTheme,
  alpha,
  Alert,
  Tooltip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material'
import ScienceIcon from '@mui/icons-material/Science'
import AddIcon from '@mui/icons-material/Add'
import ClearAllIcon from '@mui/icons-material/ClearAll'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import BackButton from '../ui/BackButton'
import { correctDrugTerm } from '../utils/medicalAutoCorrect'
import { logPatientActivity } from '../services/patientService'
import DoctorReviewPrompt from '../components/DoctorReviewPrompt'

type Interaction = {
  drug1: string
  drug2: string
  severity: 'None' | 'Mild' | 'Severe'
  severityLabel: string
  percentage: number
  probability: number
  details?: {
    mechanism: string
    symptoms: string
    recommendations: string
    alternatives: string
    dosage_adjustments: string
  }
}


export default function DrugInteractionChecker() {
  const theme = useTheme()
  const [searchParams] = useSearchParams()
  const [input, setInput] = useState('')
  const [drugs, setDrugs] = useState<string[]>([])
  const [results, setResults] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const autoRunKeyRef = useRef('')

  const runCheckFor = async (drugsToCheck: string[]) => {
    setLoading(true)
    setError(null)
    setResults([])

    try {
      const response = await fetch('/api/ddi/check-interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}),
        },
        body: JSON.stringify({ drugs: drugsToCheck }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check interactions')
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to check interactions')
      }

      const interactions: Interaction[] = data.interactions.map((item: any) => ({
        drug1: item.drug1,
        drug2: item.drug2,
        severity: item.severity,
        severityLabel: item.severityLabel,
        percentage: item.percentage,
        probability: item.probability,
        details: item.details
      }))

      setResults(interactions)

      await logPatientActivity({
        category: 'drug-interaction',
        title: 'Drug interaction check',
        details: `Checked ${drugsToCheck.length} medicines`,
        metadata: {
          drugs: drugsToCheck,
          totalPairs: data.totalPairs,
          successfulPredictions: data.successfulPredictions,
          failedPredictions: data.failedPredictions,
        }
      }).catch(() => {
        // non-blocking
      })

      if (data.errors && data.errors.length > 0) {
        const errorMessages = data.errors.map((err: any) =>
          `${err.drug1} + ${err.drug2}: ${err.error}`
        ).join('; ')
        setError(`Some predictions failed: ${errorMessages}`)
      }

    } catch (err: any) {
      console.error('Error checking interactions:', err)
      setError(err.message || 'Failed to check drug interactions. Please ensure the DDI service is running.')
    } finally {
      setLoading(false)
    }
  }

  const addDrug = () => {
    const rawName = input.trim()
    if (!rawName) return

    const correctedName = correctDrugTerm(rawName)
    const displayName = correctedName === rawName ? rawName : correctedName

    if (!drugs.includes(displayName)) {
      setDrugs([...drugs, displayName])
      if (correctedName !== rawName) {
        setError(`Corrected '${rawName}' to '${displayName}'`)
      }
    }

    setInput('')
  }

  const removeDrug = (name: string) => {
    setDrugs(drugs.filter((d) => d !== name))
    setError(null)
  }

  const handleCheck = async () => {
    await runCheckFor(drugs)
  }

  useEffect(() => {
    const drugsParam = searchParams.get('drugs') || ''
    if (!drugsParam) return

    const parsed = drugsParam
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => correctDrugTerm(item) || item)

    const unique = Array.from(new Set(parsed.map((item) => item.toLowerCase())))
      .map((lower) => parsed.find((item) => item.toLowerCase() === lower) as string)

    if (unique.length < 2) return

    const key = unique.join('|').toLowerCase()
    if (autoRunKeyRef.current === key) return
    autoRunKeyRef.current = key

    setDrugs(unique)
    runCheckFor(unique)
  }, [searchParams])

  const summary = useMemo(() => {
    const counts = { None: 0, Mild: 0, Severe: 0 }
    results.forEach((r) => { counts[r.severity] += 1 })
    const total = results.length
    return { total, ...counts }
  }, [results])

  const reviewResultText = useMemo(() => {
    if (results.length === 0) return ''
    return results
      .map((item) => `${item.drug1} + ${item.drug2}: ${item.severityLabel} (${item.percentage}%)`)
      .join('\n')
  }, [results])

  const severityColor = (s: Interaction['severity']) => {
    if (s === 'None') return theme.palette.success.main
    if (s === 'Mild') return theme.palette.warning.main
    return theme.palette.error.main
  }

  return (
    <Box sx={{
      width: '100%',
      minHeight: '100vh',
      bgcolor: theme.palette.background.default,
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Background Decorative Elements */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'none'
      }}>
        <Box
          sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 70%)`,
            filter: 'blur(60px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.05)} 0%, transparent 70%)`,
            filter: 'blur(50px)',
          }}
        />
      </Box>

      {/* Main Content */}
      <Box sx={{ position: 'relative', zIndex: 1, p: { xs: 2, md: 4 } }}>
        <Stack spacing={4}>
          <BackButton />

          {/* Header */}
          <Stack direction="row" spacing={2.5} alignItems="center">
            <Box sx={{
              width: 60,
              height: 60,
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.1) 0%, rgba(6, 214, 160, 0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid',
              borderColor: 'rgba(0, 180, 216, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 180, 216, 0.1)'
            }}>
              <ScienceIcon sx={{ fontSize: 32, color: '#00B4D8' }} />
            </Box>
            <Box>
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{
                  background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '1.75rem', md: '2.25rem' },
                  lineHeight: 1.2,
                  mb: 0.5
                }}
              >
                Drug Interaction Checker
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Check for potential interactions between medications
              </Typography>
            </Box>
          </Stack>

          {/* Input Card */}
          <Card sx={{
            borderRadius: '24px',
            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack spacing={3}>
                <Typography variant="h6" fontWeight={700} sx={{
                  background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Add Medications
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Enter medication name"
                    placeholder="e.g., Aspirin, Metformin"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    fullWidth
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (input.trim()) {
                          addDrug()
                        } else if (drugs.length >= 2) {
                          handleCheck()
                        }
                      }
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />
                  <Tooltip title="Add medication">
                    <Button
                      variant="contained"
                      onClick={addDrug}
                      startIcon={<AddIcon />}
                      disabled={!input.trim()}
                      sx={{
                        borderRadius: 3,
                        px: 3,
                        background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #0096C7 0%, #05B586 100%)',
                        },
                        '&:disabled': {
                          background: alpha(theme.palette.action.disabled, 0.12),
                          color: theme.palette.action.disabled
                        }
                      }}
                    >
                      Add
                    </Button>
                  </Tooltip>
                  <Tooltip title="Clear all">
                    <Button
                      variant="outlined"
                      onClick={() => { setDrugs([]); setResults([]) }}
                      startIcon={<ClearAllIcon />}
                      disabled={drugs.length === 0}
                      sx={{
                        borderRadius: 3,
                        px: 3,
                        borderColor: '#00B4D8',
                        color: '#00B4D8',
                        '&:hover': {
                          borderColor: '#0096C7',
                          bgcolor: alpha('#00B4D8', 0.05)
                        },
                        '&:disabled': {
                          borderColor: theme.palette.action.disabled,
                          color: theme.palette.action.disabled
                        }
                      }}
                    >
                      Clear
                    </Button>
                  </Tooltip>
                </Stack>
                {drugs.length === 0 ? (
                  <Alert severity="info" sx={{ borderRadius: 2, width: '100%' }}>
                    Add at least 2 medications to check for interactions
                  </Alert>
                ) : (
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    <AnimatePresence>
                      {drugs.map((d) => (
                        <motion.div
                          key={d}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Chip
                            label={d}
                            onDelete={() => removeDrug(d)}
                            sx={{
                              borderRadius: '8px',
                              bgcolor: alpha('#00B4D8', 0.1),
                              color: '#00B4D8',
                              fontWeight: 600,
                              '& .MuiChip-deleteIcon': {
                                color: '#00B4D8',
                                '&:hover': {
                                  color: '#0096C7'
                                }
                              }
                            }}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </Stack>
                )}
                {error && (
                  <Alert severity="error" sx={{ borderRadius: 2, width: '100%' }}>
                    {error}
                  </Alert>
                )}
                <Button
                  variant="contained"
                  onClick={handleCheck}
                  disabled={drugs.length < 2 || loading}
                  sx={{
                    borderRadius: 3,
                    px: 4,
                    py: 1.5,
                    background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                    boxShadow: '0 4px 12px rgba(0, 180, 216, 0.3)',
                    alignSelf: 'flex-start',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0096C7 0%, #05B586 100%)',
                      boxShadow: '0 6px 16px rgba(0, 180, 216, 0.4)'
                    },
                    '&:disabled': {
                      background: alpha(theme.palette.action.disabled, 0.12),
                      color: theme.palette.action.disabled
                    }
                  }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1, color: 'inherit' }} />
                      Analyzing...
                    </>
                  ) : (
                    'Check Interactions'
                  )}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Summary Card */}
          {results.length > 0 && (
            <Card sx={{
              borderRadius: '24px',
              boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
              bgcolor: alpha(theme.palette.background.paper, 0.6),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Typography variant="h6" fontWeight={700} sx={{
                  mb: 2,
                  background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Summary
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
                  <Chip
                    label={`Total pairs: ${summary.total}`}
                    sx={{
                      borderRadius: '12px',
                      px: 2,
                      py: 2.5,
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main
                    }}
                  />
                  <Chip
                    label={`Safe: ${summary.None}`}
                    sx={{
                      borderRadius: '12px',
                      px: 2,
                      py: 2.5,
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      bgcolor: alpha(theme.palette.success.main, 0.15),
                      color: theme.palette.success.dark
                    }}
                  />
                  <Chip
                    label={`Caution: ${summary.Mild}`}
                    sx={{
                      borderRadius: '12px',
                      px: 2,
                      py: 2.5,
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      bgcolor: alpha(theme.palette.warning.main, 0.15),
                      color: theme.palette.warning.dark
                    }}
                  />
                  <Chip
                    label={`Harmful: ${summary.Severe}`}
                    sx={{
                      borderRadius: '12px',
                      px: 2,
                      py: 2.5,
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      bgcolor: alpha(theme.palette.error.main, 0.15),
                      color: theme.palette.error.dark
                    }}
                  />
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Results Card */}
          {results.length > 0 && (
            <DoctorReviewPrompt
              feature="ddi"
              patientQuery={drugs.join(', ')}
              aiResultText={reviewResultText}
              aiResultData={results}
            />
          )}

          {results.length > 0 && (
            <Card sx={{
              borderRadius: '24px',
              boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
              bgcolor: alpha(theme.palette.background.paper, 0.6),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Typography variant="h6" fontWeight={700} sx={{
                  mb: 3,
                  background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Interaction Details
                </Typography>
                <Stack spacing={2}>
                  <AnimatePresence>
                    {results.map((r, idx) => {
                      const SeverityIcon = r.severity === 'None' ? CheckCircleIcon : r.severity === 'Mild' ? WarningAmberIcon : ErrorIcon
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                        >
                          <Box
                            sx={{
                              p: 2.5,
                              borderRadius: '16px',
                              bgcolor: alpha(theme.palette.background.paper, 0.5),
                              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                              display: 'grid',
                              gridTemplateColumns: { xs: '1fr', sm: 'auto 1fr 140px 2.5fr' },
                              gap: 2,
                              alignItems: 'center',
                              position: 'relative',
                              transition: 'all 0.2s',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`
                              }
                            }}
                          >
                            <Box
                              sx={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: 6,
                                bgcolor: severityColor(r.severity),
                                borderTopLeftRadius: 16,
                                borderBottomLeftRadius: 16
                              }}
                            />
                            <Box sx={{ pl: 2, display: 'flex', alignItems: 'center' }}>
                              <SeverityIcon sx={{ color: severityColor(r.severity), fontSize: 28 }} />
                            </Box>
                            <Typography
                              fontWeight={700}
                              sx={{
                                fontSize: '1rem',
                                background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                              }}
                            >
                              {r.drug1} + {r.drug2}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                label={`${r.percentage}%`}
                                size="small"
                                sx={{
                                  borderRadius: '8px',
                                  fontWeight: 700,
                                  bgcolor: alpha(severityColor(r.severity), 0.15),
                                  color: severityColor(r.severity),
                                  border: `1px solid ${alpha(severityColor(r.severity), 0.3)}`
                                }}
                              />
                              <Chip
                                label={r.severityLabel}
                                size="small"
                                sx={{
                                  borderRadius: '8px',
                                  fontWeight: 700,
                                  bgcolor: alpha(severityColor(r.severity), 0.15),
                                  color: severityColor(r.severity),
                                  border: `1px solid ${alpha(severityColor(r.severity), 0.3)}`
                                }}
                              />
                            </Stack>
                            <Typography sx={{ color: 'text.primary', lineHeight: 1.6, fontSize: '0.95rem' }}>
                              {r.severity === 'None'
                                ? 'No significant interaction detected. These medications can generally be used together safely.'
                                : r.severity === 'Mild'
                                  ? `Moderate interaction risk (${r.percentage}%). Monitor for side effects and consult your healthcare provider.`
                                  : `High interaction risk (${r.percentage}%). Avoid using together if possible. Consult your doctor immediately.`
                              }
                            </Typography>

                            {/* LLM Details - Professional Template */}
                            {r.details && (
                              <Box mt={2.5}>
                                <Accordion
                                  sx={{
                                    borderRadius: '12px !important',
                                    '&:before': { display: 'none' },
                                    boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
                                    bgcolor: alpha(theme.palette.background.paper, 0.8)
                                  }}
                                >
                                  <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{
                                      borderRadius: '12px',
                                      '&:hover': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.02)
                                      }
                                    }}
                                  >
                                    <Typography variant="subtitle2" fontWeight={700} sx={{
                                      background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                                      WebkitBackgroundClip: 'text',
                                      WebkitTextFillColor: 'transparent'
                                    }}>
                                      📋 View Detailed Clinical Information
                                    </Typography>
                                  </AccordionSummary>
                                  <AccordionDetails sx={{ pt: 2 }}>
                                    <Stack spacing={2.5}>
                                      {/* Mechanism */}
                                      <Box>
                                        <Typography variant="subtitle2" fontWeight={700} sx={{
                                          color: '#00B4D8',
                                          mb: 1,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 0.5
                                        }}>
                                          🔬 Mechanism of Interaction
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                          color: 'text.secondary',
                                          lineHeight: 1.7,
                                          whiteSpace: 'pre-line'
                                        }}>
                                          {r.details.mechanism}
                                        </Typography>
                                      </Box>

                                      <Divider />

                                      {/* Symptoms */}
                                      <Box>
                                        <Typography variant="subtitle2" fontWeight={700} sx={{
                                          color: theme.palette.warning.main,
                                          mb: 1,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 0.5
                                        }}>
                                          ⚠️ Symptoms to Watch For
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                          color: 'text.secondary',
                                          lineHeight: 1.7,
                                          whiteSpace: 'pre-line'
                                        }}>
                                          {r.details.symptoms}
                                        </Typography>
                                      </Box>

                                      <Divider />

                                      {/* Recommendations */}
                                      <Box>
                                        <Typography variant="subtitle2" fontWeight={700} sx={{
                                          color: theme.palette.info.main,
                                          mb: 1,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 0.5
                                        }}>
                                          💊 Clinical Recommendations
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                          color: 'text.secondary',
                                          lineHeight: 1.7,
                                          whiteSpace: 'pre-line'
                                        }}>
                                          {r.details.recommendations}
                                        </Typography>
                                      </Box>

                                      <Divider />

                                      {/* Alternatives */}
                                      <Box>
                                        <Typography variant="subtitle2" fontWeight={700} sx={{
                                          color: theme.palette.success.main,
                                          mb: 1,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 0.5
                                        }}>
                                          🔄 Alternative Medications
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                          color: 'text.secondary',
                                          lineHeight: 1.7,
                                          whiteSpace: 'pre-line'
                                        }}>
                                          {r.details.alternatives}
                                        </Typography>
                                      </Box>

                                      <Divider />

                                      {/* Dosage Adjustments */}
                                      <Box>
                                        <Typography variant="subtitle2" fontWeight={700} sx={{
                                          color: theme.palette.secondary.main,
                                          mb: 1,
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 0.5
                                        }}>
                                          ⏰ Dosage & Timing Adjustments
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                          color: 'text.secondary',
                                          lineHeight: 1.7,
                                          whiteSpace: 'pre-line'
                                        }}>
                                          {r.details.dosage_adjustments}
                                        </Typography>
                                      </Box>
                                    </Stack>
                                  </AccordionDetails>
                                </Accordion>
                              </Box>
                            )}
                          </Box>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Box>
    </Box>
  )
}
