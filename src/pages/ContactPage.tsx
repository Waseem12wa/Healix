import { Box, Button, Card, CardContent, Container, Stack, TextField, Typography, useTheme, alpha } from '@mui/material'
import { motion } from 'framer-motion'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import SendIcon from '@mui/icons-material/Send'
import { useState } from 'react'
import { sendContactMessage } from '../services/contactService'

export default function ContactPage() {
  const theme = useTheme()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const contactInfo = [
    {
      icon: EmailIcon,
      title: 'Email',
      content: 'support@healix.app',
      link: 'mailto:support@healix.app',
      color: '#06D6A0'
    },
    {
      icon: PhoneIcon,
      title: 'Phone',
      content: '+92 307 8932652',
      link: 'tel:+923078932652',
      color: '#EF476F'
    },
    {
      icon: AccessTimeIcon,
      title: 'Support Hours',
      content: '24/7 Availability',
      link: null,
      color: '#FFD166'
    }
  ]

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitMessage(null)

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setSubmitMessage({ type: 'error', text: 'Please complete all required fields.' })
      return
    }

    try {
      setSubmitting(true)
      await sendContactMessage({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      })

      setSubmitMessage({ type: 'success', text: 'Your message has been sent successfully.' })
      setFirstName('')
      setLastName('')
      setEmail('')
      setSubject('')
      setMessage('')
    } catch (error: any) {
      setSubmitMessage({ type: 'error', text: error?.response?.data?.message || 'Failed to send your message. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: theme.palette.background.paper,
          pt: { xs: 12, md: 16 },
          pb: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Background Decorative Elements */}
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

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 3,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                letterSpacing: '-0.02em',
                textAlign: 'center',
                color: theme.palette.text.primary
              }}
            >
              Get in Touch
            </Typography>
            <Typography
              variant="h5"
              sx={{
                mb: 5,
                color: theme.palette.text.secondary,
                fontSize: { xs: '1.125rem', md: '1.5rem' },
                fontWeight: 400,
                textAlign: 'center',
                maxWidth: 800,
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              We'd love to hear from you. Send us a <Box component="span" sx={{ color: theme.palette.primary.main, fontWeight: 700 }}>message</Box> or <Box component="span" sx={{ color: theme.palette.primary.main, fontWeight: 700 }}>reach out directly</Box>.
            </Typography>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 }, mt: -8 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1.5fr' }, gap: 4 }}>

          {/* Contact Info Cards */}
          <Stack spacing={3}>
            {contactInfo.map((info, idx) => {
              const Icon = info.icon
              return (
                <motion.div
                  key={info.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <Card
                    sx={{
                      borderRadius: '20px',
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Stack direction="row" spacing={3} alignItems="center">
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: '14px',
                            bgcolor: alpha(info.color, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <Icon sx={{ fontSize: 28, color: info.color }} />
                        </Box>
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              fontSize: '1.1rem',
                              color: theme.palette.text.primary
                            }}
                          >
                            {info.title}
                          </Typography>
                          {info.link ? (
                            <Typography
                              component="a"
                              href={info.link}
                              sx={{
                                color: theme.palette.text.secondary,
                                textDecoration: 'none',
                                '&:hover': { color: theme.palette.primary.main }
                              }}
                            >
                              {info.content}
                            </Typography>
                          ) : (
                            <Typography color="text.secondary">
                              {info.content}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </Stack>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card
              sx={{
                height: '100%',
                borderRadius: '24px',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                boxShadow: `0 20px 60px ${alpha(theme.palette.common.black, 0.08)}`,
                bgcolor: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(20px)'
              }}
            >
              <CardContent sx={{ p: { xs: 4, md: 5 } }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    mb: 4,
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Send us a Message
                </Typography>

                <Stack spacing={3} component="form" onSubmit={handleSubmit}>
                  {submitMessage && (
                    <Typography
                      sx={{
                        color: submitMessage.type === 'success' ? '#06D6A0' : '#EF476F',
                        fontWeight: 600,
                        fontSize: '0.95rem'
                      }}
                    >
                      {submitMessage.text}
                    </Typography>
                  )}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                    <TextField
                      label="First name"
                      required
                      fullWidth
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          bgcolor: alpha(theme.palette.background.paper, 0.5)
                        }
                      }}
                    />
                    <TextField
                      label="Last name"
                      required
                      fullWidth
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          bgcolor: alpha(theme.palette.background.paper, 0.5)
                        }
                      }}
                    />
                  </Stack>
                  <TextField
                    label="Email"
                    type="email"
                    required
                    fullWidth
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    helperText="We’ll only use this to reply to your message."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        bgcolor: alpha(theme.palette.background.paper, 0.5)
                      }
                    }}
                  />
                  <TextField
                    label="Subject"
                    required
                    fullWidth
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        bgcolor: alpha(theme.palette.background.paper, 0.5)
                      }
                    }}
                  />
                  <TextField
                    label="Message"
                    required
                    fullWidth
                    multiline
                    minRows={6}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        bgcolor: alpha(theme.palette.background.paper, 0.5)
                      }
                    }}
                  />

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems="center" sx={{ pt: 2 }}>
                    <Button
                      href="/faq"
                      variant="text"
                      sx={{
                        fontWeight: 600,
                        textTransform: 'none',
                        color: theme.palette.text.secondary,
                        '&:hover': { color: theme.palette.primary.main }
                      }}
                    >
                      Check our FAQ first
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={submitting}
                      endIcon={<SendIcon />}
                      sx={{
                        px: 4,
                        py: 1.5,
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 700,
                        boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.4)}`
                        }
                      }}
                    >
                      {submitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        </Box>

        {/* Urgent Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card
            sx={{
              mt: 8,
              borderRadius: '24px',
              background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
              color: '#FFFFFF',
              boxShadow: `0 12px 48px ${alpha(theme.palette.secondary.main, 0.3)}`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 300,
                height: 300,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha('#FFFFFF', 0.1)} 0%, transparent 70%)`,
                filter: 'blur(40px)',
              }}
            />

            <CardContent sx={{ p: { xs: 4, md: 6 }, position: 'relative', zIndex: 1 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight={800} mb={1}>Need urgent help?</Typography>
                  <Typography sx={{ opacity: 0.9 }}>Our support team usually replies within a few hours.</Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                  <Button
                    href="/about"
                    variant="outlined"
                    sx={{
                      borderColor: '#FFFFFF',
                      color: '#FFFFFF',
                      borderWidth: 2,
                      px: 3,
                      py: 1,
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 700,
                      '&:hover': {
                        borderWidth: 2,
                        bgcolor: alpha('#FFFFFF', 0.1)
                      }
                    }}
                  >
                    Learn more
                  </Button>
                  <Button
                    href="mailto:support@healix.app"
                    variant="contained"
                    sx={{
                      bgcolor: '#FFFFFF',
                      color: theme.palette.secondary.main,
                      px: 3,
                      py: 1,
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 700,
                      '&:hover': {
                        bgcolor: alpha('#FFFFFF', 0.95)
                      }
                    }}
                  >
                    Email Support
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  )
}



