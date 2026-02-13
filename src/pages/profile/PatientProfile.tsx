import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Alert,
  useTheme,
  alpha
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import SaveIcon from '@mui/icons-material/Save'
import BackButton from '../../ui/BackButton'

interface PatientProfileData {
  fullName: string
  dateOfBirth: string
  gender: 'Male' | 'Female' | 'Other' | ''
  phoneNumber: string
  email: string
  address: string
  city: string
  emergencyContact: string
  emergencyPhone: string
  bloodGroup: string
  allergies: string
  medicalHistory: string
}

export default function PatientProfile() {
  const theme = useTheme()
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [profile, setProfile] = useState<PatientProfileData>({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    phoneNumber: '',
    email: '',
    address: '',
    city: '',
    emergencyContact: '',
    emergencyPhone: '',
    bloodGroup: '',
    allergies: '',
    medicalHistory: ''
  })

  const handleInputChange = (field: keyof PatientProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
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
        <Box sx={{
          position: 'fixed',
          left: { xs: 16, md: 24 },
          top: { xs: 16, md: 24 },
          zIndex: 1100
        }}>
          <BackButton />
        </Box>

        <Stack direction="row" spacing={2.5} alignItems="center" sx={{ mb: 4 }}>
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
            <PersonIcon sx={{ fontSize: 32, color: '#00B4D8' }} />
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
              Patient Profile
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your personal and medical information
            </Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>Profile saved successfully!</Alert>}

        <form onSubmit={handleSubmit}>
          <Stack spacing={4} sx={{ maxWidth: 1200, mx: 'auto' }}>
            {/* Personal Information */}
            <Card sx={{
              borderRadius: '24px',
              boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
              bgcolor: alpha(theme.palette.background.paper, 0.6),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              overflow: 'visible'
            }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Typography variant="h6" fontWeight={700} sx={{
                  mb: 3,
                  background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Personal Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Full Name"
                      value={profile.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      required
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Date of Birth"
                      type="date"
                      value={profile.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      required
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth required>
                      <InputLabel>Gender</InputLabel>
                      <Select
                        value={profile.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        label="Gender"
                        sx={{ borderRadius: 3 }}
                      >
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Phone Number"
                      value={profile.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      required
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Email Address"
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="City"
                      value={profile.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      required
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Address"
                      value={profile.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      required
                      fullWidth
                      multiline
                      rows={2}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card sx={{
              borderRadius: '24px',
              boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
              bgcolor: alpha(theme.palette.background.paper, 0.6),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              overflow: 'visible'
            }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Typography variant="h6" fontWeight={700} sx={{
                  mb: 3,
                  background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Emergency Contact
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Emergency Contact Name"
                      value={profile.emergencyContact}
                      onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Emergency Contact Phone"
                      value={profile.emergencyPhone}
                      onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                      fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Medical Information */}
            <Card sx={{
              borderRadius: '24px',
              boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
              bgcolor: alpha(theme.palette.background.paper, 0.6),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              overflow: 'visible'
            }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Typography variant="h6" fontWeight={700} sx={{
                  mb: 3,
                  background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Medical Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Blood Group</InputLabel>
                      <Select
                        value={profile.bloodGroup}
                        onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                        label="Blood Group"
                        sx={{ borderRadius: 3 }}
                      >
                        <MenuItem value="A+">A+</MenuItem>
                        <MenuItem value="A-">A-</MenuItem>
                        <MenuItem value="B+">B+</MenuItem>
                        <MenuItem value="B-">B-</MenuItem>
                        <MenuItem value="AB+">AB+</MenuItem>
                        <MenuItem value="AB-">AB-</MenuItem>
                        <MenuItem value="O+">O+</MenuItem>
                        <MenuItem value="O-">O-</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Allergies (Optional)"
                      value={profile.allergies}
                      onChange={(e) => handleInputChange('allergies', e.target.value)}
                      fullWidth
                      placeholder="e.g., Penicillin, Peanuts"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Medical History (Optional)"
                      value={profile.medicalHistory}
                      onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="Any chronic conditions, past surgeries, or ongoing treatments..."
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={saving}
                sx={{
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                  boxShadow: '0 4px 12px rgba(0, 180, 216, 0.3)',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0096C7 0%, #05B586 100%)',
                    boxShadow: '0 6px 16px rgba(0, 180, 216, 0.4)'
                  }
                }}
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </Box>
          </Stack>
        </form>
      </Box>
    </Box>
  )
}
