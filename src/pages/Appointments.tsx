import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material'
import { motion } from 'framer-motion'
import BackButton from '../ui/BackButton'
import DeleteIcon from '@mui/icons-material/Delete'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import EventIcon from '@mui/icons-material/Event'
import SearchIcon from '@mui/icons-material/Search'
import PersonIcon from '@mui/icons-material/Person'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'

interface Doctor {
  id: string
  email: string
  name: string
  specialization: string
  subSpecialization?: string
  experience: number
  inPersonFee: number
  onlineFee?: number
  city: string
  clinicName: string
  availability: {
    workingDays: string[]
    startTime: string
    endTime: string
    slotDuration: number
  }
  languages: string[]
  bio: string
}

interface Appointment {
  _id?: string
  id?: number
  doctorName: string
  doctorId?: string
  specialization: string
  date: string
  time: string
  location: string
  status: 'confirmed' | 'pending' | 'cancelled' | 'approved' | 'rejected'
  notes: string
  consultationType?: string
  fee?: number
}

export default function Appointments() {
  const [tabValue, setTabValue] = useState(0) // 0 = Browse Doctors, 1 = My Appointments
  const [loading, setLoading] = useState(false)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [specializationFilter, setSpecializationFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [error, setError] = useState('')

  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)

  const [bookingForm, setBookingForm] = useState({
    date: '',
    time: '',
    consultationType: 'in-person',
    notes: '',
  })

  // Load doctors on mount
  useEffect(() => {
    if (tabValue === 0) {
      searchDoctors()
    } else if (tabValue === 1) {
      loadAppointments()
    }
  }, [tabValue])

  // Load patient appointments
  const loadAppointments = async () => {
    setLoadingAppointments(true)
    try {
      const userEmail = localStorage.getItem('userEmail')
      if (!userEmail) {
        setError('User email not found. Please login again.')
        return
      }

      const response = await fetch(`http://localhost:5000/api/appointments/patient?email=${encodeURIComponent(userEmail)}`)
      const data = await response.json()

      if (data.success) {
        setAppointments(data.data)
      } else {
        setError(data.message || 'Failed to load appointments')
      }
    } catch (err: any) {
      console.error('Error loading appointments:', err)
      setError('Failed to load appointments. Please try again.')
    } finally {
      setLoadingAppointments(false)
    }
  }

  const searchDoctors = async () => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('name', searchQuery)
      if (specializationFilter) params.append('specialization', specializationFilter)
      if (cityFilter) params.append('city', cityFilter)

      const response = await fetch(`http://localhost:5000/api/doctors/search?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setDoctors(data.data)
      } else {
        setError(data.message || 'Failed to search doctors')
      }
    } catch (err: any) {
      console.error('Error searching doctors:', err)
      setError('Failed to search doctors. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBookAppointment = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setBookingForm({
      date: '',
      time: '',
      consultationType: 'in-person',
      notes: '',
    })
    setBookingDialogOpen(true)
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDoctor) return

    setLoading(true)
    setError('')

    try {
      const userEmail = localStorage.getItem('userEmail')
      if (!userEmail) {
        setError('User email not found. Please login again.')
        setLoading(false)
        return
      }

      const bookingData = {
        patientEmail: userEmail,
        doctorId: selectedDoctor.id,
        date: bookingForm.date,
        time: bookingForm.time,
        consultationType: bookingForm.consultationType,
        notes: bookingForm.notes
      }

      console.log('📅 Booking appointment with:', {
        ...bookingData,
        doctorIdType: typeof selectedDoctor.id,
        selectedDoctor: selectedDoctor
      })

      const response = await fetch('http://localhost:5000/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('❌ Non-JSON response received:', text.substring(0, 500))
        setError(`Server error (${response.status}): The server returned an HTML page instead of JSON. Please check if the server is running.`)
        setLoading(false)
        return
      }

      const data = await response.json()
      console.log('📥 Appointment booking response:', data)

      if (!response.ok) {
        console.error('❌ Appointment booking failed:', {
          status: response.status,
          message: data.message,
          error: data.error
        })
        setError(data.message || `Failed to book appointment (${response.status})`)
        setLoading(false)
        return
      }

      if (data.success) {
        console.log('✅ Appointment booked successfully!')
        setBookingDialogOpen(false)
        setSelectedDoctor(null)
        setBookingForm({
          date: '',
          time: '',
          consultationType: 'in-person',
          notes: ''
        })
        setTabValue(1) // Switch to My Appointments tab
        loadAppointments() // Reload appointments
      } else {
        setError(data.message || 'Failed to book appointment')
      }
    } catch (err: any) {
      console.error('❌ Booking error:', err)

      // More detailed error message
      let errorMessage = 'Failed to book appointment. Please try again.'
      if (err.message) {
        errorMessage = err.message
      } else if (err instanceof Error) {
        errorMessage = err.message
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number | string) => {
    try {
      const userEmail = localStorage.getItem('userEmail')
      if (!userEmail) {
        setError('User email not found. Please login again.')
        return
      }

      const appointmentId = typeof id === 'string' ? id : appointments.find(a => a.id === id)?._id
      if (!appointmentId) {
        setError('Appointment not found')
        return
      }

      const response = await fetch(`http://localhost:5000/api/appointments/${appointmentId}?userEmail=${encodeURIComponent(userEmail)}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        loadAppointments() // Reload appointments
      } else {
        setError(data.message || 'Failed to cancel appointment')
      }
    } catch (err: any) {
      console.error('Error cancelling appointment:', err)
      setError('Failed to cancel appointment. Please try again.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'approved':
        return 'success'
      case 'pending':
        return 'warning'
      case 'cancelled':
      case 'rejected':
        return 'error'
      default:
        return 'default'
    }
  }

  const formatTime = (time: string) => {
    if (!time) return 'N/A'
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const generateTimeSlots = (doctor: Doctor) => {
    if (!doctor.availability.startTime || !doctor.availability.endTime) return []

    const slots = []
    const [startHour, startMin] = doctor.availability.startTime.split(':').map(Number)
    const [endHour, endMin] = doctor.availability.endTime.split(':').map(Number)
    const duration = doctor.availability.slotDuration

    let currentHour = startHour
    let currentMin = startMin

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`
      slots.push(timeStr)

      currentMin += duration
      if (currentMin >= 60) {
        currentMin = 0
        currentHour += 1
      }
    }

    return slots
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F5F5F7 0%, #E8F4F8 100%)',
      py: { xs: 4, md: 6 },
      px: { xs: 2, md: 4 }
    }}>
      {/* Main Content */}
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Stack spacing={4}>
          {/* Back Button */}
          <Box>
            <BackButton />
          </Box>

          {/* Page Header */}
          <Box>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Box sx={{
                width: 56,
                height: 56,
                borderRadius: 2.5,
                bgcolor: '#06D6A0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(6, 214, 160, 0.3)'
              }}>
                <CalendarTodayIcon sx={{ fontSize: 32, color: '#FFFFFF' }} />
              </Box>
              <Box>
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{
                    color: '#1A1A2E',
                    fontSize: { xs: '1.75rem', md: '2.25rem' },
                    lineHeight: 1.2,
                    mb: 0.5
                  }}
                >
                  Doctor Appointments
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748B', fontSize: '14px' }}>
                  Browse doctors and manage your appointments
                </Typography>
              </Box>
            </Stack>

            <Tabs
              value={tabValue}
              onChange={(_e, newValue) => setTabValue(newValue)}
              sx={{
                mb: 3,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: '#64748B',
                  '&.Mui-selected': {
                    color: '#06D6A0'
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#06D6A0',
                  height: 3,
                  borderRadius: '3px 3px 0 0'
                }
              }}
            >
              <Tab label="Browse Doctors" />
              <Tab label="My Appointments" />
            </Tabs>
          </Box>

          {/* Browse Doctors Tab */}
          {tabValue === 0 && (
            <Stack spacing={3}>
              {/* Search Filters */}
              <Card elevation={0} sx={{
                borderRadius: 3,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                bgcolor: '#FFFFFF'
              }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                      <TextField
                        fullWidth
                        placeholder="Search by doctor name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon sx={{ color: '#64748B' }} />
                            </InputAdornment>
                          )
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#F5F5F7',
                            borderRadius: 2,
                            '& fieldset': {
                              borderColor: '#E2E8F0'
                            },
                            '&:hover fieldset': {
                              borderColor: '#00B4D8'
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#00B4D8',
                              borderWidth: '2px'
                            }
                          }
                        }}
                      />
                      <TextField
                        fullWidth
                        placeholder="Filter by specialization..."
                        value={specializationFilter}
                        onChange={(e) => setSpecializationFilter(e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#F5F5F7',
                            borderRadius: 2,
                            '& fieldset': {
                              borderColor: '#E2E8F0'
                            },
                            '&:hover fieldset': {
                              borderColor: '#00B4D8'
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#00B4D8',
                              borderWidth: '2px'
                            }
                          }
                        }}
                      />
                      <TextField
                        fullWidth
                        placeholder="Filter by city..."
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationOnIcon sx={{ color: '#64748B' }} />
                            </InputAdornment>
                          )
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#F5F5F7',
                            borderRadius: 2,
                            '& fieldset': {
                              borderColor: '#E2E8F0'
                            },
                            '&:hover fieldset': {
                              borderColor: '#00B4D8'
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#00B4D8',
                              borderWidth: '2px'
                            }
                          }
                        }}
                      />
                    </Stack>
                    <Button
                      variant="contained"
                      onClick={searchDoctors}
                      disabled={loading}
                      sx={{
                        bgcolor: '#06D6A0',
                        color: '#FFFFFF',
                        textTransform: 'none',
                        borderRadius: 2,
                        px: 3,
                        py: 1.25,
                        fontSize: '14px',
                        fontWeight: 600,
                        boxShadow: '0 2px 8px rgba(6, 214, 160, 0.3)',
                        '&:hover': {
                          bgcolor: '#04A777',
                          boxShadow: '0 4px 12px rgba(6, 214, 160, 0.4)'
                        },
                        alignSelf: 'flex-start'
                      }}
                    >
                      {loading ? <CircularProgress size={20} sx={{ color: '#FFFFFF' }} /> : 'Search'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress sx={{ color: '#06D6A0' }} />
                </Box>
              )}

              {!loading && doctors.length === 0 && !error && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>No doctors found. Try adjusting your search filters.</Alert>
              )}

              {/* Doctors Grid */}
              <Grid container spacing={3}>
                {doctors.map((doctor) => (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={doctor.id}>
                    <Card
                      elevation={0}
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 3,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        bgcolor: '#FFFFFF',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)'
                        }
                      }}
                    >
                      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                        <Stack spacing={2}>
                          {/* Doctor Name and Specialization */}
                          <Box>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                              <PersonIcon sx={{ color: '#06D6A0', fontSize: 24 }} />
                              <Typography variant="h6" fontWeight={700} sx={{ color: '#1A1A2E', fontSize: '18px' }}>
                                {doctor.name}
                              </Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ color: '#64748B', mb: 1, fontSize: '13px' }}>
                              {doctor.specialization}
                              {doctor.subSpecialization && ` - ${doctor.subSpecialization}`}
                            </Typography>
                            <Chip
                              label={`${doctor.experience} years experience`}
                              size="small"
                              sx={{
                                bgcolor: '#E8F4F8',
                                color: '#00B4D8',
                                fontWeight: 600,
                                fontSize: '12px'
                              }}
                            />
                          </Box>

                          <Divider sx={{ borderColor: '#E2E8F0' }} />

                          {/* Clinic Info */}
                          <Box>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                              <LocalHospitalIcon sx={{ fontSize: 18, color: '#64748B' }} />
                              <Typography variant="body2" fontWeight={600} sx={{ color: '#1A1A2E', fontSize: '13px' }}>
                                {doctor.clinicName}
                              </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <LocationOnIcon sx={{ fontSize: 18, color: '#64748B' }} />
                              <Typography variant="body2" sx={{ color: '#64748B', fontSize: '13px' }}>
                                {doctor.city}
                              </Typography>
                            </Stack>
                          </Box>

                          {/* Availability */}
                          <Box>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                              <AccessTimeIcon sx={{ fontSize: 18, color: '#64748B' }} />
                              <Typography variant="body2" fontWeight={600} sx={{ color: '#1A1A2E', fontSize: '13px' }}>
                                Availability
                              </Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ color: '#64748B', mb: 0.5, fontSize: '12px' }}>
                              {doctor.availability.workingDays.join(', ')}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748B', fontSize: '12px' }}>
                              {formatTime(doctor.availability.startTime)} - {formatTime(doctor.availability.endTime)}
                            </Typography>
                          </Box>

                          {/* Fees */}
                          <Box sx={{ mt: 'auto', pt: 2 }}>
                            <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
                              <Box>
                                <Typography variant="body2" sx={{ color: '#64748B', fontSize: '12px' }}>
                                  In-person: <strong style={{ color: '#1A1A2E' }}>PKR {doctor.inPersonFee.toLocaleString()}</strong>
                                </Typography>
                                {doctor.onlineFee && (
                                  <Typography variant="body2" sx={{ color: '#64748B', fontSize: '12px' }}>
                                    Online: <strong style={{ color: '#1A1A2E' }}>PKR {doctor.onlineFee.toLocaleString()}</strong>
                                  </Typography>
                                )}
                              </Box>
                              <Button
                                variant="contained"
                                startIcon={<CalendarTodayIcon sx={{ fontSize: 18 }} />}
                                onClick={() => handleBookAppointment(doctor)}
                                sx={{
                                  bgcolor: '#06D6A0',
                                  color: '#FFFFFF',
                                  textTransform: 'none',
                                  borderRadius: 2,
                                  px: 2,
                                  py: 1,
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  boxShadow: '0 2px 8px rgba(6, 214, 160, 0.3)',
                                  '&:hover': {
                                    bgcolor: '#04A777',
                                    boxShadow: '0 4px 12px rgba(6, 214, 160, 0.4)'
                                  }
                                }}
                              >
                                Book
                              </Button>
                            </Stack>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          )}

          {/* My Appointments Tab */}
          {tabValue === 1 && (
            <>
              {loadingAppointments && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              )}
              {!loadingAppointments && appointments.length === 0 && (
                <Alert severity="info">You have no appointments yet. Browse doctors to book one.</Alert>
              )}
              <Grid container spacing={3}>
                {appointments.map((appointment) => (
                  <Grid size={{ xs: 12, md: 6 }} key={appointment._id || appointment.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card
                        sx={{
                          height: '100%',
                          borderRadius: 2,
                          boxShadow: 2,
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4,
                          },
                        }}
                      >
                        <CardContent>
                          <Stack spacing={2}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                              <Box>
                                <Typography variant="h6" fontWeight={800} color="#1947D2">
                                  {appointment.doctorName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {appointment.specialization}
                                </Typography>
                              </Box>
                              <Chip
                                label={appointment.status === 'approved' ? 'Confirmed' : appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                color={getStatusColor(appointment.status) as any}
                                size="small"
                              />
                            </Box>

                            <Stack spacing={1}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EventIcon sx={{ color: '#1947D2', fontSize: 20 }} />
                                <Typography variant="body2">{appointment.date}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccessTimeIcon sx={{ color: '#1947D2', fontSize: 20 }} />
                                <Typography variant="body2">{appointment.time}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LocationOnIcon sx={{ color: '#1947D2', fontSize: 20 }} />
                                <Typography variant="body2">{appointment.location}</Typography>
                              </Box>
                            </Stack>

                            {appointment.notes && (
                              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#f5f7fa' }}>
                                <Typography variant="body2" color="text.secondary">
                                  {appointment.notes}
                                </Typography>
                              </Paper>
                            )}

                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              {appointment.status === 'pending' && (
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    const appointmentId = appointment._id || appointment.id
                                    if (appointmentId) handleDelete(appointmentId)
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </>
          )}

          {/* Booking Dialog */}
          <Dialog open={bookingDialogOpen} onClose={() => setBookingDialogOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 800, color: '#1947D2' }}>
              Book Appointment with {selectedDoctor?.name}
            </DialogTitle>
            <DialogContent>
              {selectedDoctor && (
                <form onSubmit={handleBookingSubmit}>
                  <Stack spacing={3} sx={{ mt: 2 }}>
                    {/* Doctor Info */}
                    <Card variant="outlined">
                      <CardContent>
                        <Stack spacing={2}>
                          <Typography variant="h6" fontWeight={700} sx={{ color: '#1947D2' }}>
                            Doctor Information
                          </Typography>
                          <Stack direction="row" spacing={2} flexWrap="wrap">
                            <Box>
                              <Typography variant="body2" color="text.secondary">Specialization</Typography>
                              <Typography variant="body1" fontWeight={600}>
                                {selectedDoctor.specialization}
                                {selectedDoctor.subSpecialization && ` - ${selectedDoctor.subSpecialization}`}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary">Experience</Typography>
                              <Typography variant="body1" fontWeight={600}>
                                {selectedDoctor.experience} years
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary">Clinic</Typography>
                              <Typography variant="body1" fontWeight={600}>
                                {selectedDoctor.clinicName}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary">Location</Typography>
                              <Typography variant="body1" fontWeight={600}>
                                {selectedDoctor.city}
                              </Typography>
                            </Box>
                          </Stack>
                          {selectedDoctor.bio && (
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                {selectedDoctor.bio}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>

                    {/* Availability */}
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: '#1947D2' }}>
                          Availability
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Working Days: {selectedDoctor.availability.workingDays.join(', ')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Time: {formatTime(selectedDoctor.availability.startTime)} - {formatTime(selectedDoctor.availability.endTime)}
                        </Typography>
                      </CardContent>
                    </Card>

                    {/* Booking Form */}
                    <Stack spacing={2}>
                      <TextField
                        label="Date"
                        type="date"
                        value={bookingForm.date}
                        onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                        required
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        inputProps={{
                          min: new Date().toISOString().split('T')[0]
                        }}
                      />

                      <TextField
                        label="Time Slot"
                        select
                        value={bookingForm.time}
                        onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                        required
                        fullWidth
                        disabled={!bookingForm.date}
                      >
                        {generateTimeSlots(selectedDoctor).map((slot) => (
                          <MenuItem key={slot} value={slot}>
                            {formatTime(slot)}
                          </MenuItem>
                        ))}
                      </TextField>

                      <TextField
                        label="Consultation Type"
                        select
                        value={bookingForm.consultationType}
                        onChange={(e) => setBookingForm({ ...bookingForm, consultationType: e.target.value })}
                        fullWidth
                      >
                        <MenuItem value="in-person">
                          In-person (PKR {selectedDoctor.inPersonFee.toLocaleString()})
                        </MenuItem>
                        {selectedDoctor.onlineFee && (
                          <MenuItem value="online">
                            Online (PKR {selectedDoctor.onlineFee.toLocaleString()})
                          </MenuItem>
                        )}
                      </TextField>

                      <TextField
                        label="Notes (Optional)"
                        multiline
                        rows={3}
                        value={bookingForm.notes}
                        onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                        fullWidth
                        placeholder="Any additional information or concerns..."
                      />
                    </Stack>
                  </Stack>
                </form>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setBookingDialogOpen(false)}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                onClick={handleBookingSubmit}
                disabled={!bookingForm.date || !bookingForm.time}
                sx={{
                  bgcolor: '#1947D2',
                  '&:hover': { bgcolor: '#1E40AF' },
                }}
              >
                Confirm Booking
              </Button>
            </DialogActions>
          </Dialog>
        </Stack>
      </Box>
    </Box>
  )
}

