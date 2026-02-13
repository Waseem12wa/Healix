import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  InputAdornment
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import PersonIcon from '@mui/icons-material/Person'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import LanguageIcon from '@mui/icons-material/Language'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import BackButton from '../ui/BackButton'
import { useNavigate } from 'react-router-dom'

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

export default function SearchDoctors() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [specializationFilter, setSpecializationFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    searchDoctors()
  }, [])

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
    // Navigate to appointments page with doctor pre-selected
    navigate('/tools/appointments', { state: { doctor } })
  }

  const formatTime = (time: string) => {
    if (!time) return 'N/A'
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <Stack spacing={3}>
      <Box sx={{
        position: 'fixed',
        left: { xs: 16, md: 24 },
        top: { xs: 16, md: 24 },
        zIndex: 1100
      }}>
        <BackButton />
      </Box>

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <LocalHospitalIcon sx={{ fontSize: { xs: 28, md: 32 }, color: '#1947D2' }} />
        <Typography
          variant="h4"
          fontWeight={800}
          sx={{
            color: '#1947D2',
            fontSize: { xs: '1.75rem', md: '2.25rem' },
            lineHeight: 1.2
          }}
        >
          Search Doctors
        </Typography>
      </Stack>

      {/* Search Filters */}
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  placeholder="Search by doctor name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  placeholder="Filter by specialization..."
                  value={specializationFilter}
                  onChange={(e) => setSpecializationFilter(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  placeholder="Filter by city..."
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOnIcon />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
            </Grid>
            <Button
              variant="contained"
              onClick={searchDoctors}
              disabled={loading}
              sx={{
                bgcolor: '#1947D2',
                '&:hover': { bgcolor: '#1E40AF' },
                alignSelf: 'flex-start'
              }}
            >
              {loading ? <CircularProgress size={20} /> : 'Search'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error">{error}</Alert>}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && doctors.length === 0 && !error && (
        <Alert severity="info">No doctors found. Try adjusting your search filters.</Alert>
      )}

      {/* Doctors List */}
      <Grid container spacing={3}>
        {doctors.map((doctor) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={doctor.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Stack spacing={2}>
                  {/* Doctor Name and Specialization */}
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <PersonIcon color="primary" />
                      <Typography variant="h6" fontWeight={700} sx={{ color: '#1947D2' }}>
                        {doctor.name}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {doctor.specialization}
                      {doctor.subSpecialization && ` - ${doctor.subSpecialization}`}
                    </Typography>
                    <Chip
                      label={`${doctor.experience} years experience`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>

                  <Divider />

                  {/* Clinic Info */}
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <LocalHospitalIcon fontSize="small" color="action" />
                      <Typography variant="body2" fontWeight={600}>
                        {doctor.clinicName}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <LocationOnIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {doctor.city}
                      </Typography>
                    </Stack>
                  </Box>

                  {/* Availability */}
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <AccessTimeIcon fontSize="small" color="action" />
                      <Typography variant="body2" fontWeight={600}>
                        Availability
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {doctor.availability.workingDays.join(', ')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatTime(doctor.availability.startTime)} - {formatTime(doctor.availability.endTime)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({doctor.availability.slotDuration} min slots)
                    </Typography>
                  </Box>

                  {/* Languages */}
                  {doctor.languages.length > 0 && (
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <LanguageIcon fontSize="small" color="action" />
                        <Typography variant="body2" fontWeight={600}>
                          Languages
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                        {doctor.languages.map((lang, idx) => (
                          <Chip key={idx} label={lang} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Bio */}
                  {doctor.bio && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        {doctor.bio.length > 100 ? `${doctor.bio.substring(0, 100)}...` : doctor.bio}
                      </Typography>
                    </Box>
                  )}

                  {/* Fees */}
                  <Box sx={{ mt: 'auto', pt: 2 }}>
                    <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          In-person: <strong>PKR {doctor.inPersonFee.toLocaleString()}</strong>
                        </Typography>
                        {doctor.onlineFee && (
                          <Typography variant="body2" color="text.secondary">
                            Online: <strong>PKR {doctor.onlineFee.toLocaleString()}</strong>
                          </Typography>
                        )}
                      </Box>
                      <Button
                        variant="contained"
                        startIcon={<CalendarTodayIcon />}
                        onClick={() => handleBookAppointment(doctor)}
                        sx={{
                          bgcolor: '#1947D2',
                          '&:hover': { bgcolor: '#1E40AF' }
                        }}
                      >
                        Book Appointment
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
  )
}

