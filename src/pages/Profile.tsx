import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import BackButton from '../ui/BackButton'
import PersonIcon from '@mui/icons-material/Person'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import SaveIcon from '@mui/icons-material/Save'
import HistoryIcon from '@mui/icons-material/History'
import { useNavigate } from 'react-router-dom'
import {
  getAvailableDoctors,
  getMyProfile,
  getPatientActivities,
  updateMyProfile,
  uploadMyProfileImage,
  type AvailableDoctor,
} from '../services/patientService'
import { BRAND_GRADIENT, HERO_BG, colors } from '../ui/premium'

type FormState = {
  userName: string
  email: string
  age: string
  gender: string
  mobileNumber: string
  assignedDoctorId: string
  profileImage: string
  bio: string
}

const defaultForm: FormState = {
  userName: '',
  email: '',
  age: '',
  gender: '',
  mobileNumber: '',
  assignedDoctorId: '',
  profileImage: '',
  bio: '',
}

export default function Profile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [activities, setActivities] = useState<any[]>([])
  const [availableDoctors, setAvailableDoctors] = useState<AvailableDoctor[]>([])

  useEffect(() => {
    const role = localStorage.getItem('authRole')
    if (role === 'doctor') {
      navigate('/doctor-profile', { replace: true })
      return
    }

    const loadProfile = async () => {
      try {
        setLoading(true)
        const [profile, activityData] = await Promise.all([
          getMyProfile(),
          getPatientActivities(undefined, 20),
        ])

        const doctors = await getAvailableDoctors().catch(() => [])
        setAvailableDoctors(Array.isArray(doctors) ? doctors : [])

        setForm({
          userName: profile?.userName || '',
          email: profile?.email || '',
          age: profile?.patientProfile?.age ? String(profile.patientProfile.age) : '',
          gender: profile?.patientProfile?.gender || '',
          mobileNumber: profile?.patientProfile?.mobileNumber || '',
          assignedDoctorId: profile?.patientProfile?.assignedDoctorId || '',
          profileImage: profile?.patientProfile?.profileImage || '',
          bio: profile?.patientProfile?.bio || '',
        })
        localStorage.setItem('profileImage', profile?.patientProfile?.profileImage || '')
        setActivities(Array.isArray(activityData) ? activityData : [])
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [navigate])

  const avatarLabel = useMemo(() => {
    if (form.userName?.trim()) {
      return form.userName.trim().charAt(0).toUpperCase()
    }
    if (form.email?.trim()) {
      return form.email.trim().charAt(0).toUpperCase()
    }
    return 'P'
  }, [form.userName, form.email])

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleImageUpload = async (file?: File) => {
    if (!file) return

    // Keep client-side limit aligned with backend upload limit.
    if (file.size > 5 * 1024 * 1024) {
      setError('Profile image must be 5MB or smaller')
      return
    }

    try {
      setUploadingImage(true)
      const imageUrl = await uploadMyProfileImage(file)
      if (!imageUrl) {
        throw new Error('Image upload failed')
      }
      updateField('profileImage', imageUrl)
      localStorage.setItem('profileImage', imageUrl)
      setSuccess('Profile image uploaded successfully')
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const payload = {
        userName: form.userName,
        email: form.email,
        patientProfile: {
          age: form.age ? Number(form.age) : undefined,
          gender: form.gender,
          mobileNumber: form.mobileNumber,
          assignedDoctorId: form.assignedDoctorId || null,
          profileImage: form.profileImage,
          bio: form.bio,
        },
      }

      const updated = await updateMyProfile(payload)
      localStorage.setItem('userName', updated?.userName || form.userName)
      localStorage.setItem('userEmail', updated?.email || form.email)
      localStorage.setItem('profileImage', updated?.patientProfile?.profileImage || form.profileImage || '')
      const completedFromApi = typeof updated?.profileCompleted === 'boolean' ? updated.profileCompleted : null
      const completedFallback = Boolean(
        (updated?.userName || form.userName || '').trim() &&
        Number(form.age) > 0 &&
        (form.gender || '').trim() &&
        (form.assignedDoctorId || '').trim() &&
        (form.mobileNumber || '').trim()
      )
      localStorage.setItem('profileCompleted', (completedFromApi ?? completedFallback) ? 'true' : 'false')

      setSuccess('Profile saved successfully')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(140deg, #ECFEFF 0%, #F0FDFA 35%, #EFF6FF 100%)', py: 4, px: 2 }}>
      <Box sx={{ maxWidth: 980, mx: 'auto' }}>
        <BackButton />

        <Stack spacing={3} sx={{ mt: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ width: 56, height: 56, borderRadius: 2, background: BRAND_GRADIENT, boxShadow: '0 8px 20px rgba(14,165,233,0.28), 0 2px 6px rgba(37,99,235,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PersonIcon sx={{ color: colors.surface, fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A' }}>Patient Profile</Typography>
              <Typography variant="body2" sx={{ color: '#64748B' }}>Your information is securely stored and linked to your unique patient ID.</Typography>
            </Box>
          </Stack>

          {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
          {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}

          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(0, 0, 0, 0.06)' }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              {loading ? (
                <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                  <CircularProgress />
                  <Typography sx={{ mt: 2, color: '#64748B' }}>Loading profile...</Typography>
                </Stack>
              ) : (
                <Stack spacing={3}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                    <Avatar src={form.profileImage || undefined} sx={{ width: 90, height: 90, bgcolor: '#0EA5E9', fontSize: '2rem', fontWeight: 700 }}>
                      {avatarLabel}
                    </Avatar>
                    <Button component="label" variant="outlined" startIcon={uploadingImage ? <CircularProgress size={16} /> : <PhotoCameraIcon />} sx={{ textTransform: 'none' }} disabled={uploadingImage}>
                      Upload Profile Image
                      <input
                        hidden
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => handleImageUpload(e.target.files?.[0])}
                      />
                    </Button>
                    <Typography variant="caption" color="text.secondary">PNG, JPG, WEBP up to 5MB</Typography>
                  </Stack>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Full Name"
                      fullWidth
                      value={form.userName}
                      onChange={(e) => updateField('userName', e.target.value)}
                    />
                    <TextField
                      label="Email"
                      type="email"
                      fullWidth
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                    />
                  </Stack>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Age"
                      type="number"
                      fullWidth
                      value={form.age}
                      onChange={(e) => updateField('age', e.target.value)}
                    />
                    <TextField
                      label="Gender"
                      select
                      fullWidth
                      value={form.gender}
                      onChange={(e) => updateField('gender', e.target.value)}
                    >
                      <MenuItem value="">Prefer not to say</MenuItem>
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </TextField>
                  </Stack>

                  <TextField
                    label="Mobile Number"
                    fullWidth
                    value={form.mobileNumber}
                    onChange={(e) => updateField('mobileNumber', e.target.value)}
                  />

                  <TextField
                    label="Assigned Doctor"
                    select
                    fullWidth
                    required
                    value={form.assignedDoctorId}
                    onChange={(e) => updateField('assignedDoctorId', e.target.value)}
                    helperText={
                      availableDoctors.length
                        ? 'Choose one registered doctor to complete your profile'
                        : 'No doctors available right now. Please try again later.'
                    }
                  >
                    {availableDoctors.map((doctor) => (
                      <MenuItem key={doctor.id} value={doctor.id}>
                        {doctor.name}
                        {doctor.specialization ? ` - ${doctor.specialization}` : ''}
                        {doctor.city ? ` (${doctor.city})` : ''}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    label="Bio (optional)"
                    fullWidth
                    multiline
                    minRows={3}
                    value={form.bio}
                    onChange={(e) => updateField('bio', e.target.value)}
                  />

                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                    onClick={handleSave}
                    disabled={saving}
                    sx={{ alignSelf: 'flex-start', textTransform: 'none', background: BRAND_GRADIENT, backgroundSize: '200% 200%', backgroundPosition: '0% 50%', boxShadow: '0 6px 16px rgba(14,165,233,0.28)', '&:hover': { backgroundPosition: '100% 50%', boxShadow: '0 10px 22px rgba(14,165,233,0.38)' } }}
                  >
                    {saving ? 'Saving...' : 'Save Profile'}
                  </Button>
                </Stack>
              )}
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(0, 0, 0, 0.06)' }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <HistoryIcon sx={{ color: '#0EA5E9' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  Profile Activity Timeline
                </Typography>
              </Stack>
              {activities.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No activity yet. Your recent assistant usage, interaction checks, and purchases will appear here.</Typography>
              ) : (
                <Stack spacing={1.5}>
                  {activities.map((activity, idx) => (
                    <Box key={activity._id || idx}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                            {activity.title}
                          </Typography>
                          <Chip size="small" label={activity.category || 'other'} sx={{ textTransform: 'capitalize' }} />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {activity.createdAt ? new Date(activity.createdAt).toLocaleString() : ''}
                        </Typography>
                      </Stack>
                      {activity.details && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {activity.details}
                        </Typography>
                      )}
                      {idx < activities.length - 1 && <Divider sx={{ mt: 1.25 }} />}
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Box>
  )
}
