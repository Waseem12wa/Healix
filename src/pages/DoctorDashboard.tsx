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
  Snackbar,
  Stack,
  TextField,
  Typography,
  Autocomplete,
} from '@mui/material'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import NotificationsIcon from '@mui/icons-material/Notifications'
import PersonIcon from '@mui/icons-material/Person'
import LogoutIcon from '@mui/icons-material/Logout'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import ScienceIcon from '@mui/icons-material/Science'
import FastfoodIcon from '@mui/icons-material/Fastfood'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import SummarizeIcon from '@mui/icons-material/Summarize'
import EventIcon from '@mui/icons-material/Event'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import SearchIcon from '@mui/icons-material/Search'
import HistoryIcon from '@mui/icons-material/History'
import AlarmIcon from '@mui/icons-material/Alarm'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import RecommendIcon from '@mui/icons-material/Recommend'
import GroupIcon from '@mui/icons-material/Group'
import TrackChangesIcon from '@mui/icons-material/TrackChanges'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { clearAuthData } from '../utils/auth'
import { getMyProfile, logPatientActivity } from '../services/patientService'
import { getDoctorDashboardLive, type DoctorDashboardLiveData } from '../services/doctorService'
import { getMyReviewRequests, type DoctorReviewRequest } from '../services/reviewService'
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
  isSetReminder?: boolean
  href?: string
  reviewFeature?: 'ddi' | 'dfi' | 'alternatives' | 'side-effects' | 'ai-assistant' | 'medication-pharmacy' | 'health-summary'
}

export default function DoctorDashboard() {
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
    {
      label: 'Set Reminder',
      description: 'Create medication recommendations and schedules for your patients.',
      icon: <AlarmIcon sx={{ color: '#FFD166' }} />,
      isSetReminder: true,
    },
    {
      label: 'Assigned Patient',
      description: 'Open the list of patients who selected you in their profile.',
      icon: <GroupIcon sx={{ color: '#06D6A0' }} />,
      href: '/doctor-assigned-patients',
    },
    {
      label: 'Drug Interaction Checker',
      description: 'Check interactions between medications in seconds.',
      icon: <ScienceIcon sx={{ color: '#00B4D8' }} />,
      reviewFeature: 'ddi',
      href: '/doctor-reviews/ddi',
    },
    {
      label: 'Drug-Food Interaction',
      description: 'See how foods may affect your prescriptions.',
      icon: <FastfoodIcon sx={{ color: '#06D6A0' }} />,
      reviewFeature: 'dfi',
      href: '/doctor-reviews/dfi',
    },
    {
      label: 'Drug Alternatives',
      description: 'Explore safer or more affordable alternatives.',
      icon: <SwapHorizIcon sx={{ color: '#0096C7' }} />,
      reviewFeature: 'alternatives',
      href: '/doctor-reviews/alternatives',
    },
    {
      label: 'Side Effect Predictor',
      description: 'Predict potential side effects from medications.',
      icon: <TrendingUpIcon sx={{ color: '#EF476F' }} />,
      reviewFeature: 'side-effects',
      href: '/doctor-reviews/side-effects',
    },
    {
      label: 'Medicine Shop',
      description: 'Purchase medicines directly from our store.',
      icon: <ShoppingCartIcon sx={{ color: '#FFB703' }} />,
      reviewFeature: 'medication-pharmacy',
      href: '/doctor-reviews/medication-pharmacy',
    },
    {
      label: 'AI Health Assistant',
      description: 'Chat with an AI to understand your health data.',
      icon: <SmartToyIcon sx={{ color: '#90E0EF' }} />,
      reviewFeature: 'ai-assistant',
      href: '/doctor-reviews/ai-assistant',
    },
    {
      label: 'Record Summarization',
      description: 'Turn complex reports into clear summaries.',
      icon: <SummarizeIcon sx={{ color: '#00B4D8' }} />,
      reviewFeature: 'health-summary',
      href: '/doctor-reviews/health-summary',
    },
    {
      label: 'My Appointment',
      description: 'Manage and review upcoming visits.',
      icon: <EventIcon sx={{ color: '#06D6A0' }} />,
      href: '/doctor-appointments',
    },
  ]

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

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', display: 'flex', bgcolor: '#F5F7FA', overflowX: 'hidden' }}>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
        <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid', borderColor: 'divider', p: { xs: 2.5, md: 3.5 }, px: { xs: 3, md: 4 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Stack direction="row" alignItems="center" spacing={2.5}>
              <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: '#06D6A0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LocalHospitalIcon sx={{ color: '#ffffff' }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: { xs: '1.75rem', md: '2.35rem' }, fontWeight: 900, color: '#1A1A2E' }}>
                  Doctor Dashboard
                </Typography>
                <Typography sx={{ fontSize: '0.9rem', color: '#64748B' }}>
                  Live monitoring of doctor actions and patient module activity
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: '#94A3B8', mt: 0.25 }}>
                  {loadingDashboard ? 'Syncing live data...' : `Live sync: ${lastSyncedAt ? lastSyncedAt.toLocaleTimeString() : 'not synced'}`}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', minWidth: { sm: 220, md: 280 }, bgcolor: '#F5F5F7', borderRadius: 2, border: '1px solid', borderColor: '#E2E8F0', '&:hover': { borderColor: '#00B4D8', bgcolor: '#FFFFFF' } }}>
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

              <Badge badgeContent={unreadCount + dashboardData.appointments.pending} color="error">
                <IconButton component={Link} to="/tools/notifications" onClick={() => recordActivity('Opened notifications', 'Viewed doctor notifications', { source: 'doctor-header' })}>
                  <NotificationsIcon />
                </IconButton>
              </Badge>

              <IconButton
                onClick={handleManualRefresh}
                disabled={manualRefreshLoading}
                title="Refresh dashboard metrics"
                sx={{ color: '#06D6A0', '&:hover': { bgcolor: '#E8F5F0' } }}
              >
                <RefreshIcon sx={{ animation: manualRefreshLoading ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }} />
              </IconButton>

              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                onClick={handleOpenProfileMenu}
                sx={{ cursor: 'pointer', px: 1.25, py: 0.75, borderRadius: 2, border: '1px solid', borderColor: 'transparent', '&:hover': { borderColor: '#E2E8F0', bgcolor: '#F8FAFC' } }}
                role="button"
                aria-label="Open doctor profile menu"
              >
                <Avatar src={profileImage || undefined} sx={{ bgcolor: '#06D6A0', width: 40, height: 40 }}>
                  {doctorName.charAt(0)}
                </Avatar>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#1A1A2E' }}>{doctorName}</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>Doctor</Typography>
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
                <MenuItem onClick={() => handleProfileMenuNavigate('/tools/notifications', 'Opened notifications')}>
                  <ListItemIcon sx={{ color: '#64748B' }}>
                    <NotificationsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Notifications" primaryTypographyProps={{ fontSize: '0.92rem', fontWeight: 600 }} />
                </MenuItem>
                <MenuItem onClick={() => handleProfileMenuNavigate('/doctor-profile', 'Opened doctor profile')}>
                  <ListItemIcon sx={{ color: '#64748B' }}>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Profile" primaryTypographyProps={{ fontSize: '0.92rem', fontWeight: 600 }} />
                </MenuItem>
                <MenuItem onClick={handleOpenHistory}>
                  <ListItemIcon sx={{ color: '#64748B' }}>
                    <HistoryIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="History" primaryTypographyProps={{ fontSize: '0.92rem', fontWeight: 600 }} />
                </MenuItem>
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
            <Stack spacing={3.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
                <Typography sx={{ color: '#64748B', fontSize: '0.9rem' }}>
                  Assigned Patients: {dashboardData.monitoring.assignedPatients} | Tracked patient activities: {dashboardData.monitoring.trackedPatientActivities}
                </Typography>
                <Button variant="outlined" size="small" onClick={loadLiveDashboard} sx={{ borderRadius: 2, textTransform: 'none' }}>
                  Refresh live data
                </Button>
              </Stack>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }, gap: { xs: 2, md: 3 } }}>
                {filteredFeatureItems.map((item) => (
                  <motion.div key={item.label} variants={cardVariants} whileHover="hover">
                    {(() => {
                      const pendingCount = item.reviewFeature
                        ? (pendingByFeature[item.reviewFeature] || 0)
                        : item.label === 'My Appointment'
                          ? dashboardData.appointments.pending
                          : 0
                      const hasPending = pendingCount > 0
                      const pendingLabel = item.label === 'My Appointment'
                        ? `${pendingCount} new appointment${pendingCount > 1 ? 's' : ''}`
                        : `${pendingCount} new patient request${pendingCount > 1 ? 's' : ''}`

                      return (
                    <Card
                      onClick={() => {
                        if (item.isSetReminder) {
                          setReminderModalOpen(true)
                          recordActivity('Opened reminder modal', 'Started preparing patient medication recommendations', { source: 'doctor-dashboard' })
                          return
                        }

                        if (item.href) {
                          recordActivity('Opened assigned patients', `Navigated to ${item.href}`, { source: 'doctor-dashboard', path: item.href })
                          navigate(item.href)
                        }
                      }}
                      sx={{
                        height: 200,
                        borderRadius: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        overflow: 'hidden',
                        bgcolor: hasPending ? 'rgba(254, 243, 199, 0.75)' : '#FFFFFF',
                        border: '1px solid',
                        borderColor: hasPending ? '#F59E0B' : '#E2E8F0',
                        boxShadow: hasPending ? '0 6px 18px rgba(245, 158, 11, 0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: item.isSetReminder || item.href ? 'pointer' : 'default',
                        '&:hover': {
                          transform: 'translateY(-6px)',
                          borderColor: hasPending ? '#D97706' : '#00B4D8',
                          boxShadow: hasPending ? '0 12px 32px rgba(245, 158, 11, 0.28)' : '0 12px 32px rgba(0, 180, 216, 0.2)',
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

                        {hasPending && (
                          <Chip
                            label={pendingLabel}
                            size="small"
                            sx={{ mt: 1.5, fontWeight: 700, bgcolor: '#FEF3C7', color: '#92400E' }}
                          />
                        )}
                      </CardContent>
                      <Box sx={{ px: { xs: 3, md: 3.5 }, pb: 3, display: 'flex', justifyContent: 'flex-start' }}>
                        <Chip
                          label={item.label === 'My Appointment' ? 'Open appointments' : item.reviewFeature ? 'Open requests' : 'Open tool'}
                          size="small"
                          sx={{ fontWeight: 600, bgcolor: 'rgba(0, 180, 216, 0.1)', color: '#00B4D8', height: 28, fontSize: '0.8125rem' }}
                        />
                      </Box>
                    </Card>
                      )
                    })()}
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
                {summaryCards.map((card) => (
                  <motion.div key={card.title} variants={cardVariants}>
                    <Card sx={{ borderRadius: 2, boxShadow: 2, bgcolor: '#ffffff' }}>
                      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                          <Box sx={{ width: 40, height: 40, borderRadius: 1.5, bgcolor: '#F3F4F6', color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {card.icon}
                          </Box>
                          <Typography sx={{ fontWeight: 700, color: '#1F2937' }}>{card.title}</Typography>
                        </Stack>
                        <Typography sx={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1, color: '#111827', mb: 0.5 }}>{card.value}</Typography>
                        <Typography sx={{ fontSize: '0.84rem', color: '#64748B' }}>{card.hint}</Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 1fr' }, gap: { xs: 2, md: 3 } }}>
                <motion.div variants={cardVariants}>
                  <Card sx={{ boxShadow: 2, borderRadius: 2, bgcolor: '#ffffff' }}>
                    <CardContent sx={{ p: { xs: 2.5, md: 3.25 } }}>
                      <Typography sx={{ fontSize: { xs: '1.3rem', md: '1.6rem' }, fontWeight: 800, color: '#1A1A2E', mb: 2.5 }}>
                        Patient Module Monitoring (Live)
                      </Typography>
                      <Box sx={{ height: { xs: 260, md: 320 } }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={moduleChartData} margin={{ top: 15, right: 20, left: 0, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="module" tick={{ fill: '#6B7280', fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" name="Observed Requests" fill="#06B6D4" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={cardVariants}>
                  <Card sx={{ boxShadow: 2, borderRadius: 2, bgcolor: '#ffffff' }}>
                    <CardContent sx={{ p: { xs: 2.5, md: 3.25 } }}>
                      <Typography sx={{ fontSize: { xs: '1.3rem', md: '1.6rem' }, fontWeight: 800, color: '#1A1A2E', mb: 2.5 }}>
                        Doctor Actions Trend (7 Days)
                      </Typography>
                      <Box sx={{ height: { xs: 260, md: 320 } }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={dashboardData.trend7d} margin={{ top: 15, right: 20, left: 0, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                            <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="doctorActions" stroke="#06B6D4" strokeWidth={3} name="Doctor Actions" />
                            <Line type="monotone" dataKey="patientRequests" stroke="#10B981" strokeWidth={3} name="Patient Requests" />
                            <Line type="monotone" dataKey="approvals" stroke="#2563EB" strokeWidth={2} name="Approvals" />
                            <Line type="monotone" dataKey="rejections" stroke="#EF4444" strokeWidth={2} name="Rejections" />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: { xs: 2, md: 3 } }}>
                <motion.div variants={cardVariants}>
                  <Card sx={{ boxShadow: 2, borderRadius: 2, bgcolor: '#ffffff' }}>
                    <CardContent sx={{ p: { xs: 2.5, md: 3.25 } }}>
                      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2.25 }}>
                        <GroupIcon sx={{ color: '#06D6A0' }} />
                        <Typography sx={{ fontSize: { xs: '1.2rem', md: '1.45rem' }, fontWeight: 800, color: '#1A1A2E' }}>
                          Recent Patient Signals
                        </Typography>
                      </Stack>

                      {dashboardData.recentPatientSignals.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">No patient activity signals yet.</Typography>
                      ) : (
                        <Stack spacing={1.25}>
                          {dashboardData.recentPatientSignals.map((item, index) => (
                            <Box key={item.id || index}>
                              <Stack direction="row" justifyContent="space-between" alignItems="start" gap={1.5}>
                                <Box>
                                  <Typography sx={{ fontWeight: 700, color: '#1A1A2E' }}>{item.title || 'Patient activity'}</Typography>
                                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                                  </Typography>
                                </Box>
                              </Stack>
                              {item.details && <Typography variant="body2" sx={{ mt: 0.6, color: 'text.secondary' }}>{item.details}</Typography>}
                              {index < dashboardData.recentPatientSignals.length - 1 && <Divider sx={{ mt: 1.1 }} />}
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>
            </Stack>
          </motion.div>
        </Box>
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
    </Box>
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
        <DialogTitle sx={{ bgcolor: '#06D6A0', color: 'white', fontWeight: 700 }}>
          Set Medicine Reminders
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Stack spacing={4}>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: '#06D6A0', fontWeight: 700 }}>
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
              <Typography variant="h6" gutterBottom sx={{ color: '#06D6A0', fontWeight: 700 }}>
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
              <Typography variant="h6" gutterBottom sx={{ color: '#06D6A0', fontWeight: 700 }}>
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
              <Typography variant="h6" gutterBottom sx={{ color: '#06D6A0', fontWeight: 700 }}>
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
