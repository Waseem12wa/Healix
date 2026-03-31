import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
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
import SettingsIcon from '@mui/icons-material/Settings'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { clearAuthData } from '../utils/auth'
import { getMyProfile, getPatientActivities, logPatientActivity } from '../services/patientService'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type ActivityItem = {
  _id?: string
  category?: string
  title?: string
  details?: string
  createdAt?: string
  metadata?: Record<string, unknown>
}

type DayBucket = {
  key: string
  label: string
  total: number
  interactions: number
  aiAssistant: number
  uploads: number
  profileUpdates: number
  purchases: number
}

type MonthBucket = {
  key: string
  label: string
  interactions: number
  aiAssistant: number
  uploads: number
  total: number
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const toDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const isUploadActivity = (activity: ActivityItem) => {
  const text = `${activity.title || ''} ${activity.details || ''}`.toLowerCase()
  return activity.category === 'profile-update' || /upload|record|summary|image/.test(text)
}

const buildLast7Days = () => {
  const days: DayBucket[] = []
  const now = new Date()

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    d.setDate(now.getDate() - i)

    days.push({
      key: toDateKey(d),
      label: DAY_LABELS[d.getDay()],
      total: 0,
      interactions: 0,
      aiAssistant: 0,
      uploads: 0,
      profileUpdates: 0,
      purchases: 0,
    })
  }

  return days
}

const buildLast6Months = () => {
  const months: MonthBucket[] = []
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const key = `${d.getFullYear()}-${month}`

    months.push({
      key,
      label: d.toLocaleString(undefined, { month: 'short' }),
      interactions: 0,
      aiAssistant: 0,
      uploads: 0,
      total: 0,
    })
  }

  return months
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [profileImage, setProfileImage] = useState(() => localStorage.getItem('profileImage') || '')
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)
  const dashboardLoggedRef = useRef(false)

  const { unreadCount } = useNotifications()

  const userName = useMemo(() => {
    return localStorage.getItem('userName') || 'Patient'
  }, [])

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
    { label: 'Settings', icon: <SettingsIcon fontSize="small" />, href: '/settings' },
  ]

  const recordActivity = async (title: string, details: string, metadata: Record<string, unknown> = {}) => {
    const optimistic: ActivityItem = {
      _id: `optimistic-${Date.now()}`,
      title,
      details,
      category: 'other',
      createdAt: new Date().toISOString(),
      metadata,
    }

    setActivities((prev) => [optimistic, ...prev].slice(0, 200))

    try {
      await logPatientActivity({
        category: 'other',
        title,
        details,
        metadata,
      })
    } catch {
      // Keep UX responsive even if activity logging fails.
    }
  }

  const loadDashboardData = async () => {
    try {
      const [profile, activityData] = await Promise.all([
        getMyProfile().catch(() => null),
        getPatientActivities(undefined, 200),
      ])

      const nextImage = profile?.patientProfile?.profileImage || ''
      setProfileImage(nextImage)
      if (nextImage) {
        localStorage.setItem('profileImage', nextImage)
      } else {
        localStorage.removeItem('profileImage')
      }

      setActivities(Array.isArray(activityData) ? activityData : [])
      setLastSyncedAt(new Date())
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    let mounted = true

    const safeLoad = async () => {
      if (!mounted) return
      await loadDashboardData()
    }

    safeLoad()

    const intervalId = window.setInterval(() => {
      safeLoad()
    }, 8000)

    const handleVisibility = () => {
      if (!document.hidden) {
        safeLoad()
      }
    }

    window.addEventListener('focus', safeLoad)
    document.addEventListener('visibilitychange', handleVisibility)

    if (!dashboardLoggedRef.current) {
      dashboardLoggedRef.current = true
      recordActivity('Dashboard opened', 'Patient viewed dashboard', { source: 'patient-dashboard' })
    }

    return () => {
      mounted = false
      window.clearInterval(intervalId)
      window.removeEventListener('focus', safeLoad)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  const metrics = useMemo(() => {
    const dayBuckets = buildLast7Days()
    const dayIndex = new Map(dayBuckets.map((d, i) => [d.key, i]))

    const monthBuckets = buildLast6Months()
    const monthIndex = new Map(monthBuckets.map((m, i) => [m.key, i]))

    let interactionChecks = 0
    let healthRecordActivities = 0
    let aiActivities = 0
    let purchaseActivities = 0

    activities.forEach((activity) => {
      const createdAt = activity.createdAt ? new Date(activity.createdAt) : null
      if (!createdAt || Number.isNaN(createdAt.getTime())) return

      const category = activity.category || 'other'
      const dayKey = toDateKey(createdAt)
      const dayIdx = dayIndex.get(dayKey)

      const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`
      const monthIdx = monthIndex.get(monthKey)

      const isInteraction = category === 'drug-interaction' || category === 'food-interaction'
      const isUpload = isUploadActivity(activity)
      const isAi = category === 'ai-assistant'
      const isPurchase = category === 'purchase'

      if (isInteraction) interactionChecks += 1
      if (isUpload) healthRecordActivities += 1
      if (isAi) aiActivities += 1
      if (isPurchase) purchaseActivities += 1

      if (dayIdx !== undefined) {
        dayBuckets[dayIdx].total += 1
        if (isInteraction) dayBuckets[dayIdx].interactions += 1
        if (isAi) dayBuckets[dayIdx].aiAssistant += 1
        if (isUpload) dayBuckets[dayIdx].uploads += 1
        if (category === 'profile-update') dayBuckets[dayIdx].profileUpdates += 1
        if (isPurchase) dayBuckets[dayIdx].purchases += 1
      }

      if (monthIdx !== undefined) {
        monthBuckets[monthIdx].total += 1
        if (isInteraction) monthBuckets[monthIdx].interactions += 1
        if (isAi) monthBuckets[monthIdx].aiAssistant += 1
        if (isUpload) monthBuckets[monthIdx].uploads += 1
      }
    })

    const activeDays = dayBuckets.filter((d) => d.total > 0).length
    const adherenceRate = Math.round((activeDays / 7) * 100)

    const weeklyTotal = dayBuckets.reduce((acc, item) => acc + item.total, 0)
    const recentActivities = activities.slice(0, 5)

    const summaryCards = [
      {
        title: 'Total Activities',
        value: String(activities.length),
        change: `${weeklyTotal} this week`,
        changeType: 'positive' as const,
        icon: <AccessAlarmIcon />,
      },
      {
        title: 'Interaction Checks',
        value: String(interactionChecks),
        change: `${dayBuckets[6]?.interactions || 0} today`,
        changeType: 'positive' as const,
        icon: <ScienceIcon />,
      },
      {
        title: 'Health Records',
        value: String(healthRecordActivities),
        change: `${monthBuckets[5]?.uploads || 0} this month`,
        changeType: 'positive' as const,
        icon: <SummarizeIcon />,
      },
      {
        title: 'Adherence Rate',
        value: `${adherenceRate}%`,
        change: `${activeDays}/7 active days`,
        changeType: adherenceRate > 0 ? 'positive' as const : 'neutral' as const,
        icon: <TrendingUpIcon />,
      },
    ]

    const medicationUsageData = dayBuckets.map((d) => ({
      day: d.label,
      interactions: d.interactions,
      uploads: d.uploads,
    }))

    const healthMetricsData = monthBuckets.map((m) => ({
      month: m.label,
      interactions: m.interactions,
      aiAssistant: m.aiAssistant,
      uploads: m.uploads,
    }))

    const treatmentProgressData = [
      {
        period: 'Week 1',
        baseline: Math.max(0, weeklyTotal - Math.max(0, Math.round(weeklyTotal * 0.4))),
        current: Math.max(0, weeklyTotal - Math.max(0, Math.round(weeklyTotal * 0.2))),
      },
      {
        period: 'Week 2',
        baseline: Math.max(0, weeklyTotal - Math.max(0, Math.round(weeklyTotal * 0.3))),
        current: Math.max(0, weeklyTotal - Math.max(0, Math.round(weeklyTotal * 0.1))),
      },
      {
        period: 'Week 3',
        baseline: Math.max(0, weeklyTotal - Math.max(0, Math.round(weeklyTotal * 0.15))),
        current: weeklyTotal,
      },
      {
        period: 'Week 4',
        baseline: Math.max(0, weeklyTotal - Math.max(0, Math.round(weeklyTotal * 0.1))),
        current: weeklyTotal,
      },
    ]

    const dynamicGoalTarget = Math.max(5, ...monthBuckets.map((m) => m.total))
    const healthGoalsData = monthBuckets.map((m) => ({
      month: m.label,
      achieved: m.total,
      target: dynamicGoalTarget,
    }))

    const maxDaily = Math.max(1, ...dayBuckets.map((d) => d.total))
    const adherenceData = dayBuckets.map((d) => ({
      day: d.label,
      value: Math.round((d.total / maxDaily) * 100),
    }))

    return {
      activeDays,
      adherenceRate,
      aiActivities,
      purchaseActivities,
      recentActivities,
      summaryCards,
      medicationUsageData,
      healthMetricsData,
      treatmentProgressData,
      healthGoalsData,
      adherenceData,
      weeklyTotal,
    }
  }, [activities])

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

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: 'easeInOut',
      },
    },
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', display: 'flex', bgcolor: '#F5F5F7', overflowX: 'hidden' }}>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
        <Box sx={{ bgcolor: '#FFFFFF', borderBottom: '1px solid', borderColor: '#E2E8F0', p: { xs: 3, md: 4 }, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Stack direction="row" alignItems="center" spacing={2.5}>
              <Box sx={{ width: 52, height: 52, borderRadius: 2, background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0, 180, 216, 0.3)' }}>
                <LocalHospitalIcon sx={{ color: '#FFFFFF', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, fontWeight: 700, color: '#1A1A2E', letterSpacing: '-0.02em' }}>
                  Dashboard
                </Typography>
                <Typography sx={{ fontSize: '0.9375rem', color: '#64748B', mt: 0.5 }}>
                  Overview of your health tools and real-time activity
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', minWidth: { sm: 220, md: 280 }, bgcolor: '#F5F5F7', borderRadius: 2, border: '1px solid', borderColor: '#E2E8F0', transition: 'all 0.2s ease', '&:hover': { borderColor: '#00B4D8', bgcolor: '#FFFFFF' } }}>
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
                  sx={{ px: 2, py: 0.25, '& .MuiInputBase-input': { fontSize: '0.9375rem', color: '#1A1A2E' } }}
                />
              </Box>

              <Badge badgeContent={unreadCount} sx={{ '& .MuiBadge-badge': { bgcolor: '#EF476F', fontSize: '0.75rem', fontWeight: 600, minWidth: 20, height: 20 } }}>
                <IconButton component={Link} to="/tools/notifications" sx={{ bgcolor: '#F5F5F7', color: '#1A1A2E', '&:hover': { bgcolor: '#00B4D8', color: '#FFFFFF' } }}>
                  <NotificationsIcon />
                </IconButton>
              </Badge>

              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                onClick={handleOpenProfileMenu}
                sx={{ cursor: 'pointer', px: 1.25, py: 0.75, borderRadius: 2, border: '1px solid', borderColor: 'transparent', transition: 'all 0.2s ease', '&:hover': { borderColor: '#E2E8F0', bgcolor: '#F8FAFC' } }}
                role="button"
                aria-label="Open patient profile menu"
              >
                <Avatar src={profileImage || undefined} sx={{ bgcolor: '#00B4D8', width: 44, height: 44, fontWeight: 600, fontSize: '1.125rem' }}>
                  {userName.charAt(0)}
                </Avatar>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1A1A2E' }}>{userName}</Typography>
                  <Typography sx={{ fontSize: '0.8125rem', color: '#64748B' }}>Patient</Typography>
                </Box>
                <ArrowDropDownIcon sx={{ color: '#64748B', display: { xs: 'none', sm: 'block' } }} />
              </Stack>

              <Menu
                anchorEl={profileMenuAnchor}
                open={Boolean(profileMenuAnchor)}
                onClose={handleCloseProfileMenu}
                PaperProps={{ sx: { mt: 1, minWidth: 220, borderRadius: 2, border: '1px solid', borderColor: '#E2E8F0', boxShadow: '0 12px 28px rgba(15, 23, 42, 0.12)' } }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                {profileMenuItems.map((item) => (
                  <MenuItem key={item.label} onClick={() => handleProfileMenuNavigate(item.href)}>
                    <ListItemIcon sx={{ color: '#64748B' }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.92rem', fontWeight: 600 }} />
                  </MenuItem>
                ))}
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon sx={{ color: '#64748B' }}>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.92rem', fontWeight: 600 }} />
                </MenuItem>
              </Menu>
            </Stack>
          </Stack>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2.5, md: 3.5 }, px: { xs: 3, md: 4 }, width: '100%' }}>
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <Stack spacing={4}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography sx={{ color: '#64748B', fontSize: '0.92rem' }}>
                  {loadingData ? 'Syncing your dashboard...' : `Live sync: ${lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : 'Not yet synced'}`}
                </Typography>
                <Button variant="outlined" size="small" onClick={loadDashboardData} sx={{ borderRadius: 2, textTransform: 'none' }}>
                  Refresh now
                </Button>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }, gap: { xs: 2, md: 3 } }}>
                {filteredFeatureItems.map((item) => (
                  <motion.div key={item.label} variants={cardVariants} whileHover="hover">
                    <Card
                      component={Link}
                      to={item.href}
                      onClick={() => {
                        recordActivity('Opened dashboard tool', `Navigated to ${item.label}`, { source: 'patient-dashboard', path: item.href })
                      }}
                      sx={{
                        textDecoration: 'none',
                        height: 200,
                        borderRadius: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        overflow: 'hidden',
                        bgcolor: '#FFFFFF',
                        border: '1px solid',
                        borderColor: '#E2E8F0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-6px)',
                          borderColor: '#00B4D8',
                          boxShadow: '0 12px 32px rgba(0, 180, 216, 0.2)',
                        },
                      }}
                    >
                      <CardContent sx={{ p: { xs: 3, md: 3.5 }, flex: 1 }}>
                        <Stack direction="row" spacing={2.5} alignItems="center" sx={{ mb: 2 }}>
                          <Box sx={{ width: 52, height: 52, borderRadius: 2, background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.1) 0%, rgba(6, 214, 160, 0.1) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid', borderColor: 'rgba(0, 180, 216, 0.2)' }}>
                            {item.icon}
                          </Box>
                          <Typography sx={{ fontSize: '1.0625rem', fontWeight: 700, color: '#1A1A2E', lineHeight: 1.3 }}>{item.label}</Typography>
                        </Stack>
                        <Typography sx={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.6 }}>{item.description}</Typography>
                      </CardContent>
                      <Box sx={{ px: { xs: 3, md: 3.5 }, pb: 3, display: 'flex', justifyContent: 'flex-start' }}>
                        <Chip label="Open tool" size="small" sx={{ fontWeight: 600, bgcolor: 'rgba(0, 180, 216, 0.1)', color: '#00B4D8', height: 28, fontSize: '0.8125rem' }} />
                      </Box>
                    </Card>
                  </motion.div>
                ))}
              </Box>

              {filteredFeatureItems.length === 0 && (
                <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: '#E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <CardContent>
                    <Typography sx={{ color: '#1A1A2E', fontWeight: 700, mb: 0.5 }}>No tools found</Typography>
                    <Typography sx={{ color: '#64748B', fontSize: '0.9rem' }}>Try a different search term.</Typography>
                  </CardContent>
                </Card>
              )}

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: { xs: 2, md: 3 } }}>
                {metrics.summaryCards.map((card, index) => (
                  <motion.div key={card.title} variants={cardVariants} initial="hidden" animate="visible" transition={{ delay: index * 0.1 }} whileHover="hover">
                    <Card sx={{ height: '100%', borderRadius: 3, bgcolor: '#FFFFFF', border: '1px solid', borderColor: '#E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 3 }}>
                          <Box sx={{ width: { xs: 60, md: 72 }, height: { xs: 60, md: 72 }, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.1) 0%, rgba(6, 214, 160, 0.1) 100%)', border: '1px solid', borderColor: 'rgba(0, 180, 216, 0.2)' }}>
                            {card.icon}
                          </Box>
                        </Stack>
                        <Typography sx={{ fontSize: { xs: '1rem', md: '1.125rem' }, fontWeight: 600, color: '#64748B', mb: 2 }}>{card.title}</Typography>
                        <Stack direction="row" alignItems="baseline" spacing={1.5}>
                          <Typography sx={{ fontSize: { xs: '2.1rem', md: '2.8rem' }, fontWeight: 700, color: '#00B4D8', lineHeight: 1 }}>{card.value}</Typography>
                          <Typography sx={{ fontSize: { xs: '0.82rem', md: '0.94rem' }, fontWeight: 600, color: card.changeType === 'positive' ? '#06D6A0' : '#64748B' }}>{card.change}</Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: { xs: 2, md: 3 } }}>
                <motion.div variants={cardVariants}>
                  <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: '#E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', bgcolor: '#FFFFFF' }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Typography sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' }, fontWeight: 700, color: '#1A1A2E', mb: 4 }}>Tool Usage (7 Days)</Typography>
                      <Box sx={{ height: { xs: 300, md: 360 } }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={metrics.medicationUsageData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }} barCategoryGap="20%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                            <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 13, fontWeight: 600 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={{ stroke: '#E2E8F0' }} />
                            <YAxis tick={{ fill: '#64748B', fontSize: 13, fontWeight: 600 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={{ stroke: '#E2E8F0' }} allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="interactions" fill="#00B4D8" name="Interaction Checks" radius={[12, 12, 0, 0]} />
                            <Bar dataKey="uploads" fill="#06D6A0" name="Uploads & Records" radius={[12, 12, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={cardVariants}>
                  <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: '#E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', bgcolor: '#FFFFFF' }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Typography sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' }, fontWeight: 700, color: '#1A1A2E', mb: 4 }}>Monthly Activity Metrics</Typography>
                      <Box sx={{ height: { xs: 300, md: 360 } }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={metrics.healthMetricsData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                            <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 13, fontWeight: 600 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={{ stroke: '#E2E8F0' }} />
                            <YAxis tick={{ fill: '#64748B', fontSize: 13, fontWeight: 600 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={{ stroke: '#E2E8F0' }} allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="interactions" stroke="#00B4D8" strokeWidth={3} name="Interactions" />
                            <Line type="monotone" dataKey="aiAssistant" stroke="#EF476F" strokeWidth={3} name="AI Assistant" />
                            <Line type="monotone" dataKey="uploads" stroke="#06D6A0" strokeWidth={3} name="Uploads" />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: { xs: 2, md: 3 } }}>
                <motion.div variants={cardVariants}>
                  <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: '#E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', bgcolor: '#FFFFFF' }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Typography sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' }, fontWeight: 700, color: '#1A1A2E', mb: 4 }}>Weekly Progress</Typography>
                      <Box sx={{ height: { xs: 260, md: 320 } }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={metrics.treatmentProgressData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                            <XAxis dataKey="period" tick={{ fill: '#64748B', fontSize: 13, fontWeight: 600 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={{ stroke: '#E2E8F0' }} />
                            <YAxis tick={{ fill: '#64748B', fontSize: 13, fontWeight: 600 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={{ stroke: '#E2E8F0' }} allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="baseline" stroke="#00B4D8" strokeWidth={3} name="Baseline" />
                            <Line type="monotone" dataKey="current" stroke="#06D6A0" strokeWidth={3} name="Current" />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={cardVariants}>
                  <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: '#E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', bgcolor: '#FFFFFF' }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Typography sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' }, fontWeight: 700, color: '#1A1A2E', mb: 4 }}>Activity Goals Progress</Typography>
                      <Box sx={{ height: { xs: 260, md: 320 } }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={metrics.healthGoalsData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }} barCategoryGap="25%">
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                            <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 13, fontWeight: 600 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={{ stroke: '#E2E8F0' }} interval={0} />
                            <YAxis tick={{ fill: '#64748B', fontSize: 13, fontWeight: 600 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={{ stroke: '#E2E8F0' }} allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="achieved" fill="#06D6A0" name="Achieved" radius={[12, 12, 0, 0]} />
                            <Bar dataKey="target" fill="#00B4D8" name="Target" radius={[12, 12, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: { xs: 2, md: 3 } }}>
                <motion.div variants={cardVariants}>
                  <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: '#E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', bgcolor: '#FFFFFF', height: '100%' }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Typography sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' }, fontWeight: 700, color: '#1A1A2E', mb: 2.5 }}>Recent Patient Activity</Typography>
                      <Typography sx={{ fontSize: { xs: '1rem', md: '1.0625rem' }, color: '#64748B', mb: 3, fontWeight: 500 }}>
                        {metrics.recentActivities.length === 0 ? 'No activity yet for this patient.' : `${metrics.recentActivities.length} latest updates are shown below.`}
                      </Typography>
                      <Stack spacing={1.5}>
                        {metrics.recentActivities.length === 0 ? (
                          <Chip label="No activity found" sx={{ bgcolor: '#F5F5F7', color: '#64748B', fontWeight: 600, height: 40, borderRadius: 2, border: '1px solid', borderColor: '#E2E8F0' }} />
                        ) : (
                          metrics.recentActivities.map((item, idx) => (
                            <Chip
                              key={item._id || idx}
                              label={`${item.title || 'Activity'}${item.createdAt ? ` - ${new Date(item.createdAt).toLocaleTimeString()}` : ''}`}
                              sx={{ bgcolor: '#F5F5F7', color: '#00B4D8', fontWeight: 600, fontSize: '0.84rem', height: 40, borderRadius: 2, border: '1px solid', borderColor: '#E2E8F0' }}
                            />
                          ))
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={cardVariants}>
                  <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: '#E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', bgcolor: '#FFFFFF', height: '100%' }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Typography sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' }, fontWeight: 700, color: '#1A1A2E', mb: 3 }}>Activity Consistency (7 days)</Typography>
                      <Box sx={{ height: { xs: 240, md: 320 }, mb: 3 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={metrics.adherenceData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                            <defs>
                              <linearGradient id="colorAdh" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#00B4D8" stopOpacity={0.5} />
                                <stop offset="50%" stopColor="#06D6A0" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#06D6A0" stopOpacity={0.05} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                            <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 13, fontWeight: 600 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={{ stroke: '#E2E8F0' }} />
                            <YAxis tick={{ fill: '#64748B', fontSize: 13, fontWeight: 600 }} axisLine={{ stroke: '#E2E8F0' }} tickLine={{ stroke: '#E2E8F0' }} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                            <Tooltip formatter={(value: number) => [`${value}%`, 'Consistency']} />
                            <Area type="monotone" dataKey="value" stroke="#00B4D8" fill="url(#colorAdh)" strokeWidth={3} dot={{ fill: '#00B4D8', r: 5, strokeWidth: 2, stroke: '#FFFFFF' }} activeDot={{ r: 7, strokeWidth: 2, stroke: '#FFFFFF' }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Box>
                      <Typography sx={{ fontSize: { xs: '1rem', md: '1.0625rem' }, color: '#64748B', fontWeight: 600 }}>
                        {metrics.weeklyTotal === 0
                          ? 'No activity recorded yet. Start using tools to see live trends.'
                          : `You were active on ${metrics.activeDays} of the last 7 days.`}
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
