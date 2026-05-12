import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
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
  Skeleton,
  Stack,
  TextField,
  Tooltip as MuiTooltip,
  Typography,
  CircularProgress,
  Alert,
  alpha,
} from '@mui/material'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import BackButton from '../ui/BackButton'
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded'
import AccessTimeIcon from '@mui/icons-material/AccessTimeRounded'
import LocationOnIcon from '@mui/icons-material/LocationOnRounded'
import EventIcon from '@mui/icons-material/EventRounded'
import SearchIcon from '@mui/icons-material/SearchRounded'
import PersonIcon from '@mui/icons-material/PersonRounded'
import LocalHospitalIcon from '@mui/icons-material/LocalHospitalRounded'
import CalendarTodayIcon from '@mui/icons-material/CalendarMonthRounded'
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded'
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import { BRAND_GRADIENT, HERO_BG, GLASS_SURFACE as GLASS, SOFT_BORDER, PREMIUM_SHADOW } from '../ui/premium'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import FiberManualRecordRoundedIcon from '@mui/icons-material/FiberManualRecordRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import PendingRoundedIcon from '@mui/icons-material/PendingRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded'

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
  status: 'confirmed' | 'pending' | 'cancelled' | 'approved' | 'completed' | 'rejected'
  notes: string
  consultationType?: 'in-person' | 'online'
  fee?: number
  doctorComments?: string
  meetingLink?: string
  appointmentLocationDetails?: string
}

export default function Appointments() {
  const [searchParams] = useSearchParams()
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
  const [appointmentsLoadedOnce, setAppointmentsLoadedOnce] = useState(false)

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

  useEffect(() => {
    if (tabValue !== 1) return

    const interval = setInterval(() => {
      loadAppointments({ silent: true })
    }, 10000)

    return () => clearInterval(interval)
  }, [tabValue])

  // Load patient appointments
  const loadAppointments = async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false
    if (!silent) {
      setLoadingAppointments(true)
    }
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Authentication required. Please login again.')
        return
      }

      const response = await fetch('/api/appointments/patient', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const data = await response.json()

      if (data.success) {
        setAppointments(data.data)
        if (!appointmentsLoadedOnce) {
          setAppointmentsLoadedOnce(true)
        }
      } else {
        setError(data.message || 'Failed to load appointments')
      }
    } catch (err: any) {
      console.error('Error loading appointments:', err)
      setError('Failed to load appointments. Please try again.')
    } finally {
      if (!silent) {
        setLoadingAppointments(false)
      }
    }
  }

  const searchDoctors = async (overrides?: { name?: string; specialization?: string; city?: string }) => {
    setLoading(true)
    setError('')

    try {
      const resolvedName = overrides?.name ?? searchQuery
      const resolvedSpecialization = overrides?.specialization ?? specializationFilter
      const resolvedCity = overrides?.city ?? cityFilter

      const params = new URLSearchParams()
      if (resolvedName) params.append('name', resolvedName)
      if (resolvedSpecialization) params.append('specialization', resolvedSpecialization)
      if (resolvedCity) params.append('city', resolvedCity)

      const response = await fetch(`/api/doctors/search?${params.toString()}`)
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

  useEffect(() => {
    const tabParam = (searchParams.get('tab') || '').toLowerCase()
    const nameParam = (searchParams.get('name') || '').trim()
    const specializationParam = (searchParams.get('specialization') || '').trim()
    const cityParam = (searchParams.get('city') || '').trim()

    if (tabParam === '1' || tabParam === 'my') {
      setTabValue(1)
      return
    }

    if (tabParam === '0' || tabParam === 'browse' || nameParam || specializationParam || cityParam) {
      setTabValue(0)
      setSearchQuery(nameParam)
      setSpecializationFilter(specializationParam)
      setCityFilter(cityParam)
      searchDoctors({
        name: nameParam,
        specialization: specializationParam,
        city: cityParam,
      })
    }
  }, [searchParams])

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
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Authentication required. Please login again.')
        setLoading(false)
        return
      }

      const bookingData = {
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

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
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
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Authentication required. Please login again.')
        return
      }

      const appointmentId = typeof id === 'string' ? id : appointments.find(a => a.id === id)?._id
      if (!appointmentId) {
        setError('Appointment not found')
        return
      }

      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
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
      case 'completed':
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

  // Premium tokens
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  }
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  }

  // Appointment KPIs
  const upcomingCount = useMemo(() => appointments.filter(a => a.status === 'pending' || a.status === 'approved' || a.status === 'confirmed').length, [appointments])
  const pendingCount = useMemo(() => appointments.filter(a => a.status === 'pending').length, [appointments])
  const completedCount = useMemo(() => appointments.filter(a => a.status === 'completed').length, [appointments])

  const statusMeta = (status: string) => {
    switch (status) {
      case 'approved':
      case 'confirmed':
        return { label: 'Confirmed', color: '#10B981', bg: alpha('#10B981', 0.12), Icon: CheckCircleRoundedIcon }
      case 'pending':
        return { label: 'Pending', color: '#F59E0B', bg: alpha('#F59E0B', 0.14), Icon: PendingRoundedIcon }
      case 'rejected':
      case 'cancelled':
        return { label: status.charAt(0).toUpperCase() + status.slice(1), color: '#F43F5E', bg: alpha('#F43F5E', 0.12), Icon: CancelRoundedIcon }
      case 'completed':
        return { label: 'Completed', color: '#1D4ED8', bg: alpha('#1D4ED8', 0.10), Icon: VerifiedRoundedIcon }
      default:
        return { label: status, color: '#64748B', bg: alpha('#0F172A', 0.06), Icon: EventIcon }
    }
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', position: 'relative' }}>
      {/* Ambient mesh */}
      <Box sx={{
        position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none',
        backgroundImage:
          'radial-gradient(900px 500px at -10% -10%, rgba(52,211,153,0.10) 0%, transparent 60%),' +
          'radial-gradient(700px 400px at 110% 0%, rgba(37,99,235,0.10) 0%, transparent 60%),' +
          'radial-gradient(600px 400px at 50% 110%, rgba(6,182,212,0.08) 0%, transparent 60%)',
      }} />

      {/* Glass header */}
      <Box sx={{
        position: 'sticky', top: 0, zIndex: 20,
        bgcolor: GLASS, backdropFilter: 'saturate(180%) blur(16px)',
        WebkitBackdropFilter: 'saturate(180%) blur(16px)',
        borderBottom: SOFT_BORDER,
      }}>
        <Container maxWidth="xl" sx={{ py: 1.25, px: { xs: 2, md: 3 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <BackButton />
              <Stack direction="row" alignItems="center" spacing={1.25} sx={{ pl: 0.5 }}>
                <Box sx={{
                  width: 38, height: 38, borderRadius: '11px',
                  background: BRAND_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(14,165,233,0.32), 0 2px 4px rgba(37,99,235,0.18)',
                }}>
                  <CalendarTodayIcon sx={{ color: '#FFFFFF', fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography sx={{
                    fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.01em',
                    background: BRAND_GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>Appointments</Typography>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Find doctors · Manage visits
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            {/* Premium pill tabs */}
            <Box sx={{
              display: 'flex', p: 0.4, gap: 0.4,
              bgcolor: alpha('#FFFFFF', 0.75), backdropFilter: 'blur(8px)',
              border: SOFT_BORDER, borderRadius: 999,
            }}>
              {[
                { value: 0, label: 'Browse', shortLabel: 'Browse', Icon: SearchIcon },
                { value: 1, label: `My Appointments${upcomingCount > 0 ? ` · ${upcomingCount}` : ''}`, shortLabel: 'Mine', Icon: EventAvailableRoundedIcon },
              ].map((t) => {
                const TIcon = t.Icon
                const active = tabValue === t.value
                return (
                  <Button
                    key={t.value}
                    onClick={() => setTabValue(t.value)}
                    startIcon={<TIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      textTransform: 'none', fontWeight: 700, fontSize: '0.78rem',
                      borderRadius: 999, px: { xs: 1.25, md: 2 }, py: 0.6,
                      minWidth: { xs: 'auto', md: 0 },
                      ...(active
                        ? {
                            color: '#FFFFFF',
                            background: BRAND_GRADIENT,
                            boxShadow: '0 4px 12px rgba(14,165,233,0.30)',
                          }
                        : {
                            color: 'text.secondary',
                            '&:hover': { color: '#0F172A', bgcolor: alpha('#0F172A', 0.04) },
                          }),
                    }}
                  >
                    <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>{t.label}</Box>
                    <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>{t.shortLabel}</Box>
                  </Button>
                )
              })}
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Body */}
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <Stack spacing={{ xs: 3, md: 3.5 }}>
          {/* Browse Doctors Tab */}
          {tabValue === 0 && (
            <Stack spacing={3}>
              {/* HERO BANNER */}
              <motion.div variants={cardVariants}>
                <Card sx={{
                  position: 'relative', overflow: 'hidden',
                  borderRadius: 4, border: SOFT_BORDER,
                  background: HERO_BG, boxShadow: PREMIUM_SHADOW,
                }}>
                  <Box sx={{ position: 'absolute', top: -120, right: -100, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.22) 0%, transparent 60%)', filter: 'blur(20px)', pointerEvents: 'none' }} />
                  <Box sx={{ position: 'absolute', bottom: -100, left: '40%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 60%)', filter: 'blur(20px)', pointerEvents: 'none' }} />
                  <CardContent sx={{ position: 'relative', p: { xs: 3, md: 4.5 } }}>
                    <Chip
                      size="small"
                      icon={<VerifiedRoundedIcon sx={{ fontSize: 14 }} />}
                      label="VERIFIED DOCTORS"
                      sx={{
                        bgcolor: alpha('#FFFFFF', 0.65), backdropFilter: 'blur(8px)',
                        border: SOFT_BORDER, color: '#1D4ED8', fontWeight: 800, letterSpacing: '0.06em',
                        fontSize: '0.65rem', height: 24, mb: 2,
                        '& .MuiChip-icon': { color: '#06B6D4' },
                      }}
                    />
                    <Typography sx={{
                      fontSize: { xs: '1.75rem', sm: '2.15rem', md: '2.6rem' },
                      fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', color: '#0F172A',
                    }}>
                      Find your{' '}
                      <Box component="span" sx={{
                        background: BRAND_GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      }}>perfect doctor</Box>
                    </Typography>
                    <Typography sx={{ fontSize: { xs: '0.95rem', md: '1.05rem' }, color: 'text.secondary', mt: 1.25, maxWidth: 620, lineHeight: 1.6 }}>
                      Browse <strong>{doctors.length || 'verified'}</strong> licensed specialists. Book in-person or online consultations instantly.
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>

              {/* SEARCH + FILTERS */}
              <motion.div variants={cardVariants}>
                <Card sx={{
                  borderRadius: 3, border: SOFT_BORDER,
                  bgcolor: alpha('#FFFFFF', 0.85), backdropFilter: 'blur(8px)', boxShadow: PREMIUM_SHADOW,
                }}>
                  <CardContent sx={{ p: { xs: 2.25, md: 2.75 } }}>
                    <Stack spacing={1.75}>
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                        <TextField
                          fullWidth size="small"
                          placeholder="Doctor name…"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#FFFFFF', borderRadius: 999 } }}
                        />
                        <TextField
                          fullWidth size="small"
                          placeholder="Specialization…"
                          value={specializationFilter}
                          onChange={(e) => setSpecializationFilter(e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <WorkspacePremiumRoundedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#FFFFFF', borderRadius: 999 } }}
                        />
                        <TextField
                          fullWidth size="small"
                          placeholder="City…"
                          value={cityFilter}
                          onChange={(e) => setCityFilter(e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LocationOnIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#FFFFFF', borderRadius: 999 } }}
                        />
                        <Button
                          onClick={() => { searchDoctors() }}
                          disabled={loading}
                          startIcon={loading ? <CircularProgress size={16} sx={{ color: '#FFFFFF' }} /> : <SearchIcon sx={{ fontSize: 18 }} />}
                          sx={{
                            background: BRAND_GRADIENT,
                            backgroundSize: '200% 200%', backgroundPosition: '0% 50%',
                            color: '#FFFFFF', textTransform: 'none', fontWeight: 700, fontSize: '0.85rem',
                            borderRadius: 999, px: 3, py: 1, minWidth: 140,
                            boxShadow: '0 6px 16px rgba(14,165,233,0.28)',
                            transition: 'all 0.3s ease',
                            '&:hover': { backgroundPosition: '100% 50%', boxShadow: '0 10px 22px rgba(14,165,233,0.38)' },
                          }}
                        >
                          {loading ? 'Searching…' : 'Search'}
                        </Button>
                      </Stack>
                      <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                        {doctors.length > 0 ? `Showing ${doctors.length} ${doctors.length === 1 ? 'doctor' : 'doctors'}` : 'Use filters to find specialists in your area'}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>

              {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

              {loading && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2.5 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} sx={{ borderRadius: 3, border: SOFT_BORDER, p: 3 }}>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Skeleton variant="circular" width={56} height={56} />
                        <Box sx={{ flex: 1 }}>
                          <Skeleton variant="text" width="70%" />
                          <Skeleton variant="text" width="50%" />
                        </Box>
                      </Stack>
                      <Skeleton variant="text" />
                      <Skeleton variant="text" width="80%" />
                      <Skeleton variant="rounded" height={36} sx={{ mt: 1.5, borderRadius: 1.5 }} />
                    </Card>
                  ))}
                </Box>
              )}

              {!loading && doctors.length === 0 && !error && (
                <Card sx={{ borderRadius: 3, border: SOFT_BORDER, p: 5, textAlign: 'center', bgcolor: alpha('#FFFFFF', 0.7) }}>
                  <Box sx={{
                    width: 56, height: 56, mx: 'auto', mb: 2, borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha('#0EA5E9', 0.18)} 0%, ${alpha('#0EA5E9', 0.06)} 100%)`,
                    border: `1px solid ${alpha('#0EA5E9', 0.25)}`, color: '#0EA5E9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <SearchIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>No doctors found</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Try adjusting your search filters or pick a different city.</Typography>
                </Card>
              )}

              {/* Doctors Grid */}
              {!loading && doctors.length > 0 && (
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                  gap: { xs: 2, md: 2.5 },
                }}>
                  {doctors.map((doctor) => (
                    <motion.div key={doctor.id} variants={cardVariants} whileHover={{ y: -6 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
                      <Card sx={{
                        position: 'relative', overflow: 'hidden', height: '100%',
                        display: 'flex', flexDirection: 'column',
                        borderRadius: 3, border: SOFT_BORDER,
                        bgcolor: alpha('#FFFFFF', 0.92), backdropFilter: 'blur(8px)',
                        boxShadow: PREMIUM_SHADOW,
                        transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
                        '&:hover': { borderColor: alpha('#0EA5E9', 0.4), boxShadow: '0 16px 40px rgba(14,165,233,0.20)' },
                      }}>
                        <Box sx={{
                          position: 'absolute', top: -50, right: -50, width: 160, height: 160, borderRadius: '50%',
                          background: 'radial-gradient(circle, rgba(52,211,153,0.18) 0%, transparent 65%)',
                          pointerEvents: 'none',
                        }} />

                        <CardContent sx={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', p: { xs: 2.5, md: 3 } }}>
                          {/* Doctor identity */}
                          <Stack direction="row" spacing={1.75} alignItems="center" sx={{ mb: 2 }}>
                            <Box sx={{
                              position: 'relative',
                              '&::before': {
                                content: '""', position: 'absolute', inset: -3, borderRadius: '50%', padding: '2px',
                                background: BRAND_GRADIENT,
                                WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                                mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                                WebkitMaskComposite: 'xor', maskComposite: 'exclude',
                              },
                            }}>
                              <Avatar sx={{ width: 56, height: 56, bgcolor: alpha('#0EA5E9', 0.12), color: '#1D4ED8', fontWeight: 800, fontSize: '1.25rem' }}>
                                {doctor.name.charAt(0).toUpperCase()}
                              </Avatar>
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  Dr. {doctor.name}
                                </Typography>
                                <VerifiedRoundedIcon sx={{ fontSize: 16, color: '#0EA5E9' }} />
                              </Stack>
                              <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {doctor.specialization}{doctor.subSpecialization && ` · ${doctor.subSpecialization}`}
                              </Typography>
                            </Box>
                          </Stack>

                          {/* Tags row */}
                          <Stack direction="row" spacing={0.75} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.75 }}>
                            <Chip
                              size="small"
                              icon={<WorkspacePremiumRoundedIcon sx={{ fontSize: '0.85rem !important' }} />}
                              label={`${doctor.experience} yrs`}
                              sx={{ bgcolor: alpha('#0EA5E9', 0.10), color: '#1D4ED8', fontWeight: 700, fontSize: '0.7rem', height: 22, '& .MuiChip-icon': { color: '#0EA5E9', ml: 0.5 } }}
                            />
                            {doctor.onlineFee && (
                              <Chip
                                size="small"
                                icon={<VideocamRoundedIcon sx={{ fontSize: '0.85rem !important' }} />}
                                label="Online"
                                sx={{ bgcolor: alpha('#10B981', 0.10), color: '#059669', fontWeight: 700, fontSize: '0.7rem', height: 22, '& .MuiChip-icon': { color: '#10B981', ml: 0.5 } }}
                              />
                            )}
                            <Chip
                              size="small"
                              icon={<StorefrontRoundedIcon sx={{ fontSize: '0.85rem !important' }} />}
                              label="In-person"
                              sx={{ bgcolor: alpha('#F59E0B', 0.10), color: '#92400E', fontWeight: 700, fontSize: '0.7rem', height: 22, '& .MuiChip-icon': { color: '#F59E0B', ml: 0.5 } }}
                            />
                          </Stack>

                          {/* Info rows */}
                          <Stack spacing={1} sx={{ mb: 2 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <LocalHospitalIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                              <Typography sx={{ fontSize: '0.8rem', color: '#0F172A', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doctor.clinicName}</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <LocationOnIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{doctor.city}</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <AccessTimeIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                                {doctor.availability.workingDays.slice(0, 3).join(', ')}{doctor.availability.workingDays.length > 3 ? '…' : ''} · {formatTime(doctor.availability.startTime)}–{formatTime(doctor.availability.endTime)}
                              </Typography>
                            </Stack>
                          </Stack>

                          <Box sx={{ flex: 1 }} />

                          {/* Footer: Fees + Book */}
                          <Box sx={{
                            mt: 1, pt: 2, borderTop: SOFT_BORDER,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
                          }}>
                            <Box>
                              <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Starts from
                              </Typography>
                              <Typography sx={{
                                fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.01em',
                                background: BRAND_GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                lineHeight: 1.2,
                              }}>
                                PKR {Math.min(doctor.inPersonFee, doctor.onlineFee || doctor.inPersonFee).toLocaleString()}
                              </Typography>
                            </Box>
                            <Button
                              onClick={() => handleBookAppointment(doctor)}
                              endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />}
                              sx={{
                                background: BRAND_GRADIENT,
                                backgroundSize: '200% 200%', backgroundPosition: '0% 50%',
                                color: '#FFFFFF', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem',
                                borderRadius: 999, px: 2, py: 0.85,
                                boxShadow: '0 6px 16px rgba(14,165,233,0.28)',
                                transition: 'all 0.3s ease',
                                '&:hover': { backgroundPosition: '100% 50%', boxShadow: '0 10px 22px rgba(14,165,233,0.38)' },
                              }}
                            >
                              Book
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </Box>
              )}
            </Stack>
          )}

          {/* My Appointments Tab */}
          {tabValue === 1 && (
            <Stack spacing={3}>
              {/* KPI strip */}
              {!loadingAppointments && appointments.length > 0 && (
                <motion.div variants={cardVariants}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: { xs: 1.5, md: 2 } }}>
                    {[
                      { label: 'Upcoming', value: upcomingCount, color: '#0EA5E9', Icon: EventAvailableRoundedIcon },
                      { label: 'Pending', value: pendingCount, color: '#F59E0B', Icon: PendingRoundedIcon },
                      { label: 'Completed', value: completedCount, color: '#10B981', Icon: CheckCircleRoundedIcon },
                    ].map(({ label, value, color, Icon }) => (
                      <Card key={label} sx={{
                        position: 'relative', overflow: 'hidden',
                        borderRadius: 3, border: SOFT_BORDER,
                        bgcolor: alpha('#FFFFFF', 0.85), backdropFilter: 'blur(8px)', boxShadow: PREMIUM_SHADOW,
                      }}>
                        <Box sx={{
                          position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%',
                          background: `radial-gradient(circle, ${alpha(color, 0.18)} 0%, transparent 65%)`,
                          pointerEvents: 'none',
                        }} />
                        <CardContent sx={{ position: 'relative', p: 2.25 }}>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Box sx={{
                              width: 40, height: 40, borderRadius: 2,
                              background: `linear-gradient(135deg, ${alpha(color, 0.18)} 0%, ${alpha(color, 0.06)} 100%)`,
                              border: `1px solid ${alpha(color, 0.25)}`, color,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Icon sx={{ fontSize: 22 }} />
                            </Box>
                            <Box>
                              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</Typography>
                              <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </motion.div>
              )}

              {loadingAppointments && !appointmentsLoadedOnce && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2.5 }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} sx={{ borderRadius: 3, border: SOFT_BORDER, p: 3 }}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                      <Stack spacing={1} sx={{ mt: 2 }}>
                        <Skeleton variant="text" />
                        <Skeleton variant="text" />
                        <Skeleton variant="text" width="70%" />
                      </Stack>
                    </Card>
                  ))}
                </Box>
              )}

              {!loadingAppointments && appointments.length === 0 && (
                <Card sx={{ borderRadius: 3, border: SOFT_BORDER, p: 5, textAlign: 'center', bgcolor: alpha('#FFFFFF', 0.7) }}>
                  <Box sx={{
                    width: 56, height: 56, mx: 'auto', mb: 2, borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha('#0EA5E9', 0.18)} 0%, ${alpha('#0EA5E9', 0.06)} 100%)`,
                    border: `1px solid ${alpha('#0EA5E9', 0.25)}`, color: '#0EA5E9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <EventIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>No appointments yet</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', mb: 2 }}>Browse doctors to book your first consultation.</Typography>
                  <Button
                    onClick={() => setTabValue(0)}
                    endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      background: BRAND_GRADIENT,
                      backgroundSize: '200% 200%', backgroundPosition: '0% 50%',
                      color: '#FFFFFF', textTransform: 'none', fontWeight: 700, fontSize: '0.85rem',
                      borderRadius: 999, px: 2.5, py: 1,
                      boxShadow: '0 6px 16px rgba(14,165,233,0.28)',
                      transition: 'all 0.3s ease',
                      '&:hover': { backgroundPosition: '100% 50%' },
                    }}
                  >
                    Browse doctors
                  </Button>
                </Card>
              )}

              {appointments.length > 0 && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: { xs: 2, md: 2.5 } }}>
                  {appointments.map((appointment) => {
                    const meta = statusMeta(appointment.status)
                    const StatusIcon = meta.Icon
                    return (
                      <motion.div key={appointment._id || appointment.id} variants={cardVariants}>
                        <Card sx={{
                          position: 'relative', overflow: 'hidden', height: '100%',
                          borderRadius: 3, border: SOFT_BORDER,
                          bgcolor: alpha('#FFFFFF', 0.92), backdropFilter: 'blur(8px)',
                          boxShadow: PREMIUM_SHADOW,
                          transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
                          '&:hover': { borderColor: alpha(meta.color, 0.4), boxShadow: `0 16px 40px ${alpha(meta.color, 0.18)}` },
                        }}>
                          {/* Status side rail */}
                          <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: meta.color }} />

                          <CardContent sx={{ position: 'relative', p: { xs: 2.5, md: 3 }, pl: { xs: 3, md: 3.5 } }}>
                            {/* Header row */}
                            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
                              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                                <Avatar sx={{ width: 44, height: 44, bgcolor: alpha('#0EA5E9', 0.12), color: '#1D4ED8', fontWeight: 800, fontSize: '1rem' }}>
                                  {appointment.doctorName.charAt(0).toUpperCase()}
                                </Avatar>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    Dr. {appointment.doctorName}
                                  </Typography>
                                  <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {appointment.specialization}
                                  </Typography>
                                </Box>
                              </Stack>
                              <Chip
                                size="small"
                                icon={<StatusIcon sx={{ fontSize: '0.85rem !important' }} />}
                                label={meta.label}
                                sx={{
                                  bgcolor: meta.bg, color: meta.color, fontWeight: 800, fontSize: '0.7rem', height: 24,
                                  '& .MuiChip-icon': { color: meta.color, ml: 0.5 },
                                }}
                              />
                            </Stack>

                            {/* Visit details */}
                            <Box sx={{ p: 1.5, bgcolor: alpha('#0F172A', 0.025), borderRadius: 2, border: SOFT_BORDER, mb: appointment.notes || appointment.status === 'approved' ? 2 : 0 }}>
                              <Stack spacing={0.85}>
                                {appointment.consultationType && (
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    {appointment.consultationType === 'online' ? <VideocamRoundedIcon sx={{ fontSize: 16, color: '#10B981' }} /> : <StorefrontRoundedIcon sx={{ fontSize: 16, color: '#F59E0B' }} />}
                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#0F172A' }}>
                                      {appointment.consultationType === 'online' ? 'Online consultation' : 'In-person consultation'}
                                    </Typography>
                                  </Stack>
                                )}
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <EventIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                                  <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
                                    <Box component="span" sx={{ color: '#0F172A', fontWeight: 700 }}>{appointment.date}</Box> · {appointment.time}
                                  </Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <LocationOnIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                                  <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {appointment.location}
                                  </Typography>
                                </Stack>
                                {appointment.fee !== undefined && appointment.fee !== null && (
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <FiberManualRecordRoundedIcon sx={{ fontSize: 8, color: '#1D4ED8' }} />
                                    <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
                                      Fee: <Box component="span" sx={{ color: '#0F172A', fontWeight: 700 }}>PKR {Number(appointment.fee).toLocaleString()}</Box>
                                    </Typography>
                                  </Stack>
                                )}
                              </Stack>
                            </Box>

                            {appointment.notes && (
                              <Box sx={{
                                p: 1.5, mb: appointment.status === 'approved' ? 1.5 : 0,
                                bgcolor: alpha('#0EA5E9', 0.05), border: `1px solid ${alpha('#0EA5E9', 0.15)}`, borderRadius: 2,
                              }}>
                                <Typography sx={{ fontSize: '0.7rem', color: '#1D4ED8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>Your notes</Typography>
                                <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', lineHeight: 1.5 }}>{appointment.notes}</Typography>
                              </Box>
                            )}

                            {/* Approved-only blocks */}
                            {appointment.status === 'approved' && (
                              <Stack spacing={1.25}>
                                {appointment.doctorComments && (
                                  <Box sx={{ p: 1.5, bgcolor: alpha('#10B981', 0.06), border: `1px solid ${alpha('#10B981', 0.18)}`, borderRadius: 2 }}>
                                    <Typography sx={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>Doctor comments</Typography>
                                    <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', lineHeight: 1.5 }}>{appointment.doctorComments}</Typography>
                                  </Box>
                                )}
                                {appointment.consultationType === 'online' && appointment.meetingLink && (
                                  <Button
                                    component="a" href={appointment.meetingLink} target="_blank" rel="noopener noreferrer"
                                    fullWidth
                                    startIcon={<VideocamRoundedIcon sx={{ fontSize: 18 }} />}
                                    endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 14 }} />}
                                    sx={{
                                      background: BRAND_GRADIENT,
                                      backgroundSize: '200% 200%', backgroundPosition: '0% 50%',
                                      color: '#FFFFFF', textTransform: 'none', fontWeight: 700, fontSize: '0.85rem',
                                      borderRadius: 2, py: 1,
                                      boxShadow: '0 6px 16px rgba(14,165,233,0.28)',
                                      transition: 'all 0.3s ease',
                                      '&:hover': { backgroundPosition: '100% 50%' },
                                    }}
                                  >
                                    Join meeting
                                  </Button>
                                )}
                                {appointment.consultationType === 'in-person' && appointment.appointmentLocationDetails && (
                                  <Box sx={{ p: 1.5, bgcolor: alpha('#F59E0B', 0.08), border: `1px solid ${alpha('#F59E0B', 0.20)}`, borderRadius: 2 }}>
                                    <Typography sx={{ fontSize: '0.7rem', color: '#92400E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>Location details</Typography>
                                    <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', lineHeight: 1.5 }}>{appointment.appointmentLocationDetails}</Typography>
                                  </Box>
                                )}
                              </Stack>
                            )}

                            {/* Footer actions */}
                            {appointment.status === 'pending' && (
                              <Box sx={{ mt: 2, pt: 1.5, borderTop: SOFT_BORDER, display: 'flex', justifyContent: 'flex-end' }}>
                                <MuiTooltip title="Cancel appointment" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      const appointmentId = appointment._id || appointment.id
                                      if (appointmentId) handleDelete(appointmentId)
                                    }}
                                    sx={{
                                      color: '#F43F5E', bgcolor: alpha('#F43F5E', 0.06), border: `1px solid ${alpha('#F43F5E', 0.18)}`,
                                      borderRadius: 1.5,
                                      '&:hover': { bgcolor: alpha('#F43F5E', 0.12), borderColor: alpha('#F43F5E', 0.4) },
                                    }}
                                    aria-label="Cancel appointment"
                                  >
                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </MuiTooltip>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </Box>
              )}
            </Stack>
          )}
          </Stack>
        </motion.div>
      </Container>

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
    </Box>
  )
}

