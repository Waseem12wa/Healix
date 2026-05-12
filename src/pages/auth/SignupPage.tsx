import { useState } from 'react'
import { 
  Box, 
  Button, 
  Paper, 
  TextField, 
  Typography, 
  Alert, 
  CircularProgress,
  InputAdornment,
  IconButton,
  Card,
  CardContent
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PersonIcon from '@mui/icons-material/Person'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import BuildIcon from '@mui/icons-material/Build'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import LockIcon from '@mui/icons-material/Lock'

const roles = [
  { 
    label: 'Patient', 
    value: 'patient',
    icon: PersonIcon,
    color: '#10B981', // Success green for Patient
    iconColor: '#0F172A' // Dark gray icon when selected
  },
  { 
    label: 'Doctor', 
    value: 'doctor',
    icon: MedicalServicesIcon, // Caduceus/medical staff icon
    color: '#9D4EDD', // Purple for Doctor
    iconColor: '#9D4EDD' // Purple icon
  },
  { 
    label: 'Admin', 
    value: 'admin',
    icon: BuildIcon, // Wrench icon
    color: '#0F172A', // Dark gray for Admin
    iconColor: '#0F172A' // Dark gray icon
  },
  { 
    label: 'Provider', 
    value: 'provider',
    icon: LocalHospitalIcon, // Hospital building icon
    color: '#F43F5E', // Red for Provider
    iconColor: '#F43F5E' // Red icon (with cross)
  },
]

export default function SignupPage() {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState('patient')
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          role: selectedRole,
          userName: userName || undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle validation errors
        if (data.errors && Array.isArray(data.errors)) {
          throw new Error(data.errors.join(', '))
        }
        throw new Error(data.message || 'Signup failed')
      }

      if (data.success) {
        // Store user data in localStorage
        localStorage.setItem('userName', data.data.userName)
        localStorage.setItem('authRole', data.data.role)
        localStorage.setItem('userRole', data.data.role)
        localStorage.setItem('userEmail', data.data.email)
        localStorage.setItem('userId', data.data.id)
        localStorage.setItem('profileCompleted', data.data.profileCompleted ? 'true' : 'false')
        if (data.token) {
          localStorage.setItem('token', data.token)
        }

        // Navigate based on role
        if (selectedRole === 'patient') { 
          navigate('/dashboard') 
        } else if (selectedRole === 'doctor') { 
          navigate('/doctor-dashboard') 
        } else if (selectedRole === 'admin') { 
          navigate('/admin') 
        } else if (selectedRole === 'provider') { 
          navigate('/provider-dashboard') 
        }
      } else {
        setError(data.message || 'Signup failed')
      }
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'Failed to connect to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(140deg, #ECFEFF 0%, #F0FDFA 35%, #EFF6FF 100%)',
        py: { xs: 4, md: 6 },
        px: { xs: 2, sm: 2, md: 3 },
        animation: 'fadeIn 0.3s ease-in'
      }}
    >
      {/* Top-Left Branding */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 24, md: 32 },
          left: { xs: 24, md: 32 },
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #34D399 0%, #06B6D4 50%, #2563EB 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(14,165,233,0.28), 0 2px 6px rgba(37,99,235,0.18)'
          }}
        >
          <LockOutlinedIcon sx={{ color: '#FFFFFF', fontSize: 28 }} />
        </Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: '#0F172A',
            fontSize: { xs: '1.5rem', md: '1.75rem' }
          }}
        >
          Healix
        </Typography>
      </Box>

      {/* Main Signup Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: 640 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            bgcolor: '#FFFFFF'
          }}
        >
          {/* Welcome Section */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#0F172A',
                mb: 1,
                fontSize: { xs: '1.75rem', md: '2rem' }
              }}
            >
              Create your account
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#64748B',
                fontSize: '14px'
              }}
            >
              Join Healix to book doctors, check interactions, and more
            </Typography>
          </Box>

          {/* Role Selection */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: '#0F172A',
                mb: 2,
                fontSize: '16px'
              }}
            >
              Select your role
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 2
              }}
            >
              {roles.map((roleItem) => {
                const Icon = roleItem.icon
                const isSelected = selectedRole === roleItem.value
                
                return (
                  <motion.div
                    key={roleItem.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      onClick={() => setSelectedRole(roleItem.value)}
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 2,
                        border: isSelected ? `2px solid ${roleItem.color}` : '1px solid #E2E8F0',
                        bgcolor: isSelected ? `${roleItem.color}15` : '#FFFFFF',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: roleItem.color,
                          bgcolor: `${roleItem.color}10`,
                          boxShadow: `0 4px 12px ${roleItem.color}20`
                        }
                      }}
                    >
                      <CardContent sx={{ p: 2, textAlign: 'center' }}>
                        <Icon
                          sx={{
                            fontSize: 32,
                            color: isSelected ? (roleItem.iconColor || roleItem.color) : '#64748B',
                            mb: 1
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: isSelected ? roleItem.color : '#0F172A',
                            fontSize: '14px'
                          }}
                        >
                          {roleItem.label}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </Box>
          </Box>

          {/* Signup Form */}
          <Box component="form" onSubmit={handleSubmit}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  bgcolor: '#FEF2F2',
                  color: '#F43F5E',
                  '& .MuiAlert-icon': {
                    color: '#F43F5E'
                  }
                }}
              >
                {error}
              </Alert>
            )}

            {/* Full Name Field */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: '#0F172A',
                  mb: 1,
                  fontSize: '14px'
                }}
              >
                Full name
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter your full name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon sx={{ color: '#64748B', fontSize: 20 }} />
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
                      borderColor: '#0EA5E9'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0EA5E9',
                      borderWidth: '2px'
                    }
                  }
                }}
              />
            </Box>

            {/* Email Field */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: '#0F172A',
                  mb: 1,
                  fontSize: '14px'
                }}
              >
                Email address
              </Typography>
              <TextField
                fullWidth
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ color: '#64748B', fontSize: 20 }} />
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
                      borderColor: '#0EA5E9'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0EA5E9',
                      borderWidth: '2px'
                    }
                  }
                }}
              />
            </Box>

            {/* Password Field */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: '#0F172A',
                  mb: 1,
                  fontSize: '14px'
                }}
              >
                Password
              </Typography>
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                helperText="Must be at least 8 characters with uppercase, lowercase, number, and special character"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: '#64748B', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: '#64748B' }}
                      >
                        {showPassword ? (
                          <VisibilityOutlinedIcon fontSize="small" />
                        ) : (
                          <VisibilityOffOutlinedIcon fontSize="small" />
                        )}
                      </IconButton>
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
                      borderColor: '#0EA5E9'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0EA5E9',
                      borderWidth: '2px'
                    }
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: '12px',
                    color: '#64748B',
                    mt: 1
                  }
                }}
              />
            </Box>

            {/* Confirm Password Field */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: '#0F172A',
                  mb: 1,
                  fontSize: '14px'
                }}
              >
                Confirm Password
              </Typography>
              <TextField
                fullWidth
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: '#64748B', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        sx={{ color: '#64748B' }}
                      >
                        {showConfirmPassword ? (
                          <VisibilityOutlinedIcon fontSize="small" />
                        ) : (
                          <VisibilityOffOutlinedIcon fontSize="small" />
                        )}
                      </IconButton>
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
                      borderColor: '#0EA5E9'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0EA5E9',
                      borderWidth: '2px'
                    }
                  }
                }}
              />
            </Box>

            {/* Create Account Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ArrowForwardIcon />}
              sx={{
                color: '#FFFFFF',
                py: 1.6,
                borderRadius: 2.5,
                fontSize: '16px',
                fontWeight: 700,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #34D399 0%, #06B6D4 50%, #2563EB 100%)',
                backgroundSize: '200% 200%',
                backgroundPosition: '0% 50%',
                boxShadow: '0 10px 24px rgba(14,165,233,0.32), 0 4px 10px rgba(37,99,235,0.18)',
                transition: 'all 0.3s ease',
                mb: 3,
                '&:hover': {
                  backgroundPosition: '100% 50%',
                  boxShadow: '0 14px 28px rgba(14,165,233,0.40), 0 6px 14px rgba(37,99,235,0.22)',
                  transform: 'translateY(-2px)'
                },
                '&:disabled': {
                  background: '#CBD5E1',
                  color: '#FFFFFF',
                  boxShadow: 'none'
                }
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>

            {/* Divider */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                my: 3,
                '&::before, &::after': {
                  content: '""',
                  flex: 1,
                  height: '1px',
                  bgcolor: '#E2E8F0'
                }
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  px: 2,
                  color: '#64748B',
                  fontSize: '14px'
                }}
              >
                Already have an account?
              </Typography>
            </Box>

            {/* Login Link */}
            <Typography
              variant="body2"
              sx={{
                textAlign: 'center',
                color: '#64748B',
                fontSize: '14px',
                mb: 3
              }}
            >
              <Button
                component="a"
                href="/login"
                sx={{
                  textTransform: 'none',
                  color: '#0EA5E9',
                  fontSize: '14px',
                  fontWeight: 600,
                  p: 0,
                  minWidth: 'auto',
                  '&:hover': {
                    bgcolor: 'transparent',
                    color: '#1D4ED8',
                    textDecoration: 'underline'
                  }
                }}
              >
                Login
              </Button>
            </Typography>

            {/* Terms and Privacy */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                pt: 3,
                borderTop: '1px solid #E2E8F0'
              }}
            >
              <LockIcon sx={{ color: '#94A3B8', fontSize: 16 }} />
              <Typography
                variant="caption"
                sx={{
                  color: '#94A3B8',
                  fontSize: '12px',
                  textAlign: 'center'
                }}
              >
                By creating an account, you agree to our terms and privacy policy
              </Typography>
            </Box>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  )
}
