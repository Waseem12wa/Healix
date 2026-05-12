import { useMemo, useRef, useState, useEffect } from 'react'
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
  useTheme,
  alpha,
} from '@mui/material'
import SmartToyIcon from '@mui/icons-material/SmartToyRounded'
import SendIcon from '@mui/icons-material/SendRounded'
import PersonIcon from '@mui/icons-material/PersonRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import FiberManualRecordRoundedIcon from '@mui/icons-material/FiberManualRecordRounded'
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import TipsAndUpdatesRoundedIcon from '@mui/icons-material/TipsAndUpdatesRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import BackButton from '../ui/BackButton'
import { sendChatMessage } from '../utils/healthAssistantClient'
import { BRAND_GRADIENT, HERO_BG, GLASS_SURFACE as GLASS, SOFT_BORDER, PREMIUM_SHADOW } from '../ui/premium'

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
  useTheme()
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

  const history = useMemo(() => messages.filter((m) => m.role === 'user').slice(-10).map((m, i) => ({ id: m.id, title: m.text.slice(0, 32) || `Chat ${i + 1}` })), [messages])

  // Auto-scroll on new messages or typing state changes
  useEffect(() => {
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [messages, isTyping])

  // Premium tokens
  // Suggested prompts to seed conversation
  const SUGGESTIONS: string[] = [
    'What are the side effects of ibuprofen?',
    'Can I take metformin with grapefruit?',
    'Find a cardiologist near me',
    'Set a reminder for my medication',
    'Summarize my latest health record',
    'Suggest alternatives for atorvastatin',
  ]

  const sendSuggestion = (text: string) => {
    setInput(text)
    setTimeout(() => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      document.activeElement?.dispatchEvent(event)
    }, 0)
  }

  const handleCopy = (text: string) => {
    try { navigator.clipboard?.writeText(text) } catch {}
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', position: 'relative' }}>
      {/* Ambient mesh */}
      <Box sx={{
        position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none',
        backgroundImage:
          'radial-gradient(900px 500px at -10% -10%, rgba(52,211,153,0.10) 0%, transparent 60%),' +
          'radial-gradient(700px 400px at 110% 0%, rgba(37,99,235,0.10) 0%, transparent 60%),' +
          'radial-gradient(600px 400px at 50% 110%, rgba(6,182,212,0.08) 0%, transparent 60%)',
      }} />

      {/* Glass header */}
      <Box sx={{
        position: 'sticky', top: 0, zIndex: 20,
        bgcolor: GLASS, backdropFilter: 'saturate(180%) blur(16px)',
        WebkitBackdropFilter: 'saturate(180%) blur(16px)',
        borderBottom: SOFT_BORDER,
      }}>
        <Container maxWidth="xl" sx={{ py: 1.25, px: { xs: 2, md: 3 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <BackButton />
              <Stack direction="row" alignItems="center" spacing={1.25} sx={{ pl: 0.5 }}>
                <Box sx={{
                  width: 38, height: 38, borderRadius: '11px',
                  background: BRAND_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(14,165,233,0.32), 0 2px 4px rgba(37,99,235,0.18)',
                }}>
                  <SmartToyIcon sx={{ color: '#FFFFFF', fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography sx={{
                    fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.01em',
                    background: BRAND_GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>AI Health Assistant</Typography>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Healix · Always learning
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            <Chip
              size="small"
              icon={<FiberManualRecordRoundedIcon sx={{ fontSize: '0.6rem !important', color: '#10B981 !important' }} />}
              label={isTyping ? 'AI thinking…' : 'Online'}
              sx={{
                bgcolor: alpha('#FFFFFF', 0.7), backdropFilter: 'blur(6px)',
                border: SOFT_BORDER, fontWeight: 700, fontSize: '0.72rem', height: 28,
                color: '#0F172A',
              }}
            />
          </Stack>
        </Container>
      </Box>

      {/* Body */}
      <Container maxWidth="xl" sx={{ py: { xs: 2.5, md: 3.5 }, px: { xs: 2, md: 3 } }}>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '280px 1fr' },
          gap: { xs: 2, md: 2.5 },
          height: { md: 'calc(100vh - 140px)' },
        }}>

          {/* SIDEBAR — Suggestions + History */}
          <Stack spacing={2} sx={{ display: { xs: 'none', md: 'flex' }, height: '100%', overflow: 'hidden' }}>
            <Card sx={{
              borderRadius: 3, border: SOFT_BORDER,
              bgcolor: alpha('#FFFFFF', 0.85), backdropFilter: 'blur(8px)', boxShadow: PREMIUM_SHADOW,
            }}>
              <CardContent sx={{ p: 2.25 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <Box sx={{
                    width: 28, height: 28, borderRadius: 1.5,
                    background: `linear-gradient(135deg, ${alpha('#F59E0B', 0.18)} 0%, ${alpha('#F59E0B', 0.06)} 100%)`,
                    border: `1px solid ${alpha('#F59E0B', 0.25)}`, color: '#F59E0B',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <TipsAndUpdatesRoundedIcon sx={{ fontSize: 16 }} />
                  </Box>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Try asking
                  </Typography>
                </Stack>
                <Stack spacing={0.75}>
                  {SUGGESTIONS.slice(0, 4).map((q) => (
                    <Box
                      key={q}
                      onClick={() => sendSuggestion(q)}
                      sx={{
                        cursor: 'pointer',
                        px: 1.5, py: 1, borderRadius: 2,
                        bgcolor: alpha('#0EA5E9', 0.04), border: SOFT_BORDER,
                        transition: 'all 0.2s ease',
                        '&:hover': { bgcolor: alpha('#0EA5E9', 0.10), borderColor: alpha('#0EA5E9', 0.3), transform: 'translateX(2px)' },
                      }}
                    >
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#0F172A', lineHeight: 1.4 }}>{q}</Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{
              flex: 1, minHeight: 0,
              borderRadius: 3, border: SOFT_BORDER,
              bgcolor: alpha('#FFFFFF', 0.85), backdropFilter: 'blur(8px)', boxShadow: PREMIUM_SHADOW,
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ p: 2.25, pb: 1.5 }}>
                <Box sx={{
                  width: 28, height: 28, borderRadius: 1.5,
                  background: `linear-gradient(135deg, ${alpha('#0EA5E9', 0.18)} 0%, ${alpha('#0EA5E9', 0.06)} 100%)`,
                  border: `1px solid ${alpha('#0EA5E9', 0.25)}`, color: '#0EA5E9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <HistoryRoundedIcon sx={{ fontSize: 16 }} />
                </Box>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Recent
                </Typography>
              </Stack>
              <Box sx={{ flex: 1, overflow: 'auto', px: 1.25, pb: 1.5 }}>
                {history.length === 0 ? (
                  <Box sx={{ px: 1, py: 2, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>No conversations yet</Typography>
                  </Box>
                ) : (
                  <Stack spacing={0.5}>
                    {history.map((h) => (
                      <Box key={h.id} sx={{
                        px: 1.5, py: 1.25, borderRadius: 2,
                        cursor: 'pointer', transition: 'all 0.18s ease',
                        '&:hover': { bgcolor: alpha('#0EA5E9', 0.06) },
                      }}>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#0F172A', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.title}</Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.25 }}>You</Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            </Card>
          </Stack>

          {/* MAIN CHAT AREA */}
          <Card sx={{
            display: 'flex', flexDirection: 'column',
            height: { xs: 'calc(100vh - 180px)', md: '100%' },
            borderRadius: 3, border: SOFT_BORDER,
            bgcolor: alpha('#FFFFFF', 0.85), backdropFilter: 'blur(12px)',
            boxShadow: PREMIUM_SHADOW,
            overflow: 'hidden',
          }}>
            {/* Hero strip inside chat */}
            <Box sx={{
              position: 'relative', overflow: 'hidden',
              background: HERO_BG,
              borderBottom: SOFT_BORDER,
              p: { xs: 2, md: 2.5 },
            }}>
              <Box sx={{
                position: 'absolute', top: -80, right: -60, width: 220, height: 220, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(52,211,153,0.22) 0%, transparent 60%)',
                filter: 'blur(16px)', pointerEvents: 'none',
              }} />
              <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} sx={{ position: 'relative' }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box sx={{
                    position: 'relative',
                    '&::before': {
                      content: '""', position: 'absolute', inset: -3, borderRadius: '50%', padding: '2px',
                      background: BRAND_GRADIENT,
                      WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                      mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                      WebkitMaskComposite: 'xor', maskComposite: 'exclude',
                    },
                  }}>
                    <Avatar sx={{ bgcolor: alpha('#0EA5E9', 0.12), color: '#1D4ED8', width: 40, height: 40 }}>
                      <SmartToyIcon sx={{ fontSize: 22 }} />
                    </Avatar>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>Healix Assistant</Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>Powered by clinical AI · Read-only guidance</Typography>
                  </Box>
                </Stack>
                <Chip
                  size="small"
                  icon={<AutoAwesomeRoundedIcon sx={{ fontSize: 12 }} />}
                  label="AI · BETA"
                  sx={{
                    bgcolor: alpha('#FFFFFF', 0.7), backdropFilter: 'blur(6px)',
                    border: SOFT_BORDER, color: '#1D4ED8',
                    fontWeight: 800, letterSpacing: '0.06em', fontSize: '0.65rem', height: 24,
                    '& .MuiChip-icon': { color: '#06B6D4' },
                  }}
                />
              </Stack>
            </Box>

            {/* Messages */}
            <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 3 } }}>
              <Stack spacing={2.5}>
                <AnimatePresence initial={false}>
                  {messages.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <Stack direction={m.role === 'user' ? 'row-reverse' : 'row'} spacing={1.25} sx={{ maxWidth: { xs: '92%', md: '78%' }, alignItems: 'flex-end' }}>
                          {/* Avatar */}
                          {m.role === 'bot' ? (
                            <Box sx={{
                              width: 32, height: 32, flexShrink: 0,
                              borderRadius: '50%', background: BRAND_GRADIENT,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: '0 4px 10px rgba(14,165,233,0.30)',
                            }}>
                              <SmartToyIcon sx={{ fontSize: 18, color: '#FFFFFF' }} />
                            </Box>
                          ) : (
                            <Box sx={{
                              width: 32, height: 32, flexShrink: 0,
                              borderRadius: '50%', bgcolor: alpha('#0F172A', 0.06), border: SOFT_BORDER,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            </Box>
                          )}

                          {/* Bubble */}
                          <Box sx={{
                            position: 'relative',
                            px: 2, py: 1.5,
                            borderRadius: m.role === 'bot' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                            ...(m.role === 'user'
                              ? {
                                  background: BRAND_GRADIENT,
                                  color: '#FFFFFF',
                                  boxShadow: '0 6px 18px rgba(14,165,233,0.30), 0 2px 6px rgba(37,99,235,0.18)',
                                }
                              : {
                                  bgcolor: alpha('#FFFFFF', 0.95),
                                  border: SOFT_BORDER,
                                  color: '#0F172A',
                                  boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                                }),
                            '&:hover .copy-btn': { opacity: m.role === 'bot' ? 1 : 0 },
                          }}>
                            <Typography sx={{
                              fontSize: { xs: '0.92rem', md: '0.95rem' },
                              lineHeight: 1.6,
                              color: m.role === 'user' ? '#FFFFFF' : '#0F172A',
                              fontWeight: m.role === 'user' ? 500 : 400,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}>{m.text}</Typography>

                            {m.role === 'bot' && (
                              <IconButton
                                className="copy-btn"
                                onClick={() => handleCopy(m.text)}
                                size="small"
                                aria-label="Copy message"
                                sx={{
                                  position: 'absolute', top: 4, right: 4,
                                  width: 24, height: 24,
                                  opacity: 0, transition: 'opacity 0.2s ease',
                                  color: 'text.secondary',
                                  bgcolor: alpha('#FFFFFF', 0.85),
                                  border: SOFT_BORDER,
                                  '&:hover': { color: '#0EA5E9', bgcolor: '#FFFFFF' },
                                }}
                              >
                                <ContentCopyRoundedIcon sx={{ fontSize: 12 }} />
                              </IconButton>
                            )}

                            {/* Action chips */}
                            {m.role === 'bot' && m.actions && m.actions.length > 0 && (
                              <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.75 }}>
                                {m.actions.map((action) => (
                                  <Button
                                    key={`${m.id}-${action.label}`}
                                    size="small"
                                    onClick={() => navigate(action.path)}
                                    endIcon={<ArrowOutwardRoundedIcon sx={{ fontSize: 14 }} />}
                                    sx={{
                                      textTransform: 'none', fontWeight: 700, fontSize: '0.78rem',
                                      bgcolor: alpha('#0EA5E9', 0.10),
                                      color: '#1D4ED8',
                                      border: `1px solid ${alpha('#0EA5E9', 0.25)}`,
                                      borderRadius: 999,
                                      px: 1.5, py: 0.4,
                                      transition: 'all 0.2s ease',
                                      '&:hover': { bgcolor: alpha('#0EA5E9', 0.18), borderColor: alpha('#0EA5E9', 0.5), transform: 'translateY(-1px)' },
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
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Stack direction="row" spacing={1.25} alignItems="flex-end">
                        <Box sx={{
                          width: 32, height: 32, flexShrink: 0,
                          borderRadius: '50%', background: BRAND_GRADIENT,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 4px 10px rgba(14,165,233,0.30)',
                        }}>
                          <SmartToyIcon sx={{ fontSize: 18, color: '#FFFFFF' }} />
                        </Box>
                        <Box sx={{
                          px: 2, py: 1.5,
                          borderRadius: '4px 16px 16px 16px',
                          bgcolor: alpha('#FFFFFF', 0.95), border: SOFT_BORDER,
                          boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                        }}>
                          <Stack direction="row" spacing={0.6} alignItems="center" sx={{ minHeight: 20 }}>
                            {[0, 1, 2].map((i) => (
                              <Box
                                key={i}
                                sx={{
                                  width: 6, height: 6, borderRadius: '50%',
                                  bgcolor: '#0EA5E9',
                                  animation: 'typing 1.4s infinite ease-in-out',
                                  animationDelay: `${i * 0.18}s`,
                                  '@keyframes typing': {
                                    '0%, 60%, 100%': { transform: 'translateY(0)', opacity: 0.4 },
                                    '30%': { transform: 'translateY(-6px)', opacity: 1 },
                                  },
                                }}
                              />
                            ))}
                          </Stack>
                        </Box>
                      </Stack>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={endRef} />
              </Stack>
            </Box>

            {/* Quick suggestion chips (inline above input) */}
            {messages.length <= 2 && (
              <Box sx={{ px: { xs: 2, md: 3 }, pb: 1.25, pt: 0 }}>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                  {SUGGESTIONS.slice(0, 3).map((q) => (
                    <Chip
                      key={q}
                      label={q}
                      onClick={() => sendSuggestion(q)}
                      sx={{
                        bgcolor: alpha('#0EA5E9', 0.06),
                        border: `1px solid ${alpha('#0EA5E9', 0.18)}`,
                        color: '#0F172A',
                        fontWeight: 600, fontSize: '0.74rem', height: 28,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: alpha('#0EA5E9', 0.14), borderColor: alpha('#0EA5E9', 0.4) },
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Input bar */}
            <Box sx={{
              position: 'relative',
              p: { xs: 1.5, md: 2 },
              borderTop: SOFT_BORDER,
              background: alpha('#FFFFFF', 0.7), backdropFilter: 'blur(10px)',
            }}>
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                bgcolor: '#FFFFFF', border: SOFT_BORDER, borderRadius: 999,
                pl: 2, pr: 0.5, py: 0.5,
                transition: 'all 0.2s ease',
                '&:focus-within': { borderColor: alpha('#0EA5E9', 0.45), boxShadow: '0 0 0 4px rgba(14,165,233,0.10)' },
              }}>
                <AutoAwesomeRoundedIcon sx={{ fontSize: 18, color: '#06B6D4', flexShrink: 0 }} />
                <TextField
                  fullWidth multiline maxRows={4}
                  placeholder="Ask anything about your health…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                  variant="standard"
                  InputProps={{ disableUnderline: true, sx: { fontSize: '0.95rem', py: 0.5 } }}
                  disabled={isTyping}
                />
                <IconButton
                  onClick={send}
                  disabled={!input.trim() || isTyping}
                  aria-label="Send message"
                  sx={{
                    width: 40, height: 40, flexShrink: 0,
                    color: '#FFFFFF',
                    background: input.trim() && !isTyping ? BRAND_GRADIENT : alpha('#0F172A', 0.06),
                    backgroundSize: '200% 200%', backgroundPosition: '0% 50%',
                    boxShadow: input.trim() && !isTyping ? '0 6px 16px rgba(14,165,233,0.32), 0 2px 4px rgba(37,99,235,0.18)' : 'none',
                    transition: 'all 0.25s ease',
                    '&:hover': { backgroundPosition: '100% 50%' },
                    '&.Mui-disabled': { color: alpha('#0F172A', 0.25) },
                  }}
                >
                  <SendIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
              <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', textAlign: 'center', mt: 0.75, fontWeight: 500 }}>
                Press <Box component="kbd" sx={{ px: 0.6, py: 0.1, borderRadius: 0.75, bgcolor: alpha('#0F172A', 0.06), fontSize: '0.65rem', fontFamily: 'inherit', fontWeight: 700 }}>Enter</Box> to send · <Box component="kbd" sx={{ px: 0.6, py: 0.1, borderRadius: 0.75, bgcolor: alpha('#0F172A', 0.06), fontSize: '0.65rem', fontFamily: 'inherit', fontWeight: 700 }}>Shift+Enter</Box> for newline · AI may make mistakes
              </Typography>
            </Box>
          </Card>
        </Box>
      </Container>
    </Box>
  )
}
