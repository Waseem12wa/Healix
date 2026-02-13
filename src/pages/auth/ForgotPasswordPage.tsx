import { useState } from 'react'
import { Box, Button, Paper, Stack, TextField, Typography, Alert, CircularProgress, useTheme, alpha } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import LockResetIcon from '@mui/icons-material/LockReset'
import EmailIcon from '@mui/icons-material/Email'

export default function ForgotPasswordPage() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    if (!email) {
      setError('Email is required')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('http://localhost:5000/api/password/forgot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email')
      }

      if (data.success) {
        setSuccess(true)
      } else {
        setError(data.message || 'Failed to send reset email')
      }
    } catch (err: any) {
      console.error('Forgot password error:', err)
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
        style={{ width: '100%', maxWidth: 600, position: 'relative', zIndex: 1 }}
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
          <Stack spacing={1.5}>
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
                  mb: 2,
                  boxShadow: '0 4px 12px rgba(0, 180, 216, 0.3)'
                }}
              >
                <LockResetIcon sx={{ fontSize: 32, color: '#ffffff' }} />
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
                Forgot Password?
              </Typography>
              <Typography color="text.secondary">
                No worries! Enter your email and we'll send you reset instructions.
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
                    Check Your Email
                  </Typography>
                  <Typography variant="body2">
                    We've sent a password reset link to <strong>{email}</strong>
                  </Typography>
                </Alert>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/login')}
                  startIcon={<ArrowBackIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: '#00B4D8',
                    color: '#00B4D8',
                    '&:hover': {
                      borderColor: '#0096C7',
                      bgcolor: alpha('#00B4D8', 0.05)
                    }
                  }}
                >
                  Back to Login
                </Button>
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
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                  disabled={loading}
                  autoFocus
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ color: 'text.secondary', mr: 1.5 }} />,
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
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
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
        </Paper>
      </motion.div>
    </Box>
  )
}

