import { useState, useEffect } from 'react'
import { Box, Button, Card, CardContent, Checkbox, FormControlLabel, Stack, TextField, Typography } from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import EditIcon from '@mui/icons-material/Edit'
import LockIcon from '@mui/icons-material/Lock'
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety'
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm'
import SaveIcon from '@mui/icons-material/Save'
import BackButton from '../ui/BackButton'
import { useNavigate } from 'react-router-dom'

type UserProfile = {
  name: string
  age: number
  gender: string
  email: string
  phone: string
  medicalHistory: string[]
  lastCheck: string
  remindersActive: number
}

export default function Profile() {
  const navigate = useNavigate()

  // Redirect doctors to doctor profile page
  useEffect(() => {
    const role = localStorage.getItem('authRole')
    if (role === 'doctor') {
      navigate('/doctor-profile', { replace: true })
    }
  }, [navigate])

  const [profile, setProfile] = useState<UserProfile>({
    name: 'John Doe',
    age: 35,
    gender: 'Male',
    email: 'john.doe@email.com',
    phone: '+1 (555) 123-4567',
    medicalHistory: ['Diabetes Type 2', 'Hypertension', 'Allergic to Penicillin'],
    lastCheck: '3 days ago',
    remindersActive: 4,
  })

  const [editMode, setEditMode] = useState(false)
  const [passwordMode, setPasswordMode] = useState(false)
  const [consents, setConsents] = useState({
    shareWithDoctors: true,
    shareForResearch: false,
    shareWithProviders: true,
  })

  const handleEdit = () => setEditMode(!editMode)
  const handlePassword = () => setPasswordMode(!passwordMode)

  const updateProfile = (field: keyof UserProfile, value: string | number) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const updateConsent = (field: keyof typeof consents, value: boolean) => {
    setConsents(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F5F5F7 0%, #E8F4F8 100%)',
      py: { xs: 4, md: 6 },
      px: { xs: 2, md: 4 }
    }}>
      {/* Main Content */}
      <Box sx={{ maxWidth: 1400, mx: 'auto', pt: { xs: 4, md: 6 } }}>
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
                bgcolor: '#06D6A0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(6, 214, 160, 0.3)'
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
                  Profile
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748B', fontSize: '14px' }}>
                  Manage your personal information and preferences
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Personal Information Card */}
          <Card elevation={0} sx={{
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            bgcolor: '#FFFFFF'
          }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack spacing={3}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#1A1A2E', fontSize: '18px' }}>
                    Personal Information
                  </Typography>
                  <Button
                    startIcon={<EditIcon />}
                    variant={editMode ? "outlined" : "contained"}
                    onClick={handleEdit}
                    sx={{
                      textTransform: 'none',
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: '14px',
                      ...(editMode ? {
                        borderColor: '#E2E8F0',
                        color: '#64748B',
                        '&:hover': {
                          borderColor: '#CBD5E1',
                          bgcolor: '#F5F5F7'
                        }
                      } : {
                        bgcolor: '#06D6A0',
                        color: '#FFFFFF',
                        boxShadow: '0 2px 8px rgba(6, 214, 160, 0.3)',
                        '&:hover': {
                          bgcolor: '#04A777',
                          boxShadow: '0 4px 12px rgba(6, 214, 160, 0.4)'
                        }
                      })
                    }}
                  >
                    {editMode ? 'Cancel' : 'Edit Profile'}
                  </Button>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Full Name"
                    value={profile.name}
                    onChange={(e) => updateProfile('name', e.target.value)}
                    disabled={!editMode}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: editMode ? '#F5F5F7' : '#FAFAFA',
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: '#E2E8F0'
                        },
                        '&:hover fieldset': {
                          borderColor: editMode ? '#00B4D8' : '#E2E8F0'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#00B4D8',
                          borderWidth: '2px'
                        }
                      }
                    }}
                  />
                  <TextField
                    label="Age"
                    type="number"
                    value={profile.age}
                    onChange={(e) => updateProfile('age', parseInt(e.target.value))}
                    disabled={!editMode}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: editMode ? '#F5F5F7' : '#FAFAFA',
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: '#E2E8F0'
                        },
                        '&:hover fieldset': {
                          borderColor: editMode ? '#00B4D8' : '#E2E8F0'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#00B4D8',
                          borderWidth: '2px'
                        }
                      }
                    }}
                  />
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Gender"
                    value={profile.gender}
                    onChange={(e) => updateProfile('gender', e.target.value)}
                    disabled={!editMode}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: editMode ? '#F5F5F7' : '#FAFAFA',
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: '#E2E8F0'
                        },
                        '&:hover fieldset': {
                          borderColor: editMode ? '#00B4D8' : '#E2E8F0'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#00B4D8',
                          borderWidth: '2px'
                        }
                      }
                    }}
                  />
                  <TextField
                    label="Email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => updateProfile('email', e.target.value)}
                    disabled={!editMode}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: editMode ? '#F5F5F7' : '#FAFAFA',
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: '#E2E8F0'
                        },
                        '&:hover fieldset': {
                          borderColor: editMode ? '#00B4D8' : '#E2E8F0'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#00B4D8',
                          borderWidth: '2px'
                        }
                      }
                    }}
                  />
                </Stack>

                <TextField
                  label="Phone"
                  value={profile.phone}
                  onChange={(e) => updateProfile('phone', e.target.value)}
                  disabled={!editMode}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: editMode ? '#F5F5F7' : '#FAFAFA',
                      borderRadius: 2,
                      '& fieldset': {
                        borderColor: '#E2E8F0'
                      },
                      '&:hover fieldset': {
                        borderColor: editMode ? '#00B4D8' : '#E2E8F0'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00B4D8',
                        borderWidth: '2px'
                      }
                    }
                  }}
                />

                {editMode && (
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={() => setEditMode(false)}
                    sx={{
                      alignSelf: 'flex-start',
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
                      }
                    }}
                  >
                    Save Changes
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card elevation={0} sx={{
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            bgcolor: '#FFFFFF'
          }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack spacing={3}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#1A1A2E', fontSize: '18px' }}>
                    Security
                  </Typography>
                  <Button
                    startIcon={<LockIcon />}
                    variant={passwordMode ? "outlined" : "contained"}
                    onClick={handlePassword}
                    sx={{
                      textTransform: 'none',
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: '14px',
                      ...(passwordMode ? {
                        borderColor: '#E2E8F0',
                        color: '#64748B',
                        '&:hover': {
                          borderColor: '#CBD5E1',
                          bgcolor: '#F5F5F7'
                        }
                      } : {
                        bgcolor: '#06D6A0',
                        color: '#FFFFFF',
                        boxShadow: '0 2px 8px rgba(6, 214, 160, 0.3)',
                        '&:hover': {
                          bgcolor: '#04A777',
                          boxShadow: '0 4px 12px rgba(6, 214, 160, 0.4)'
                        }
                      })
                    }}
                  >
                    {passwordMode ? 'Cancel' : 'Update Password'}
                  </Button>
                </Stack>

                {passwordMode && (
                  <Stack spacing={2}>
                    <TextField
                      label="Current Password"
                      type="password"
                      fullWidth
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
                      label="New Password"
                      type="password"
                      fullWidth
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
                      label="Confirm New Password"
                      type="password"
                      fullWidth
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
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={() => setPasswordMode(false)}
                      sx={{
                        alignSelf: 'flex-start',
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
                        }
                      }}
                    >
                      Update Password
                    </Button>
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Medical History Card */}
          <Card elevation={0} sx={{
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            bgcolor: '#FFFFFF'
          }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 3, color: '#1A1A2E', fontSize: '18px' }}>
                Medical History
              </Typography>
              <Stack spacing={2}>
                {profile.medicalHistory.map((condition, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      bgcolor: '#F5F5F7',
                      borderRadius: 2,
                      border: '1px solid #E2E8F0'
                    }}
                  >
                    <Typography sx={{ color: '#1A1A2E', fontSize: '14px' }}>{condition}</Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>

          {/* Data Sharing Consent Card */}
          <Card elevation={0} sx={{
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            bgcolor: '#FFFFFF'
          }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 3, color: '#1A1A2E', fontSize: '18px' }}>
                Data Sharing Consent
              </Typography>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={consents.shareWithDoctors}
                      onChange={(e) => updateConsent('shareWithDoctors', e.target.checked)}
                      sx={{
                        color: '#CBD5E1',
                        '&.Mui-checked': {
                          color: '#06D6A0'
                        }
                      }}
                    />
                  }
                  label={<Typography sx={{ color: '#1A1A2E', fontSize: '14px' }}>Share data with my doctors</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={consents.shareForResearch}
                      onChange={(e) => updateConsent('shareForResearch', e.target.checked)}
                      sx={{
                        color: '#CBD5E1',
                        '&.Mui-checked': {
                          color: '#06D6A0'
                        }
                      }}
                    />
                  }
                  label={<Typography sx={{ color: '#1A1A2E', fontSize: '14px' }}>Share anonymized data for medical research</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={consents.shareWithProviders}
                      onChange={(e) => updateConsent('shareWithProviders', e.target.checked)}
                      sx={{
                        color: '#CBD5E1',
                        '&.Mui-checked': {
                          color: '#06D6A0'
                        }
                      }}
                    />
                  }
                  label={<Typography sx={{ color: '#1A1A2E', fontSize: '14px' }}>Share data with healthcare providers</Typography>}
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Health Summary Card */}
          <Card elevation={0} sx={{
            borderRadius: 3,
            boxShadow: '0 4px 12px rgba(6, 214, 160, 0.2)',
            border: 'none',
            background: 'linear-gradient(135deg, #06D6A0 0%, #04A777 100%)',
            color: '#FFFFFF'
          }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <HealthAndSafetyIcon sx={{ fontSize: 28 }} />
                <Typography variant="h6" fontWeight={700} sx={{ color: '#FFFFFF', fontSize: '18px' }}>
                  Health Summary
                </Typography>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5, fontSize: '13px' }}>
                    Last Check
                  </Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#FFFFFF', fontSize: '20px' }}>
                    {profile.lastCheck}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5, fontSize: '13px' }}>
                    Reminders Active
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccessAlarmIcon sx={{ fontSize: 24 }} />
                    <Typography variant="h6" fontWeight={700} sx={{ color: '#FFFFFF', fontSize: '20px' }}>
                      {profile.remindersActive}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Box>
  )
}
