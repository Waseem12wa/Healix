import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Avatar,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import PersonIcon from '@mui/icons-material/Person'
import SaveIcon from '@mui/icons-material/Save'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import SchoolIcon from '@mui/icons-material/School'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import BackButton from '../ui/BackButton'
import { useNavigate } from 'react-router-dom'
import { getMyProfile, uploadMyProfileImage } from '../services/patientService'

interface DoctorProfileData {
  fullName: string
  phoneNumber: string
  gender: 'Male' | 'Female' | 'Other' | ''
  specialization: string
  subSpecialization: string
  education: string[]
  pmdcNumber: string
  yearsOfExperience: number
  professionalBio: string
  languagesSpoken: string[]
  clinicName: string
  clinicAddress: string
  city: string
  mapLocation: string
  workingDays: string[]
  startTime: string
  endTime: string
  slotDuration: 10 | 15 | 30
  inPersonFee: number
  onlineFee: number
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const COMMON_LANGUAGES = ['English', 'Urdu', 'Punjabi', 'Sindhi', 'Pashto', 'Balochi', 'Arabic', 'French', 'German', 'Spanish']

export default function DoctorProfile() {
  const navigate = useNavigate()
  const [doctorName, setDoctorName] = useState(() => localStorage.getItem('userName') || 'Doctor')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [profileImage, setProfileImage] = useState(() => localStorage.getItem('profileImage') || '')
  const [profile, setProfile] = useState<DoctorProfileData>({
    fullName: '',
    phoneNumber: '',
    gender: '',
    specialization: '',
    subSpecialization: '',
    education: [],
    pmdcNumber: '',
    yearsOfExperience: 0,
    professionalBio: '',
    languagesSpoken: [],
    clinicName: '',
    clinicAddress: '',
    city: '',
    mapLocation: '',
    workingDays: [],
    startTime: '',
    endTime: '',
    slotDuration: 30,
    inPersonFee: 0,
    onlineFee: 0
  })

  const [newEducation, setNewEducation] = useState('')

  // Load existing profile
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      setError('')

      try {
        const userEmail = localStorage.getItem('userEmail')
        if (!userEmail) {
          setError('User email not found. Please login again.')
          return
        }

        const [doctorProfileResponse, authProfile] = await Promise.all([
          fetch(`/api/doctors/profile?email=${encodeURIComponent(userEmail)}`),
          getMyProfile().catch(() => null),
        ])
        const data = await doctorProfileResponse.json()

        if (data.success && data.data.profile) {
          const existingProfile = data.data.profile
          const nextDoctorName = existingProfile.fullName || data.data.userName || localStorage.getItem('userName') || 'Doctor'
          setDoctorName(nextDoctorName)
          localStorage.setItem('userName', nextDoctorName)
          setProfile({
            fullName: existingProfile.fullName || '',
            phoneNumber: existingProfile.phoneNumber || '',
            gender: existingProfile.gender || '',
            specialization: existingProfile.specialization || '',
            subSpecialization: existingProfile.subSpecialization || '',
            education: existingProfile.education || [],
            pmdcNumber: existingProfile.pmdcNumber || '',
            yearsOfExperience: existingProfile.yearsOfExperience || 0,
            professionalBio: existingProfile.professionalBio || '',
            languagesSpoken: existingProfile.languagesSpoken || [],
            clinicName: existingProfile.clinicName || '',
            clinicAddress: existingProfile.clinicAddress || '',
            city: existingProfile.city || '',
            mapLocation: existingProfile.mapLocation || '',
            workingDays: existingProfile.workingDays || [],
            startTime: existingProfile.startTime || '',
            endTime: existingProfile.endTime || '',
            slotDuration: existingProfile.slotDuration || 30,
            inPersonFee: existingProfile.inPersonFee || 0,
            onlineFee: existingProfile.onlineFee || 0
          })
        }

        const nextImage = authProfile?.patientProfile?.profileImage || ''
        setProfileImage(nextImage)
        if (nextImage) {
          localStorage.setItem('profileImage', nextImage)
        }
      } catch (err: any) {
        console.error('Error loading profile:', err)
        // Don't show error if profile doesn't exist yet (first time)
        if (err.message && !err.message.includes('404')) {
          setError('Failed to load profile. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setError('')
    setSuccess('')

    try {
      const uploadedImage = await uploadMyProfileImage(file)
      setProfileImage(uploadedImage)
      if (uploadedImage) {
        localStorage.setItem('profileImage', uploadedImage)
      }
      setSuccess('Profile picture updated successfully.')
    } catch (err: any) {
      setError(err?.message || 'Failed to upload profile picture. Please try again.')
    } finally {
      setUploadingImage(false)
      event.target.value = ''
    }
  }

  const handleInputChange = (field: keyof DoctorProfileData, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }))
    setError('')
    setSuccess('')
  }

  const handleAddEducation = () => {
    if (newEducation.trim() && !profile.education.includes(newEducation.trim())) {
      handleInputChange('education', [...profile.education, newEducation.trim()])
      setNewEducation('')
    }
  }

  const handleRemoveEducation = (index: number) => {
    handleInputChange('education', profile.education.filter((_, i) => i !== index))
  }

  const handleToggleLanguage = (language: string) => {
    const updated = profile.languagesSpoken.includes(language)
      ? profile.languagesSpoken.filter(l => l !== language)
      : [...profile.languagesSpoken, language]
    handleInputChange('languagesSpoken', updated)
  }

  const handleToggleWorkingDay = (day: string) => {
    const updated = profile.workingDays.includes(day)
      ? profile.workingDays.filter(d => d !== day)
      : [...profile.workingDays, day]
    handleInputChange('workingDays', updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const userEmail = localStorage.getItem('userEmail')
      if (!userEmail) {
        setError('User email not found. Please login again.')
        setSaving(false)
        return
      }

      const response = await fetch('/api/doctors/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: userEmail,
          profile: profile
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save profile')
      }

      if (data.success) {
        const nextDoctorName = profile.fullName?.trim() || localStorage.getItem('userName') || 'Doctor'
        setDoctorName(nextDoctorName)
        localStorage.setItem('userName', nextDoctorName)
        localStorage.setItem('profileCompleted', 'true')
        setSuccess('Profile saved successfully! You are now visible to patients.')
        setTimeout(() => {
          navigate('/doctor-dashboard')
        }, 2000)
      }
    } catch (err: any) {
      console.error('Error saving profile:', err)
      setError(err.message || 'Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(140deg, #ECFEFF 0%, #F0FDFA 35%, #EFF6FF 100%)',
      py: { xs: 4, md: 6 },
      px: { xs: 2, md: 4 }
    }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Stack spacing={4}>
          {/* Back Button & Header */}
          <Box>
            <Box sx={{ mb: 2 }}>
              <BackButton />
            </Box>

            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{
                width: 56,
                height: 56,
                borderRadius: 2.5,
                background: 'linear-gradient(135deg, #34D399 0%, #06B6D4 50%, #2563EB 100%)',
                boxShadow: '0 8px 20px rgba(14,165,233,0.28), 0 2px 6px rgba(37,99,235,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <PersonIcon sx={{ fontSize: 32, color: '#FFFFFF' }} />
              </Box>
              <Box>
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{
                    color: '#0F172A',
                    fontSize: { xs: '1.75rem', md: '2.25rem' },
                    lineHeight: 1.2,
                    mb: 0.5
                  }}
                >
                  Doctor Profile
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748B', fontSize: '14px' }}>
                  Manage your professional information and practice details
                </Typography>
              </Box>
            </Stack>
          </Box>

          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ borderRadius: 2 }}>{success}</Alert>}

          <Card elevation={0} sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={profileImage || undefined}
                    sx={{ width: 76, height: 76, bgcolor: '#10B981', fontSize: '1.8rem', fontWeight: 700 }}
                  >
                    {(doctorName || 'D').charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', mb: 0.25 }}>
                      {doctorName}
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  component="label"
                  variant="outlined"
                  startIcon={uploadingImage ? <CircularProgress size={18} color="inherit" /> : <PhotoCameraIcon />}
                  disabled={uploadingImage}
                  sx={{ borderRadius: 2, textTransform: 'none', px: 2.5 }}
                >
                  {uploadingImage ? 'Uploading...' : 'Upload Picture'}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleProfileImageUpload}
                  />
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* Personal Information */}
              <Card elevation={0} sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 3, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon sx={{ color: '#10B981' }} />
                    Personal Information
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Full Name"
                        value={profile.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        required
                        fullWidth
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#F8FAFC' } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Phone Number"
                        value={profile.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        required
                        fullWidth
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#F8FAFC' } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth required>
                        <InputLabel>Gender</InputLabel>
                        <Select
                          value={profile.gender}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          label="Gender"
                          sx={{ borderRadius: 2, bgcolor: '#F8FAFC' }}
                        >
                          <MenuItem value="Male">Male</MenuItem>
                          <MenuItem value="Female">Female</MenuItem>
                          <MenuItem value="Other">Other</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Professional Details */}
              <Card elevation={0} sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 3, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SchoolIcon sx={{ color: '#10B981' }} />
                    Professional Details
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Specialization"
                        value={profile.specialization}
                        onChange={(e) => handleInputChange('specialization', e.target.value)}
                        required
                        fullWidth
                        placeholder="e.g., Cardiology"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#F8FAFC' } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Sub-specialization"
                        value={profile.subSpecialization}
                        onChange={(e) => handleInputChange('subSpecialization', e.target.value)}
                        fullWidth
                        placeholder="e.g., Pediatric"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#F8FAFC' } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="PMDC Number"
                        value={profile.pmdcNumber}
                        onChange={(e) => handleInputChange('pmdcNumber', e.target.value)}
                        required
                        fullWidth
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#F8FAFC' } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Years of Experience"
                        type="number"
                        value={profile.yearsOfExperience}
                        onChange={(e) => handleInputChange('yearsOfExperience', parseInt(e.target.value) || 0)}
                        required
                        fullWidth
                        inputProps={{ min: 0, max: 50 }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#F8FAFC' } }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#64748B' }}>Education / Degrees</Typography>
                      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} alignItems="flex-start">
                        <TextField
                          size="small"
                          placeholder="e.g., MBBS, MD, PhD"
                          value={newEducation}
                          onChange={(e) => setNewEducation(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEducation())}
                          sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#F8FAFC' } }}
                        />
                        <Button
                          onClick={handleAddEducation}
                          variant="contained"
                          sx={{
                            background: 'linear-gradient(135deg, #34D399 0%, #06B6D4 50%, #2563EB 100%)',
                            backgroundSize: '200% 200%',
                            backgroundPosition: '0% 50%',
                            color: '#fff',
                            boxShadow: '0 6px 16px rgba(14,165,233,0.28)',
                            transition: 'all 0.3s ease',
                            '&:hover': { backgroundPosition: '100% 50%', boxShadow: '0 10px 22px rgba(14,165,233,0.38)' },
                            borderRadius: 2,
                            height: 40, // Match small textfield height roughly
                            px: 3
                          }}
                        >
                          Add
                        </Button>
                      </Stack>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                        {profile.education.map((edu, index) => (
                          <Chip
                            key={index}
                            label={edu}
                            onDelete={() => handleRemoveEducation(index)}
                            sx={{ bgcolor: '#E0F2F1', color: '#00695C', borderRadius: 1.5 }}
                          />
                        ))}
                      </Stack>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#64748B' }}>Languages Spoken</Typography>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                        {COMMON_LANGUAGES.map(lang => (
                          <Chip
                            key={lang}
                            label={lang}
                            onClick={() => handleToggleLanguage(lang)}
                            sx={{
                              borderRadius: 1.5,
                              bgcolor: profile.languagesSpoken.includes(lang) ? '#10B981' : 'transparent',
                              color: profile.languagesSpoken.includes(lang) ? '#fff' : 'text.primary',
                              border: profile.languagesSpoken.includes(lang) ? 'none' : '1px solid #E2E8F0',
                              '&:hover': {
                                bgcolor: profile.languagesSpoken.includes(lang) ? '#05b588' : '#F1F5F9'
                              }
                            }}
                          />
                        ))}
                      </Stack>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        label="Professional Bio"
                        value={profile.professionalBio}
                        onChange={(e) => handleInputChange('professionalBio', e.target.value)}
                        required
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Tell patients about your expertise and approach..."
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#F8FAFC' } }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Clinic / Practice Details */}
              <Card elevation={0} sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 3, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalHospitalIcon sx={{ color: '#10B981' }} />
                    Clinic / Practice Details
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Clinic/Hospital Name"
                        value={profile.clinicName}
                        onChange={(e) => handleInputChange('clinicName', e.target.value)}
                        required
                        fullWidth
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#F8FAFC' } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="City"
                        value={profile.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        required
                        fullWidth
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#F8FAFC' } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Clinic Address"
                        value={profile.clinicAddress}
                        onChange={(e) => handleInputChange('clinicAddress', e.target.value)}
                        required
                        fullWidth
                        multiline
                        rows={2}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#F8FAFC' } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Map Location (Optional)"
                        value={profile.mapLocation}
                        onChange={(e) => handleInputChange('mapLocation', e.target.value)}
                        fullWidth
                        placeholder="Coordinates or address for map"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#F8FAFC' } }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Availability */}
              <Card elevation={0} sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 3, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTimeIcon sx={{ color: '#10B981' }} />
                    Availability
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 600, color: '#64748B' }}>Working Days</Typography>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                        {DAYS_OF_WEEK.map(day => (
                          <Chip
                            key={day}
                            label={day}
                            onClick={() => handleToggleWorkingDay(day)}
                            sx={{
                              borderRadius: 1.5,
                              bgcolor: profile.workingDays.includes(day) ? '#10B981' : 'transparent',
                              color: profile.workingDays.includes(day) ? '#fff' : 'text.primary',
                              border: profile.workingDays.includes(day) ? 'none' : '1px solid #E2E8F0',
                              '&:hover': {
                                bgcolor: profile.workingDays.includes(day) ? '#05b588' : '#F1F5F9'
                              }
                            }}
                          />
                        ))}
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="Start Time"
                            type="time"
                            value={profile.startTime}
                            onChange={(e) => handleInputChange('startTime', e.target.value)}
                            required
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#F8FAFC' } }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="End Time"
                            type="time"
                            value={profile.endTime}
                            onChange={(e) => handleInputChange('endTime', e.target.value)}
                            required
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#F8FAFC' } }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <FormControl fullWidth required>
                            <InputLabel>Slot Duration</InputLabel>
                            <Select
                              value={profile.slotDuration}
                              onChange={(e) => handleInputChange('slotDuration', e.target.value as 10 | 15 | 30)}
                              label="Slot Duration"
                              sx={{ borderRadius: 2, bgcolor: '#F8FAFC' }}
                            >
                              <MenuItem value={10}>10 min</MenuItem>
                              <MenuItem value={15}>15 min</MenuItem>
                              <MenuItem value={30}>30 min</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Fee Structure */}
              <Card elevation={0} sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 3, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AttachMoneyIcon sx={{ color: '#10B981' }} />
                    Fee Structure
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="In-person Consultation Fee (PKR)"
                        type="number"
                        value={profile.inPersonFee}
                        onChange={(e) => handleInputChange('inPersonFee', parseFloat(e.target.value) || 0)}
                        required
                        fullWidth
                        inputProps={{ min: 0, step: 100 }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#F8FAFC' } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Online Consultation Fee (PKR) - Optional"
                        type="number"
                        value={profile.onlineFee}
                        onChange={(e) => handleInputChange('onlineFee', parseFloat(e.target.value) || 0)}
                        fullWidth
                        inputProps={{ min: 0, step: 100 }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#F8FAFC' } }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/doctor-dashboard')}
                  disabled={saving}
                  sx={{
                    borderRadius: 2,
                    px: 4,
                    color: '#64748B',
                    borderColor: '#E2E8F0',
                    '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={saving}
                  sx={{
                    background: 'linear-gradient(135deg, #34D399 0%, #06B6D4 50%, #2563EB 100%)',
                    backgroundSize: '200% 200%',
                    backgroundPosition: '0% 50%',
                    color: '#FFFFFF',
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 700,
                    textTransform: 'none',
                    fontSize: '1rem',
                    boxShadow: '0 10px 24px rgba(14,165,233,0.32), 0 4px 10px rgba(37,99,235,0.18)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundPosition: '100% 50%',
                      boxShadow: '0 14px 28px rgba(14,165,233,0.40), 0 6px 14px rgba(37,99,235,0.22)'
                    }
                  }}
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </Box>
            </Stack>
          </form>
        </Stack>
      </Box>
    </Box>
  )
}

