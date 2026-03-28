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
  Divider
} from '@mui/material'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import MedicationIcon from '@mui/icons-material/Medication'
import AddIcon from '@mui/icons-material/Add'
import ClearAllIcon from '@mui/icons-material/ClearAll'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '../ui/BackButton'
import { correctDrugTerm, correctFoodTerm } from '../utils/medicalAutoCorrect'
import { logPatientActivity } from '../services/patientService'

type FoodInteraction = {
  medicine: string
  food: string
  severity: 'Low' | 'Moderate' | 'High'
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


export default function DrugFoodInteractionChecker() {
  const theme = useTheme()
  const [medicineInput, setMedicineInput] = useState('')
  const [foodInput, setFoodInput] = useState('')
  const [medicines, setMedicines] = useState<string[]>([])
  const [foods, setFoods] = useState<string[]>([])
  const [results, setResults] = useState<FoodInteraction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addMedicine = () => {
    const raw = medicineInput.trim()
    if (!raw) return
    const corrected = correctDrugTerm(raw)
    const value = corrected || raw

    if (!medicines.includes(value)) {
      setMedicines([...medicines, value])
      if (value !== raw) setError(`Corrected '${raw}' to '${value}'`)
    }

    setMedicineInput('')
  }

  const addFood = (food?: string) => {
    const raw = (food || foodInput).trim()
    if (!raw) return
    const corrected = correctFoodTerm(raw)
    const value = corrected || raw
    if (!foods.includes(value)) {
      setFoods([...foods, value])
      if (value !== raw) setError(`Corrected '${raw}' to '${value}'`)
    }
    setFoodInput('')
  }

  const removeMedicine = (name: string) => {
    setMedicines(medicines.filter((m) => m !== name))
    setError(null)
  }

  const removeFood = (name: string) => {
    setFoods(foods.filter((f) => f !== name))
    setError(null)
  }

  const handleCheck = async () => {
    setLoading(true)
    setError(null)
    setResults([])

    try {
      const interactions: FoodInteraction[] = []
      const errors: string[] = []

      // Check each medicine-food combination
      for (const medicine of medicines) {
        for (const food of foods) {
          try {
            const response = await fetch('http://localhost:5000/api/dfi/predict', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}),
              },
              body: JSON.stringify({ medicine, food }),
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
              errors.push(`${medicine} + ${food}: ${data.error || 'Failed'}`)
              continue
            }

            interactions.push({
              medicine: data.medicine,
              food: data.food,
              severity: data.severity,
              severityLabel: data.severity_label,
              percentage: data.percentage,
              probability: data.probability,
              details: data.details
            })

          } catch (err: any) {
            errors.push(`${medicine} + ${food}: ${err.message}`)
          }
        }
      }

      setResults(interactions)

      await logPatientActivity({
        category: 'food-interaction',
        title: 'Drug-food interaction check',
        details: `Checked ${medicines.length} medicines with ${foods.length} foods`,
        metadata: {
          medicines,
          foods,
          totalCombinations: medicines.length * foods.length,
          successfulPredictions: interactions.length,
          failedPredictions: errors.length,
        }
      }).catch(() => {
        // non-blocking
      })

      if (errors.length > 0) {
        setError(`Some predictions failed: ${errors.join('; ')}`)
      }

    } catch (err: any) {
      console.error('Error checking interactions:', err)
      setError(err.message || 'Failed to check food interactions')
    } finally {
      setLoading(false)
    }
  }

  const summary = useMemo(() => {
    const counts = { Low: 0, Moderate: 0, High: 0 }
    results.forEach((r) => { counts[r.severity] += 1 })
    const total = results.length
    return { total, ...counts }
  }, [results])

  const severityColor = (s: FoodInteraction['severity']) => {
    if (s === 'Low') return theme.palette.success.main
    if (s === 'Moderate') return theme.palette.warning.main
    return theme.palette.error.main
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4, px: 2 }}>
      <BackButton />

      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Stack direction="row" spacing={2} alignItems="center" mb={4}>
            <RestaurantIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            <Box>
              <Typography variant="h3" fontWeight="bold">
                Drug-Food Interaction Checker
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Check how foods affect your medications
              </Typography>
            </Box>
          </Stack>
        </motion.div>

        {/* Input Section */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            {/* Medicine Input */}
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MedicationIcon /> Medicines
            </Typography>
            <Stack direction="row" spacing={2} mb={2}>
              <TextField
                fullWidth
                placeholder="Enter medicine name (e.g., Warfarin)"
                value={medicineInput}
                onChange={(e) => setMedicineInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (medicineInput.trim()) {
                      addMedicine()
                    } else if (medicines.length > 0 && foods.length > 0) {
                      handleCheck()
                    }
                  }
                }}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={addMedicine}
                disabled={!medicineInput.trim()}
              >
                Add
              </Button>
            </Stack>

            {/* Medicine Chips */}
            {medicines.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" mb={3}>
                {medicines.map((med) => (
                  <Chip
                    key={med}
                    label={med}
                    onDelete={() => removeMedicine(med)}
                    color="primary"
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Food Input */}
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RestaurantIcon /> Foods
            </Typography>
            <Stack direction="row" spacing={2} mb={2}>
              <TextField
                fullWidth
                placeholder="Enter food name (e.g., Grapefruit, Alcohol, Dairy)"
                value={foodInput}
                onChange={(e) => setFoodInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (foodInput.trim()) {
                      addFood()
                    } else if (medicines.length > 0 && foods.length > 0) {
                      handleCheck()
                    }
                  }
                }}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => addFood()}
                disabled={!foodInput.trim()}
              >
                Add
              </Button>
            </Stack>

            {/* Food Chips */}
            {foods.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
                {foods.map((food) => (
                  <Chip
                    key={food}
                    label={food}
                    onDelete={() => removeFood(food)}
                    color="secondary"
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
            )}

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} mt={3}>
              <Button
                variant="contained"
                size="large"
                onClick={handleCheck}
                disabled={medicines.length === 0 || foods.length === 0 || loading}
                startIcon={loading ? <CircularProgress size={20} /> : <RestaurantIcon />}
                fullWidth
              >
                {loading ? 'Checking Interactions...' : 'Check Interactions'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<ClearAllIcon />}
                onClick={() => {
                  setMedicines([])
                  setFoods([])
                  setResults([])
                  setError(null)
                }}
              >
                Clear All
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert severity="warning" sx={{ mb: 4 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Results */}
        {results.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Interaction Results
                </Typography>
                <Stack direction="row" spacing={2} mb={3}>
                  <Chip
                    label={`Total: ${summary.total}`}
                    color="default"
                  />
                  <Chip
                    label={`High Risk: ${summary.High}`}
                    sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.main' }}
                  />
                  <Chip
                    label={`Moderate: ${summary.Moderate}`}
                    sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main' }}
                  />
                  <Chip
                    label={`Low Risk: ${summary.Low}`}
                    sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main' }}
                  />
                </Stack>

                <Stack spacing={2}>
                  <AnimatePresence>
                    {results.map((interaction, idx) => (
                      <motion.div
                        key={`${interaction.medicine}-${interaction.food}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Card
                          sx={{
                            borderLeft: `4px solid ${severityColor(interaction.severity)}`,
                            bgcolor: alpha(severityColor(interaction.severity), 0.05)
                          }}
                        >
                          <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                              <Typography variant="h6">
                                {interaction.medicine} + {interaction.food}
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                {interaction.severity === 'High' && <ErrorIcon color="error" />}
                                {interaction.severity === 'Moderate' && <WarningAmberIcon color="warning" />}
                                {interaction.severity === 'Low' && <CheckCircleIcon color="success" />}
                                <Chip
                                  label={`${interaction.percentage}%`}
                                  size="small"
                                  sx={{
                                    bgcolor: severityColor(interaction.severity),
                                    color: 'white',
                                    fontWeight: 'bold'
                                  }}
                                />
                                <Chip
                                  label={interaction.severityLabel}
                                  size="small"
                                  color={
                                    interaction.severity === 'High' ? 'error' :
                                      interaction.severity === 'Moderate' ? 'warning' : 'success'
                                  }
                                />
                              </Stack>
                            </Stack>

                            <Typography variant="body2" color="text.secondary" mb={2}>
                              {interaction.severity === 'High' && 'Avoid this combination. Consult your healthcare provider immediately.'}
                              {interaction.severity === 'Moderate' && 'Use caution. Monitor for side effects and consult your healthcare provider.'}
                              {interaction.severity === 'Low' && 'No significant interaction detected. These can generally be used together safely.'}
                            </Typography>

                            {/* LLM Details */}
                            {interaction.details && (
                              <Box mt={2}>
                                <Accordion>
                                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography variant="subtitle2" fontWeight="bold">
                                      View Detailed Clinical Information
                                    </Typography>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    <Stack spacing={2}>
                                      <Box>
                                        <Typography variant="subtitle2" fontWeight="bold" color="primary" gutterBottom>
                                          Mechanism
                                        </Typography>
                                        <Typography variant="body2">{interaction.details.mechanism}</Typography>
                                      </Box>
                                      <Divider />
                                      <Box>
                                        <Typography variant="subtitle2" fontWeight="bold" color="warning.main" gutterBottom>
                                          Symptoms to Watch For
                                        </Typography>
                                        <Typography variant="body2">{interaction.details.symptoms}</Typography>
                                      </Box>
                                      <Divider />
                                      <Box>
                                        <Typography variant="subtitle2" fontWeight="bold" color="info.main" gutterBottom>
                                          Clinical Recommendations
                                        </Typography>
                                        <Typography variant="body2">{interaction.details.recommendations}</Typography>
                                      </Box>
                                      <Divider />
                                      <Box>
                                        <Typography variant="subtitle2" fontWeight="bold" color="success.main" gutterBottom>
                                          Alternative Foods
                                        </Typography>
                                        <Typography variant="body2">{interaction.details.alternatives}</Typography>
                                      </Box>
                                      <Divider />
                                      <Box>
                                        <Typography variant="subtitle2" fontWeight="bold" color="secondary.main" gutterBottom>
                                          Dosage & Timing
                                        </Typography>
                                        <Typography variant="body2">{interaction.details.dosage_adjustments}</Typography>
                                      </Box>
                                    </Stack>
                                  </AccordionDetails>
                                </Accordion>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </Box>
    </Box>
  )
}
