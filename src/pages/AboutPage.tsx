import { Box, Button, Card, CardContent, Stack, Typography, useTheme, alpha, Container } from '@mui/material'
import { motion } from 'framer-motion'
import SecurityIcon from '@mui/icons-material/Security'
import SpeedIcon from '@mui/icons-material/Speed'
import GroupsIcon from '@mui/icons-material/Groups'
import DevicesIcon from '@mui/icons-material/Devices'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

export default function AboutPage() {
  const theme = useTheme()

  const features = [
    {
      icon: SecurityIcon,
      title: 'Secure by Design',
      desc: 'Privacy-first architecture, encryption in transit and at rest, least-privilege access.'
    },
    {
      icon: SpeedIcon,
      title: 'Fast & Reliable',
      desc: 'Snappy UX with resilient infrastructure and real-time updates when it matters.'
    },
    {
      icon: GroupsIcon,
      title: 'Collaborative Care',
      desc: 'Bring patients, doctors, and providers together with shared context and messaging.'
    },
    {
      icon: DevicesIcon,
      title: 'Works Everywhere',
      desc: 'Responsive on any device—desktop, tablet, or mobile.'
    },
  ]

  const stats = [
    { label: 'Uptime', value: '99.9%' },
    { label: 'Avg. response', value: '120ms' },
    { label: 'Clinicians onboarded', value: '5k+' },
    { label: 'Patients served', value: '100k+' },
  ]

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: theme.palette.background.paper,
          pt: { xs: 8, md: 12 },
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
              About Healix
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
              We connect <Box component="span" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>patients, clinicians, and providers</Box> with secure, modern tools that make care simpler.
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
            >
              <Button
                href="/signup"
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.0625rem',
                  fontWeight: 700,
                  borderRadius: '12px',
                  textTransform: 'none',
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.25)}`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.3)}`
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                Get Started
              </Button>
              <Button
                href="/contact"
                variant="outlined"
                sx={{
                  borderWidth: 2,
                  px: 4,
                  py: 1.5,
                  fontSize: '1.0625rem',
                  fontWeight: 700,
                  borderRadius: '12px',
                  textTransform: 'none',
                  '&:hover': {
                    borderWidth: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                Contact Us
              </Button>
            </Stack>
          </motion.div>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Stack spacing={8}>
          {/* Why Healix Section */}
          <Box>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  mb: 5,
                  fontSize: { xs: '2rem', md: '2.5rem' },
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textAlign: 'center'
                }}
              >
                Why Healix
              </Typography>
            </motion.div>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {features.map((feature, idx) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  >
                    <Card
                      sx={{
                        height: '100%',
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
                      <CardContent sx={{ p: 4 }}>
                        <Stack direction="row" spacing={3} alignItems="flex-start">
                          <Box
                            sx={{
                              width: 56,
                              height: 56,
                              borderRadius: '14px',
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <Icon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                          </Box>
                          <Box>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                mb: 1,
                                fontSize: '1.25rem',
                                color: theme.palette.text.primary
                              }}
                            >
                              {feature.title}
                            </Typography>
                            <Typography
                              variant="body1"
                              sx={{
                                color: theme.palette.text.secondary,
                                lineHeight: 1.7
                              }}
                            >
                              {feature.desc}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </Box>
          </Box>

          {/* Stats Section */}
          <Box>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  mb: 5,
                  fontSize: { xs: '2rem', md: '2.5rem' },
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textAlign: 'center'
                }}
              >
                By the Numbers
              </Typography>
            </motion.div>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3 }}>
              {stats.map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <Card
                    sx={{
                      textAlign: 'center',
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
                    <CardContent sx={{ p: 4 }}>
                      <Typography
                        variant="h3"
                        sx={{
                          fontWeight: 800,
                          mb: 1,
                          fontSize: { xs: '2rem', md: '2.5rem' },
                          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: theme.palette.text.secondary,
                          fontWeight: 600
                        }}
                      >
                        {stat.label}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </Box>
          </Box>

          {/* Mission Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card
              sx={{
                borderRadius: '24px',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
                background: alpha(theme.palette.background.paper, 0.8),
                backdropFilter: 'blur(20px)'
              }}
            >
              <CardContent sx={{ p: { xs: 4, md: 6 }, textAlign: 'center' }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    mb: 3,
                    fontSize: { xs: '1.75rem', md: '2rem' },
                    color: theme.palette.primary.main
                  }}
                >
                  Our Mission
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.text.secondary,
                    lineHeight: 1.8,
                    fontSize: { xs: '1.125rem', md: '1.25rem' },
                    fontWeight: 400,
                    maxWidth: 800,
                    mx: 'auto'
                  }}
                >
                  Empower all stakeholders in healthcare with secure, accessible, and intuitive digital tools that support better outcomes and simpler operations.
                </Typography>
              </CardContent>
            </Card>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card
              sx={{
                borderRadius: '24px',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                color: '#FFFFFF',
                boxShadow: `0 12px 48px ${alpha(theme.palette.primary.main, 0.3)}`,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Background Pattern */}
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
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={4}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        mb: 1.5,
                        fontSize: { xs: '1.75rem', md: '2rem' }
                      }}
                    >
                      Ready to experience connected care?
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        opacity: 0.95,
                        fontSize: { xs: '1rem', md: '1.125rem' },
                        fontWeight: 400
                      }}
                    >
                      Create your account and start with Healix today.
                    </Typography>
                  </Box>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Button
                      href="/signup"
                      variant="contained"
                      sx={{
                        bgcolor: '#FFFFFF',
                        color: theme.palette.primary.main,
                        px: 4,
                        py: 1.5,
                        fontSize: '1.0625rem',
                        fontWeight: 700,
                        borderRadius: '12px',
                        textTransform: 'none',
                        boxShadow: `0 4px 16px ${alpha('#000000', 0.15)}`,
                        '&:hover': {
                          bgcolor: alpha('#FFFFFF', 0.95),
                          transform: 'translateY(-2px)',
                          boxShadow: `0 8px 24px ${alpha('#000000', 0.2)}`
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      Get Started
                    </Button>
                    <Button
                      href="/contact"
                      variant="outlined"
                      sx={{
                        borderColor: '#FFFFFF',
                        color: '#FFFFFF',
                        borderWidth: 2,
                        px: 4,
                        py: 1.5,
                        fontSize: '1.0625rem',
                        fontWeight: 700,
                        borderRadius: '12px',
                        textTransform: 'none',
                        '&:hover': {
                          borderWidth: 2,
                          bgcolor: alpha('#FFFFFF', 0.1),
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      Talk to us
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        </Stack>
      </Container>
    </Box>
  )
}
