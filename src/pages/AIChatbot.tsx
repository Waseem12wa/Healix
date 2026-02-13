import { useMemo, useRef, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Switch,
  TextField,
  Typography,
  useTheme,
  alpha
} from '@mui/material'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import SendIcon from '@mui/icons-material/Send'
import PersonIcon from '@mui/icons-material/Person'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '../ui/BackButton'

type Msg = { id: string; role: 'user' | 'bot'; text: string }

export default function AIChatbot() {
  const theme = useTheme()
  const [messages, setMessages] = useState<Msg[]>([
    { id: 'm1', role: 'bot', text: 'Hello! I am your AI Health Assistant. How can I help you today?' },
  ])
  const [input, setInput] = useState('')
  const [urdu, setUrdu] = useState(false)
  const endRef = useRef<HTMLDivElement | null>(null)

  const send = () => {
    const content = input.trim()
    if (!content) return
    const userMsg: Msg = { id: Math.random().toString(36).slice(2), role: 'user', text: content }
    const placeholder = urdu ? 'ہم فی الحال ماڈل کو بہتر بنا رہے ہیں۔ براہ کرم کچھ دیر بعد دوبارہ کوشش کریں۔' : 'We are improving our model. Please try again later.'
    const botMsg: Msg = { id: Math.random().toString(36).slice(2), role: 'bot', text: placeholder }
    setMessages((prev) => [...prev, userMsg, botMsg])
    setInput('')
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const history = useMemo(() => messages.filter((m) => m.role === 'user').slice(-10).map((m, i) => ({ id: m.id, title: m.text.slice(0, 24) || `Chat ${i + 1}` })), [messages])

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
        <Stack spacing={3}>
          <BackButton />

          {/* Header */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
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
                <SmartToyIcon sx={{ fontSize: 32, color: '#00B4D8' }} />
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
                  AI Health Assistant
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Ask health-related questions
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" fontWeight={600}>EN</Typography>
              <Switch
                checked={urdu}
                onChange={(e) => setUrdu(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#00B4D8',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#00B4D8',
                  },
                }}
              />
              <Typography variant="body2" fontWeight={600}>UR</Typography>
            </Stack>
          </Stack>

          {/* Chat Interface */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '260px 1fr' }, gap: 3, height: { md: '70vh' } }}>
            {/* Sidebar - Chat History */}
            <Card sx={{
              display: { xs: 'none', md: 'block' },
              borderRadius: '24px',
              boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
              bgcolor: alpha(theme.palette.background.paper, 0.6),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}>
              <CardContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography sx={{ p: 3, pb: 2 }} variant="h6" fontWeight={700} sx={{
                  background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  p: 3,
                  pb: 2
                }}>
                  Chat History
                </Typography>
                <Divider />
                <List dense sx={{ flex: 1, overflow: 'auto' }}>
                  {history.map((h) => (
                    <ListItemButton key={h.id} sx={{ borderRadius: 2, mx: 1 }}>
                      <ListItemText
                        primary={h.title}
                        secondary="Recent"
                        primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* Main Chat Area */}
            <Card sx={{
              borderRadius: '24px',
              boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
              bgcolor: alpha(theme.palette.background.paper, 0.6),
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              display: 'flex',
              flexDirection: 'column',
              height: { xs: '60vh', md: '100%' }
            }}>
              <CardContent sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                <Stack spacing={2}>
                  <AnimatePresence>
                    {messages.map((m) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                          <Stack direction={m.role === 'user' ? 'row-reverse' : 'row'} spacing={1.5} sx={{ maxWidth: '80%' }}>
                            <Box sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: m.role === 'bot'
                                ? 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)'
                                : alpha(theme.palette.grey[400], 0.3),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              {m.role === 'bot' ? (
                                <SmartToyIcon sx={{ fontSize: 20, color: '#fff' }} />
                              ) : (
                                <PersonIcon sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                              )}
                            </Box>
                            <Box sx={{
                              px: 2,
                              py: 1.5,
                              borderRadius: 3,
                              bgcolor: m.role === 'bot'
                                ? alpha('#00B4D8', 0.1)
                                : alpha(theme.palette.grey[300], 0.5),
                              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            }}>
                              <Typography sx={{ lineHeight: 1.6 }}>{m.text}</Typography>
                            </Box>
                          </Stack>
                        </Box>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={endRef} />
                </Stack>
              </CardContent>
              <Divider />
              <Box sx={{ p: 2 }}>
                <TextField
                  fullWidth
                  placeholder={urdu ? 'اپنا پیغام لکھیں…' : 'Type your message…'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send() } }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={send}
                          disabled={!input.trim()}
                          sx={{
                            background: input.trim() ? 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)' : undefined,
                            color: input.trim() ? '#fff' : undefined,
                            '&:hover': {
                              background: input.trim() ? 'linear-gradient(135deg, #0096C7 0%, #05B586 100%)' : undefined,
                            }
                          }}
                        >
                          <SendIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Box>
            </Card>
          </Box>
        </Stack>
      </Box>
    </Box>
  )
}
