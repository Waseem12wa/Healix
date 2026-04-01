import { Box, Button, Card, CardContent, Stack, TextField, Typography, InputAdornment, Avatar, CircularProgress, Alert } from '@mui/material'
import BackButton from '../../ui/BackButton'
import Grid from '@mui/material/GridLegacy'
import PersonIcon from '@mui/icons-material/Person'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import SaveIcon from '@mui/icons-material/Save'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import StoreIcon from '@mui/icons-material/Store'
import VerifiedIcon from '@mui/icons-material/Verified'
import NotificationsIcon from '@mui/icons-material/Notifications'
import HelpCenterIcon from '@mui/icons-material/HelpCenter'
import LockIcon from '@mui/icons-material/Lock'
import LogoutIcon from '@mui/icons-material/Logout'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearAuthData } from '../../utils/auth'

interface ProviderData {
  _id: string
  email: string
  userName: string
  phone?: string
  providerProfile?: {
    profileImage?: string
    clinicName?: string
    pharmacyName?: string
    clinicAddress?: string
    specialization?: string
    licenseNumber?: string
    registrationNumber?: string
    profileCompleted?: boolean
  }
}

export default function ProviderProfile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [profileImage, setProfileImage] = useState<string>('')
  const [supportSubject, setSupportSubject] = useState('')
  const [supportMessage, setSupportMessage] = useState('')
  const [supportSending, setSupportSending] = useState(false)
  const [formData, setFormData] = useState<ProviderData>({
    _id: '',
    email: '',
    userName: '',
    phone: '',
    providerProfile: {
      clinicName: '',
      pharmacyName: '',
      clinicAddress: '',
      specialization: '',
      licenseNumber: '',
      registrationNumber: '',
      profileImage: '',
      profileCompleted: false
    }
  })

  useEffect(() => {
    loadProviderData()
  }, [])

  const loadProviderData = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken')
      if (!token) {
        navigate('/login')
        return
      }

      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        const payload = await response.json()
        const userData = payload?.data || {}
        setFormData((prev) => ({
          ...prev,
          ...userData,
          providerProfile: {
            ...prev.providerProfile,
            ...(userData.providerProfile || {})
          }
        }))
        if (userData.providerProfile?.profileImage) {
          setProfileImage(userData.providerProfile.profileImage)
        }
      } else {
        setError('Failed to load profile data')
      }
    } catch (err) {
      setError('Error loading profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('provider_')) {
      const providerField = field.replace('provider_', '')
      setFormData({
        ...formData,
        providerProfile: {
          ...formData.providerProfile,
          [providerField]: value
        }
      })
    } else {
      setFormData({
        ...formData,
        [field]: value
      })
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadProfileImage(file)
    }
  }

  const uploadProfileImage = async (file: File) => {
    try {
      setError('')
      const token = localStorage.getItem('token') || localStorage.getItem('authToken')
      if (!token) {
        navigate('/login')
        return
      }

      const body = new FormData()
      body.append('image', file)

      const response = await fetch('/api/auth/me/profile-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body,
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to upload image')
      }

      const imageUrl = payload?.data?.profileImage || ''
      if (imageUrl) {
        setProfileImage(imageUrl)
        setFormData((prev) => ({
          ...prev,
          providerProfile: {
            ...prev.providerProfile,
            profileImage: imageUrl,
          },
        }))
        localStorage.setItem('profileImage', imageUrl)
      }
      setSuccess('Profile image uploaded successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const token = localStorage.getItem('token') || localStorage.getItem('authToken')
      if (!token) {
        navigate('/login')
        return
      }

      const response = await fetch('/api/auth/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userName: formData.userName,
          phone: formData.phone,
          providerProfile: formData.providerProfile
        })
      })

      if (response.ok) {
        const payload = await response.json().catch(() => null)
        const user = payload?.data || {}

        const nextUserName = user?.userName || formData.userName || ''
        const nextProfileImage = user?.providerProfile?.profileImage || formData.providerProfile?.profileImage || ''

        if (nextUserName) {
          localStorage.setItem('userName', nextUserName)
        }
        if (nextProfileImage) {
          localStorage.setItem('profileImage', nextProfileImage)
        }

        setSuccess('Profile updated successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const payload = await response.json().catch(() => null)
        setError(payload?.message || 'Failed to update profile')
      }
    } catch (err) {
      setError('Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitSupport = async () => {
    try {
      setSupportSending(true)
      setError('')
      setSuccess('')

      const token = localStorage.getItem('token') || localStorage.getItem('authToken')
      if (!token) {
        navigate('/login')
        return
      }

      const response = await fetch('/api/provider/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: supportSubject,
          message: supportMessage,
          priority: 'normal',
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to submit support request')
      }

      setSuccess('Support request sent to admin successfully.')
      setSupportSubject('')
      setSupportMessage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit support request')
    } finally {
      setSupportSending(false)
    }
  }

  const handleLogout = () => {
    clearAuthData()
    navigate('/login')
  }

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F5F5F7 0%, #E8F4F8 100%)',
      py: { xs: 4, md: 6 },
      px: { xs: 2, md: 4 }
    }}>
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        <Stack spacing={4}>
          {/* Back Button */}
          <Box>
            <BackButton />
          </Box>

          {/* Page Header */}
          <Box>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
              <Box sx={{
                width: 56,
                height: 56,
                borderRadius: 2.5,
                bgcolor: '#00B4D8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 180, 216, 0.3)'
              }}>
                <PersonIcon sx={{ fontSize: 32, color: '#FFFFFF' }} />
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
                  Provider Profile
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748B', fontSize: '14px' }}>
                  Manage your clinic/pharmacy information and professional details
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Success/Error Messages */}
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          {/* Profile Form */}
          <Card elevation={0} sx={{
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            bgcolor: '#FFFFFF'
          }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack spacing={4} component="form" onSubmit={(e) => { e.preventDefault(); handleSave() }}>

                {/* Profile Picture Section */}
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#1A1A2E', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon sx={{ color: '#00B4D8' }} />
                    Profile Picture
                  </Typography>
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Avatar
                      src={profileImage}
                      sx={{
                        width: 100,
                        height: 100,
                        bgcolor: '#00B4D8',
                        fontSize: '2.5rem',
                        fontWeight: 700
                      }}
                    >
                      {formData.userName?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<CloudUploadIcon />}
                      sx={{
                        borderColor: '#00B4D8',
                        color: '#00B4D8',
                        '&:hover': { borderColor: '#0096C7', bgcolor: '#E0F7FF' }
                      }}
                    >
                      Upload Image
                      <input hidden accept="image/*" type="file" onChange={handleImageUpload} />
                    </Button>
                  </Stack>
                </Box>

                {/* Personal Information Section */}
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#1A1A2E', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon sx={{ color: '#00B4D8' }} />
                    Personal Information
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Full Name"
                        value={formData.userName}
                        onChange={(e) => handleInputChange('userName', e.target.value)}
                        fullWidth
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#F5F5F7',
                            borderRadius: 2,
                            '& fieldset': { borderColor: '#E2E8F0' },
                            '&:hover fieldset': { borderColor: '#00B4D8' },
                            '&.Mui-focused fieldset': { borderColor: '#00B4D8' }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Email Address"
                        value={formData.email}
                        fullWidth
                        disabled
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: '#64748B' }} /></InputAdornment>,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#F5F5F7',
                            borderRadius: 2,
                            '& fieldset': { borderColor: '#E2E8F0' }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Phone Number"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        fullWidth
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ color: '#64748B' }} /></InputAdornment>,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#F5F5F7',
                            borderRadius: 2,
                            '& fieldset': { borderColor: '#E2E8F0' },
                            '&:hover fieldset': { borderColor: '#00B4D8' },
                            '&.Mui-focused fieldset': { borderColor: '#00B4D8' }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Specialization"
                        value={formData.providerProfile?.specialization}
                        onChange={(e) => handleInputChange('provider_specialization', e.target.value)}
                        fullWidth
                        placeholder="e.g., Cardiology, General Medicine"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#F5F5F7',
                            borderRadius: 2,
                            '& fieldset': { borderColor: '#E2E8F0' },
                            '&:hover fieldset': { borderColor: '#00B4D8' },
                            '&.Mui-focused fieldset': { borderColor: '#00B4D8' }
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Clinic Details Section */}
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#1A1A2E', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalHospitalIcon sx={{ color: '#00B4D8' }} />
                    Clinic Details
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Clinic Name"
                        value={formData.providerProfile?.clinicName}
                        onChange={(e) => handleInputChange('provider_clinicName', e.target.value)}
                        fullWidth
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#F5F5F7',
                            borderRadius: 2,
                            '& fieldset': { borderColor: '#E2E8F0' },
                            '&:hover fieldset': { borderColor: '#00B4D8' },
                            '&.Mui-focused fieldset': { borderColor: '#00B4D8' }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Clinic Address"
                        value={formData.providerProfile?.clinicAddress}
                        onChange={(e) => handleInputChange('provider_clinicAddress', e.target.value)}
                        fullWidth
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><LocationOnIcon sx={{ color: '#64748B' }} /></InputAdornment>,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#F5F5F7',
                            borderRadius: 2,
                            '& fieldset': { borderColor: '#E2E8F0' },
                            '&:hover fieldset': { borderColor: '#00B4D8' },
                            '&.Mui-focused fieldset': { borderColor: '#00B4D8' }
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Pharmacy Details Section */}
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#1A1A2E', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StoreIcon sx={{ color: '#00B4D8' }} />
                    Pharmacy Details
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Pharmacy Name"
                        value={formData.providerProfile?.pharmacyName}
                        onChange={(e) => handleInputChange('provider_pharmacyName', e.target.value)}
                        fullWidth
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#F5F5F7',
                            borderRadius: 2,
                            '& fieldset': { borderColor: '#E2E8F0' },
                            '&:hover fieldset': { borderColor: '#00B4D8' },
                            '&.Mui-focused fieldset': { borderColor: '#00B4D8' }
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* License & Registration Section */}
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#1A1A2E', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VerifiedIcon sx={{ color: '#00B4D8' }} />
                    License & Registration
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="License Number"
                        value={formData.providerProfile?.licenseNumber}
                        onChange={(e) => handleInputChange('provider_licenseNumber', e.target.value)}
                        fullWidth
                        placeholder="Your professional license number"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#F5F5F7',
                            borderRadius: 2,
                            '& fieldset': { borderColor: '#E2E8F0' },
                            '&:hover fieldset': { borderColor: '#00B4D8' },
                            '&.Mui-focused fieldset': { borderColor: '#00B4D8' }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Registration Number"
                        value={formData.providerProfile?.registrationNumber}
                        onChange={(e) => handleInputChange('provider_registrationNumber', e.target.value)}
                        fullWidth
                        placeholder="Your registration/authorization number"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#F5F5F7',
                            borderRadius: 2,
                            '& fieldset': { borderColor: '#E2E8F0' },
                            '&:hover fieldset': { borderColor: '#00B4D8' },
                            '&.Mui-focused fieldset': { borderColor: '#00B4D8' }
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Profile Settings, Support & Notifications */}
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#1A1A2E', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MedicalServicesIcon sx={{ color: '#00B4D8' }} />
                    Profile Settings, Support & Notifications
                  </Typography>

                  <Stack spacing={2.5}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                      <Button
                        variant="outlined"
                        startIcon={<NotificationsIcon />}
                        onClick={() => navigate('/tools/notifications')}
                        sx={{ borderColor: '#00B4D8', color: '#00B4D8' }}
                      >
                        Open Notifications
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<LockIcon />}
                        onClick={() => navigate('/settings')}
                        sx={{ borderColor: '#00B4D8', color: '#00B4D8' }}
                      >
                        Security & Password Settings
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<LogoutIcon />}
                        onClick={handleLogout}
                      >
                        Logout
                      </Button>
                    </Stack>

                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Typography sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <HelpCenterIcon sx={{ color: '#00B4D8' }} />
                          Contact Support / Report Issue
                        </Typography>
                        <Stack spacing={2}>
                          <TextField
                            label="Subject"
                            value={supportSubject}
                            onChange={(e) => setSupportSubject(e.target.value)}
                            fullWidth
                          />
                          <TextField
                            label="Issue Details"
                            value={supportMessage}
                            onChange={(e) => setSupportMessage(e.target.value)}
                            fullWidth
                            multiline
                            minRows={3}
                          />
                          <Box>
                            <Button
                              variant="contained"
                              startIcon={<HelpCenterIcon />}
                              disabled={supportSending || !supportSubject.trim() || !supportMessage.trim()}
                              onClick={handleSubmitSupport}
                              sx={{ bgcolor: '#00B4D8', '&:hover': { bgcolor: '#0096C7' } }}
                            >
                              {supportSending ? 'Sending...' : 'Send to Admin'}
                            </Button>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Stack>
                </Box>

                {/* Save Button */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={saving}
                    sx={{
                      bgcolor: '#00B4D8',
                      color: '#FFFFFF',
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 700,
                      textTransform: 'none',
                      fontSize: '1rem',
                      boxShadow: '0 4px 12px rgba(0, 180, 216, 0.3)',
                      '&:hover': {
                        bgcolor: '#0096C7',
                        boxShadow: '0 6px 16px rgba(0, 180, 216, 0.4)'
                      },
                      '&:disabled': {
                        bgcolor: '#B0E0E6',
                        color: '#ffffff'
                      }
                    }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Box>
  )
}
