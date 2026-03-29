import { useState, useEffect } from 'react'
import { Box, Button, Paper, Stack, TextField, Typography, Alert, CircularProgress, useTheme, alpha, IconButton, InputAdornment } from '@mui/material'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import LockResetIcon from '@mui/icons-material/LockReset'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import KeyIcon from '@mui/icons-material/Key'

export default function ResetPasswordPage() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState(false)

  useEffect(() => {
    // Verify token on mount
    const verifyToken = async () => {
      if (!token) {
        setError('Invalid reset link. Please request a new password reset.')
        setVerifying(false)
        return
      }

      try {
        const response = await fetch(`/api/password/verify-token?token=${token}`)
        const data = await response.json()

        if (data.success && data.valid) {
          setTokenValid(true)
        } else {
          setError('Invalid or expired reset link. Please request a new password reset.')
        }
      } catch (err) {
        setError('Failed to verify reset link. Please try again.')
      } finally {
        setVerifying(false)
      }
    }

    verifyToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/password/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          throw new Error(data.errors.join(', '))
        }
        throw new Error(data.message || 'Failed to reset password')
      }

      if (data.success) {
        setSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        setError(data.message || 'Failed to reset password')
      }
    } catch (err: any) {
      console.error('Reset password error:', err)
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
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: theme.palette.background.default,
        position: 'relative',
        overflow: 'hidden',
        p: 3
      }}
    >
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
        <Box sx={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 180, 216, 0.15) 0%, rgba(0, 180, 216, 0.05) 50%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'float 20s ease-in-out infinite'
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 214, 160, 0.15) 0%, rgba(6, 214, 160, 0.05) 50%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'float 25s ease-in-out infinite reverse'
        }} />
      </Box>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 5 },
            borderRadius: 4,
            bgcolor: alpha('#ffffff', 0.8),
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.5)'
          }}
        >
          {verifying ? (
            <Stack spacing={3} alignItems="center" textAlign="center">
              <CircularProgress sx={{ color: '#00B4D8' }} />
              <Typography variant="h6" fontWeight={600}>Verifying Reset Link...</Typography>
            </Stack>
          ) : !tokenValid ? (
            <Stack spacing={3} textAlign="center">
              <Alert
                severity="error"
                sx={{
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  color: theme.palette.error.dark,
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                }}
              >
                {error || 'Invalid or expired reset link'}
              </Alert>
              <Button
                variant="contained"
                onClick={() => navigate('/forgot-password')}
                fullWidth
                sx={{
                  height: 48,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                  boxShadow: '0 4px 12px rgba(0, 180, 216, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0096C7 0%, #05b588 100%)',
                    boxShadow: '0 6px 16px rgba(0, 180, 216, 0.4)'
                  }
                }}
              >
                Request New Reset Link
              </Button>
            </Stack>
          ) : (
            <Stack spacing={4}>
              <Box textAlign="center">
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                    boxShadow: '0 4px 12px rgba(0, 180, 216, 0.3)'
                  }}
                >
                  <KeyIcon sx={{ fontSize: 32, color: '#ffffff' }} />
                </Box>
                <Typography
                  variant="h4"
                  fontWeight={800}
                  gutterBottom
                  sx={{
                    background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Reset Password
                </Typography>
                <Typography color="text.secondary">
                  Enter your new password below.
                </Typography>
              </Box>

              {success ? (
                <Stack spacing={3} textAlign="center">
                  <Alert
                    severity="success"
                    sx={{
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      color: theme.palette.success.dark,
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                      Password Reset Successful!
                    </Typography>
                    <Typography variant="body2">
                      Your password has been reset successfully. Redirecting to login...
                    </Typography>
                  </Alert>
                </Stack>
              ) : (
                <Stack spacing={3} component="form" onSubmit={handleSubmit}>
                  {error && (
                    <Alert
                      severity="error"
                      sx={{
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                        color: theme.palette.error.dark,
                        border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                      }}
                    >
                      {error}
                    </Alert>
                  )}

                  <TextField
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    fullWidth
                    disabled={loading}
                    autoFocus
                    helperText="Must be at least 8 characters with uppercase, lowercase, number, and special character"
                    InputProps={{
                      startAdornment: <LockResetIcon sx={{ color: 'text.secondary', mr: 1.5 }} />,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 2 }
                    }}
                  />

                  <TextField
                    label="Confirm New Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    fullWidth
                    disabled={loading}
                    InputProps={{
                      startAdornment: <LockResetIcon sx={{ color: 'text.secondary', mr: 1.5 }} />,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 2 }
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={loading}
                    sx={{
                      height: 48,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                      boxShadow: '0 4px 12px rgba(0, 180, 216, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #0096C7 0%, #05b588 100%)',
                        boxShadow: '0 6px 16px rgba(0, 180, 216, 0.4)'
                      }
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
                  </Button>

                  <Button
                    variant="text"
                    onClick={() => navigate('/login')}
                    startIcon={<ArrowBackIcon />}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      color: 'text.secondary',
                      '&:hover': { color: '#00B4D8', bgcolor: 'transparent' }
                    }}
                  >
                    Back to Login
                  </Button>
                </Stack>
              )}
            </Stack>
          )}
        </Paper>
      </motion.div>
    </Box>
  )
}

