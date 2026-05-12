import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Tooltip as MuiTooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import NotificationsIcon from '@mui/icons-material/NotificationsRounded'
import PersonIcon from '@mui/icons-material/PersonRounded'
import ScienceIcon from '@mui/icons-material/ScienceRounded'
import LocalHospitalIcon from '@mui/icons-material/LocalHospitalRounded'
import FastfoodIcon from '@mui/icons-material/FastfoodRounded'
import SwapHorizIcon from '@mui/icons-material/SwapHorizRounded'
import AccessAlarmIcon from '@mui/icons-material/AccessAlarmRounded'
import SmartToyIcon from '@mui/icons-material/SmartToyRounded'
import SummarizeIcon from '@mui/icons-material/SummarizeRounded'
import LogoutIcon from '@mui/icons-material/LogoutRounded'
import TrendingUpIcon from '@mui/icons-material/TrendingUpRounded'
import EventIcon from '@mui/icons-material/EventRounded'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCartRounded'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDownRounded'
import SearchIcon from '@mui/icons-material/SearchRounded'
import SettingsIcon from '@mui/icons-material/SettingsRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import FiberManualRecordRoundedIcon from '@mui/icons-material/FiberManualRecordRounded'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BRAND_GRADIENT, HERO_BG, GLASS_SURFACE, SOFT_BORDER, PREMIUM_SHADOW, getGreeting, colors } from '../ui/premium'
import { useNotifications } from '../hooks/useNotifications'
import { clearAuthData } from '../utils/auth'
import { getMyProfile, getPatientActivities, logPatientActivity } from '../services/patientService'
import BackButton from '../ui/BackButton'
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
  const theme = useTheme()
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

  const firstName = useMemo(() => userName.split(' ')[0] || userName, [userName])

  const greeting = useMemo(() => getGreeting(), [])

  const featureItems = [
    { label: 'Drug Interaction Checker', description: 'Check interactions between medications in seconds.', Icon: ScienceIcon, accent: '#0EA5E9', href: '/tools/drug-interactions' },
    { label: 'Drug-Food Interaction', description: 'See how foods may affect your prescriptions.', Icon: FastfoodIcon, accent: '#10B981', href: '/tools/drug-food-interactions' },
    { label: 'Drug Alternatives', description: 'Explore safer or more affordable alternatives.', Icon: SwapHorizIcon, accent: '#1D4ED8', href: '/tools/drug-alternatives' },
    { label: 'Side Effect Predictor', description: 'Predict potential side effects from medications.', Icon: TrendingUpIcon, accent: '#F43F5E', href: '/tools/side-effects' },
    { label: 'Medicine Shop', description: 'Purchase medicines directly from our store.', Icon: ShoppingCartIcon, accent: '#F59E0B', href: '/shop/medicines' },
    { label: 'Medication Reminder', description: 'Stay on track with intelligent reminders.', Icon: AccessAlarmIcon, accent: '#0F766E', href: '/tools/medication-reminder' },
    { label: 'AI Health Assistant', description: 'Chat with an AI to understand your health data.', Icon: SmartToyIcon, accent: '#2563EB', href: '/tools/ai-chatbot' },
    { label: 'Record Summarization', description: 'Turn complex reports into clear summaries.', Icon: SummarizeIcon, accent: '#06B6D4', href: '/tools/health-summary' },
    { label: 'Doctor Appointments', description: 'Manage and review upcoming visits.', Icon: EventIcon, accent: '#10B981', href: '/tools/appointments' },
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

    const sparkTotal = dayBuckets.map((d, i) => ({ x: i, y: d.total }))
    const sparkInteractions = dayBuckets.map((d, i) => ({ x: i, y: d.interactions }))
    const sparkUploads = dayBuckets.map((d, i) => ({ x: i, y: d.uploads }))
    const sparkAdherence = dayBuckets.map((d, i) => ({ x: i, y: d.total > 0 ? 1 : 0 }))

    const summaryCards = [
      {
        title: 'Total Activities',
        value: String(activities.length),
        change: `${weeklyTotal} this week`,
        changeType: 'positive' as const,
        icon: <AccessAlarmIcon />,
        accent: '#0EA5E9',
        spark: sparkTotal,
      },
      {
        title: 'Interaction Checks',
        value: String(interactionChecks),
        change: `${dayBuckets[6]?.interactions || 0} today`,
        changeType: 'positive' as const,
        icon: <ScienceIcon />,
        accent: '#06B6D4',
        spark: sparkInteractions,
      },
      {
        title: 'Health Records',
        value: String(healthRecordActivities),
        change: `${monthBuckets[5]?.uploads || 0} this month`,
        changeType: 'positive' as const,
        icon: <SummarizeIcon />,
        accent: '#10B981',
        spark: sparkUploads,
      },
      {
        title: 'Adherence Rate',
        value: `${adherenceRate}%`,
        change: `${activeDays}/7 active days`,
        changeType: adherenceRate > 0 ? 'positive' as const : 'neutral' as const,
        icon: <TrendingUpIcon />,
        accent: '#2563EB',
        spark: sparkAdherence,
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

  // Premium design tokens
  // Custom recharts tooltip
  const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null
    return (
      <Box sx={{
        background: alpha('#FFFFFF', 0.96),
        backdropFilter: 'blur(8px)',
        border: SOFT_BORDER,
        borderRadius: 2,
        px: 1.75, py: 1.25,
        boxShadow: '0 12px 32px rgba(15,23,42,0.10)',
        minWidth: 140,
      }}>
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: colors.ink, mb: 0.75 }}>{label}</Typography>
        {payload.map((p: any, i: number) => (
          <Stack key={i} direction="row" alignItems="center" spacing={1} sx={{ fontSize: '0.78rem' }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color || p.stroke || p.fill }} />
            <Typography sx={{ fontSize: '0.78rem', color: colors.inkMuted, flex: 1 }}>{p.name}</Typography>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: colors.ink }}>{p.value}</Typography>
          </Stack>
        ))}
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', position: 'relative' }}>
      {/* Ambient background mesh */}
      <Box sx={{
        position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none',
        backgroundImage:
          'radial-gradient(900px 500px at -10% -10%, rgba(52,211,153,0.10) 0%, transparent 60%),' +
          'radial-gradient(700px 400px at 110% 0%, rgba(37,99,235,0.10) 0%, transparent 60%),' +
          'radial-gradient(600px 400px at 50% 110%, rgba(6,182,212,0.08) 0%, transparent 60%)',
      }} />

      {/* Premium glass sticky header */}
      <Box sx={{
        position: 'sticky', top: 0, zIndex: 20,
        bgcolor: GLASS_SURFACE,
        backdropFilter: 'saturate(180%) blur(16px)',
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
                  background: BRAND_GRADIENT,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(14,165,233,0.32), 0 2px 4px rgba(37,99,235,0.18)',
                }}>
                  <LocalHospitalIcon sx={{ color: colors.surface, fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography sx={{
                    fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.01em',
                    background: BRAND_GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>Healix</Typography>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Patient Console
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              {/* Search pill */}
              <Box sx={{
                display: { xs: 'none', md: 'flex' }, alignItems: 'center',
                width: 280, height: 40, px: 1.5, gap: 1,
                bgcolor: alpha('#FFFFFF', 0.7), backdropFilter: 'blur(8px)',
                border: SOFT_BORDER, borderRadius: 999,
                transition: 'all 0.2s ease',
                '&:hover, &:focus-within': { borderColor: alpha('#0EA5E9', 0.4), bgcolor: '#FFFFFF', boxShadow: '0 4px 12px rgba(14,165,233,0.10)' },
              }}>
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                <TextField
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tools, records, medicines…"
                  variant="standard"
                  fullWidth
                  InputProps={{ disableUnderline: true, sx: { fontSize: '0.875rem' } }}
                />
                <Box sx={{
                  px: 0.75, py: 0.25, borderRadius: 1, fontSize: '0.7rem', fontWeight: 700,
                  color: 'text.secondary', bgcolor: alpha('#0F172A', 0.04), border: SOFT_BORDER, lineHeight: 1.4,
                }}>⌘K</Box>
              </Box>

              <MuiTooltip title="Notifications" arrow>
                <Badge badgeContent={unreadCount} max={9} sx={{ '& .MuiBadge-badge': { background: 'linear-gradient(135deg, #FB7185 0%, #F43F5E 100%)', color: '#FFFFFF', fontWeight: 700, fontSize: '0.65rem', minWidth: 18, height: 18 } }}>
                  <IconButton
                    component={Link} to="/tools/notifications"
                    sx={{
                      width: 40, height: 40, borderRadius: 2,
                      bgcolor: alpha('#FFFFFF', 0.7), border: SOFT_BORDER, color: 'text.primary',
                      '&:hover': { bgcolor: '#FFFFFF', borderColor: alpha('#0EA5E9', 0.4), boxShadow: '0 4px 12px rgba(14,165,233,0.15)' },
                    }}
                  >
                    <NotificationsIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Badge>
              </MuiTooltip>

              <Stack
                direction="row" alignItems="center" spacing={1} onClick={handleOpenProfileMenu}
                sx={{
                  cursor: 'pointer', pl: 0.5, pr: 1.25, py: 0.5, borderRadius: 999,
                  bgcolor: alpha('#FFFFFF', 0.7), border: SOFT_BORDER,
                  transition: 'all 0.2s ease',
                  '&:hover': { bgcolor: '#FFFFFF', borderColor: alpha('#0EA5E9', 0.4), boxShadow: '0 4px 12px rgba(14,165,233,0.12)' },
                }}
                role="button" aria-label="Open patient profile menu"
              >
                <Box sx={{
                  position: 'relative',
                  '&::before': {
                    content: '""', position: 'absolute', inset: -2,
                    borderRadius: '50%', padding: '2px', background: BRAND_GRADIENT,
                    WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                    mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                    WebkitMaskComposite: 'xor', maskComposite: 'exclude',
                  }
                }}>
                  <Avatar src={profileImage || undefined} sx={{ bgcolor: colors.sky, width: 32, height: 32, fontWeight: 700, fontSize: '0.85rem' }}>
                    {userName.charAt(0).toUpperCase()}
                  </Avatar>
                </Box>
                <Box sx={{ display: { xs: 'none', sm: 'block' }, lineHeight: 1 }}>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>{firstName}</Typography>
                  <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', lineHeight: 1.2 }}>Patient</Typography>
                </Box>
                <ArrowDropDownIcon sx={{ color: 'text.secondary', fontSize: 18, display: { xs: 'none', sm: 'block' } }} />
              </Stack>

              <Menu
                anchorEl={profileMenuAnchor} open={Boolean(profileMenuAnchor)} onClose={handleCloseProfileMenu}
                PaperProps={{ sx: { mt: 1.25, minWidth: 240, borderRadius: 3, border: SOFT_BORDER, boxShadow: '0 16px 40px rgba(15,23,42,0.12)', overflow: 'hidden' } }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Box sx={{ p: 2, background: alpha('#0EA5E9', 0.05), borderBottom: SOFT_BORDER }}>
                  <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: 'text.primary' }}>{userName}</Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>Signed in as Patient</Typography>
                </Box>
                {profileMenuItems.map((item) => (
                  <MenuItem key={item.label} onClick={() => handleProfileMenuNavigate(item.href)} sx={{ py: 1.25 }}>
                    <ListItemIcon sx={{ color: 'text.secondary' }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }} />
                  </MenuItem>
                ))}
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ py: 1.25, color: '#F43F5E' }}>
                  <ListItemIcon sx={{ color: '#F43F5E' }}><LogoutIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 700 }} />
                </MenuItem>
              </Menu>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Body */}
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <Stack spacing={{ xs: 3, md: 4 }}>

            {/* HERO GREETING CARD */}
            <motion.div variants={cardVariants}>
              <Card sx={{
                position: 'relative', overflow: 'hidden',
                borderRadius: 4, border: SOFT_BORDER,
                background: HERO_BG,
                boxShadow: PREMIUM_SHADOW,
              }}>
                {/* Decorative gradient mesh */}
                <Box sx={{
                  position: 'absolute', top: -120, right: -100, width: 420, height: 420, borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(52,211,153,0.22) 0%, transparent 60%)',
                  filter: 'blur(20px)', pointerEvents: 'none',
                }} />
                <Box sx={{
                  position: 'absolute', bottom: -100, left: '40%', width: 360, height: 360, borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 60%)',
                  filter: 'blur(20px)', pointerEvents: 'none',
                }} />

                <CardContent sx={{ position: 'relative', p: { xs: 3, md: 4.5 } }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" gap={3}>
                    <Box sx={{ flex: 1 }}>
                      <Chip
                        size="small"
                        icon={<AutoAwesomeRoundedIcon sx={{ fontSize: 14 }} />}
                        label="AI HEALTH HUB"
                        sx={{
                          bgcolor: alpha('#FFFFFF', 0.65), backdropFilter: 'blur(8px)',
                          border: SOFT_BORDER, color: '#1D4ED8', fontWeight: 800, letterSpacing: '0.06em',
                          fontSize: '0.65rem', height: 24, mb: 2,
                          '& .MuiChip-icon': { color: '#06B6D4' },
                        }}
                      />
                      <Typography sx={{
                        fontSize: { xs: '1.75rem', sm: '2.15rem', md: '2.6rem' },
                        fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em',
                        color: colors.ink,
                      }}>
                        {greeting},{' '}
                        <Box component="span" sx={{
                          background: BRAND_GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>{firstName}</Box>
                      </Typography>
                      <Typography sx={{ fontSize: { xs: '0.95rem', md: '1.05rem' }, color: 'text.secondary', mt: 1.25, maxWidth: 640, lineHeight: 1.6 }}>
                        Here&apos;s what&apos;s happening with your health today. Track activity, run AI checks, and stay on top of your care plan.
                      </Typography>

                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 3, flexWrap: 'wrap', gap: 1 }}>
                        <Chip
                          size="small"
                          icon={<FiberManualRecordRoundedIcon sx={{ fontSize: '0.6rem !important', color: loadingData ? '#F59E0B' : '#10B981' }} />}
                          label={loadingData ? 'Syncing your data…' : `Live · ${lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : 'pending'}`}
                          sx={{ bgcolor: alpha('#FFFFFF', 0.75), backdropFilter: 'blur(6px)', border: SOFT_BORDER, fontWeight: 600, fontSize: '0.75rem', height: 28 }}
                        />
                        <Button
                          onClick={loadDashboardData}
                          startIcon={<RefreshRoundedIcon sx={{ fontSize: 16 }} />}
                          size="small"
                          sx={{
                            textTransform: 'none', fontWeight: 600, fontSize: '0.8rem',
                            color: '#1D4ED8',
                            bgcolor: alpha('#FFFFFF', 0.65), border: SOFT_BORDER, borderRadius: 999, px: 1.75,
                            '&:hover': { bgcolor: '#FFFFFF', borderColor: alpha('#0EA5E9', 0.35) },
                          }}
                        >
                          Refresh
                        </Button>
                      </Stack>
                    </Box>

                    {/* Hero Right: weekly activity headline */}
                    <Box sx={{
                      flexShrink: 0, minWidth: { md: 280 },
                      bgcolor: alpha('#FFFFFF', 0.7), backdropFilter: 'blur(12px)',
                      border: SOFT_BORDER, borderRadius: 3, p: 2.5,
                    }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          This Week
                        </Typography>
                        <BoltRoundedIcon sx={{ fontSize: 18, color: '#F59E0B' }} />
                      </Stack>
                      <Typography sx={{ fontSize: '2.4rem', fontWeight: 800, color: '#0F172A', lineHeight: 1, letterSpacing: '-0.02em' }}>
                        {metrics.weeklyTotal}
                      </Typography>
                      <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mb: 1.5 }}>
                        Activities tracked
                      </Typography>
                      <Box sx={{ height: 56 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={metrics.adherenceData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="heroSpark" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.55} />
                                <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="value" stroke="#0EA5E9" fill="url(#heroSpark)" strokeWidth={2.5} dot={false} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Box>
                      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                        <ArrowUpwardRoundedIcon sx={{ fontSize: 14, color: '#10B981' }} />
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#10B981' }}>
                          {metrics.adherenceRate}% consistency
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>

            {/* AT A GLANCE — Premium stat cards with sparklines */}
            <Box>
              <Stack direction="row" alignItems="flex-end" justifyContent="space-between" sx={{ mb: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                    At a glance
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Real-time activity insights</Typography>
                </Box>
              </Stack>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: { xs: 2, md: 2.5 } }}>
                {loadingData
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <Card key={i} sx={{ borderRadius: 3, border: SOFT_BORDER, p: 2.5 }}>
                        <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: 2 }} />
                        <Skeleton variant="text" width="40%" sx={{ fontSize: '2rem', mt: 1 }} />
                        <Skeleton variant="text" width="70%" />
                        <Skeleton variant="rounded" width="100%" height={40} sx={{ mt: 1 }} />
                      </Card>
                    ))
                  : metrics.summaryCards.map((card: any, index: number) => (
                  <motion.div key={card.title} variants={cardVariants} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                    <Card sx={{
                      position: 'relative', overflow: 'hidden', height: '100%',
                      borderRadius: 3, border: SOFT_BORDER,
                      bgcolor: alpha('#FFFFFF', 0.85), backdropFilter: 'blur(8px)',
                      boxShadow: PREMIUM_SHADOW,
                      transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
                      '&:hover': { borderColor: alpha(card.accent, 0.4), boxShadow: `0 12px 32px ${alpha(card.accent, 0.18)}` },
                    }}>
                      {/* Decorative accent corner */}
                      <Box sx={{
                        position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%',
                        background: `radial-gradient(circle, ${alpha(card.accent, 0.18)} 0%, transparent 65%)`,
                        pointerEvents: 'none',
                      }} />
                      <CardContent sx={{ position: 'relative', p: { xs: 2.5, md: 3 } }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                          <Box sx={{
                            width: 44, height: 44, borderRadius: 2,
                            background: `linear-gradient(135deg, ${alpha(card.accent, 0.18)} 0%, ${alpha(card.accent, 0.06)} 100%)`,
                            border: `1px solid ${alpha(card.accent, 0.25)}`,
                            color: card.accent,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {card.icon}
                          </Box>
                          <Chip
                            size="small"
                            icon={<ArrowUpwardRoundedIcon sx={{ fontSize: '0.85rem !important', color: '#10B981 !important' }} />}
                            label={card.change}
                            sx={{ bgcolor: alpha('#10B981', 0.10), color: '#059669', fontWeight: 700, height: 22, fontSize: '0.7rem', '& .MuiChip-icon': { ml: 0.5 } }}
                          />
                        </Stack>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
                          {card.title}
                        </Typography>
                        <Typography sx={{ fontSize: { xs: '1.85rem', md: '2.25rem' }, fontWeight: 800, color: '#0F172A', lineHeight: 1, letterSpacing: '-0.02em', mb: 1.25 }}>
                          {card.value}
                        </Typography>
                        <Box sx={{ height: 36, mx: -1 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={card.spark} margin={{ top: 2, right: 4, left: 4, bottom: 0 }}>
                              <defs>
                                <linearGradient id={`spark-${index}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={card.accent} stopOpacity={0.55} />
                                  <stop offset="100%" stopColor={card.accent} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="y" stroke={card.accent} strokeWidth={2} fill={`url(#spark-${index})`} dot={false} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </Box>
            </Box>

            {/* HEALTH TOOLS */}
            <Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'flex-end' }} justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                    Health tools
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Quick access to your AI-powered toolkit</Typography>
                </Box>
                <Box sx={{
                  display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1,
                  width: '100%', height: 40, px: 1.5,
                  bgcolor: alpha('#FFFFFF', 0.7), border: SOFT_BORDER, borderRadius: 999,
                }}>
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                  <TextField
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tools…" variant="standard" fullWidth
                    InputProps={{ disableUnderline: true, sx: { fontSize: '0.875rem' } }}
                  />
                </Box>
              </Stack>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }, gap: { xs: 2, md: 2.5 } }}>
                {filteredFeatureItems.map((item) => {
                  const Icon = item.Icon
                  return (
                    <motion.div key={item.label} variants={cardVariants} whileHover={{ y: -6 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
                      <Card
                        component={Link}
                        to={item.href}
                        onClick={() => recordActivity('Opened dashboard tool', `Navigated to ${item.label}`, { source: 'patient-dashboard', path: item.href })}
                        sx={{
                          position: 'relative', overflow: 'hidden',
                          textDecoration: 'none', display: 'flex', flexDirection: 'column',
                          height: 220, borderRadius: 3, border: SOFT_BORDER,
                          bgcolor: alpha('#FFFFFF', 0.88), backdropFilter: 'blur(8px)',
                          boxShadow: PREMIUM_SHADOW,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            borderColor: alpha(item.accent, 0.4),
                            boxShadow: `0 16px 40px ${alpha(item.accent, 0.22)}`,
                          },
                          '&:hover .tool-arrow': { transform: 'translate(2px, -2px)' },
                          '&:hover .tool-mesh': { opacity: 1 },
                        }}
                      >
                        <Box className="tool-mesh" sx={{
                          position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%',
                          background: `radial-gradient(circle, ${alpha(item.accent, 0.22)} 0%, transparent 65%)`,
                          opacity: 0.6, transition: 'opacity 0.3s ease', pointerEvents: 'none',
                        }} />

                        <CardContent sx={{ position: 'relative', flex: 1, p: { xs: 2.5, md: 3 } }}>
                          <Box sx={{
                            width: 48, height: 48, borderRadius: 2,
                            background: `linear-gradient(135deg, ${alpha(item.accent, 0.18)} 0%, ${alpha(item.accent, 0.06)} 100%)`,
                            border: `1px solid ${alpha(item.accent, 0.25)}`,
                            color: item.accent,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            mb: 2,
                          }}>
                            <Icon sx={{ fontSize: 24 }} />
                          </Box>
                          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.3, mb: 0.75 }}>
                            {item.label}
                          </Typography>
                          <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', lineHeight: 1.55 }}>
                            {item.description}
                          </Typography>
                        </CardContent>

                        <Box sx={{
                          position: 'relative',
                          px: { xs: 2.5, md: 3 }, pb: 2.25,
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                          <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: item.accent, letterSpacing: '0.02em' }}>
                            Open tool
                          </Typography>
                          <Box className="tool-arrow" sx={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: alpha(item.accent, 0.12),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: item.accent,
                            transition: 'transform 0.25s ease',
                          }}>
                            <ArrowOutwardRoundedIcon sx={{ fontSize: 16 }} />
                          </Box>
                        </Box>
                      </Card>
                    </motion.div>
                  )
                })}
              </Box>

              {filteredFeatureItems.length === 0 && (
                <Card sx={{ borderRadius: 3, border: SOFT_BORDER, p: 4, textAlign: 'center', bgcolor: alpha('#FFFFFF', 0.7) }}>
                  <Typography sx={{ color: '#0F172A', fontWeight: 700, mb: 0.5 }}>No tools found</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Try a different search term.</Typography>
                </Card>
              )}
            </Box>

            {/* INSIGHTS — Frosted glass charts */}
            <Box>
              <Typography sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', mb: 0.5 }}>
                Insights
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 2.5 }}>Your health metrics over time</Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: { xs: 2, md: 2.5 }, mb: { xs: 2, md: 2.5 } }}>
                <motion.div variants={cardVariants}>
                  <Card sx={{ borderRadius: 3, border: SOFT_BORDER, bgcolor: alpha('#FFFFFF', 0.85), backdropFilter: 'blur(8px)', boxShadow: PREMIUM_SHADOW, height: '100%' }}>
                    <CardContent sx={{ p: { xs: 2.5, md: 3.25 } }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
                        <Box>
                          <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>Tool Usage</Typography>
                          <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>Last 7 days</Typography>
                        </Box>
                        <Chip size="small" label="7D" sx={{ bgcolor: alpha('#0EA5E9', 0.10), color: '#1D4ED8', fontWeight: 700, height: 24 }} />
                      </Stack>
                      <Box sx={{ height: { xs: 280, md: 320 } }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={metrics.medicationUsageData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="22%">
                            <CartesianGrid strokeDasharray="3 6" stroke={alpha('#0F172A', 0.06)} vertical={false} />
                            <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: alpha('#0EA5E9', 0.06) }} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                            <Bar dataKey="interactions" fill="#0EA5E9" name="Interactions" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="uploads" fill="#10B981" name="Uploads" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={cardVariants}>
                  <Card sx={{ borderRadius: 3, border: SOFT_BORDER, bgcolor: alpha('#FFFFFF', 0.85), backdropFilter: 'blur(8px)', boxShadow: PREMIUM_SHADOW, height: '100%' }}>
                    <CardContent sx={{ p: { xs: 2.5, md: 3.25 } }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
                        <Box>
                          <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>Monthly Activity</Typography>
                          <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>Last 6 months</Typography>
                        </Box>
                        <Chip size="small" label="6M" sx={{ bgcolor: alpha('#10B981', 0.10), color: '#059669', fontWeight: 700, height: 24 }} />
                      </Stack>
                      <Box sx={{ height: { xs: 280, md: 320 } }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={metrics.healthMetricsData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 6" stroke={alpha('#0F172A', 0.06)} vertical={false} />
                            <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<ChartTooltip />} cursor={{ stroke: alpha('#0EA5E9', 0.18), strokeWidth: 24 }} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                            <Line type="monotone" dataKey="interactions" stroke="#0EA5E9" strokeWidth={2.5} name="Interactions" dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                            <Line type="monotone" dataKey="aiAssistant" stroke="#F43F5E" strokeWidth={2.5} name="AI Assistant" dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                            <Line type="monotone" dataKey="uploads" stroke="#10B981" strokeWidth={2.5} name="Uploads" dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: { xs: 2, md: 2.5 } }}>
                <motion.div variants={cardVariants}>
                  <Card sx={{ borderRadius: 3, border: SOFT_BORDER, bgcolor: alpha('#FFFFFF', 0.85), backdropFilter: 'blur(8px)', boxShadow: PREMIUM_SHADOW }}>
                    <CardContent sx={{ p: { xs: 2.5, md: 3.25 } }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
                        <Box>
                          <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>Weekly Progress</Typography>
                          <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>Baseline vs current</Typography>
                        </Box>
                      </Stack>
                      <Box sx={{ height: { xs: 240, md: 280 } }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={metrics.treatmentProgressData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 6" stroke={alpha('#0F172A', 0.06)} vertical={false} />
                            <XAxis dataKey="period" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<ChartTooltip />} cursor={{ stroke: alpha('#0EA5E9', 0.18), strokeWidth: 24 }} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                            <Line type="monotone" dataKey="baseline" stroke="#0EA5E9" strokeWidth={2.5} name="Baseline" dot={{ r: 3, strokeWidth: 0 }} />
                            <Line type="monotone" dataKey="current" stroke="#10B981" strokeWidth={2.5} name="Current" dot={{ r: 3, strokeWidth: 0 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={cardVariants}>
                  <Card sx={{ borderRadius: 3, border: SOFT_BORDER, bgcolor: alpha('#FFFFFF', 0.85), backdropFilter: 'blur(8px)', boxShadow: PREMIUM_SHADOW }}>
                    <CardContent sx={{ p: { xs: 2.5, md: 3.25 } }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
                        <Box>
                          <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>Activity Goals</Typography>
                          <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>Achieved vs target</Typography>
                        </Box>
                      </Stack>
                      <Box sx={{ height: { xs: 240, md: 280 } }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={metrics.healthGoalsData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="28%">
                            <CartesianGrid strokeDasharray="3 6" stroke={alpha('#0F172A', 0.06)} vertical={false} />
                            <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} interval={0} />
                            <YAxis tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: alpha('#0EA5E9', 0.06) }} />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                            <Bar dataKey="achieved" fill="#10B981" name="Achieved" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="target" fill="#0EA5E9" name="Target" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>
            </Box>

            {/* ACTIVITY TIMELINE + CONSISTENCY */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: { xs: 2, md: 2.5 } }}>
              <motion.div variants={cardVariants}>
                <Card sx={{ borderRadius: 3, border: SOFT_BORDER, bgcolor: alpha('#FFFFFF', 0.85), backdropFilter: 'blur(8px)', boxShadow: PREMIUM_SHADOW, height: '100%' }}>
                  <CardContent sx={{ p: { xs: 2.5, md: 3.25 } }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
                      <Box>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>Recent activity</Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                          {metrics.recentActivities.length === 0 ? 'No activity yet' : `${metrics.recentActivities.length} latest updates`}
                        </Typography>
                      </Box>
                    </Stack>
                    {metrics.recentActivities.length === 0 ? (
                      <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Start using tools to see live activity here.</Typography>
                      </Box>
                    ) : (
                      <Box sx={{ position: 'relative' }}>
                        {/* Timeline rail */}
                        <Box sx={{ position: 'absolute', left: 11, top: 6, bottom: 6, width: 2, background: `linear-gradient(180deg, ${alpha('#0EA5E9', 0.45)} 0%, ${alpha('#10B981', 0.15)} 100%)`, borderRadius: 1 }} />
                        <Stack spacing={2}>
                          {metrics.recentActivities.map((item: ActivityItem, idx: number) => (
                            <Stack key={item._id || idx} direction="row" spacing={1.75} alignItems="flex-start">
                              <Box sx={{
                                width: 24, height: 24, mt: 0.25, flexShrink: 0,
                                borderRadius: '50%',
                                background: BRAND_GRADIENT,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 2px 6px rgba(14,165,233,0.30)',
                                position: 'relative', zIndex: 1,
                              }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#FFFFFF' }} />
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
                                <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.35 }}>
                                  {item.title || 'Activity'}
                                </Typography>
                                {item.details && (
                                  <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 0.25, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                    {item.details}
                                  </Typography>
                                )}
                                {item.createdAt && (
                                  <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontWeight: 600, mt: 0.5, letterSpacing: '0.02em' }}>
                                    {new Date(item.createdAt).toLocaleString()}
                                  </Typography>
                                )}
                              </Box>
                            </Stack>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={cardVariants}>
                <Card sx={{ borderRadius: 3, border: SOFT_BORDER, bgcolor: alpha('#FFFFFF', 0.85), backdropFilter: 'blur(8px)', boxShadow: PREMIUM_SHADOW, height: '100%' }}>
                  <CardContent sx={{ p: { xs: 2.5, md: 3.25 } }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
                      <Box>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>Activity Consistency</Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>Last 7 days</Typography>
                      </Box>
                      <Chip size="small" label={`${metrics.adherenceRate}%`} sx={{ bgcolor: alpha('#10B981', 0.12), color: '#059669', fontWeight: 800, height: 26, fontSize: '0.85rem' }} />
                    </Stack>
                    <Box sx={{ height: { xs: 220, md: 270 }, mb: 2 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={metrics.adherenceData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorAdh" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.5} />
                              <stop offset="50%" stopColor="#10B981" stopOpacity={0.25} />
                              <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 6" stroke={alpha('#0F172A', 0.06)} vertical={false} />
                          <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                          <Tooltip content={<ChartTooltip />} cursor={{ stroke: alpha('#0EA5E9', 0.18), strokeWidth: 24 }} />
                          <Area type="monotone" dataKey="value" stroke="#0EA5E9" fill="url(#colorAdh)" strokeWidth={3} dot={{ fill: '#0EA5E9', r: 4, strokeWidth: 2, stroke: '#FFFFFF' }} activeDot={{ r: 6, strokeWidth: 2, stroke: '#FFFFFF' }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                    <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', fontWeight: 500 }}>
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
      </Container>
    </Box>
  )
}
