import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Stack,
  TextField,
  Typography,
  useTheme,
  alpha
} from '@mui/material'
import NotificationsIcon from '@mui/icons-material/Notifications'
import EmailIcon from '@mui/icons-material/Email'
import SmsIcon from '@mui/icons-material/Sms'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm'
import BackButton from '../ui/BackButton'

type NotificationPrefs = {
  email: { enabled: boolean; address: string }
  sms: { enabled: boolean; number: string }
  whatsapp: { enabled: boolean; number: string }
}

const SAMPLE_REMINDERS = [
  { id: 1, med: 'Metformin', time: '8:00 AM', channel: 'WhatsApp', icon: <WhatsAppIcon sx={{ color: '#25D366' }} /> },
  { id: 2, med: 'Lisinopril', time: '1:00 PM', channel: 'SMS', icon: <SmsIcon sx={{ color: '#00B4D8' }} /> },
  { id: 3, med: 'Vitamin D', time: '6:00 PM', channel: 'Email', icon: <EmailIcon sx={{ color: '#06D6A0' }} /> },
]

export default function Notifications() {
  const theme = useTheme()
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    email: { enabled: true, address: '' },
    sms: { enabled: false, number: '' },
    whatsapp: { enabled: false, number: '' },
  })
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const handleSave = () => {
    if (!prefs.email.enabled && !prefs.sms.enabled && !prefs.whatsapp.enabled) {
      setAlert({ type: 'error', msg: 'Please enable at least one notification channel.' })
      return
    }
    if (prefs.email.enabled && !prefs.email.address) {
      setAlert({ type: 'error', msg: 'Email address is required when email notifications are enabled.' })
      return
    }
    if (prefs.sms.enabled && !prefs.sms.number) {
      setAlert({ type: 'error', msg: 'Phone number is required when SMS notifications are enabled.' })
      return
    }
    if (prefs.whatsapp.enabled && !prefs.whatsapp.number) {
      setAlert({ type: 'error', msg: 'WhatsApp number is required when WhatsApp notifications are enabled.' })
      return
    }
    setAlert({ type: 'success', msg: 'Notification preferences saved successfully!' })
    setTimeout(() => setAlert(null), 3000)
  }

  const updateChannel = (channel: keyof NotificationPrefs, field: 'enabled' | 'address' | 'number', value: boolean | string) => {
    setPrefs((prev) => ({ ...prev, [channel]: { ...prev[channel], [field]: value } }))
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
        <Stack spacing={4}>
          {/* Back Button */}
          <Box>
            <BackButton />
          </Box>

          {/* Header */}
          <Stack direction="row" spacing={2.5} alignItems="center">
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
              <NotificationsIcon sx={{ fontSize: 32, color: '#1947D2' }} />
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
                Notifications
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage your notification preferences and channels
              </Typography>
            </Box>
          </Stack>

          {alert && (
            <Alert severity={alert.type} onClose={() => setAlert(null)} sx={{ borderRadius: 2 }}>
              {alert.msg}
            </Alert>
          )}

          {/* Notification Channels Card */}
          <Card sx={{
            borderRadius: '24px',
            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            overflow: 'visible'
          }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack spacing={3}>
                <Typography variant="h6" fontWeight={700} sx={{
                  mb: 2,
                  background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Notification Channels
                </Typography>

                {/* Email */}
                <Box sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                    <Box sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <EmailIcon sx={{ color: '#7C3AED', fontSize: 20 }} />
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#7C3AED' }}>
                      Email
                    </Typography>
                  </Stack>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={prefs.email.enabled}
                        onChange={(e) => updateChannel('email', 'enabled', e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#7C3AED',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#7C3AED',
                          },
                        }}
                      />
                    }
                    label="Enable email notifications"
                  />
                  {prefs.email.enabled && (
                    <TextField
                      label="Email address"
                      type="email"
                      value={prefs.email.address}
                      onChange={(e) => updateChannel('email', 'address', e.target.value)}
                      fullWidth
                      sx={{
                        mt: 2,
                        '& .MuiOutlinedInput-root': { borderRadius: 3 }
                      }}
                    />
                  )}
                </Box>

                {/* SMS */}
                <Box sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                    <Box sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.1) 0%, rgba(0, 180, 216, 0.05) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <SmsIcon sx={{ color: '#00B4D8', fontSize: 20 }} />
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#00B4D8' }}>
                      SMS
                    </Typography>
                  </Stack>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={prefs.sms.enabled}
                        onChange={(e) => updateChannel('sms', 'enabled', e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#00B4D8',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#00B4D8',
                          },
                        }}
                      />
                    }
                    label="Enable SMS notifications"
                  />
                  {prefs.sms.enabled && (
                    <TextField
                      label="Phone number"
                      type="tel"
                      value={prefs.sms.number}
                      onChange={(e) => updateChannel('sms', 'number', e.target.value)}
                      fullWidth
                      sx={{
                        mt: 2,
                        '& .MuiOutlinedInput-root': { borderRadius: 3 }
                      }}
                    />
                  )}
                </Box>

                {/* WhatsApp */}
                <Box sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                }}>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                    <Box sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.1) 0%, rgba(37, 211, 102, 0.05) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <WhatsAppIcon sx={{ color: '#25D366', fontSize: 20 }} />
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#25D366' }}>
                      WhatsApp
                    </Typography>
                  </Stack>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={prefs.whatsapp.enabled}
                        onChange={(e) => updateChannel('whatsapp', 'enabled', e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#25D366',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#25D366',
                          },
                        }}
                      />
                    }
                    label="Enable WhatsApp notifications"
                  />
                  {prefs.whatsapp.enabled && (
                    <TextField
                      label="WhatsApp number"
                      type="tel"
                      value={prefs.whatsapp.number}
                      onChange={(e) => updateChannel('whatsapp', 'number', e.target.value)}
                      fullWidth
                      sx={{
                        mt: 2,
                        '& .MuiOutlinedInput-root': { borderRadius: 3 }
                      }}
                    />
                  )}
                </Box>

                <Button
                  variant="contained"
                  onClick={handleSave}
                  sx={{
                    alignSelf: 'flex-start',
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
                  Save Preferences
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Sample Reminders Card */}
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
                mb: 1,
                background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Sample Reminders
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Here's how your reminders will look:
              </Typography>
              <Stack spacing={2}>
                {SAMPLE_REMINDERS.map((r) => (
                  <Box
                    key={r.id}
                    sx={{
                      p: 2.5,
                      borderRadius: '16px',
                      bgcolor: alpha(theme.palette.background.paper, 0.5),
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`
                      }
                    }}
                  >
                    <Box sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.1) 0%, rgba(6, 214, 160, 0.1) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <AccessAlarmIcon sx={{ color: '#00B4D8', fontSize: 24 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700} sx={{
                        background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>
                        {r.med} - {r.time}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        via {r.channel}
                      </Typography>
                    </Box>
                    <Box sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '12px',
                      bgcolor: alpha(theme.palette.background.paper, 0.8),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {r.icon}
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Box>
  )
}
