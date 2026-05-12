import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Tooltip as MuiTooltip,
  Typography,
  Autocomplete,
  alpha,
  useTheme,
} from '@mui/material'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import NotificationsIcon from '@mui/icons-material/NotificationsRounded'
import PersonIcon from '@mui/icons-material/PersonRounded'
import LogoutIcon from '@mui/icons-material/LogoutRounded'
import LocalHospitalIcon from '@mui/icons-material/LocalHospitalRounded'
import ScienceIcon from '@mui/icons-material/ScienceRounded'
import FastfoodIcon from '@mui/icons-material/FastfoodRounded'
import SwapHorizIcon from '@mui/icons-material/SwapHorizRounded'
import TrendingUpIcon from '@mui/icons-material/TrendingUpRounded'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCartRounded'
import SmartToyIcon from '@mui/icons-material/SmartToyRounded'
import SummarizeIcon from '@mui/icons-material/SummarizeRounded'
import EventIcon from '@mui/icons-material/EventRounded'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDownRounded'
import SearchIcon from '@mui/icons-material/SearchRounded'
import HistoryIcon from '@mui/icons-material/HistoryRounded'
import AlarmIcon from '@mui/icons-material/AlarmRounded'
import CheckCircleIcon from '@mui/icons-material/CheckCircleRounded'
import CancelIcon from '@mui/icons-material/CancelRounded'
import RecommendIcon from '@mui/icons-material/RecommendRounded'
import GroupIcon from '@mui/icons-material/GroupRounded'
import TrackChangesIcon from '@mui/icons-material/TrackChangesRounded'
import RefreshIcon from '@mui/icons-material/RefreshRounded'
import SettingsIcon from '@mui/icons-material/SettingsRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import FiberManualRecordRoundedIcon from '@mui/icons-material/FiberManualRecordRounded'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded'
import { BRAND_GRADIENT, HERO_BG, GLASS_SURFACE, SOFT_BORDER, PREMIUM_SHADOW } from '../ui/premium'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { clearAuthData } from '../utils/auth'
import { getMyProfile, logPatientActivity } from '../services/patientService'
import { getDoctorDashboardLive, type DoctorDashboardLiveData } from '../services/doctorService'
import { getMyReviewRequests, type DoctorReviewRequest } from '../services/reviewService'
import BackButton from '../ui/BackButton'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { LocalizationProvider, TimePicker, DatePicker } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

const EMPTY_DASHBOARD: DoctorDashboardLiveData = {
  generatedAt: new Date().toISOString(),
  doctor: {
    email: '',
    name: 'Doctor',
    specialization: '',
  },
  appointments: {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  },
  monitoring: {
    assignedPatients: 0,
    trackedPatientActivities: 0,
    moduleUsage: {
      ddi: 0,
      dfi: 0,
      sideEffects: 0,
      medicationShop: 0,
      healthSummary: 0,
      aiAssistant: 0,
      appointments: 0,
      reminders: 0,
      profileUpdates: 0,
      total: 0,
    },
  },
  outcomes: {
    approvals: 0,
    rejections: 0,
    recommendationsGiven: 0,
    actionsTaken: 0,
  },
  reminders: {
    created: 0,
    upcomingNext7Days: 0,
  },
  trend7d: [
    { key: '0', day: 'Mon', doctorActions: 0, patientRequests: 0, approvals: 0, rejections: 0 },
    { key: '1', day: 'Tue', doctorActions: 0, patientRequests: 0, approvals: 0, rejections: 0 },
    { key: '2', day: 'Wed', doctorActions: 0, patientRequests: 0, approvals: 0, rejections: 0 },
    { key: '3', day: 'Thu', doctorActions: 0, patientRequests: 0, approvals: 0, rejections: 0 },
    { key: '4', day: 'Fri', doctorActions: 0, patientRequests: 0, approvals: 0, rejections: 0 },
    { key: '5', day: 'Sat', doctorActions: 0, patientRequests: 0, approvals: 0, rejections: 0 },
    { key: '6', day: 'Sun', doctorActions: 0, patientRequests: 0, approvals: 0, rejections: 0 },
  ],
  recentDoctorActions: [],
  recentPatientSignals: [],
}

type FeatureItem = {
  label: string
  description: string
  icon: React.ReactElement
  Icon: React.ComponentType<any>
  accent: string
  isSetReminder?: boolean
  href?: string
  reviewFeature?: 'ddi' | 'dfi' | 'alternatives' | 'side-effects' | 'ai-assistant' | 'medication-pharmacy' | 'health-summary'
}

export default function DoctorDashboard() {
  useTheme()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [doctorName, setDoctorName] = useState(() => localStorage.getItem('userName') || 'Doctor')
  const [profileImage, setProfileImage] = useState(() => localStorage.getItem('profileImage') || '')
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null)
  const [dashboardData, setDashboardData] = useState<DoctorDashboardLiveData>(EMPTY_DASHBOARD)
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)
  const [reminderModalOpen, setReminderModalOpen] = useState(false)
  const [reviewRequests, setReviewRequests] = useState<DoctorReviewRequest[]>([])
  const [manualRefreshLoading, setManualRefreshLoading] = useState(false)
  const dashboardLoggedRef = useRef(false)
  const liveRefreshInFlightRef = useRef(false)
  const lastRefreshAtRef = useRef(0)

  const { unreadCount } = useNotifications()

  const recordActivity = async (title: string, details: string, metadata: Record<string, unknown> = {}) => {
    try {
      await logPatientActivity({
        category: 'other',
        title,
        details,
        metadata,
      })
    } catch {
      // Do not block doctor workflows when logging fails.
    }
  }

  const featureItems: FeatureItem[] = [
    { label: 'Set Reminder', description: 'Create medication recommendations and schedules for your patients.', icon: <AlarmIcon />, Icon: AlarmIcon, accent: '#F59E0B', isSetReminder: true },
    { label: 'Assigned Patient', description: 'Open the list of patients who selected you in their profile.', icon: <GroupIcon />, Icon: GroupIcon, accent: '#10B981', href: '/doctor-assigned-patients' },
    { label: 'Drug Interaction Checker', description: 'Check interactions between medications in seconds.', icon: <ScienceIcon />, Icon: ScienceIcon, accent: '#0EA5E9', reviewFeature: 'ddi', href: '/doctor-reviews/ddi' },
    { label: 'Drug-Food Interaction', description: 'See how foods may affect your prescriptions.', icon: <FastfoodIcon />, Icon: FastfoodIcon, accent: '#10B981', reviewFeature: 'dfi', href: '/doctor-reviews/dfi' },
    { label: 'Drug Alternatives', description: 'Explore safer or more affordable alternatives.', icon: <SwapHorizIcon />, Icon: SwapHorizIcon, accent: '#1D4ED8', reviewFeature: 'alternatives', href: '/doctor-reviews/alternatives' },
    { label: 'Side Effect Predictor', description: 'Predict potential side effects from medications.', icon: <TrendingUpIcon />, Icon: TrendingUpIcon, accent: '#F43F5E', reviewFeature: 'side-effects', href: '/doctor-reviews/side-effects' },
    { label: 'Medicine Manager', description: 'View and manage platform medicine records for patient safety.', icon: <ShoppingCartIcon />, Icon: ShoppingCartIcon, accent: '#F59E0B', href: '/doctor-medicines' },
    { label: 'AI Health Assistant', description: 'Chat with an AI to understand your health data.', icon: <SmartToyIcon />, Icon: SmartToyIcon, accent: '#2563EB', reviewFeature: 'ai-assistant', href: '/doctor-reviews/ai-assistant' },
    { label: 'Record Summarization', description: 'Turn complex reports into clear summaries.', icon: <SummarizeIcon />, Icon: SummarizeIcon, accent: '#06B6D4', reviewFeature: 'health-summary', href: '/doctor-reviews/health-summary' },
    { label: 'My Appointment', description: 'Manage and review upcoming visits.', icon: <EventIcon />, Icon: EventIcon, accent: '#10B981', href: '/doctor-appointments' },
  ]

  const firstName = useMemo(() => doctorName.split(' ')[0] || doctorName, [doctorName])
  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const filteredFeatureItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return featureItems
    }

    return featureItems.filter((item) => {
      const haystack = `${item.label} ${item.description}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [featureItems, searchQuery])

  const loadLiveDashboard = async () => {
    try {
      const [authProfile, liveData, reviews] = await Promise.all([
        getMyProfile().catch(() => null),
        getDoctorDashboardLive().catch(() => EMPTY_DASHBOARD),
        getMyReviewRequests({ limit: 100 }).catch(() => []),
      ])

      setDashboardData(liveData || EMPTY_DASHBOARD)
      const reviewsArray = Array.isArray(reviews) ? reviews : []
      setReviewRequests(reviewsArray)
      
      // Diagnostic logging for rejected requests debugging
      const rejectedCount = reviewsArray.filter((r) => r.status === 'rejected').length
      const statusBreakdown = {
        total: reviewsArray.length,
        pending: reviewsArray.filter((r) => r.status === 'pending').length,
        approved: reviewsArray.filter((r) => r.status === 'approved').length,
        rejected: rejectedCount,
        modified: reviewsArray.filter((r) => r.status === 'modified').length,
      }
      console.log('[DoctorDashboard] Review requests status breakdown:', statusBreakdown)
      if (rejectedCount === 0 && reviewsArray.length > 0) {
        console.warn('[DoctorDashboard] No rejected requests found. All reviews:', reviewsArray.map((r) => ({ id: r.id, status: r.status, feature: r.feature })))
      }
      
      const resolvedName = liveData?.doctor?.name || localStorage.getItem('userName') || 'Doctor'
      setDoctorName(resolvedName)
      localStorage.setItem('userName', resolvedName)

      const nextImage = authProfile?.patientProfile?.profileImage || ''
      setProfileImage(nextImage)
      if (nextImage) {
        localStorage.setItem('profileImage', nextImage)
      } else {
        localStorage.removeItem('profileImage')
      }

      setLastSyncedAt(new Date())
    } catch (error) {
      console.error('[DoctorDashboard] Error loading live dashboard:', error)
    } finally {
      setLoadingDashboard(false)
    }
  }

  useEffect(() => {
    let mounted = true
    const LIVE_REFRESH_MS = 15000

    const guardedRefresh = async (force = false) => {
      if (!mounted) return
      if (liveRefreshInFlightRef.current) return

      const now = Date.now()
      if (!force && now - lastRefreshAtRef.current < LIVE_REFRESH_MS - 500) {
        return
      }

      liveRefreshInFlightRef.current = true
      try {
        await loadLiveDashboard()
        lastRefreshAtRef.current = Date.now()
      } finally {
        liveRefreshInFlightRef.current = false
      }
    }

    guardedRefresh(true)

    const intervalId = window.setInterval(() => {
      guardedRefresh(false)
    }, LIVE_REFRESH_MS)

    const onVisibility = () => {
      if (!document.hidden) {
        guardedRefresh(true)
      }
    }

    document.addEventListener('visibilitychange', onVisibility)

    if (!dashboardLoggedRef.current) {
      dashboardLoggedRef.current = true
      recordActivity('Doctor dashboard opened', 'Doctor opened live monitoring dashboard', { source: 'doctor-dashboard' })
    }

    return () => {
      mounted = false
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const handleOpenProfileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget)
  }

  const handleCloseProfileMenu = () => {
    setProfileMenuAnchor(null)
  }

  const handleProfileMenuNavigate = (path: string, title: string) => {
    handleCloseProfileMenu()
    recordActivity(title, `Navigated to ${path}`, { source: 'doctor-header-menu', path })
    navigate(path)
  }

  const handleOpenHistory = () => {
    handleCloseProfileMenu()
    recordActivity('Viewed doctor history', 'Opened doctor history page from profile menu', { source: 'doctor-header-menu' })
    navigate('/doctor-history')
  }

  const handleLogout = () => {
    clearAuthData()
    handleCloseProfileMenu()
    navigate('/login')
  }

  const handleManualRefresh = async () => {
    try {
      setManualRefreshLoading(true)
      await loadLiveDashboard()
      recordActivity('Manually refreshed dashboard', 'Doctor manually refreshed live dashboard metrics', { source: 'doctor-header-refresh' })
    } catch (error) {
      console.error('[DoctorDashboard] Manual refresh error:', error)
    } finally {
      setManualRefreshLoading(false)
    }
  }

  const reviewMetrics = useMemo(() => {
    const approved = reviewRequests.filter((item) => item.status === 'approved').length
    const rejected = reviewRequests.filter((item) => item.status === 'rejected').length
    const modified = reviewRequests.filter((item) => item.status === 'modified').length
    const pending = reviewRequests.filter((item) => item.status === 'pending').length
    const actionsTaken = approved + rejected + modified

    return {
      approved,
      rejected,
      modified,
      pending,
      actionsTaken,
      total: reviewRequests.length,
    }
  }, [reviewRequests])

  const summaryCards = [
    {
      title: 'Approved Requests',
      value: reviewMetrics.approved,
      hint: `${reviewMetrics.pending} pending feature requests`,
      icon: <CheckCircleIcon />,
      color: '#10b981',
    },
    {
      title: 'Rejected Requests',
      value: reviewMetrics.rejected,
      hint: `${reviewMetrics.total} total feature requests`,
      icon: <CancelIcon />,
      color: '#ef4444',
    },
    {
      title: 'Recommendations Given',
      value: reviewMetrics.modified,
      hint: `${dashboardData.reminders.created} reminders created`,
      icon: <RecommendIcon />,
      color: '#0ea5e9',
    },
    {
      title: 'Actions Taken',
      value: reviewMetrics.actionsTaken,
      hint: `${dashboardData.monitoring.assignedPatients} assigned patients monitored`,
      icon: <TrackChangesIcon />,
      color: '#8b5cf6',
    },
  ]

  const moduleChartData = [
    { module: 'DDI', value: dashboardData.monitoring.moduleUsage.ddi },
    { module: 'DFI', value: dashboardData.monitoring.moduleUsage.dfi },
    { module: 'Side Effects', value: dashboardData.monitoring.moduleUsage.sideEffects },
    { module: 'Shop', value: dashboardData.monitoring.moduleUsage.medicationShop },
    { module: 'AI', value: dashboardData.monitoring.moduleUsage.aiAssistant },
    { module: 'Summary', value: dashboardData.monitoring.moduleUsage.healthSummary },
    { module: 'Appointments', value: dashboardData.monitoring.moduleUsage.appointments },
    { module: 'Reminders', value: dashboardData.monitoring.moduleUsage.reminders },
  ]

  const pendingByFeature = useMemo(() => {
    const bucket: Record<string, number> = {}
    for (const item of reviewRequests) {
      if (item.status !== 'pending') continue
      const key = item.feature
      bucket[key] = (bucket[key] || 0) + 1
    }
    return bucket
  }, [reviewRequests])

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  }

  const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.96 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.35, ease: 'easeOut' },
    },
    hover: {
      scale: 1.015,
      transition: { duration: 0.18, ease: 'easeInOut' },
    },
  }

  // Premium design tokens
  const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null
    return (
      <Box sx={{
        background: alpha('#FFFFFF', 0.96), backdropFilter: 'blur(8px)',
        border: SOFT_BORDER, borderRadius: 2, px: 1.75, py: 1.25,
        boxShadow: '0 12px 32px rgba(15,23,42,0.10)', minWidth: 140,
      }}>
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', mb: 0.75 }}>{label}</Typography>
        {payload.map((p: any, i: number) => (
          <Stack key={i} direction="row" alignItems="center" spacing={1} sx={{ fontSize: '0.78rem' }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color || p.stroke || p.fill }} />
            <Typography sx={{ fontSize: '0.78rem', color: '#475569', flex: 1 }}>{p.name}</Typography>
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>{p.value}</Typography>
          </Stack>
        ))}
      </Box>
    )
  }

  return (
    <>
      <Box sx={{ width: '100%', minHeight: '100vh', position: 'relative' }}>
        {/* Ambient bg mesh */}
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
          bgcolor: GLASS_SURFACE, backdropFilter: 'saturate(180%) blur(16px)',
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
                    <LocalHospitalIcon sx={{ color: '#FFFFFF', fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography sx={{
                      fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.01em',
                      background: BRAND_GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>Healix</Typography>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      Doctor Console
                    </Typography>
                  </Box>
                </Stack>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1}>
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
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search patients, reviews, tools…" variant="standard" fullWidth
                    InputProps={{ disableUnderline: true, sx: { fontSize: '0.875rem' } }}
                  />
                  <Box sx={{ px: 0.75, py: 0.25, borderRadius: 1, fontSize: '0.7rem', fontWeight: 700, color: 'text.secondary', bgcolor: alpha('#0F172A', 0.04), border: SOFT_BORDER }}>⌘K</Box>
                </Box>

                <MuiTooltip title="Refresh dashboard" arrow>
                  <IconButton
                    onClick={handleManualRefresh}
                    disabled={manualRefreshLoading}
                    sx={{
                      width: 40, height: 40, borderRadius: 2,
                      bgcolor: alpha('#FFFFFF', 0.7), border: SOFT_BORDER, color: '#1D4ED8',
                      '&:hover': { bgcolor: '#FFFFFF', borderColor: alpha('#0EA5E9', 0.4) },
                    }}
                  >
                    <RefreshIcon sx={{ fontSize: 20, animation: manualRefreshLoading ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }} />
                  </IconButton>
                </MuiTooltip>

                <MuiTooltip title="Notifications" arrow>
                  <Badge badgeContent={unreadCount + dashboardData.appointments.pending} max={9} sx={{ '& .MuiBadge-badge': { background: 'linear-gradient(135deg, #FB7185 0%, #F43F5E 100%)', color: '#FFFFFF', fontWeight: 700, fontSize: '0.65rem', minWidth: 18, height: 18 } }}>
                    <IconButton
                      component={Link} to="/tools/notifications"
                      onClick={() => recordActivity('Opened notifications', 'Viewed doctor notifications', { source: 'doctor-header' })}
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
                  role="button" aria-label="Open doctor profile menu"
                >
                  <Box sx={{
                    position: 'relative',
                    '&::before': {
                      content: '""', position: 'absolute', inset: -2, borderRadius: '50%', padding: '2px',
                      background: BRAND_GRADIENT,
                      WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                      mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                      WebkitMaskComposite: 'xor', maskComposite: 'exclude',
                    },
                  }}>
                    <Avatar src={profileImage || undefined} sx={{ bgcolor: '#10B981', width: 32, height: 32, fontWeight: 700, fontSize: '0.85rem' }}>
                      {doctorName.charAt(0).toUpperCase()}
                    </Avatar>
                  </Box>
                  <Box sx={{ display: { xs: 'none', sm: 'block' }, lineHeight: 1 }}>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>Dr. {firstName}</Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', lineHeight: 1.2 }}>Physician</Typography>
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
                    <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: 'text.primary' }}>Dr. {doctorName}</Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>Signed in as Doctor</Typography>
                  </Box>
                  <MenuItem onClick={() => handleProfileMenuNavigate('/tools/notifications', 'Opened notifications')} sx={{ py: 1.25 }}>
                    <ListItemIcon sx={{ color: 'text.secondary' }}><NotificationsIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Notifications" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }} />
                  </MenuItem>
                  <MenuItem onClick={() => handleProfileMenuNavigate('/doctor-profile', 'Opened doctor profile')} sx={{ py: 1.25 }}>
                    <ListItemIcon sx={{ color: 'text.secondary' }}><PersonIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Profile" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }} />
                  </MenuItem>
                  <MenuItem onClick={handleOpenHistory} sx={{ py: 1.25 }}>
                    <ListItemIcon sx={{ color: 'text.secondary' }}><HistoryIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="History" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }} />
                  </MenuItem>
                  <MenuItem onClick={() => handleProfileMenuNavigate('/settings', 'Opened settings')} sx={{ py: 1.25 }}>
                    <ListItemIcon sx={{ color: 'text.secondary' }}><SettingsIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Settings" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }} />
                  </MenuItem>
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

              {/* HERO GREETING */}
              <motion.div variants={cardVariants}>
                <Card sx={{
                  position: 'relative', overflow: 'hidden',
                  borderRadius: 4, border: SOFT_BORDER,
                  background: HERO_BG, boxShadow: PREMIUM_SHADOW,
                }}>
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
                          label="CLINICAL CONSOLE"
                          sx={{
                            bgcolor: alpha('#FFFFFF', 0.65), backdropFilter: 'blur(8px)',
                            border: SOFT_BORDER, color: '#1D4ED8', fontWeight: 800, letterSpacing: '0.06em',
                            fontSize: '0.65rem', height: 24, mb: 2,
                            '& .MuiChip-icon': { color: '#06B6D4' },
                          }}
                        />
                        <Typography sx={{
                          fontSize: { xs: '1.75rem', sm: '2.15rem', md: '2.6rem' },
                          fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', color: '#0F172A',
                        }}>
                          {greeting},{' '}
                          <Box component="span" sx={{
                            background: BRAND_GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                          }}>Dr. {firstName}</Box>
                        </Typography>
                        <Typography sx={{ fontSize: { xs: '0.95rem', md: '1.05rem' }, color: 'text.secondary', mt: 1.25, maxWidth: 640, lineHeight: 1.6 }}>
                          You&apos;re monitoring <strong>{dashboardData.monitoring.assignedPatients}</strong> assigned patients with <strong>{reviewMetrics.pending}</strong> pending review request{reviewMetrics.pending === 1 ? '' : 's'}.
                        </Typography>

                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 3, flexWrap: 'wrap', gap: 1 }}>
                          <Chip
                            size="small"
                            icon={<FiberManualRecordRoundedIcon sx={{ fontSize: '0.6rem !important', color: loadingDashboard ? '#F59E0B' : '#10B981' }} />}
                            label={loadingDashboard ? 'Syncing live data…' : `Live · ${lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : 'pending'}`}
                            sx={{ bgcolor: alpha('#FFFFFF', 0.75), backdropFilter: 'blur(6px)', border: SOFT_BORDER, fontWeight: 600, fontSize: '0.75rem', height: 28 }}
                          />
                          <Chip
                            size="small"
                            label={`${dashboardData.monitoring.trackedPatientActivities} tracked activities`}
                            sx={{ bgcolor: alpha('#FFFFFF', 0.75), backdropFilter: 'blur(6px)', border: SOFT_BORDER, fontWeight: 600, fontSize: '0.75rem', height: 28 }}
                          />
                          <Button
                            onClick={() => setReminderModalOpen(true)}
                            startIcon={<AlarmIcon sx={{ fontSize: 16 }} />}
                            size="small"
                            sx={{
                              textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', color: '#FFFFFF',
                              background: BRAND_GRADIENT, backgroundSize: '200% 200%', backgroundPosition: '0% 50%',
                              borderRadius: 999, px: 2,
                              boxShadow: '0 6px 16px rgba(14,165,233,0.28)',
                              transition: 'all 0.3s ease',
                              '&:hover': { backgroundPosition: '100% 50%', boxShadow: '0 10px 22px rgba(14,165,233,0.38)' },
                            }}
                          >
                            New reminder
                          </Button>
                        </Stack>
                      </Box>

                      <Box sx={{
                        flexShrink: 0, minWidth: { md: 280 },
                        bgcolor: alpha('#FFFFFF', 0.7), backdropFilter: 'blur(12px)',
                        border: SOFT_BORDER, borderRadius: 3, p: 2.5,
                      }}>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1 }}>
                          Pending Reviews
                        </Typography>
                        <Typography sx={{ fontSize: '2.4rem', fontWeight: 800, color: '#0F172A', lineHeight: 1, letterSpacing: '-0.02em' }}>
                          {reviewMetrics.pending}
                        </Typography>
                        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mb: 1.5 }}>Awaiting your action</Typography>
                        <Box sx={{ height: 56 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dashboardData.trend7d} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                              <Line type="monotone" dataKey="patientRequests" stroke="#0EA5E9" strokeWidth={2.5} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </Box>
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                          <ArrowUpwardRoundedIcon sx={{ fontSize: 14, color: '#10B981' }} />
                          <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#10B981' }}>
                            {reviewMetrics.actionsTaken} actions taken
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>

              {/* AT A GLANCE — Premium summary cards */}
              <Box>
                <Stack direction="row" alignItems="flex-end" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                      Review pipeline
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Live request status across all features</Typography>
                  </Box>
                </Stack>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: { xs: 2, md: 2.5 } }}>
                  {loadingDashboard
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} sx={{ borderRadius: 3, border: SOFT_BORDER, p: 2.5 }}>
                          <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: 2 }} />
                          <Skeleton variant="text" width="40%" sx={{ fontSize: '2rem', mt: 1 }} />
                          <Skeleton variant="text" width="70%" />
                        </Card>
                      ))
                    : summaryCards.map((card) => (
                    <motion.div key={card.title} variants={cardVariants} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                      <Card sx={{
                        position: 'relative', overflow: 'hidden', height: '100%',
                        borderRadius: 3, border: SOFT_BORDER,
                        bgcolor: alpha('#FFFFFF', 0.85), backdropFilter: 'blur(8px)',
                        boxShadow: PREMIUM_SHADOW,
                        transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
                        '&:hover': { borderColor: alpha(card.color, 0.4), boxShadow: `0 12px 32px ${alpha(card.color, 0.18)}` },
                      }}>
                        <Box sx={{
                          position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%',
                          background: `radial-gradient(circle, ${alpha(card.color, 0.18)} 0%, transparent 65%)`,
                          pointerEvents: 'none',
                        }} />
                        <CardContent sx={{ position: 'relative', p: { xs: 2.5, md: 3 } }}>
                          <Box sx={{
                            width: 44, height: 44, borderRadius: 2,
                            background: `linear-gradient(135deg, ${alpha(card.color, 0.18)} 0%, ${alpha(card.color, 0.06)} 100%)`,
                            border: `1px solid ${alpha(card.color, 0.25)}`,
                            color: card.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            mb: 1.5,
                          }}>
                            {card.icon}
                          </Box>
                          <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
                            {card.title}
                          </Typography>
                          <Typography sx={{ fontSize: { xs: '1.85rem', md: '2.25rem' }, fontWeight: 800, color: '#0F172A', lineHeight: 1, letterSpacing: '-0.02em', mb: 1 }}>
                            {card.value}
                          </Typography>
                          <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>{card.hint}</Typography>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </Box>
              </Box>

              {/* DOCTOR TOOLS */}
              <Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'flex-end' }} justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                      Clinical tools
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Manage reviews, patients, and recommendations</Typography>
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
                    const pendingCount = item.reviewFeature
                      ? (pendingByFeature[item.reviewFeature] || 0)
                      : item.label === 'My Appointment'
                        ? dashboardData.appointments.pending
                        : 0
                    const hasPending = pendingCount > 0
                    const pendingLabel = item.label === 'My Appointment'
                      ? `${pendingCount} new appointment${pendingCount > 1 ? 's' : ''}`
                      : `${pendingCount} new request${pendingCount > 1 ? 's' : ''}`
                    const ItemIcon = item.Icon

                    return (
                      <motion.div key={item.label} variants={cardVariants} whileHover={{ y: -6 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
                        <Card
                          onClick={() => {
                            if (item.isSetReminder) {
                              setReminderModalOpen(true)
                              recordActivity('Opened reminder modal', 'Started preparing patient medication recommendations', { source: 'doctor-dashboard' })
                              return
                            }
                            if (item.href) {
                              recordActivity('Opened doctor tool', `Navigated to ${item.href}`, { source: 'doctor-dashboard', path: item.href })
                              navigate(item.href)
                            }
                          }}
                          sx={{
                            position: 'relative', overflow: 'hidden',
                            display: 'flex', flexDirection: 'column',
                            height: 220, borderRadius: 3,
                            border: hasPending ? `1px solid ${alpha('#F59E0B', 0.5)}` : SOFT_BORDER,
                            bgcolor: alpha('#FFFFFF', 0.88), backdropFilter: 'blur(8px)',
                            boxShadow: hasPending ? `0 8px 24px ${alpha('#F59E0B', 0.18)}` : PREMIUM_SHADOW,
                            cursor: item.isSetReminder || item.href ? 'pointer' : 'default',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              borderColor: hasPending ? alpha('#F59E0B', 0.7) : alpha(item.accent, 0.4),
                              boxShadow: hasPending ? `0 16px 40px ${alpha('#F59E0B', 0.28)}` : `0 16px 40px ${alpha(item.accent, 0.22)}`,
                            },
                            '&:hover .tool-arrow': { transform: 'translate(2px, -2px)' },
                            '&:hover .tool-mesh': { opacity: 1 },
                          }}
                        >
                          <Box className="tool-mesh" sx={{
                            position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%',
                            background: `radial-gradient(circle, ${alpha(hasPending ? '#F59E0B' : item.accent, 0.22)} 0%, transparent 65%)`,
                            opacity: 0.6, transition: 'opacity 0.3s ease', pointerEvents: 'none',
                          }} />

                          <CardContent sx={{ position: 'relative', flex: 1, p: { xs: 2.5, md: 3 } }}>
                            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
                              <Box sx={{
                                width: 48, height: 48, borderRadius: 2,
                                background: `linear-gradient(135deg, ${alpha(item.accent, 0.18)} 0%, ${alpha(item.accent, 0.06)} 100%)`,
                                border: `1px solid ${alpha(item.accent, 0.25)}`,
                                color: item.accent,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <ItemIcon sx={{ fontSize: 24 }} />
                              </Box>
                              {hasPending && (
                                <Chip
                                  size="small" label={pendingLabel}
                                  sx={{ bgcolor: alpha('#F59E0B', 0.14), color: '#92400E', fontWeight: 700, height: 22, fontSize: '0.7rem', border: `1px solid ${alpha('#F59E0B', 0.3)}` }}
                                />
                              )}
                            </Stack>
                            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.3, mb: 0.75 }}>{item.label}</Typography>
                            <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', lineHeight: 1.55 }}>{item.description}</Typography>
                          </CardContent>

                          <Box sx={{ position: 'relative', px: { xs: 2.5, md: 3 }, pb: 2.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: hasPending ? '#92400E' : item.accent, letterSpacing: '0.02em' }}>
                              {item.label === 'My Appointment' ? 'Open appointments' : item.reviewFeature ? 'Open requests' : item.isSetReminder ? 'Create reminder' : 'Open tool'}
                            </Typography>
                            <Box className="tool-arrow" sx={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: alpha(hasPending ? '#F59E0B' : item.accent, 0.12),
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: hasPending ? '#92400E' : item.accent,
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

              {/* INSIGHTS */}
              <Box>
                <Typography sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', mb: 0.5 }}>
                  Insights
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 2.5 }}>Patient module activity and your action trends</Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 1fr' }, gap: { xs: 2, md: 2.5 } }}>
                  <motion.div variants={cardVariants}>
                    <Card sx={{ borderRadius: 3, border: SOFT_BORDER, bgcolor: alpha('#FFFFFF', 0.85), backdropFilter: 'blur(8px)', boxShadow: PREMIUM_SHADOW }}>
                      <CardContent sx={{ p: { xs: 2.5, md: 3.25 } }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
                          <Box>
                            <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>Patient Module Monitoring</Typography>
                            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>Live request volume per module</Typography>
                          </Box>
                          <Chip size="small" label="LIVE" sx={{ bgcolor: alpha('#10B981', 0.10), color: '#059669', fontWeight: 800, height: 24, letterSpacing: '0.06em' }} />
                        </Stack>
                        <Box sx={{ height: { xs: 280, md: 320 } }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={moduleChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="22%">
                              <defs>
                                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#34D399" stopOpacity={1} />
                                  <stop offset="60%" stopColor="#06B6D4" stopOpacity={1} />
                                  <stop offset="100%" stopColor="#2563EB" stopOpacity={1} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 6" stroke={alpha('#0F172A', 0.06)} vertical={false} />
                              <XAxis dataKey="module" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                              <YAxis allowDecimals={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                              <Tooltip content={<ChartTooltip />} cursor={{ fill: alpha('#0EA5E9', 0.06) }} />
                              <Bar dataKey="value" name="Observed Requests" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
                            </BarChart>
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
                            <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>Action trends</Typography>
                            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>Last 7 days</Typography>
                          </Box>
                          <Chip size="small" label="7D" sx={{ bgcolor: alpha('#0EA5E9', 0.10), color: '#1D4ED8', fontWeight: 700, height: 24 }} />
                        </Stack>
                        <Box sx={{ height: { xs: 280, md: 320 } }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dashboardData.trend7d} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 6" stroke={alpha('#0F172A', 0.06)} vertical={false} />
                              <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                              <YAxis allowDecimals={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                              <Tooltip content={<ChartTooltip />} cursor={{ stroke: alpha('#0EA5E9', 0.18), strokeWidth: 24 }} />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                              <Line type="monotone" dataKey="doctorActions" stroke="#06B6D4" strokeWidth={2.5} name="Doctor Actions" dot={{ r: 3, strokeWidth: 0 }} />
                              <Line type="monotone" dataKey="patientRequests" stroke="#10B981" strokeWidth={2.5} name="Patient Requests" dot={{ r: 3, strokeWidth: 0 }} />
                              <Line type="monotone" dataKey="approvals" stroke="#2563EB" strokeWidth={2} name="Approvals" dot={{ r: 3, strokeWidth: 0 }} />
                              <Line type="monotone" dataKey="rejections" stroke="#F43F5E" strokeWidth={2} name="Rejections" dot={{ r: 3, strokeWidth: 0 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Box>
              </Box>

              {/* RECENT PATIENT SIGNALS — timeline */}
              <motion.div variants={cardVariants}>
                <Card sx={{ borderRadius: 3, border: SOFT_BORDER, bgcolor: alpha('#FFFFFF', 0.85), backdropFilter: 'blur(8px)', boxShadow: PREMIUM_SHADOW }}>
                  <CardContent sx={{ p: { xs: 2.5, md: 3.25 } }}>
                    <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2.5 }}>
                      <Box sx={{
                        width: 36, height: 36, borderRadius: 2,
                        background: `linear-gradient(135deg, ${alpha('#10B981', 0.18)} 0%, ${alpha('#10B981', 0.06)} 100%)`,
                        border: `1px solid ${alpha('#10B981', 0.25)}`, color: '#10B981',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <GroupIcon sx={{ fontSize: 20 }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>Recent Patient Signals</Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                          {dashboardData.recentPatientSignals.length === 0 ? 'No signals yet' : `${dashboardData.recentPatientSignals.length} latest patient activities`}
                        </Typography>
                      </Box>
                    </Stack>

                    {dashboardData.recentPatientSignals.length === 0 ? (
                      <Box sx={{ py: 4, textAlign: 'center' }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>No patient activity signals yet.</Typography>
                      </Box>
                    ) : (
                      <Box sx={{ position: 'relative' }}>
                        <Box sx={{ position: 'absolute', left: 11, top: 6, bottom: 6, width: 2, background: `linear-gradient(180deg, ${alpha('#0EA5E9', 0.45)} 0%, ${alpha('#10B981', 0.15)} 100%)`, borderRadius: 1 }} />
                        <Stack spacing={2}>
                          {dashboardData.recentPatientSignals.map((item: any, idx: number) => (
                            <Stack key={item.id || idx} direction="row" spacing={1.75} alignItems="flex-start">
                              <Box sx={{
                                width: 24, height: 24, mt: 0.25, flexShrink: 0,
                                borderRadius: '50%', background: BRAND_GRADIENT,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 2px 6px rgba(14,165,233,0.30)',
                                position: 'relative', zIndex: 1,
                              }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#FFFFFF' }} />
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
                                <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.35 }}>{item.title || 'Patient activity'}</Typography>
                                {item.details && (
                                  <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 0.25, lineHeight: 1.4 }}>{item.details}</Typography>
                                )}
                                {item.createdAt && (
                                  <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontWeight: 600, mt: 0.5 }}>
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

            </Stack>
          </motion.div>
        </Container>
      </Box>

      <SetReminderModal
        open={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        onReminderCreated={(payload) => {
          recordActivity(
            'Created patient recommendation',
            `Created reminders for ${payload.patientName} (${payload.medicineName})`,
            {
              source: 'doctor-reminder-modal',
              frequency: payload.frequency,
              duration: payload.duration,
            }
          )
          loadLiveDashboard()
        }}
      />
    </>
  )
}

interface SetReminderModalProps {
  open: boolean
  onClose: () => void
  onReminderCreated?: (payload: {
    patientName: string
    medicineName: string
    frequency: number
    duration: number
  }) => void
}

interface ApprovedPatient {
  patientId: string
  patientEmail: string
  patientName: string
  appointmentId: string
}

function SetReminderModal({ open, onClose, onReminderCreated }: SetReminderModalProps) {
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<ApprovedPatient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<ApprovedPatient | null>(null)
  const [medicineOptions, setMedicineOptions] = useState<string[]>([])
  const [medicineOptionsLoading, setMedicineOptionsLoading] = useState(false)

  const [medicineName, setMedicineName] = useState('')
  const [dose, setDose] = useState('')
  const [frequency, setFrequency] = useState<1 | 2 | 3>(1)
  const [times, setTimes] = useState<Date[]>([new Date()])
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [duration, setDuration] = useState(7)

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  useEffect(() => {
    if (!open) return

    loadApprovedPatients()
    setSelectedPatient(null)
    setMedicineName('')
    setDose('')
    setFrequency(1)
    setTimes([new Date()])
    setStartDate(new Date())
    setDuration(7)
    setMedicineOptions([])
  }, [open])

  useEffect(() => {
    if (!selectedPatient) {
      setMedicineOptions([])
      return
    }
    loadPatientMedicineHistory(selectedPatient.patientId)
  }, [selectedPatient])

  useEffect(() => {
    const newTimes = Array(frequency)
      .fill(null)
      .map((_, i) => {
        if (times[i]) return times[i]
        const defaultTime = new Date()
        defaultTime.setHours(9 + i * 6, 0, 0, 0)
        return defaultTime
      })
    setTimes(newTimes)
  }, [frequency])

  const loadApprovedPatients = async () => {
    try {
      const doctorEmail = localStorage.getItem('userEmail')
      const token = localStorage.getItem('token')
      console.log('[SetReminderModal] Loading patients for doctor:', doctorEmail)
      
      const response = await fetch(`/api/reminders/approved-patients?doctorEmail=${encodeURIComponent(doctorEmail || '')}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      })
      const data = await response.json()
      
      console.log('[SetReminderModal] API Response:', data)
      
      if (data.success && Array.isArray(data.data)) {
        console.log(`[SetReminderModal] Loaded ${data.data.length} patients`)
        setPatients(data.data)
      } else {
        console.warn('[SetReminderModal] No patients found or invalid response:', data)
        setSnackbar({ 
          open: true, 
          message: data.message || 'No patients found with approved appointments', 
          severity: 'error' 
        })
      }
    } catch (error) {
      console.error('Error loading approved patients:', error)
      setSnackbar({ open: true, message: 'Failed to load patients', severity: 'error' })
    }
  }

  const loadPatientMedicineHistory = async (patientId: string) => {
    try {
      setMedicineOptionsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/reminders/patient-medicine-history/${encodeURIComponent(patientId)}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      })
      const data = await response.json()
      if (data.success && Array.isArray(data.data)) {
        setMedicineOptions(data.data)
      } else {
        setMedicineOptions([])
      }
    } catch (error) {
      console.error('Error loading patient medicine history:', error)
      setMedicineOptions([])
    } finally {
      setMedicineOptionsLoading(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const doctorEmail = localStorage.getItem('userEmail')
      const doctorName = localStorage.getItem('userName')
      const token = localStorage.getItem('token')

      const formattedTimes = times.map((t) => {
        const hours = t.getHours().toString().padStart(2, '0')
        const minutes = t.getMinutes().toString().padStart(2, '0')
        return `${hours}:${minutes}`
      })

      const formattedStartDate = startDate.toISOString().split('T')[0]

      const response = await fetch('/api/reminders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          doctorEmail,
          doctorName,
          patientId: selectedPatient?.patientId,
          patientEmail: selectedPatient?.patientEmail,
          patientName: selectedPatient?.patientName,
          medicineName,
          dose,
          frequency,
          times: formattedTimes,
          startDate: formattedStartDate,
          duration,
        }),
      })

      const data = await response.json()

      if (data.success) {
        onReminderCreated?.({
          patientName: selectedPatient?.patientName || 'Unknown patient',
          medicineName,
          frequency,
          duration,
        })
        setSnackbar({ open: true, message: `Successfully created ${data.data.count} reminders!`, severity: 'success' })
        setTimeout(() => onClose(), 1200)
      } else {
        setSnackbar({ open: true, message: data.message || 'Failed to create reminders', severity: 'error' })
      }
    } catch (error) {
      console.error('Error creating reminders:', error)
      setSnackbar({ open: true, message: 'Failed to create reminders', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const getTotalReminders = () => frequency * duration

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #34D399 0%, #06B6D4 50%, #2563EB 100%)', color: 'white', fontWeight: 700 }}>
          Set Medicine Reminders
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Stack spacing={4}>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: '#10B981', fontWeight: 700 }}>
                1. Select Patient
              </Typography>
              <Autocomplete
                options={patients}
                getOptionLabel={(option) => `${option.patientName} (${option.patientEmail})`}
                value={selectedPatient}
                onChange={(_, newValue) => setSelectedPatient(newValue)}
                renderInput={(params) => <TextField {...params} label="Select Patient" required />}
                sx={{ mt: 1 }}
              />
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: '#10B981', fontWeight: 700 }}>
                2. Medicine Details
              </Typography>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Autocomplete
                  freeSolo
                  options={medicineOptions}
                  loading={medicineOptionsLoading}
                  value={medicineName}
                  onInputChange={(_, value) => setMedicineName(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Medicine Name"
                      placeholder="Select from history or type manually"
                      required
                      fullWidth
                    />
                  )}
                />
                <TextField label="Dose" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="e.g., 1 tablet, 2 capsules" required fullWidth />
                <FormControl fullWidth>
                  <InputLabel>Frequency (times per day)</InputLabel>
                  <Select value={frequency} onChange={(e) => setFrequency(e.target.value as 1 | 2 | 3)} label="Frequency (times per day)">
                    <MenuItem value={1}>Once daily</MenuItem>
                    <MenuItem value={2}>Twice daily</MenuItem>
                    <MenuItem value={3}>Three times daily</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: '#10B981', fontWeight: 700 }}>
                3. Set Reminder Times
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  {times.map((time, index) => (
                    <TimePicker
                      key={index}
                      label={`Time ${index + 1}`}
                      value={time}
                      onChange={(newValue) => {
                        const newTimes = [...times]
                        newTimes[index] = newValue || new Date()
                        setTimes(newTimes)
                      }}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  ))}
                </Stack>
              </LocalizationProvider>
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: '#10B981', fontWeight: 700 }}>
                4. Set Duration
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue || new Date())}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                  <TextField
                    label="Duration (days)"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                    inputProps={{ min: 1, max: 90 }}
                    fullWidth
                  />
                  <Alert severity="info">
                    This will create <strong>{getTotalReminders()} reminders</strong> from {startDate.toLocaleDateString()} for {duration} days
                  </Alert>
                </Stack>
              </LocalizationProvider>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading || !selectedPatient || !medicineName || !dose}>
            {loading ? <CircularProgress size={24} /> : 'Create Reminders'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  )
}
