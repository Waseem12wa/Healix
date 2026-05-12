import { useEffect, useState, useRef } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  useTheme,
  alpha,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material'
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm'
import EmailIcon from '@mui/icons-material/Email'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RefreshIcon from '@mui/icons-material/Refresh'
import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { motion } from 'framer-motion'
import BackButton from '../ui/BackButton'
import {
  savePatientReminderEmail,
  getPatientReminderEmail,
  getPatientReminders,
  deletePatientReminderSet,
  type DoctorReminder,
} from '../services/reminderService'

export default function MedicationReminder() {
  const theme = useTheme()
  const [userRole, setUserRole] = useState<'patient' | 'doctor' | null>(null)
  const [reminderEmail, setReminderEmail] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSet, setEmailSet] = useState(false)
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [reminders, setReminders] = useState<DoctorReminder[]>([])
  const [remindersLoading, setRemindersLoading] = useState(false)
  const [deletingReminderId, setDeletingReminderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [newReminderIds, setNewReminderIds] = useState<Set<string>>(new Set())
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousReminderIdsRef = useRef<Set<string>>(new Set())

  const patientEmail = localStorage.getItem('userEmail')

  useEffect(() => {
    const role = localStorage.getItem('authRole')
    setUserRole(role as 'patient' | 'doctor' | null)

    if (role === 'patient' && patientEmail) {
      // Check if patient has already set reminder email
      checkEmailPreference()
      // Load patient's reminders
      loadPatientReminders()
    }
  }, [])

  const checkEmailPreference = async () => {
    try {
      if (!patientEmail) return
      const data = await getPatientReminderEmail(patientEmail)
      if (data.isSet) {
        setReminderEmail(data.reminderEmail || '')
        setEmailInput(data.reminderEmail || '')
        setEmailSet(true)
      }
    } catch (error) {
      console.error('Error checking email preference:', error)
    }
  }

  const loadPatientReminders = async (silent = false) => {
    try {
      if (!patientEmail) return
      if (!silent) {
        setRemindersLoading(true)
      }
      const data = await getPatientReminders(patientEmail)
      const newData = Array.isArray(data) ? data : []

      // Detect only truly new reminder IDs based on previous successful fetch.
      const incomingIds = new Set(newData.map(r => r._id))
      const newIds = new Set(incomingIds)
      previousReminderIdsRef.current.forEach(id => newIds.delete(id))
      previousReminderIdsRef.current = incomingIds

      // Keep current cards visible during polling; avoid unnecessary re-renders.
      setReminders(prev => {
        if (
          prev.length === newData.length
          && prev.every((item, index) => item._id === newData[index]?._id)
        ) {
          return prev
        }
        return newData
      })

      if (newIds.size > 0) {
        setNewReminderIds(newIds)
        if (highlightTimeoutRef.current) {
          clearTimeout(highlightTimeoutRef.current)
        }
        highlightTimeoutRef.current = setTimeout(() => setNewReminderIds(new Set()), 5000)
      }

      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error loading reminders:', error)
    } finally {
      if (!silent) {
        setRemindersLoading(false)
      }
    }
  }

    // Start polling when email is set
    useEffect(() => {
      if (!emailSet || !patientEmail) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        return
      }

      // Load reminders immediately with full loading state.
      loadPatientReminders(false)

      // Poll in background without clearing the UI list.
      pollingIntervalRef.current = setInterval(() => {
        loadPatientReminders(true)
      }, 5000)

      // Cleanup interval on unmount
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        if (highlightTimeoutRef.current) {
          clearTimeout(highlightTimeoutRef.current)
          highlightTimeoutRef.current = null
        }
      }
    }, [emailSet, patientEmail])
  const handleSaveEmail = async () => {
    if (!emailInput.trim()) {
      setError('Please enter a valid email')
      return
    }

    // Basic email validation
    if (!/^\S+@\S+\.\S+$/.test(emailInput)) {
      setError('Please enter a valid email address')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const data = await savePatientReminderEmail(patientEmail || '', emailInput)

      if (data) {
        setReminderEmail(emailInput)
        setEmailSet(true)
        setIsEditingEmail(false)
        setEmailInput(emailInput)
        localStorage.setItem('reminderEmail', emailInput)
      } else {
        setError('Failed to save email preference')
      }
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Failed to save email preference')
      console.error('Error saving email:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReminderSet = async (reminder: DoctorReminder) => {
    try {
      setDeletingReminderId(reminder._id)
      setError(null)

      await deletePatientReminderSet({
        medicineName: reminder.medicine,
        dose: reminder.dose,
        doctorEmail: reminder.doctorEmail,
        startDate: reminder.startDate,
        duration: reminder.duration,
        frequency: reminder.frequency,
      })

      await loadPatientReminders(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete reminder')
    } finally {
      setDeletingReminderId(null)
    }
  }

  // If not a patient, don't show the feature
  if (userRole !== 'patient') {
    return null
  }

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        bgcolor: theme.palette.background.default,
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Background Decorative Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
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
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(52,211,153,0.14) 0%, rgba(6,182,212,0.14) 50%, rgba(37,99,235,0.14) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid',
                borderColor: 'rgba(14,165,233, 0.2)',
                boxShadow: '0 8px 32px rgba(14,165,233, 0.1)',
              }}
            >
              <AccessAlarmIcon sx={{ fontSize: 32, color: '#0EA5E9' }} />
            </Box>
            <Box>
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{
                  background: 'linear-gradient(135deg, #34D399 0%, #06B6D4 50%, #2563EB 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '1.75rem', md: '2.25rem' },
                  lineHeight: 1.2,
                  mb: 0.5,
                }}
              >
                Medication Reminders
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {emailSet ? 'Your reminders from your doctor' : 'Get medication reminders from your doctor'}
              </Typography>
            </Box>
          </Stack>

          {/* Email Preference Section - Only show if not set */}
          {!emailSet && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card
                sx={{
                  borderRadius: '24px',
                  boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Stack spacing={3}>
                    <Box>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{
                          background: 'linear-gradient(135deg, #34D399 0%, #06B6D4 50%, #2563EB 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          mb: 1,
                        }}
                      >
                        Set Up Email Reminders
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Your doctor will send you medication reminders. Would you like to receive them by email?
                      </Typography>
                    </Box>

                    <Stack spacing={2}>
                      <TextField
                        type="email"
                        label="Email for reminders"
                        placeholder="Enter your email"
                        value={emailInput}
                        onChange={(e) => {
                          setEmailInput(e.target.value)
                          setError(null)
                        }}
                        fullWidth
                        disabled={loading}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                      />

                      {error && (
                        <Alert severity="error" sx={{ borderRadius: 2 }}>
                          {error}
                        </Alert>
                      )}

                      <Button
                        onClick={handleSaveEmail}
                        disabled={loading || !emailInput.trim()}
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <EmailIcon />}
                        sx={{
                          borderRadius: 3,
                          px: 4,
                          py: 1.5,
                          background: 'linear-gradient(135deg, #34D399 0%, #06B6D4 50%, #2563EB 100%)',
                          boxShadow: '0 4px 12px rgba(14,165,233, 0.3)',
                          alignSelf: 'flex-start',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 50%, #34D399 100%)',
                            boxShadow: '0 6px 16px rgba(14,165,233, 0.4)',
                          },
                        }}
                      >
                        {loading ? 'Saving...' : 'Save Email'}
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Email Confirmed Badge */}
          {emailSet && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card
                sx={{
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, rgba(16,185,129, 0.1) 0%, rgba(14,165,233, 0.1) 100%)',
                  border: '1px solid #10B981',
                }}
              >
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                      <Stack direction="row" spacing={2} alignItems="center">
                        <CheckCircleIcon sx={{ fontSize: 32, color: '#10b981' }} />
                        <Box>
                          <Typography fontWeight={700} sx={{ color: '#10b981' }}>
                            Email reminders enabled
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Reminders will be sent to {reminderEmail}
                          </Typography>
                        </Box>
                      </Stack>

                      {!isEditingEmail && (
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => {
                            setError(null)
                            setEmailInput(reminderEmail)
                            setIsEditingEmail(true)
                          }}
                          sx={{ borderRadius: 2 }}
                        >
                          Change Email
                        </Button>
                      )}
                    </Stack>

                    {isEditingEmail && (
                      <Stack spacing={1.5}>
                        <TextField
                          type="email"
                          label="Update reminder email"
                          value={emailInput}
                          onChange={(e) => {
                            setEmailInput(e.target.value)
                            setError(null)
                          }}
                          fullWidth
                          disabled={loading}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        />

                        {error && (
                          <Alert severity="error" sx={{ borderRadius: 2 }}>
                            {error}
                          </Alert>
                        )}

                        <Stack direction="row" spacing={1.5}>
                          <Button
                            variant="contained"
                            onClick={handleSaveEmail}
                            disabled={loading || !emailInput.trim()}
                            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <EmailIcon />}
                            sx={{
                              borderRadius: 2,
                              background: 'linear-gradient(135deg, #34D399 0%, #06B6D4 50%, #2563EB 100%)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 50%, #34D399 100%)',
                              },
                            }}
                          >
                            {loading ? 'Saving...' : 'Save Changes'}
                          </Button>

                          <Button
                            variant="outlined"
                            onClick={() => {
                              setError(null)
                              setEmailInput(reminderEmail)
                              setIsEditingEmail(false)
                            }}
                            disabled={loading}
                            sx={{ borderRadius: 2 }}
                          >
                            Cancel
                          </Button>
                        </Stack>
                      </Stack>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Active Reminders Section */}
          {emailSet && (
            <Box>
              {error && (
                <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                  background: 'linear-gradient(135deg, #34D399 0%, #06B6D4 50%, #2563EB 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2,
                }}
              >
                Your Active Reminders
                {lastUpdated && (
                 <Typography 
                   variant="caption" 
                   sx={{ 
                     display: 'block', 
                     background: 'none',
                     WebkitTextFillColor: 'unset',
                     color: 'text.secondary',
                     mt: 0.5
                   }}
                 >
                   Last updated: {lastUpdated.toLocaleTimeString()}
                 </Typography>
                )}
              </Typography>

              {remindersLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : reminders.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  No active reminders yet. Your doctor will send reminders here once they set them up.
                </Alert>
              ) : (
                <Stack spacing={2}>
                  {reminders.map((reminder, idx) => (
                    <motion.div
                      key={reminder._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                    >
                      <Card
                        sx={{
                          borderRadius: '24px',
                          boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
                          bgcolor: alpha(theme.palette.background.paper, 0.6),
                          backdropFilter: 'blur(20px)',
                            border: newReminderIds.has(reminder._id) 
                              ? `2px solid #10B981` 
                              : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          borderLeft: `6px solid #10B981`,
                            background: newReminderIds.has(reminder._id)
                              ? `linear-gradient(135deg, ${alpha('#10B981', 0.08)} 0%, ${alpha('#0EA5E9', 0.08)} 100%)`
                              : alpha(theme.palette.background.paper, 0.6),
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.1)}`,
                          },
                        }}
                      >
                        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                          <Stack spacing={2}>
                            {newReminderIds.has(reminder._id) && (
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Chip 
                                  label="JUST ADDED" 
                                  size="small"
                                  sx={{
                                    background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 50%, #34D399 100%)',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                    animation: 'pulse 1.5s ease-in-out infinite',
                                    '@keyframes pulse': {
                                      '0%, 100%': { opacity: 1 },
                                      '50%': { opacity: 0.6 }
                                    }
                                  }}
                                />
                              </Box>
                            )}
                            <Box>
                              <Typography
                                variant="h6"
                                fontWeight={700}
                                sx={{
                                  fontSize: '1.15rem',
                                  background: 'linear-gradient(135deg, #34D399 0%, #06B6D4 50%, #2563EB 100%)',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent',
                                }}
                              >
                                {reminder.medicine} — {reminder.dose}
                              </Typography>
                            </Box>

                            <Stack direction="row" justifyContent="flex-end">
                              <Button
                                color="error"
                                variant="outlined"
                                size="small"
                                startIcon={<DeleteOutlineIcon />}
                                onClick={() => handleDeleteReminderSet(reminder)}
                                disabled={deletingReminderId === reminder._id}
                                sx={{ borderRadius: 2 }}
                              >
                                {deletingReminderId === reminder._id ? 'Deleting...' : 'Delete'}
                              </Button>
                            </Stack>

                            <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ gap: 1 }}>
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Frequency
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                  {reminder.frequency} time{reminder.frequency > 1 ? 's' : ''} per day
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Total Reminders
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                  {reminder.reminderCount} reminders
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Set by
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                  Dr. {reminder.doctorName}
                                </Typography>
                              </Box>
                            </Stack>

                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                              <Box
                                sx={{
                                  flex: 1,
                                  p: 1.5,
                                  bgcolor: alpha('#0EA5E9', 0.1),
                                  borderRadius: 2,
                                  border: `1px solid ${alpha('#0EA5E9', 0.2)}`,
                                }}
                              >
                                <Typography variant="caption" color="text.secondary" display="block">
                                  First Reminder
                                </Typography>
                                <Typography variant="body2" fontWeight={600} sx={{ color: '#0EA5E9' }}>
                                  {new Date(reminder.firstReminder).toLocaleString()}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  flex: 1,
                                  p: 1.5,
                                  bgcolor: alpha('#10B981', 0.1),
                                  borderRadius: 2,
                                  border: `1px solid ${alpha('#10B981', 0.2)}`,
                                }}
                              >
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Last Reminder
                                </Typography>
                                <Typography variant="body2" fontWeight={600} sx={{ color: '#10B981' }}>
                                  {new Date(reminder.lastReminder).toLocaleString()}
                                </Typography>
                              </Box>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </Stack>
              )}
            </Box>
          )}
        </Stack>
      </Box>
    </Box>
  )
}

