import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
  alpha,
  Alert
} from '@mui/material'
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import EmailIcon from '@mui/icons-material/Email'
import SmsIcon from '@mui/icons-material/Sms'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '../ui/BackButton'

type Reminder = {
  id: string
  name: string
  dosage: string
  frequency: 'Once daily' | 'Twice daily' | 'Every 8h' | 'Custom'
  startDate: string
  time: string
  channels: { email: boolean; sms: boolean; whatsapp: boolean }
}

export default function MedicationReminder() {
  const theme = useTheme()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [form, setForm] = useState<Reminder>({
    id: '',
    name: '',
    dosage: '',
    frequency: 'Once daily',
    startDate: '',
    time: '',
    channels: { email: true, sms: false, whatsapp: false },
  })

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const id = form.id || Math.random().toString(36).slice(2)
    const newItem = { ...form, id }
    setReminders((prev) => {
      const exists = prev.some((r) => r.id === id)
      return exists ? prev.map((r) => (r.id === id ? newItem : r)) : [newItem, ...prev]
    })
    setForm({ id: '', name: '', dosage: '', frequency: 'Once daily', startDate: '', time: '', channels: { email: true, sms: false, whatsapp: false } })
  }

  const onEdit = (r: Reminder) => setForm(r)
  const onDelete = (id: string) => setReminders((prev) => prev.filter((r) => r.id !== id))

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
          <BackButton />

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
              <AccessAlarmIcon sx={{ fontSize: 32, color: '#00B4D8' }} />
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
                Medication Reminder
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Set up reminders for your medications
              </Typography>
            </Box>
          </Stack>

          {/* Add/Edit Form Card */}
          <Card sx={{
            borderRadius: '24px',
            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack component="form" onSubmit={onSubmit} spacing={3}>
                <Typography variant="h6" fontWeight={700} sx={{
                  background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {form.id ? 'Edit Reminder' : 'Add New Reminder'}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Medicine name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />
                  <TextField
                    label="Dosage"
                    placeholder="e.g., 500mg"
                    value={form.dosage}
                    onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                    required
                    fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}>
                    <InputLabel id="freq-label">Frequency</InputLabel>
                    <Select
                      labelId="freq-label"
                      value={form.frequency}
                      label="Frequency"
                      onChange={(e) => setForm({ ...form, frequency: e.target.value as Reminder['frequency'] })}
                    >
                      <MenuItem value="Once daily">Once daily</MenuItem>
                      <MenuItem value="Twice daily">Twice daily</MenuItem>
                      <MenuItem value="Every 8h">Every 8 hours</MenuItem>
                      <MenuItem value="Custom">Custom</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    type="date"
                    label="Start date"
                    InputLabelProps={{ shrink: true }}
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />
                  <TextField
                    type="time"
                    label="Time"
                    InputLabelProps={{ shrink: true }}
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />
                </Stack>
                <Box>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5, color: 'text.secondary' }}>
                    Notification Channels
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={form.channels.email}
                          onChange={(e) => setForm({ ...form, channels: { ...form.channels, email: e.target.checked } })}
                          sx={{ color: '#7C3AED', '&.Mui-checked': { color: '#7C3AED' } }}
                        />
                      }
                      label={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <EmailIcon sx={{ fontSize: 20, color: '#7C3AED' }} />
                          <Typography>Email</Typography>
                        </Stack>
                      }
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={form.channels.sms}
                          onChange={(e) => setForm({ ...form, channels: { ...form.channels, sms: e.target.checked } })}
                          sx={{ color: '#00B4D8', '&.Mui-checked': { color: '#00B4D8' } }}
                        />
                      }
                      label={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <SmsIcon sx={{ fontSize: 20, color: '#00B4D8' }} />
                          <Typography>SMS</Typography>
                        </Stack>
                      }
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={form.channels.whatsapp}
                          onChange={(e) => setForm({ ...form, channels: { ...form.channels, whatsapp: e.target.checked } })}
                          sx={{ color: '#25D366', '&.Mui-checked': { color: '#25D366' } }}
                        />
                      }
                      label={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <WhatsAppIcon sx={{ fontSize: 20, color: '#25D366' }} />
                          <Typography>WhatsApp</Typography>
                        </Stack>
                      }
                    />
                  </Stack>
                </Box>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={form.id ? <EditIcon /> : <AddIcon />}
                  sx={{
                    borderRadius: 3,
                    px: 4,
                    py: 1.5,
                    background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                    boxShadow: '0 4px 12px rgba(0, 180, 216, 0.3)',
                    alignSelf: 'flex-start',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0096C7 0%, #05B586 100%)',
                      boxShadow: '0 6px 16px rgba(0, 180, 216, 0.4)'
                    }
                  }}
                >
                  {form.id ? 'Update Reminder' : 'Add Reminder'}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Reminders List */}
          {reminders.length === 0 && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              No active reminders yet. Add your first medication reminder above.
            </Alert>
          )}

          <Stack spacing={2}>
            <AnimatePresence>
              {reminders.map((r, idx) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <Card sx={{
                    borderRadius: '24px',
                    boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
                    bgcolor: alpha(theme.palette.background.paper, 0.6),
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    borderLeft: `6px solid #06D6A0`,
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.1)}`
                    }
                  }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={700} sx={{
                            fontSize: '1.15rem',
                            background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            mb: 1.5
                          }}>
                            {r.name} — {r.dosage}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                            <Chip
                              icon={<AccessAlarmIcon />}
                              label={r.frequency}
                              size="small"
                              sx={{
                                borderRadius: '8px',
                                bgcolor: alpha('#00B4D8', 0.1),
                                color: '#00B4D8',
                                fontWeight: 600
                              }}
                            />
                            <Chip
                              icon={<CalendarMonthIcon />}
                              label={r.startDate || 'No date'}
                              size="small"
                              sx={{ borderRadius: '8px' }}
                            />
                            <Chip
                              label={r.time || 'No time'}
                              size="small"
                              sx={{ borderRadius: '8px' }}
                            />
                            {r.channels.email && (
                              <Chip
                                icon={<EmailIcon />}
                                label="Email"
                                size="small"
                                sx={{
                                  borderRadius: '8px',
                                  bgcolor: alpha('#7C3AED', 0.1),
                                  color: '#7C3AED'
                                }}
                              />
                            )}
                            {r.channels.sms && (
                              <Chip
                                icon={<SmsIcon />}
                                label="SMS"
                                size="small"
                                sx={{
                                  borderRadius: '8px',
                                  bgcolor: alpha('#00B4D8', 0.1),
                                  color: '#00B4D8'
                                }}
                              />
                            )}
                            {r.channels.whatsapp && (
                              <Chip
                                icon={<WhatsAppIcon />}
                                label="WhatsApp"
                                size="small"
                                sx={{
                                  borderRadius: '8px',
                                  bgcolor: alpha('#25D366', 0.1),
                                  color: '#25D366'
                                }}
                              />
                            )}
                          </Stack>
                        </Box>
                        <CardActions sx={{ p: 0 }}>
                          <Stack direction="row" spacing={1}>
                            <Button
                              onClick={() => onEdit(r)}
                              variant="outlined"
                              size="small"
                              sx={{
                                borderRadius: 2,
                                borderColor: '#00B4D8',
                                color: '#00B4D8',
                                '&:hover': {
                                  borderColor: '#0096C7',
                                  bgcolor: alpha('#00B4D8', 0.05)
                                }
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => onDelete(r.id)}
                              variant="outlined"
                              size="small"
                              color="error"
                              sx={{ borderRadius: 2 }}
                            >
                              Delete
                            </Button>
                          </Stack>
                        </CardActions>
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </Stack>
        </Stack>
      </Box>
    </Box>
  )
}
