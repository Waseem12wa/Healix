import { Box, Button, Card, CardContent, Chip, Stack, Typography, Avatar, Badge, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider, TextField, InputAdornment } from '@mui/material'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import NotificationsIcon from '@mui/icons-material/Notifications'
import PersonIcon from '@mui/icons-material/Person'
import ScienceIcon from '@mui/icons-material/Science'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import FastfoodIcon from '@mui/icons-material/Fastfood'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import SummarizeIcon from '@mui/icons-material/Summarize'
import LogoutIcon from '@mui/icons-material/Logout'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import EventIcon from '@mui/icons-material/Event'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import SearchIcon from '@mui/icons-material/Search'
import { useMemo, useState } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { clearAuthData } from '../utils/auth'
import { Area, AreaChart, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts'

// Helper function to generate random values within a range
const randomBetween = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const userName = useMemo(() => {
    return (localStorage.getItem('userName') || 'Patient')
  }, [])
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null)

  const { unreadCount } = useNotifications()


  const featureItems = [
    { label: 'Drug Interaction Checker', description: 'Check interactions between medications in seconds.', icon: <ScienceIcon sx={{ color: '#00B4D8' }} />, href: '/tools/drug-interactions' },
    { label: 'Drug-Food Interaction', description: 'See how foods may affect your prescriptions.', icon: <FastfoodIcon sx={{ color: '#06D6A0' }} />, href: '/tools/drug-food-interactions' },
    { label: 'Drug Alternatives', description: 'Explore safer or more affordable alternatives.', icon: <SwapHorizIcon sx={{ color: '#0096C7' }} />, href: '/tools/drug-alternatives' },
    { label: 'Side Effect Predictor', description: 'Predict potential side effects from medications.', icon: <TrendingUpIcon sx={{ color: '#EF476F' }} />, href: '/tools/side-effects' },
    { label: 'Medicine Shop', description: 'Purchase medicines directly from our store.', icon: <ShoppingCartIcon sx={{ color: '#FFB703' }} />, href: '/shop/medicines' },
    { label: 'Medication Reminder', description: 'Stay on track with intelligent reminders.', icon: <AccessAlarmIcon sx={{ color: '#FFD166' }} />, href: '/tools/medication-reminder' },
    { label: 'AI Health Assistant', description: 'Chat with an AI to understand your health data.', icon: <SmartToyIcon sx={{ color: '#90E0EF' }} />, href: '/tools/ai-chatbot' },
    { label: 'Record Summarization', description: 'Turn complex reports into clear summaries.', icon: <SummarizeIcon sx={{ color: '#00B4D8' }} />, href: '/tools/health-summary' },
    { label: 'Doctor Appointments', description: 'Manage and review upcoming visits.', icon: <EventIcon sx={{ color: '#06D6A0' }} />, href: '/tools/appointments' },
  ]

  const filteredFeatureItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return featureItems

    return featureItems.filter((item) => {
      const haystack = `${item.label} ${item.description}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [featureItems, searchQuery])

  const profileMenuItems = [
    { label: 'Order History', icon: <TrendingUpIcon fontSize="small" />, href: '/shop/orders' },
    { label: 'Notifications', icon: <NotificationsIcon fontSize="small" />, href: '/tools/notifications' },
    { label: 'Profile', icon: <PersonIcon fontSize="small" />, href: '/tools/profile' },
  ]

  const handleOpenProfileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget)
  }

  const handleCloseProfileMenu = () => {
    setProfileMenuAnchor(null)
  }

  const handleProfileMenuNavigate = (path: string) => {
    handleCloseProfileMenu()
    navigate(path)
  }

  const handleLogout = () => {
    clearAuthData()
    handleCloseProfileMenu()
    navigate('/login')
  }

  const summaryCards = [
    { title: 'Active Medications', value: '5', change: '2 this week', changeType: 'positive', icon: <AccessAlarmIcon />, bgColor: '#ffffff' },
    { title: 'Interaction Checks', value: '12', change: 'All safe', changeType: 'positive', icon: <ScienceIcon />, bgColor: '#ffffff' },
    { title: 'Health Records', value: '8', change: '3 updated', changeType: 'positive', icon: <SummarizeIcon />, bgColor: '#ffffff' },
    { title: 'Adherence Rate', value: '92%', change: '+5% improvement', changeType: 'positive', icon: <TrendingUpIcon />, bgColor: '#ffffff' },
  ]

  // Randomized realistic data for charts - Varied and natural-looking with fluctuations
  const adherenceData = useMemo(() => [
    { day: 'Mon', value: randomBetween(65, 72) },
    { day: 'Tue', value: randomBetween(72, 78) },
    { day: 'Wed', value: randomBetween(68, 75) },
    { day: 'Thu', value: randomBetween(75, 82) },
    { day: 'Fri', value: randomBetween(73, 80) },
    { day: 'Sat', value: randomBetween(78, 85) },
    { day: 'Sun', value: randomBetween(80, 87) }
  ], [])

  const medicationUsageData = useMemo(() => [
    { day: 'Mon', morning: randomBetween(94, 96), evening: randomBetween(84, 88) },
    { day: 'Tue', morning: randomBetween(97, 99), evening: randomBetween(88, 92) },
    { day: 'Wed', morning: randomBetween(94, 96), evening: randomBetween(84, 88) },
    { day: 'Thu', morning: randomBetween(98, 100), evening: randomBetween(88, 92) },
    { day: 'Fri', morning: randomBetween(94, 96), evening: randomBetween(84, 88) },
    { day: 'Sat', morning: randomBetween(97, 99), evening: randomBetween(88, 92) },
    { day: 'Sun', morning: randomBetween(94, 96), evening: randomBetween(84, 88) },
  ], [])

  const healthMetricsData = useMemo(() => [
    { month: 'Jan', bloodPressure: randomBetween(138, 145), heartRate: randomBetween(78, 85), weight: randomBetween(173, 178) },
    { month: 'Feb', bloodPressure: randomBetween(133, 140), heartRate: randomBetween(75, 82), weight: randomBetween(171, 176) },
    { month: 'Mar', bloodPressure: randomBetween(130, 137), heartRate: randomBetween(72, 79), weight: randomBetween(169, 174) },
    { month: 'Apr', bloodPressure: randomBetween(126, 133), heartRate: randomBetween(70, 77), weight: randomBetween(168, 173) },
    { month: 'May', bloodPressure: randomBetween(117, 124), heartRate: randomBetween(68, 75), weight: randomBetween(172, 177) },
    { month: 'Jun', bloodPressure: randomBetween(122, 129), heartRate: randomBetween(70, 77), weight: randomBetween(170, 175) },
  ], [])

  const treatmentProgressData = useMemo(() => [
    { period: 'Week 1', baseline: 85, current: randomBetween(86, 89) },
    { period: 'Week 2', baseline: 86, current: randomBetween(89, 92) },
    { period: 'Week 3', baseline: 87, current: randomBetween(91, 94) },
    { period: 'Week 4', baseline: 88, current: randomBetween(93, 96) },
  ], [])

  const healthGoalsData = useMemo(() => [
    { month: 'Jan', achieved: randomBetween(70, 76), target: 100 },
    { month: 'Feb', achieved: randomBetween(75, 81), target: 100 },
    { month: 'Mar', achieved: randomBetween(81, 87), target: 100 },
    { month: 'Apr', achieved: randomBetween(84, 90), target: 100 },
    { month: 'May', achieved: randomBetween(88, 94), target: 100 },
    { month: 'Jun', achieved: randomBetween(91, 97), target: 100 },
    { month: 'Jul', achieved: randomBetween(93, 98), target: 100 },
  ], [])

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }


  const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    }
  }

  return (
    <Box sx={{
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      bgcolor: '#F5F5F7',
      overflowX: 'hidden'
    }}>
      {/* Main Content - Full Width */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
        {/* Header */}
        <Box sx={{
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid',
          borderColor: '#E2E8F0',
          p: { xs: 3, md: 4 },
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Stack direction="row" alignItems="center" spacing={2.5}>
              <Box sx={{
                width: 52,
                height: 52,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 180, 216, 0.3)'
              }}>
                <LocalHospitalIcon sx={{ color: '#FFFFFF', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography sx={{
                  fontSize: { xs: '1.75rem', md: '2.25rem' },
                  fontWeight: 700,
                  color: '#1A1A2E',
                  letterSpacing: '-0.02em'
                }}>
                  Dashboard
                </Typography>
                <Typography sx={{ fontSize: '0.9375rem', color: '#64748B', mt: 0.5 }}>
                  Overview of your health tools and activity
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                minWidth: { sm: 220, md: 280 },
                bgcolor: '#F5F5F7',
                borderRadius: 2,
                border: '1px solid',
                borderColor: '#E2E8F0',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#00B4D8',
                  bgcolor: '#FFFFFF'
                }
              }}>
                <TextField
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tools..."
                  variant="standard"
                  fullWidth
                  InputProps={{
                    disableUnderline: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#64748B', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    px: 2,
                    py: 0.25,
                    '& .MuiInputBase-input': {
                      fontSize: '0.9375rem',
                      color: '#1A1A2E'
                    }
                  }}
                />
              </Box>
              <Badge
                badgeContent={unreadCount}
                sx={{
                  '& .MuiBadge-badge': {
                    bgcolor: '#EF476F',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    minWidth: 20,
                    height: 20
                  }
                }}
              >
                <IconButton
                  component={Link}
                  to="/tools/notifications"
                  sx={{
                    bgcolor: '#F5F5F7',
                    color: '#1A1A2E',
                    '&:hover': {
                      bgcolor: '#00B4D8',
                      color: '#FFFFFF'
                    }
                  }}
                >
                  <NotificationsIcon />
                </IconButton>
              </Badge>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                onClick={handleOpenProfileMenu}
                sx={{
                  cursor: 'pointer',
                  px: 1.25,
                  py: 0.75,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'transparent',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#E2E8F0',
                    bgcolor: '#F8FAFC'
                  }
                }}
                role="button"
                aria-label="Open patient profile menu"
              >
                <Avatar sx={{
                  bgcolor: '#00B4D8',
                  width: 44,
                  height: 44,
                  fontWeight: 600,
                  fontSize: '1.125rem'
                }}>
                  {userName.charAt(0)}
                </Avatar>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1A1A2E' }}>
                    {userName}
                  </Typography>
                  <Typography sx={{ fontSize: '0.8125rem', color: '#64748B' }}>Patient</Typography>
                </Box>
                <ArrowDropDownIcon sx={{ color: '#64748B', display: { xs: 'none', sm: 'block' } }} />
              </Stack>

              <Menu
                anchorEl={profileMenuAnchor}
                open={Boolean(profileMenuAnchor)}
                onClose={handleCloseProfileMenu}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 220,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: '#E2E8F0',
                    boxShadow: '0 12px 28px rgba(15, 23, 42, 0.12)'
                  }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                {profileMenuItems.map((item) => (
                  <MenuItem key={item.label} onClick={() => handleProfileMenuNavigate(item.href)}>
                    <ListItemIcon sx={{ color: '#64748B' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: '0.92rem', fontWeight: 600 }}
                    />
                  </MenuItem>
                ))}
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon sx={{ color: '#64748B' }}>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Logout"
                    primaryTypographyProps={{ fontSize: '0.92rem', fontWeight: 600 }}
                  />
                </MenuItem>
              </Menu>
            </Stack>
          </Stack>
        </Box>

        {/* Dashboard Content - Full Width, No Padding on sides */}
        <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2.5, md: 3.5 }, px: { xs: 3, md: 4 }, width: '100%' }}>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Stack spacing={4}>
              {/* Feature Navigation - Full width horizontal cards */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' },
                gap: { xs: 2, md: 3 }
              }}>
                {filteredFeatureItems.map((item) => (
                  <motion.div key={item.label} variants={cardVariants} whileHover="hover">
                    <Card
                      component={Link}
                      to={item.href}
                      sx={{
                        textDecoration: 'none',
                        height: 200,
                        borderRadius: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        p: 0,
                        overflow: 'hidden',
                        bgcolor: '#FFFFFF',
                        border: '1px solid',
                        borderColor: '#E2E8F0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        '&:hover': {
                          transform: 'translateY(-6px)',
                          borderColor: '#00B4D8',
                          boxShadow: '0 12px 32px rgba(0, 180, 216, 0.2)'
                        }
                      }}
                    >
                      <CardContent sx={{ p: { xs: 3, md: 3.5 }, flex: 1 }}>
                        <Stack direction="row" spacing={2.5} alignItems="center" sx={{ mb: 2 }}>
                          <Box sx={{
                            width: 52,
                            height: 52,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.1) 0%, rgba(6, 214, 160, 0.1) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid',
                            borderColor: 'rgba(0, 180, 216, 0.2)'
                          }}>
                            {item.icon}
                          </Box>
                          <Typography sx={{
                            fontSize: '1.0625rem',
                            fontWeight: 700,
                            color: '#1A1A2E',
                            lineHeight: 1.3
                          }}>
                            {item.label}
                          </Typography>
                        </Stack>
                        <Typography sx={{
                          fontSize: '0.875rem',
                          color: '#64748B',
                          lineHeight: 1.6
                        }}>
                          {item.description}
                        </Typography>
                      </CardContent>
                      <Box sx={{
                        px: { xs: 3, md: 3.5 },
                        pb: 3,
                        pt: 0,
                        display: 'flex',
                        justifyContent: 'flex-start'
                      }}>
                        <Chip
                          label="Open tool"
                          size="small"
                          sx={{
                            fontWeight: 600,
                            bgcolor: 'rgba(0, 180, 216, 0.1)',
                            color: '#00B4D8',
                            height: 28,
                            fontSize: '0.8125rem'
                          }}
                        />
                      </Box>
                    </Card>
                  </motion.div>
                ))}
              </Box>

              {filteredFeatureItems.length === 0 && (
                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: '#E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <CardContent>
                    <Typography sx={{ color: '#1A1A2E', fontWeight: 700, mb: 0.5 }}>
                      No tools found
                    </Typography>
                    <Typography sx={{ color: '#64748B', fontSize: '0.9rem' }}>
                      Try a different search term.
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Summary Cards - Larger */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: { xs: 2, md: 3 } }}>
                {summaryCards.map((card, index) => (
                  <motion.div
                    key={card.title}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                    whileHover="hover"
                  >
                    <Card sx={{
                      height: '100%',
                      borderRadius: 3,
                      bgcolor: '#FFFFFF',
                      border: '1px solid',
                      borderColor: '#E2E8F0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(0, 180, 216, 0.15)',
                        borderColor: '#00B4D8'
                      }
                    }}>
                      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 3 }}>
                          <Box sx={{
                            width: { xs: 60, md: 72 },
                            height: { xs: 60, md: 72 },
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.1) 0%, rgba(6, 214, 160, 0.1) 100%)',
                            border: '1px solid',
                            borderColor: 'rgba(0, 180, 216, 0.2)',
                            boxShadow: '0 2px 8px rgba(0, 180, 216, 0.1)'
                          }}>
                            {card.icon}
                          </Box>
                        </Stack>
                        <Typography sx={{
                          fontSize: { xs: '1rem', md: '1.125rem' },
                          fontWeight: 600,
                          color: '#64748B',
                          mb: 2
                        }}>
                          {card.title}
                        </Typography>
                        <Stack direction="row" alignItems="baseline" spacing={1.5}>
                          <Typography sx={{
                            fontSize: { xs: '2.5rem', md: '3.5rem' },
                            fontWeight: 700,
                            color: '#00B4D8',
                            lineHeight: 1
                          }}>
                            {card.value}
                          </Typography>
                          {card.change && (
                            <Typography sx={{
                              fontSize: { xs: '0.875rem', md: '1rem' },
                              fontWeight: 600,
                              color: card.changeType === 'positive' ? '#06D6A0' : '#64748B'
                            }}>
                              {card.change}
                            </Typography>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </Box>

              {/* Charts Row - Larger */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: { xs: 2, md: 3 } }}>
                <motion.div variants={cardVariants}>
                  <Card sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: '#E2E8F0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    bgcolor: '#FFFFFF',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0, 180, 216, 0.15)',
                      borderColor: '#00B4D8'
                    }
                  }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Typography sx={{
                        fontSize: { xs: '1.5rem', md: '1.75rem' },
                        fontWeight: 700,
                        color: '#1A1A2E',
                        mb: 4
                      }}>
                        Medication Adherence
                      </Typography>
                      <Box sx={{ height: { xs: 300, md: 400 } }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={medicationUsageData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                            barCategoryGap="20%"
                          >
                            <defs>
                              <linearGradient id="morningGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#00B4D8" stopOpacity={1} />
                                <stop offset="100%" stopColor="#0096C7" stopOpacity={0.8} />
                              </linearGradient>
                              <linearGradient id="eveningGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#06D6A0" stopOpacity={1} />
                                <stop offset="100%" stopColor="#04A777" stopOpacity={0.8} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                            <XAxis
                              dataKey="day"
                              tick={{ fill: '#64748B', fontSize: 13, fontWeight: 600 }}
                              axisLine={{ stroke: '#E2E8F0' }}
                              tickLine={{ stroke: '#E2E8F0' }}
                            />
                            <YAxis
                              tick={{ fill: '#64748B', fontSize: 13, fontWeight: 600 }}
                              axisLine={{ stroke: '#E2E8F0' }}
                              tickLine={{ stroke: '#E2E8F0' }}
                              domain={[0, 100]}
                              tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                padding: '12px'
                              }}
                              labelStyle={{ color: '#1A1A2E', fontWeight: 600, marginBottom: '8px' }}
                              itemStyle={{ color: '#64748B', fontSize: '14px' }}
                              formatter={(value: number) => [`${value}%`, '']}
                            />
                            <Legend
                              wrapperStyle={{ paddingTop: '24px' }}
                              iconType="rect"
                              iconSize={12}
                              formatter={(value) => <span style={{ color: '#1A1A2E', fontSize: '14px', fontWeight: 500 }}>{value}</span>}
                            />
                            <Bar dataKey="morning" fill="url(#morningGradient)" name="Morning Doses" radius={[12, 12, 0, 0]} />
                            <Bar dataKey="evening" fill="url(#eveningGradient)" name="Evening Doses" radius={[12, 12, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={cardVariants}>
                  <Card sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: '#E2E8F0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    bgcolor: '#FFFFFF',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0, 180, 216, 0.15)',
                      borderColor: '#00B4D8'
                    }
                  }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Typography sx={{
                        fontSize: { xs: '1.5rem', md: '1.75rem' },
                        fontWeight: 700,
                        color: '#1A1A2E',
                        mb: 4
                      }}>
                        Health Metrics Overview
                      </Typography>
                      <Box sx={{ height: { xs: 300, md: 400 } }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={healthMetricsData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                            <XAxis
                              dataKey="month"
                              tick={{ fill: '#64748B', fontSize: 13, fontWeight: 600 }}
                              axisLine={{ stroke: '#E2E8F0' }}
                              tickLine={{ stroke: '#E2E8F0' }}
                            />
                            <YAxis
                              tick={{ fill: '#64748B', fontSize: 13, fontWeight: 600 }}
                              axisLine={{ stroke: '#E2E8F0' }}
                              tickLine={{ stroke: '#E2E8F0' }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                padding: '12px'
                              }}
                              labelStyle={{ color: '#1A1A2E', fontWeight: 600, marginBottom: '8px' }}
                              itemStyle={{ color: '#64748B', fontSize: '14px' }}
                            />
                            <Legend
                              wrapperStyle={{ paddingTop: '24px' }}
                              iconType="line"
                              iconSize={16}
                              formatter={(value) => <span style={{ color: '#1A1A2E', fontSize: '14px', fontWeight: 500 }}>{value}</span>}
                            />
                            <Line
                              type="monotone"
                              dataKey="bloodPressure"
                              stroke="#00B4D8"
                              strokeWidth={3}
                              name="Blood Pressure (mmHg)"
                              dot={{ fill: '#00B4D8', r: 5, strokeWidth: 2, stroke: '#FFFFFF' }}
                              activeDot={{ r: 7, strokeWidth: 2, stroke: '#FFFFFF' }}
                            />
                            <Line
                              type="monotone"
                              dataKey="heartRate"
                              stroke="#EF476F"
                              strokeWidth={3}
                              name="Heart Rate (bpm)"
                              dot={{ fill: '#EF476F', r: 5, strokeWidth: 2, stroke: '#FFFFFF' }}
                              activeDot={{ r: 7, strokeWidth: 2, stroke: '#FFFFFF' }}
                            />
                            <Line
                              type="monotone"
                              dataKey="weight"
                              stroke="#06D6A0"
                              strokeWidth={3}
                              name="Weight (lbs)"
                              dot={{ fill: '#06D6A0', r: 5, strokeWidth: 2, stroke: '#FFFFFF' }}
                              activeDot={{ r: 7, strokeWidth: 2, stroke: '#FFFFFF' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>

              {/* More Charts - Larger */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: { xs: 2, md: 3 } }}>
                <motion.div variants={cardVariants}>
                  <Card sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: '#E2E8F0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    bgcolor: '#FFFFFF',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0, 180, 216, 0.15)',
                      borderColor: '#00B4D8'
                    }
                  }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                        <Typography sx={{
                          fontSize: { xs: '1.5rem', md: '1.75rem' },
                          fontWeight: 700,
                          color: '#1A1A2E'
                        }}>
                          Treatment Progress
                        </Typography>
                        <Stack direction="row" spacing={3}>
                          <Box>
                            <Typography sx={{ fontSize: { xs: '0.875rem', md: '0.9375rem' }, color: '#64748B', mb: 0.5 }}>Baseline</Typography>
                            <Typography sx={{ fontSize: { xs: '1.125rem', md: '1.25rem' }, fontWeight: 700, color: '#00B4D8' }}>85%</Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: { xs: '0.875rem', md: '0.9375rem' }, color: '#64748B', mb: 0.5 }}>Current</Typography>
                            <Typography sx={{ fontSize: { xs: '1.125rem', md: '1.25rem' }, fontWeight: 700, color: '#06D6A0' }}>94%</Typography>
                          </Box>
                        </Stack>
                      </Stack>
                      <Box sx={{ height: { xs: 280, md: 360 } }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={treatmentProgressData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                          >
                            <defs>
                              <linearGradient id="baselineGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#00B4D8" stopOpacity={0.2} />
                                <stop offset="100%" stopColor="#00B4D8" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#06D6A0" stopOpacity={0.2} />
                                <stop offset="100%" stopColor="#06D6A0" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                            <XAxis
                              dataKey="period"
                              tick={{ fill: '#64748B', fontSize: 13, fontWeight: 600 }}
                              axisLine={{ stroke: '#E2E8F0' }}
                              tickLine={{ stroke: '#E2E8F0' }}
                            />
                            <YAxis
                              tick={{ fill: '#64748B', fontSize: 13, fontWeight: 600 }}
                              axisLine={{ stroke: '#E2E8F0' }}
                              tickLine={{ stroke: '#E2E8F0' }}
                              domain={[80, 100]}
                              tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                padding: '12px'
                              }}
                              labelStyle={{ color: '#1A1A2E', fontWeight: 600, marginBottom: '8px' }}
                              itemStyle={{ color: '#64748B', fontSize: '14px' }}
                              formatter={(value: number) => [`${value}%`, '']}
                            />
                            <Legend
                              wrapperStyle={{ paddingTop: '24px' }}
                              iconType="line"
                              iconSize={16}
                              formatter={(value) => <span style={{ color: '#1A1A2E', fontSize: '14px', fontWeight: 500 }}>{value}</span>}
                            />
                            <Line
                              type="monotone"
                              dataKey="baseline"
                              stroke="#00B4D8"
                              strokeWidth={3}
                              name="Baseline Score"
                              dot={{ fill: '#00B4D8', r: 6, strokeWidth: 2, stroke: '#FFFFFF' }}
                              activeDot={{ r: 8, strokeWidth: 2, stroke: '#FFFFFF' }}
                            />
                            <Line
                              type="monotone"
                              dataKey="current"
                              stroke="#06D6A0"
                              strokeWidth={3}
                              name="Current Score"
                              dot={{ fill: '#06D6A0', r: 6, strokeWidth: 2, stroke: '#FFFFFF' }}
                              activeDot={{ r: 8, strokeWidth: 2, stroke: '#FFFFFF' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={cardVariants}>
                  <Card sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: '#E2E8F0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    bgcolor: '#FFFFFF',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0, 180, 216, 0.15)',
                      borderColor: '#00B4D8'
                    }
                  }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Typography sx={{
                        fontSize: { xs: '1.5rem', md: '1.75rem' },
                        fontWeight: 700,
                        color: '#1A1A2E',
                        mb: 4
                      }}>
                        Health Goals Progress
                      </Typography>
                      <Box sx={{ height: { xs: 280, md: 360 } }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={healthGoalsData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                            barCategoryGap="25%"
                          >
                            <defs>
                              <linearGradient id="achievedGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#06D6A0" stopOpacity={1} />
                                <stop offset="100%" stopColor="#04A777" stopOpacity={0.8} />
                              </linearGradient>
                              <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#00B4D8" stopOpacity={0.6} />
                                <stop offset="100%" stopColor="#0096C7" stopOpacity={0.4} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                            <XAxis
                              dataKey="month"
                              tick={{ fill: '#64748B', fontSize: 13, fontWeight: 600 }}
                              axisLine={{ stroke: '#E2E8F0' }}
                              tickLine={{ stroke: '#E2E8F0' }}
                              interval={0}
                            />
                            <YAxis
                              tick={{ fill: '#64748B', fontSize: 13, fontWeight: 600 }}
                              axisLine={{ stroke: '#E2E8F0' }}
                              tickLine={{ stroke: '#E2E8F0' }}
                              domain={[0, 100]}
                              tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                padding: '12px'
                              }}
                              labelStyle={{ color: '#1A1A2E', fontWeight: 600, marginBottom: '8px' }}
                              itemStyle={{ color: '#64748B', fontSize: '14px' }}
                              formatter={(value: number) => [`${value}%`, '']}
                            />
                            <Legend
                              wrapperStyle={{ paddingTop: '24px' }}
                              iconType="rect"
                              iconSize={12}
                              formatter={(value) => <span style={{ color: '#1A1A2E', fontSize: '14px', fontWeight: 500 }}>{value}</span>}
                            />
                            <Bar dataKey="achieved" fill="url(#achievedGradient)" name="Achieved" radius={[12, 12, 0, 0]} />
                            <Bar dataKey="target" fill="url(#targetGradient)" name="Target" radius={[12, 12, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>

              {/* Bottom Row - Larger */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: { xs: 2, md: 3 } }}>
                <motion.div variants={cardVariants}>
                  <Card sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: '#E2E8F0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    bgcolor: '#FFFFFF',
                    height: '100%',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 32px rgba(0, 180, 216, 0.2)',
                      borderColor: '#00B4D8'
                    }
                  }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Typography sx={{
                        fontSize: { xs: '1.5rem', md: '1.75rem' },
                        fontWeight: 700,
                        color: '#1A1A2E',
                        mb: 2.5
                      }}>
                        Upcoming Reminders
                      </Typography>
                      <Typography sx={{
                        fontSize: { xs: '1rem', md: '1.0625rem' },
                        color: '#64748B',
                        mb: 3,
                        fontWeight: 500
                      }}>
                        You have 3 reminders in the next 7 days.
                      </Typography>
                      <Stack spacing={1.5}>
                        {['Metformin - 8:00 AM', 'Lisinopril - 1:00 PM', 'Vitamin D - 6:00 PM'].map((reminder) => (
                          <Chip
                            key={reminder}
                            label={reminder}
                            sx={{
                              bgcolor: '#F5F5F7',
                              color: '#00B4D8',
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              height: 40,
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: '#E2E8F0',
                              '&:hover': {
                                bgcolor: 'rgba(0, 180, 216, 0.1)',
                                borderColor: '#00B4D8'
                              }
                            }}
                          />
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={cardVariants}>
                  <Card sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: '#E2E8F0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    bgcolor: '#FFFFFF',
                    height: '100%',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 32px rgba(0, 180, 216, 0.2)',
                      borderColor: '#00B4D8'
                    }
                  }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Typography sx={{
                        fontSize: { xs: '1.5rem', md: '1.75rem' },
                        fontWeight: 700,
                        color: '#1A1A2E',
                        mb: 3
                      }}>
                        Adherence (7 days)
                      </Typography>
                      <Box sx={{ height: { xs: 240, md: 320 }, mb: 3 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={adherenceData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                          >
                            <defs>
                              <linearGradient id="colorAdh" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#00B4D8" stopOpacity={0.5} />
                                <stop offset="50%" stopColor="#06D6A0" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#06D6A0" stopOpacity={0.05} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                            <XAxis
                              dataKey="day"
                              tick={{ fill: '#64748B', fontSize: 13, fontWeight: 600 }}
                              axisLine={{ stroke: '#E2E8F0' }}
                              tickLine={{ stroke: '#E2E8F0' }}
                            />
                            <YAxis
                              tick={{ fill: '#64748B', fontSize: 13, fontWeight: 600 }}
                              axisLine={{ stroke: '#E2E8F0' }}
                              tickLine={{ stroke: '#E2E8F0' }}
                              domain={[60, 90]}
                              tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #E2E8F0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                padding: '12px'
                              }}
                              labelStyle={{ color: '#1A1A2E', fontWeight: 600, marginBottom: '8px' }}
                              itemStyle={{ color: '#64748B', fontSize: '14px' }}
                              formatter={(value: number) => [`${value}%`, 'Adherence']}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke="#00B4D8"
                              fill="url(#colorAdh)"
                              strokeWidth={3}
                              dot={{ fill: '#00B4D8', r: 5, strokeWidth: 2, stroke: '#FFFFFF' }}
                              activeDot={{ r: 7, strokeWidth: 2, stroke: '#FFFFFF' }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Box>
                      <Typography sx={{
                        fontSize: { xs: '1rem', md: '1.0625rem' },
                        color: '#64748B',
                        fontWeight: 600
                      }}>
                        Your medication adherence trended up this week.
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>
            </Stack>
          </motion.div>
        </Box>
      </Box>
    </Box>
  )
}


