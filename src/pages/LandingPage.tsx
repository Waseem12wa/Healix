import { Box, Button, Card, Stack, Typography, TextField, InputAdornment, Avatar, Container, Grid, Chip, useTheme, alpha } from '@mui/material'

import SearchIcon from '@mui/icons-material/Search'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined'
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined'
import LocalPharmacyOutlinedIcon from '@mui/icons-material/LocalPharmacyOutlined'
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined'
import StarRateRoundedIcon from '@mui/icons-material/StarRateRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

export default function LandingPage() {
  const theme = useTheme()

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    hover: {
      y: -8,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  }

  function AnimatedNumber({ value }: { value: number }) {
    const [display, setDisplay] = useState(0)
    useEffect(() => {
      const duration = 1500
      const startTs = performance.now()
      const step = (ts: number) => {
        const progress = Math.min(1, (ts - startTs) / duration)
        const easeProgress = 1 - Math.pow(1 - progress, 3) // cubic ease out
        setDisplay(Math.floor(easeProgress * value))
        if (progress < 1) requestAnimationFrame(step)
      }
      const id = requestAnimationFrame(step)
      return () => cancelAnimationFrame(id)
    }, [value])
    return <>{display.toLocaleString()}</>
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">

      {/* Hero Section */}
      <Box sx={{
        position: 'relative',
        overflow: 'hidden',
        background: theme.extras.gradients.hero,
        pt: { xs: 12, md: 16 },
        pb: { xs: 10, md: 14 },
      }}>
        {/* Abstract Background Shapes */}
        <Box sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 70%)`,
          filter: 'blur(60px)',
          zIndex: 0,
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -50,
          left: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 70%)`,
          filter: 'blur(40px)',
          zIndex: 0,
        }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Stack alignItems="center" spacing={4} textAlign="center">

            <motion.div variants={itemVariants}>
              <Chip
                label="Trusted by 50,000+ Doctors"
                color="primary"
                variant="outlined"
                size="small"
                icon={<CheckCircleOutlineRoundedIcon />}
                sx={{
                  borderRadius: '100px',
                  px: 1,
                  mb: 3,
                  fontWeight: 600,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderColor: alpha(theme.palette.primary.main, 0.2)
                }}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <Typography variant="h1" sx={{
                fontWeight: 800,
                fontSize: { xs: '2.5rem', md: '4rem', lg: '4.5rem' },
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                mb: 2,
                background: `linear-gradient(180deg, ${theme.palette.text.primary} 0%, ${theme.palette.grey[700]} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Your Health, <br />
                <Box component="span" sx={{
                  background: theme.extras.gradients.brand,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>Simplified.</Box>
              </Typography>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Typography variant="h5" sx={{ maxWidth: 700, color: 'text.secondary', lineHeight: 1.6, fontWeight: 400 }}>
                Find trusted medicine alternatives, book top-rated doctors instantly, and shop from verified pharmacies — all in one unified platform.
              </Typography>
            </motion.div>

            <motion.div variants={itemVariants} style={{ width: '100%', maxWidth: '600px' }}>
              <Card
                elevation={0}
                sx={{
                  p: 1,
                  borderRadius: '24px',
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: `0 8px 30px ${alpha(theme.palette.common.black, 0.08)}`,
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <InputAdornment position="start" sx={{ pl: 2 }}>
                  <SearchIcon sx={{ color: theme.palette.primary.main }} />
                </InputAdornment>
                <TextField
                  variant="standard"
                  placeholder="Search 500,000+ medicines..."
                  fullWidth
                  InputProps={{ disableUnderline: true, sx: { fontSize: '1.1rem' } }}
                  sx={{ px: 2 }}
                />
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    borderRadius: '16px',
                    px: 4,
                    py: 1.5,
                    boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.4)}`,
                  }}
                >
                  Search
                </Button>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
                <Button variant="text" color="secondary" endIcon={<ArrowForwardRoundedIcon />}>
                  Find a Doctor
                </Button>
                <Button variant="text" color="secondary" endIcon={<ArrowForwardRoundedIcon />}>
                  Upload Prescription
                </Button>
              </Stack>
            </motion.div>

          </Stack>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ mt: -8, position: 'relative', zIndex: 2 }}>
        <Card sx={{
          borderRadius: '24px',
          boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.05)}`,
          overflow: 'hidden',
          border: `1px solid ${alpha(theme.palette.divider, 0.5)}`
        }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            divideX: { md: `1px solid ${theme.palette.divider}` },
            divideY: { xs: `1px solid ${theme.palette.divider}`, md: 'none' }
          }}>
            {[
              { label: 'Drugs Indexed', value: 500000, suffix: '+' },
              { label: 'Verified Doctors', value: 50000, suffix: '+' },
              { label: 'Platform Uptime', value: 99, suffix: '%', decimal: true },
              { label: 'User Rating', value: 4, suffix: '/5', decimal: true }
            ].map((stat, i) => (
              <Box key={i} sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper' }}>
                <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.primary.main, mb: 0.5 }}>
                  <AnimatedNumber value={stat.value} />{stat.decimal && '.9'}{stat.suffix}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Card>
      </Container>

      {/* Features Grid */}
      <Container maxWidth="lg" sx={{ py: { xs: 10, md: 14 } }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="overline" sx={{ color: theme.palette.primary.main, fontWeight: 700, letterSpacing: '0.1em' }}>
            Why Healix?
          </Typography>
          <Typography variant="h2" sx={{ mt: 1, fontWeight: 800 }}>
            Complete Healthcare Ecosystem
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {[
            { icon: <BoltOutlinedIcon fontSize="large" />, title: 'Instant Intelligence', desc: 'AI-powered insights for drug interactions and safe alternatives in milliseconds.' },
            { icon: <ScheduleOutlinedIcon fontSize="large" />, title: 'Smart Booking', desc: 'Seamlessly find and book doctors that fit your specific schedule and needs.' },
            { icon: <TrendingUpRoundedIcon fontSize="large" />, title: 'Health Analytics', desc: 'Track your medication adherence and health progress with intuitive dashboards.' },
            { icon: <LockOutlinedIcon fontSize="large" />, title: 'Bank-Grade Security', desc: 'Your health data is protected with end-to-end encryption and HIPAA compliance.' },
            { icon: <SupportAgentOutlinedIcon fontSize="large" />, title: '24/7 Care Team', desc: 'Round-the-clock access to human support and our advanced medical AI assistant.' },
            { icon: <LocalPharmacyOutlinedIcon fontSize="large" />, title: 'Verified Pharmacies', desc: 'Direct access to reliable pharmacies and medicines with transparent pricing and delivery.' },
          ].map((feature, idx) => (
            <Grid size={{ xs: 12, md: 6 }} key={idx}>
              <motion.div variants={cardVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: idx * 0.1 }} whileHover="hover">
                <Card sx={{
                  height: '100%',
                  p: 3,
                  borderRadius: '20px',
                  border: '1px solid transparent',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: theme.palette.primary.light,
                    boxShadow: `0 12px 30px ${alpha(theme.palette.primary.main, 0.1)}`
                  }
                }}>
                  <Box sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '16px',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3
                  }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {feature.desc}
                  </Typography>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Testimonials */}
      <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03), py: { xs: 10, md: 14 } }}>
        <Container maxWidth="md">
          <Testimonials />
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 10, md: 14 } }}>
        <Box sx={{
          position: 'relative',
          borderRadius: '32px',
          overflow: 'hidden',
          background: theme.extras.gradients.brand,
          color: 'common.white',
          px: { xs: 4, md: 10 },
          py: { xs: 8, md: 10 },
          textAlign: 'center'
        }}>
          <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.1, background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 3 }}>
              Ready to simplify your healthcare?
            </Typography>
            <Typography variant="h6" sx={{ mb: 5, opacity: 0.9, fontWeight: 400, maxWidth: 600, mx: 'auto' }}>
              Join thousands of users who have already transformed their healthcare experience with Healix.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                component={Link}
                to="/signup"
                variant="contained"
                size="large"
                sx={{
                  bgcolor: 'common.white',
                  color: theme.palette.primary.main,
                  px: 5,
                  py: 1.5,
                  fontSize: '1.1rem',
                  '&:hover': { bgcolor: alpha(theme.palette.common.white, 0.9) }
                }}
              >
                Get Started Free
              </Button>
              <Button
                component={Link}
                to="/about"
                variant="outlined"
                size="large"
                sx={{
                  borderColor: alpha(theme.palette.common.white, 0.5),
                  color: 'common.white',
                  px: 5,
                  py: 1.5,
                  fontSize: '1.1rem',
                  '&:hover': { borderColor: 'common.white', bgcolor: alpha(theme.palette.common.white, 0.1) }
                }}
              >
                Learn More
              </Button>
            </Stack>
          </motion.div>
        </Box>
      </Container>

    </motion.div>
  )
}

function Testimonials() {
  const theme = useTheme()
  const items = useMemo(() => ([
    { name: 'Anita Sharma', role: 'Patient', quote: 'Healix helped me find a safe alternative to a medicine within seconds. It\'s a lifesaver.' },
    { name: 'Dr. Khan', role: 'Cardiologist', quote: 'The booking flow and insights save me hours every week. Highly recommended for peers.' },
    { name: 'Ravi Patel', role: 'Caregiver', quote: 'Reminders and pharmacy integration made our daily routine effortless and stress-free.' },
  ]), [])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % items.length), 5000)
    return () => clearInterval(id)
  }, [items.length])

  const current = items[index]

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="overline" sx={{ color: theme.palette.primary.main, fontWeight: 700, letterSpacing: '0.1em' }}>
        Testimonials
      </Typography>
      <Typography variant="h3" sx={{ mt: 1, mb: 6, fontWeight: 800 }}>
        Loved by patients and clinicians
      </Typography>

      <Box sx={{ position: 'relative', height: 300 }}>
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5 }}
        >
          <Card elevation={0} sx={{
            bgcolor: 'background.paper',
            borderRadius: '24px',
            p: { xs: 4, md: 6 },
            boxShadow: `0 10px 40px ${alpha(theme.palette.common.black, 0.05)}`,
            maxWidth: 800,
            mx: 'auto'
          }}>
            <Stack spacing={3} alignItems="center">
              <Stack direction="row" spacing={0.5}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarRateRoundedIcon key={i} sx={{ color: theme.palette.warning.main }} />
                ))}
              </Stack>
              <Typography variant="h5" sx={{ fontStyle: 'italic', fontWeight: 500, lineHeight: 1.6 }}>
                &ldquo;{current.quote}&rdquo;
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ width: 48, height: 48, bgcolor: theme.palette.primary.light }}>{current.name[0]}</Avatar>
                <Box textAlign="left">
                  <Typography variant="subtitle1" fontWeight={700}>{current.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{current.role}</Typography>
                </Box>
              </Stack>
            </Stack>
          </Card>
        </motion.div>
      </Box>

      <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
        {items.map((_, i) => (
          <Box
            key={i}
            onClick={() => setIndex(i)}
            sx={{
              width: i === index ? 24 : 8,
              height: 8,
              borderRadius: '4px',
              bgcolor: i === index ? theme.palette.primary.main : theme.palette.grey[300],
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
          />
        ))}
      </Stack>
    </Box>
  )
}