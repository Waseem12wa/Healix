import { useMemo, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
  useTheme,
  alpha
} from '@mui/material'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import FavoriteIcon from '@mui/icons-material/Favorite'
import SendIcon from '@mui/icons-material/Send'
import PersonIcon from '@mui/icons-material/Person'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import BackButton from '../ui/BackButton'
import { sendChatMessage } from '../utils/healthAssistantClient'
import DoctorReviewPrompt from '../components/DoctorReviewPrompt'

type AssistantAction = { label: string; path: string }
type Msg = { id: string; role: 'user' | 'bot'; text: string; actions?: AssistantAction[] }

const KNOWN_MEDICINES = [
  'aspirin', 'ibuprofen', 'metformin', 'lisinopril', 'atorvastatin',
  'amoxicillin', 'paracetamol', 'acetaminophen', 'omeprazole', 'sertraline'
]

const KNOWN_FOODS = ['grapefruit', 'alcohol', 'dairy', 'milk', 'cheese']

const getKnownMatches = (query: string, vocabulary: string[]) => {
  const lower = query.toLowerCase()
  return vocabulary.filter((item) => lower.includes(item))
}

const getSpecializationFromQuery = (query: string) => {
  const lower = query.toLowerCase()
  const candidates = [
    'cardiologist', 'dermatologist', 'neurologist', 'orthopedic',
    'gynecologist', 'pediatrician', 'psychiatrist', 'general physician'
  ]
  return candidates.find((item) => lower.includes(item)) || ''
}

const toCsvParam = (items: string[]) => encodeURIComponent(items.join(','))

const toPlainParagraph = (text: string) => {
  if (!text) return ''

  return text
    .replace(/\*\*/g, '')
    .replace(/[#`*_>-]/g, ' ')
    .replace(/\s*\d+\.\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export default function AIChatbot() {
  const theme = useTheme()
  // Pink accent from continue button / error color
  const pink = '#EF476F'
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Msg[]>([
    { id: 'm1', role: 'bot', text: 'Hello! I am your AI Health Assistant. How can I help you today?' },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const endRef = useRef<HTMLDivElement | null>(null)

  const buildActions = (query: string, result: any): AssistantAction[] => {
    const intent = String(result?.intent || '')
    const source = String(result?.source || '')
    const data = result?.data || {}
    const medicineMatches = getKnownMatches(query, KNOWN_MEDICINES)
    const foodMatches = getKnownMatches(query, KNOWN_FOODS)
    const actions: AssistantAction[] = []

    if (intent === 'side-effects' || source === 'side-effect-predictor') {
      const medicineFromData = typeof data?.medicine === 'string' ? data.medicine : ''
      const medicines = [medicineFromData, ...medicineMatches].filter(Boolean)
      const uniqueMeds = Array.from(new Set(medicines))
      const path = uniqueMeds.length > 0
        ? `/tools/side-effects?medicines=${toCsvParam(uniqueMeds)}`
        : '/tools/side-effects'
      actions.push({ label: 'Open Side Effects', path })
    }

    if (intent === 'drug-interaction' || source === 'drug-interaction-checker') {
      const interaction = Array.isArray(data?.interactions) ? data.interactions[0] : undefined
      const fromData = [interaction?.drug1, interaction?.drug2].filter(Boolean)
      const drugs = Array.from(new Set([...fromData, ...medicineMatches]))
      const path = drugs.length >= 2
        ? `/tools/drug-interactions?drugs=${toCsvParam(drugs.slice(0, 4))}`
        : '/tools/drug-interactions'
      actions.push({ label: 'Open Drug Interactions', path })
    }

    if (intent === 'food-interaction' || source === 'food-interaction-checker') {
      const meds = Array.from(new Set(medicineMatches))
      const foods = Array.from(new Set(foodMatches))
      const params: string[] = []
      if (meds.length > 0) params.push(`medicines=${toCsvParam(meds.slice(0, 3))}`)
      if (foods.length > 0) params.push(`foods=${toCsvParam(foods.slice(0, 3))}`)
      const path = params.length > 0
        ? `/tools/drug-food-interactions?${params.join('&')}`
        : '/tools/drug-food-interactions'
      actions.push({ label: 'Open Drug-Food Interactions', path })
    }

    if (intent === 'alternatives' || source === 'alternative-medicine') {
      const medicine = medicineMatches[0] || (typeof data?.medicine === 'string' ? data.medicine : '')
      const path = medicine
        ? `/tools/drug-alternatives?medicine=${encodeURIComponent(medicine)}`
        : '/tools/drug-alternatives'
      actions.push({ label: 'Open Alternatives', path })
    }

    if (intent === 'doctor-search' || query.toLowerCase().includes('doctor') || query.toLowerCase().includes('appointment')) {
      const specialization = getSpecializationFromQuery(query)
      const params = [`tab=0`]
      if (specialization) params.push(`specialization=${encodeURIComponent(specialization)}`)
      actions.push({ label: 'Find Doctors', path: `/tools/appointments?${params.join('&')}` })
      actions.push({ label: 'My Appointments', path: '/tools/appointments?tab=1' })
    }

    if (intent === 'medical-summary') {
      actions.push({ label: 'Open Health Summary', path: '/tools/health-summary' })
    }

    if (intent === 'reminder' || query.toLowerCase().includes('reminder')) {
      actions.push({ label: 'Open Medication Reminder', path: '/tools/medication-reminder' })
    }

    if (query.toLowerCase().includes('shop') || query.toLowerCase().includes('buy') || query.toLowerCase().includes('order') || query.toLowerCase().includes('mix')) {
      const medicine = medicineMatches[0] || ''
      const path = medicine
        ? `/shop/medicines?search=${encodeURIComponent(medicine)}`
        : '/shop/medicines'
      actions.push({ label: 'Open Medicine Shop', path })
    }

    // Remove duplicate labels while preserving order.
    const seen = new Set<string>()
    return actions.filter((item) => {
      if (seen.has(item.label)) return false
      seen.add(item.label)
      return true
    })
  }

  const send = async () => {
    const content = input.trim()
    if (!content) return

    const userMsg: Msg = { id: Math.random().toString(36).slice(2), role: 'user', text: content }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const result = await sendChatMessage(content)
      if (result.success) {
        const actions = buildActions(content, result)
        const cleanResponse = toPlainParagraph(result.response || 'I received your message but could not generate a response.')
        const botMsg: Msg = {
          id: Math.random().toString(36).slice(2),
          role: 'bot',
          text: cleanResponse,
          actions,
        }
        setMessages((prev) => [...prev, botMsg])
      } else {
        const errorMsg: Msg = {
          id: Math.random().toString(36).slice(2),
          role: 'bot',
          text: `Sorry, I encountered an error: ${result.error || 'Unknown error'}`
        }
        setMessages((prev) => [...prev, errorMsg])
      }
    } catch (error: any) {
      const errorMsg: Msg = {
        id: Math.random().toString(36).slice(2),
        role: 'bot',
        text: `Sorry, I'm having trouble connecting to the AI service. Please try again later.`
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
    }

    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const history = useMemo(() => messages.filter((m) => m.role === 'user').slice(-10).map((m, i) => ({ id: m.id, title: m.text.slice(0, 24) || `Chat ${i + 1}` })), [messages])
  const latestBotMessage = useMemo(() => {
    const botMessages = messages.filter((message) => message.role === 'bot')
    return botMessages.length > 0 ? botMessages[botMessages.length - 1] : null
  }, [messages])
  const latestUserMessage = useMemo(() => {
    const userMessages = messages.filter((message) => message.role === 'user')
    return userMessages.length > 0 ? userMessages[userMessages.length - 1] : null
  }, [messages])
  const latestBotActions = latestBotMessage?.actions || []
  const shouldShowReviewPrompt = latestBotActions.length > 0 && Boolean(latestUserMessage)

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
                background: `linear-gradient(135deg, ${pink} 0%, #FF6B9D 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid',
                borderColor: pink,
                boxShadow: `0 8px 32px ${pink}22`
              }}>
                <FavoriteIcon sx={{ fontSize: 32, color: '#fff' }} />
              </Box>
              <Box>
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{
                    background: `linear-gradient(135deg, ${pink} 0%, #FF6B9D 100%)`,
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
                <Typography variant="h6" fontWeight={700} sx={{
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
              boxShadow: `0 4px 20px ${pink}22`,
              bgcolor: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(24px)',
              border: `1.5px solid ${pink}33`,
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
                        <Box sx={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', mb: 0.5 }}>
                          <Stack direction={m.role === 'user' ? 'row-reverse' : 'row'} spacing={1.5} sx={{ maxWidth: '80%' }}>
                            <Box sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: m.role === 'bot'
                                ? `linear-gradient(135deg, ${pink} 0%, #FF6B9D 100%)`
                                : alpha(theme.palette.grey[400], 0.3),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              boxShadow: m.role === 'bot' ? `0 2px 8px ${pink}33` : undefined
                            }}>
                              {m.role === 'bot' ? (
                                <FavoriteIcon sx={{ fontSize: 20, color: '#fff' }} />
                              ) : (
                                <PersonIcon sx={{ fontSize: 20, color: theme.palette.text.secondary }} />
                              )}
                            </Box>
                            <Box sx={{
                              px: 2,
                              py: 1.5,
                              borderRadius: m.role === 'bot' ? '18px 18px 18px 6px' : '18px 18px 6px 18px',
                              bgcolor: m.role === 'bot'
                                ? alpha(pink, 0.08)
                                : alpha(theme.palette.grey[300], 0.5),
                              border: m.role === 'bot'
                                ? `2.5px solid ${pink}`
                                : `1.5px solid ${alpha(theme.palette.divider, 0.15)}`,
                              boxShadow: m.role === 'bot' ? `0 2px 8px ${pink}22` : undefined,
                              position: 'relative',
                              minWidth: 60
                            }}>
                              <Typography sx={{ lineHeight: 1.7, fontSize: '1.05rem', color: m.role === 'bot' ? pink : undefined }}>{m.text}</Typography>
                              {m.role === 'bot' && m.actions && m.actions.length > 0 && (
                                <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
                                  {m.actions.map((action) => (
                                    <Button
                                      key={`${m.id}-${action.label}`}
                                      size="small"
                                      variant="outlined"
                                      onClick={() => navigate(action.path)}
                                      sx={{
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        borderColor: pink,
                                        color: pink,
                                        fontWeight: 600,
                                        '&:hover': {
                                          borderColor: pink,
                                          backgroundColor: alpha(pink, 0.08)
                                        }
                                      }}
                                    >
                                      {action.label}
                                    </Button>
                                  ))}
                                </Stack>
                              )}
                            </Box>
                          </Stack>
                        </Box>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Typing Indicator */}
                  <AnimatePresence>
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Box sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <SmartToyIcon sx={{ fontSize: 20, color: '#fff' }} />
                          </Box>
                          <Box sx={{
                            px: 2,
                            py: 1.5,
                            borderRadius: 3,
                            bgcolor: alpha('#00B4D8', 0.1),
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography sx={{ lineHeight: 1.6, mr: 1 }}>AI is thinking</Typography>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {[0, 1, 2].map((i) => (
                                  <Box
                                    key={i}
                                    sx={{
                                      width: 4,
                                      height: 4,
                                      borderRadius: '50%',
                                      bgcolor: '#00B4D8',
                                      animation: 'typing 1.4s infinite ease-in-out',
                                      animationDelay: `${i * 0.2}s`,
                                      '@keyframes typing': {
                                        '0%, 60%, 100%': { transform: 'translateY(0)' },
                                        '30%': { transform: 'translateY(-8px)' }
                                      }
                                    }}
                                  />
                                ))}
                              </Box>
                            </Stack>
                          </Box>
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={endRef} />
                </Stack>
              </CardContent>
              <Divider />
              <Box sx={{ p: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send() } }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={send}
                          disabled={!input.trim() || isTyping}
                          sx={{
                            background: input.trim() ? `linear-gradient(135deg, ${pink} 0%, #FF6B9D 100%)` : undefined,
                            color: input.trim() ? '#fff' : undefined,
                            boxShadow: input.trim() ? `0 2px 8px ${pink}33` : undefined,
                            '&:hover': {
                              background: input.trim() ? `linear-gradient(135deg, #FF6B9D 0%, ${pink} 100%)` : undefined,
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

          <DoctorReviewPrompt
            feature="ai-assistant"
            patientQuery={latestUserMessage?.text || 'AI consultation'}
            aiResultText={shouldShowReviewPrompt ? latestBotMessage?.text || '' : ''}
            aiResultData={shouldShowReviewPrompt ? latestBotMessage || undefined : undefined}
          />
        </Stack>
      </Box>
    </Box>
  )
}
