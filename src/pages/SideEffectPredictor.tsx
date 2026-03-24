import { useMemo, useState } from 'react'
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
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Grid,
  LinearProgress
} from '@mui/material'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import AddIcon from '@mui/icons-material/Add'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '../ui/BackButton'

type SideEffect = {
  effect: string
  severity: 'Low' | 'Moderate' | 'High'
  percentage: number
  frequency: string
  description?: string
}

type PredictionResult = {
  success: boolean
  medicine: string
  sideEffects: SideEffect[]
  summary?: {
    severity_distribution: Record<string, number>
    most_common: string
    total_effects: number
  }
  isFallback: boolean
  error?: string
}

export default function SideEffectPredictor() {
  const theme = useTheme()
  const [medicineInput, setMedicineInput] = useState('')
  const [medicines, setMedicines] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [predictions, setPredictions] = useState<PredictionResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleAddMedicine = (med: string = medicineInput.trim()) => {
    if (!med) return
    if (medicines.includes(med.toLowerCase())) {
      setError('This medicine is already added')
      return
    }
    setMedicines([...medicines, med])
    setMedicineInput('')
    setError(null)
  }

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index))
  }

  const handlePredict = async () => {
    if (medicines.length === 0) {
      setError('Please add at least one medicine')
      return
    }

    setLoading(true)
    setError(null)
    setPredictions([])

    try {
      const results: PredictionResult[] = []

      for (const medication of medicines) {
        try {
          const response = await fetch('http://localhost:5000/api/side-effects/predict', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              medicine: medication,
              age: localStorage.getItem('userAge') || 30
            })
          })

          const data = await response.json()

          if (data.success) {
            results.push({
              success: true,
              medicine: medication,
              sideEffects: data.sideEffects || [],
              summary: data.summary,
              isFallback: data.isFallback
            })
          } else {
            results.push({
              success: false,
              medicine: medication,
              sideEffects: [],
              error: data.error || 'Failed to predict side effects',
              isFallback: false
            })
          }
        } catch (err) {
          results.push({
            success: false,
            medicine: medication,
            sideEffects: [],
            error: err instanceof Error ? err.message : 'Error predicting side effects',
            isFallback: false
          })
        }
      }

      setPredictions(results)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High':
        return theme.palette.error.main
      case 'Moderate':
        return theme.palette.warning.main
      case 'Low':
        return theme.palette.success.main
      default:
        return theme.palette.grey[500]
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'High':
        return <ErrorIcon />
      case 'Moderate':
        return <WarningAmberIcon />
      case 'Low':
        return <CheckCircleIcon />
      default:
        return null
    }
  }

  return (
    <Box>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <BackButton />
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                Side Effect Predictor
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Understand potential side effects of your medications
              </Typography>
            </Box>
            <LocalHospitalIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.2 }} />
          </Stack>
        </Box>

        {/* Input Section */}
        <Card sx={{
          borderRadius: 3,
          boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`
        }}>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Enter Medicines
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Medicine name"
                  placeholder="e.g., Aspirin, Metformin"
                  value={medicineInput}
                  onChange={(e) => setMedicineInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMedicine()}
                  fullWidth
                  disabled={loading}
                />
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleAddMedicine()}
                  disabled={!medicineInput.trim() || loading}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Add
                </Button>
              </Stack>

              {medicines.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                  {medicines.map((med, idx) => (
                    <motion.div key={idx} initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <Chip
                        label={med}
                        onDelete={() => handleRemoveMedicine(idx)}
                        color="primary"
                        variant="outlined"
                      />
                    </motion.div>
                  ))}
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} icon={<ErrorIcon />}>
            {error}
          </Alert>
        )}

        {/* Predict Button */}
        <Button
          variant="contained"
          size="large"
          onClick={handlePredict}
          disabled={medicines.length === 0 || loading}
          startIcon={loading ? <CircularProgress size={20} sx={{ color: 'inherit' }} /> : <LocalHospitalIcon />}
          sx={{ py: 1.5 }}
        >
          {loading ? 'Predicting...' : `Predict Side Effects (${medicines.length})`}
        </Button>

        {/* Results */}
        <AnimatePresence>
          {predictions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Stack spacing={2}>
                {predictions.map((prediction, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card sx={{
                      borderRadius: 3,
                      boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
                      border: `2px solid ${prediction.success ? theme.palette.primary.main : theme.palette.error.main}`
                    }}>
                      <CardContent>
                        <Stack spacing={2}>
                          {/* Header */}
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                              {prediction.medicine}
                            </Typography>
                            {prediction.isFallback && (
                              <Chip
                                label="AI-Generated"
                                size="small"
                                color="info"
                                variant="outlined"
                              />
                            )}
                          </Stack>

                          {prediction.success ? (
                            <>
                              {prediction.summary && (
                                <Grid container spacing={2}>
                                  <Grid size={{ xs: 6, sm: 3 }}>
                                    <Stack alignItems="center">
                                      <Typography variant="caption" color="textSecondary">
                                        Total Effects
                                      </Typography>
                                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                        {prediction.summary.total_effects}
                                      </Typography>
                                    </Stack>
                                  </Grid>
                                  <Grid size={{ xs: 6, sm: 3 }}>
                                    <Stack alignItems="center">
                                      <Typography variant="caption" color="textSecondary">
                                        Most Common
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'center' }}>
                                        {prediction.summary.most_common}
                                      </Typography>
                                    </Stack>
                                  </Grid>
                                  <Grid size={{ xs: 6, sm: 3 }}>
                                    <Stack alignItems="center">
                                      <Typography variant="caption" color="textSecondary">
                                        High Severity
                                      </Typography>
                                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>
                                        {prediction.summary.severity_distribution?.High || 0}
                                      </Typography>
                                    </Stack>
                                  </Grid>
                                  <Grid size={{ xs: 6, sm: 3 }}>
                                    <Stack alignItems="center">
                                      <Typography variant="caption" color="textSecondary">
                                        Moderate Severity
                                      </Typography>
                                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
                                        {prediction.summary.severity_distribution?.Moderate || 0}
                                      </Typography>
                                    </Stack>
                                  </Grid>
                                </Grid>
                              )}

                              <Divider />

                              {/* Side Effects List */}
                              {prediction.sideEffects.length > 0 ? (
                                <Stack spacing={1}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    Reported Side Effects
                                  </Typography>
                                  <AnimatePresence>
                                    {prediction.sideEffects.map((effect, i) => (
                                      <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                      >
                                        <Card variant="outlined" sx={{ p: 1.5 }}>
                                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                            <Box sx={{ flex: 1 }}>
                                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                  {effect.effect}
                                                </Typography>
                                                <Chip
                                                  icon={getSeverityIcon(effect.severity) || undefined}
                                                  label={effect.severity}
                                                  size="small"
                                                  sx={{
                                                    backgroundColor: alpha(getSeverityColor(effect.severity), 0.15),
                                                    color: getSeverityColor(effect.severity),
                                                    fontWeight: 700
                                                  }}
                                                />
                                              </Stack>
                                              {effect.description && (
                                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                                                  {effect.description}
                                                </Typography>
                                              )}
                                              <LinearProgress
                                                variant="determinate"
                                                value={effect.percentage}
                                                sx={{
                                                  height: 6,
                                                  borderRadius: 3,
                                                  backgroundColor: alpha(getSeverityColor(effect.severity), 0.2),
                                                  '& .MuiLinearProgress-bar': {
                                                    backgroundColor: getSeverityColor(effect.severity),
                                                    borderRadius: 3
                                                  }
                                                }}
                                              />
                                              <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                                                {effect.percentage}% prevalence
                                              </Typography>
                                            </Box>
                                          </Stack>
                                        </Card>
                                      </motion.div>
                                    ))}
                                  </AnimatePresence>
                                </Stack>
                              ) : (
                                <Alert severity="success">
                                  No significant side effects found for this medication.
                                </Alert>
                              )}
                            </>
                          ) : (
                            <Alert severity="error">
                              {prediction.error || 'Failed to predict side effects'}
                            </Alert>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </Stack>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Information Card */}
        <Card sx={{ backgroundColor: alpha(theme.palette.info.main, 0.05) }}>
          <CardContent>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  ℹ️ How This Works
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  <Typography variant="body2">
                    This side effect predictor uses advanced AI models to identify potential adverse reactions to medications based on:
                  </Typography>
                  <Stack component="ul" sx={{ pl: 3 }}>
                    <Typography component="li" variant="body2">
                      Clinical database of known side effects
                    </Typography>
                    <Typography component="li" variant="body2">
                      Transformer-based NLP for understanding medicine properties
                    </Typography>
                    <Typography component="li" variant="body2">
                      Named entity recognition for adverse event detection
                    </Typography>
                    <Typography component="li" variant="body2">
                      Prevalence estimations based on clinical data
                    </Typography>
                  </Stack>
                  <Alert severity="warning">
                    ⚠️ This tool is for informational purposes only. Always consult with a healthcare professional before making decisions about medications.
                  </Alert>
                </Stack>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  )
}
