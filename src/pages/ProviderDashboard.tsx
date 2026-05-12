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
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import NotificationsIcon from '@mui/icons-material/NotificationsRounded'
import PersonIcon from '@mui/icons-material/PersonRounded'
import LogoutIcon from '@mui/icons-material/LogoutRounded'
import LocalHospitalIcon from '@mui/icons-material/LocalHospitalRounded'
import MedicationIcon from '@mui/icons-material/MedicationRounded'
import InventoryIcon from '@mui/icons-material/Inventory2Rounded'
import PaymentIcon from '@mui/icons-material/PaymentsRounded'
import DashboardIcon from '@mui/icons-material/DashboardRounded'
import SettingsIcon from '@mui/icons-material/SettingsRounded'
import SearchIcon from '@mui/icons-material/SearchRounded'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDownRounded'
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded'
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded'
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded'
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import AutoGraphRoundedIcon from '@mui/icons-material/AutoGraphRounded'
import { clearAuthData } from '../utils/auth'
import { useNotifications } from '../hooks/useNotifications'
import BackButton from '../ui/BackButton'
import { BRAND_GRADIENT, HERO_BG, GLASS_SURFACE as GLASS, SOFT_BORDER, PREMIUM_SHADOW } from '../ui/premium'

interface ProviderFeatureItem {
  label: string
  description: string
  Icon: React.ComponentType<any>
  accent: string
  href: string
  metric?: string
}

interface ProviderOverviewMetrics {
  totalMedicines: number
  totalOrders: number
  pendingApprovals: number
  totalEarnings: number
}

export default function ProviderDashboard() {
  const navigate = useNavigate()
  const { unreadCount } = useNotifications()
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [displayName, setDisplayName] = useState('Provider')
  const [displayImage, setDisplayImage] = useState('')
  const [overviewMetrics, setOverviewMetrics] = useState<ProviderOverviewMetrics | null>(null)

  const userName = useMemo(() => localStorage.getItem('userName') || 'Provider', [])

  useEffect(() => {
    setDisplayName(localStorage.getItem('userName') || 'Provider')
    setDisplayImage(localStorage.getItem('profileImage') || '')

    const loadHeaderProfile = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken')
        if (!token) return

        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const payload = await response.json().catch(() => null)
        const user = payload?.data || {}

        const nextName = user?.userName || localStorage.getItem('userName') || 'Provider'
        const nextImage = user?.providerProfile?.profileImage || localStorage.getItem('profileImage') || ''

        setDisplayName(nextName)
        setDisplayImage(nextImage)

        if (nextName) localStorage.setItem('userName', nextName)
        if (nextImage) localStorage.setItem('profileImage', nextImage)
      } catch {
        // Keep local fallback values if request fails.
      }
    }

    const loadOverviewMetrics = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken')
        if (!token) return

        const response = await fetch('/api/provider/overview', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const payload = await response.json().catch(() => null)
        if (payload?.success && payload?.data?.metrics) {
          setOverviewMetrics(payload.data.metrics)
        }
      } catch {
        // Keep dashboard usable even if metrics endpoint fails.
      }
    }

    loadHeaderProfile()
    loadOverviewMetrics()

    const onFocus = () => {
      loadHeaderProfile()
    }
    window.addEventListener('focus', onFocus)

    return () => {
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  const featureItems: ProviderFeatureItem[] = [
    {
      label: 'Dashboard Overview & Analytics',
      description: 'Total medicines, orders, approvals, earnings and live sales trends.',
      Icon: AutoGraphRoundedIcon,
      accent: '#0EA5E9',
      href: '/provider/overview',
    },
    {
      label: 'Medicine Management',
      description: 'Add, edit, delete, and update medicine stock with search and filters.',
      Icon: MedicationIcon,
      accent: '#10B981',
      href: '/provider/medicines',
      metric: `${Number(overviewMetrics?.totalMedicines || 0).toLocaleString()} medicines`,
    },
    {
      label: 'Order Management & Approvals',
      description: 'Review patient orders and approve, reject, or complete them in seconds.',
      Icon: InventoryIcon,
      accent: '#F59E0B',
      href: '/provider/orders',
      metric: `${Number(overviewMetrics?.pendingApprovals || 0).toLocaleString()} pending`,
    },
    {
      label: 'Payment Management & Revenue Split',
      description: 'Manage payouts and track 75/25 revenue split transactions.',
      Icon: PaymentIcon,
      accent: '#2563EB',
      href: '/provider/payments',
      metric: `PKR ${Number(overviewMetrics?.totalEarnings || 0).toLocaleString()}`,
    },
  ]

  const firstName = useMemo(() => (displayName || userName).split(' ')[0] || (displayName || userName), [displayName, userName])
  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return featureItems

    return featureItems.filter((item) =>
      item.label.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
    )
  }, [featureItems, searchQuery])

  const handleOpenProfileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget)
  }

  const handleCloseProfileMenu = () => {
    setProfileMenuAnchor(null)
  }

  const handleProfileNavigate = (path: string) => {
    handleCloseProfileMenu()
    navigate(path)
  }

  const handleNotificationClick = () => {
    navigate('/tools/notifications')
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
        staggerChildren: 0.08,
      },
    },
  }

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.24,
        ease: 'easeOut',
      },
    },
  }

  const isMetricsLoading = overviewMetrics === null

  const kpiCards = [
    { label: 'Total Medicines', value: overviewMetrics?.totalMedicines ?? 0, prefix: '', color: '#10B981', Icon: MedicationIcon, hint: 'Catalog inventory' },
    { label: 'Total Orders', value: overviewMetrics?.totalOrders ?? 0, prefix: '', color: '#0EA5E9', Icon: StorefrontRoundedIcon, hint: 'All-time orders' },
    { label: 'Pending Approvals', value: overviewMetrics?.pendingApprovals ?? 0, prefix: '', color: '#F59E0B', Icon: PendingActionsRoundedIcon, hint: 'Awaiting your action' },
    { label: 'Total Earnings', value: overviewMetrics?.totalEarnings ?? 0, prefix: 'PKR ', color: '#2563EB', Icon: TrendingUpRoundedIcon, hint: 'Net revenue' },
  ]

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
                  <LocalHospitalIcon sx={{ color: '#FFFFFF', fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography sx={{
                    fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.01em',
                    background: BRAND_GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>Healix</Typography>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Provider Console
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
                '&:focus-within': { borderColor: alpha('#0EA5E9', 0.4), bgcolor: '#FFFFFF', boxShadow: '0 4px 12px rgba(14,165,233,0.10)' },
              }}>
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                <TextField
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sections, medicines, orders…" variant="standard" fullWidth
                  InputProps={{ disableUnderline: true, sx: { fontSize: '0.875rem' } }}
                />
              </Box>

              <MuiTooltip title="Notifications" arrow>
                <Badge badgeContent={unreadCount} max={9} sx={{ '& .MuiBadge-badge': { background: 'linear-gradient(135deg, #FB7185 0%, #F43F5E 100%)', color: '#FFFFFF', fontWeight: 700, fontSize: '0.65rem', minWidth: 18, height: 18 } }}>
                  <IconButton
                    onClick={handleNotificationClick}
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
                role="button" aria-label="Open provider profile menu"
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
                  <Avatar src={displayImage || undefined} sx={{ bgcolor: '#0EA5E9', width: 32, height: 32, fontWeight: 700, fontSize: '0.85rem' }}>
                    {(displayName || userName).charAt(0).toUpperCase()}
                  </Avatar>
                </Box>
                <Box sx={{ display: { xs: 'none', sm: 'block' }, lineHeight: 1 }}>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>{firstName}</Typography>
                  <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', lineHeight: 1.2 }}>Provider</Typography>
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
                  <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: 'text.primary' }}>{displayName || userName}</Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>Healthcare Provider</Typography>
                </Box>
                <MenuItem onClick={() => handleProfileNavigate('/tools/notifications')} sx={{ py: 1.25 }}>
                  <ListItemIcon sx={{ color: 'text.secondary' }}><NotificationsIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Notifications" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }} />
                </MenuItem>
                <MenuItem onClick={() => handleProfileNavigate('/profile/provider')} sx={{ py: 1.25 }}>
                  <ListItemIcon sx={{ color: 'text.secondary' }}><PersonIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Profile" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }} />
                </MenuItem>
                <MenuItem onClick={() => handleProfileNavigate('/settings')} sx={{ py: 1.25 }}>
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
          <Stack spacing={{ xs: 3, md: 3.5 }}>

            {/* HERO GREETING */}
            <motion.div variants={cardVariants}>
              <Card sx={{
                position: 'relative', overflow: 'hidden',
                borderRadius: 4, border: SOFT_BORDER,
                background: HERO_BG, boxShadow: PREMIUM_SHADOW,
              }}>
                <Box sx={{ position: 'absolute', top: -120, right: -100, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.22) 0%, transparent 60%)', filter: 'blur(20px)', pointerEvents: 'none' }} />
                <Box sx={{ position: 'absolute', bottom: -100, left: '40%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 60%)', filter: 'blur(20px)', pointerEvents: 'none' }} />

                <CardContent sx={{ position: 'relative', p: { xs: 3, md: 4.5 } }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" gap={3}>
                    <Box sx={{ flex: 1 }}>
                      <Chip
                        size="small"
                        icon={<AutoGraphRoundedIcon sx={{ fontSize: 14 }} />}
                        label="EXECUTIVE CONSOLE"
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
                        }}>{firstName}</Box>
                      </Typography>
                      <Typography sx={{ fontSize: { xs: '0.95rem', md: '1.05rem' }, color: 'text.secondary', mt: 1.25, maxWidth: 640, lineHeight: 1.6 }}>
                        Manage your <strong>{Number(overviewMetrics?.totalMedicines ?? 0).toLocaleString()}</strong> medicines, review <strong>{Number(overviewMetrics?.pendingApprovals ?? 0).toLocaleString()}</strong> pending order{(overviewMetrics?.pendingApprovals ?? 0) === 1 ? '' : 's'}, and track revenue performance.
                      </Typography>
                    </Box>

                    {/* Hero Right: revenue headline */}
                    <Box sx={{
                      flexShrink: 0, minWidth: { md: 280 },
                      bgcolor: alpha('#FFFFFF', 0.7), backdropFilter: 'blur(12px)',
                      border: SOFT_BORDER, borderRadius: 3, p: 2.5,
                    }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          Total Earnings
                        </Typography>
                        <TrendingUpRoundedIcon sx={{ fontSize: 18, color: '#10B981' }} />
                      </Stack>
                      {isMetricsLoading ? (
                        <Skeleton variant="text" sx={{ fontSize: '2rem' }} width="80%" />
                      ) : (
                        <Typography sx={{ fontSize: { xs: '1.75rem', md: '2.1rem' }, fontWeight: 800, color: '#0F172A', lineHeight: 1, letterSpacing: '-0.02em', wordBreak: 'break-all' }}>
                          PKR {Number(overviewMetrics?.totalEarnings ?? 0).toLocaleString()}
                        </Typography>
                      )}
                      <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 1 }}>
                        Net revenue · 75/25 split
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1.5 }}>
                        <ArrowUpwardRoundedIcon sx={{ fontSize: 14, color: '#10B981' }} />
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#10B981' }}>
                          {Number(overviewMetrics?.totalOrders ?? 0).toLocaleString()} orders processed
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>

            {/* AT A GLANCE — Premium KPI cards */}
            <Box>
              <Stack direction="row" alignItems="flex-end" justifyContent="space-between" sx={{ mb: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                    At a glance
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Live operational metrics</Typography>
                </Box>
              </Stack>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: { xs: 2, md: 2.5 } }}>
                {kpiCards.map((card) => (
                  <motion.div key={card.label} variants={cardVariants} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                    <Card sx={{
                      position: 'relative', overflow: 'hidden', height: '100%',
                      borderRadius: 3, border: SOFT_BORDER,
                      bgcolor: alpha('#FFFFFF', 0.85), backdropFilter: 'blur(8px)', boxShadow: PREMIUM_SHADOW,
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
                          border: `1px solid ${alpha(card.color, 0.25)}`, color: card.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          mb: 1.5,
                        }}>
                          <card.Icon sx={{ fontSize: 22 }} />
                        </Box>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
                          {card.label}
                        </Typography>
                        {isMetricsLoading ? (
                          <Skeleton variant="text" sx={{ fontSize: '1.85rem' }} width="60%" />
                        ) : (
                          <Typography sx={{ fontSize: { xs: '1.7rem', md: '2rem' }, fontWeight: 800, color: '#0F172A', lineHeight: 1, letterSpacing: '-0.02em', mb: 0.75, wordBreak: 'break-all' }}>
                            {card.prefix}{Number(card.value).toLocaleString()}
                          </Typography>
                        )}
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{card.hint}</Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </Box>
            </Box>

            {/* OPERATIONS — Tool grid */}
            <Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'flex-end' }} justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                    Operations
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Manage every aspect of your pharmacy</Typography>
                </Box>
                <Box sx={{
                  display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1,
                  width: '100%', height: 40, px: 1.5,
                  bgcolor: alpha('#FFFFFF', 0.7), border: SOFT_BORDER, borderRadius: 999,
                }}>
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                  <TextField
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search sections…" variant="standard" fullWidth
                    InputProps={{ disableUnderline: true, sx: { fontSize: '0.875rem' } }}
                  />
                </Box>
              </Stack>

              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' },
                gap: { xs: 2, md: 2.5 },
              }}>
                {filteredItems.map((item) => {
                  const ItemIcon = item.Icon
                  return (
                    <motion.div key={item.label} variants={cardVariants} whileHover={{ y: -6 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
                      <Card
                        onClick={() => navigate(item.href)}
                        sx={{
                          position: 'relative', overflow: 'hidden', height: '100%',
                          display: 'flex', flexDirection: 'column',
                          cursor: 'pointer',
                          minHeight: 220,
                          borderRadius: 3, border: SOFT_BORDER,
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
                            <ItemIcon sx={{ fontSize: 24 }} />
                          </Box>
                          <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.3, mb: 0.75 }}>
                            {item.label}
                          </Typography>
                          <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', lineHeight: 1.55, mb: item.metric ? 1.5 : 0 }}>
                            {item.description}
                          </Typography>
                          {item.metric && (
                            <Chip
                              size="small"
                              label={item.metric}
                              sx={{
                                bgcolor: alpha(item.accent, 0.10),
                                color: item.accent,
                                fontWeight: 800, fontSize: '0.72rem', height: 22,
                                border: `1px solid ${alpha(item.accent, 0.2)}`,
                              }}
                            />
                          )}
                        </CardContent>

                        <Box sx={{
                          position: 'relative',
                          px: { xs: 2.5, md: 3 }, pb: 2.25,
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                          <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: item.accent, letterSpacing: '0.02em' }}>
                            Open section
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

              {filteredItems.length === 0 && (
                <Card sx={{ borderRadius: 3, border: SOFT_BORDER, p: 5, textAlign: 'center', bgcolor: alpha('#FFFFFF', 0.7), mt: 2.5 }}>
                  <Box sx={{
                    width: 56, height: 56, mx: 'auto', mb: 2, borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha('#0EA5E9', 0.18)} 0%, ${alpha('#0EA5E9', 0.06)} 100%)`,
                    border: `1px solid ${alpha('#0EA5E9', 0.25)}`, color: '#0EA5E9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <SearchIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>No section found</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Try a different search term.</Typography>
                </Card>
              )}
            </Box>

          </Stack>
        </motion.div>
      </Container>
    </Box>
  )
}
