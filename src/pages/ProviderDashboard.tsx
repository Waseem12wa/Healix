import { Box, Card, CardContent, IconButton, Stack, Typography, Avatar, Badge, Menu, MenuItem, ListItemIcon, ListItemText, Divider, TextField, InputAdornment, Button } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import NotificationsIcon from '@mui/icons-material/Notifications'
import PersonIcon from '@mui/icons-material/Person'
import LogoutIcon from '@mui/icons-material/Logout'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import MedicationIcon from '@mui/icons-material/Medication'
import InventoryIcon from '@mui/icons-material/Inventory'
import PaymentIcon from '@mui/icons-material/Payment'
import DashboardIcon from '@mui/icons-material/Dashboard'
import SettingsIcon from '@mui/icons-material/Settings'
import SearchIcon from '@mui/icons-material/Search'
import { clearAuthData } from '../utils/auth'
import { useNotifications } from '../hooks/useNotifications'
import BackButton from '../ui/BackButton'

interface ProviderFeatureItem {
  label: string
  description: string
  icon: React.ReactNode
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
      description: 'View total medicines, orders, approvals, earnings and sales trends.',
      icon: <DashboardIcon color="primary" />,
      href: '/provider/overview',
    },
    {
      label: 'Medicine Management',
      description: 'Add, edit, delete, and update medicine stock with search and filtering.',
      icon: <MedicationIcon color="success" />,
      href: '/provider/medicines',
      metric: `${Number(overviewMetrics?.totalMedicines || 0).toLocaleString()} medicines`,
    },
    {
      label: 'Order Management & Approvals',
      description: 'Review incoming patient orders and approve, reject, or complete them.',
      icon: <InventoryIcon color="info" />,
      href: '/provider/orders',
      metric: `${Number(overviewMetrics?.pendingApprovals || 0).toLocaleString()} pending`,
    },
    {
      label: 'Payment Management & Revenue Split',
      description: 'Manage payout account details and track 75/25 revenue split transactions.',
      icon: <PaymentIcon color="warning" />,
      href: '/provider/payments',
      metric: `PKR ${Number(overviewMetrics?.totalEarnings || 0).toLocaleString()}`,
    },
  ]

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

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', display: 'flex', bgcolor: '#f5f7fa', overflowX: 'hidden' }}>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
        <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid', borderColor: 'divider', p: { xs: 2.5, md: 3.5 }, px: { xs: 3, md: 4 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2.5}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  bgcolor: '#00B4D8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LocalHospitalIcon sx={{ color: '#ffffff' }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' }, fontWeight: 900, color: '#00B4D8' }}>
                  Provider Dashboard
                </Typography>
                <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
                  Manage medicines, orders, payments, and profile operations
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={2}>
              <Badge badgeContent={unreadCount} color="error" invisible={unreadCount <= 0}>
                <IconButton onClick={handleNotificationClick}>
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
                  '&:hover': { borderColor: '#E2E8F0', bgcolor: '#F8FAFC' },
                }}
              >
                <Avatar src={displayImage || undefined} sx={{ bgcolor: '#00B4D8', width: 40, height: 40 }}>
                  {(displayName || userName).charAt(0)}
                </Avatar>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#00B4D8' }}>{displayName || userName}</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Healthcare Provider</Typography>
                </Box>
              </Stack>
              <Menu
                anchorEl={profileMenuAnchor}
                open={Boolean(profileMenuAnchor)}
                onClose={handleCloseProfileMenu}
                PaperProps={{ sx: { mt: 1, minWidth: 220, borderRadius: 2 } }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={() => handleProfileNavigate('/tools/notifications')}>
                  <ListItemIcon><NotificationsIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Notifications" />
                </MenuItem>
                <MenuItem onClick={() => handleProfileNavigate('/profile/provider')}>
                  <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Profile" />
                </MenuItem>
                <MenuItem onClick={() => handleProfileNavigate('/settings')}>
                  <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Settings" />
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Logout" />
                </MenuItem>
              </Menu>
            </Stack>
          </Stack>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2.5, md: 3.5 }, px: { xs: 3, md: 4 }, width: '100%' }}>
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <Box sx={{ mb: 2 }}>
              <BackButton />
            </Box>

            <Card sx={{ borderRadius: 2, border: '1px solid #D7E0EA', mb: 2.5 }}>
              <CardContent sx={{ p: { xs: 2, md: 2.25 } }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
                  <TextField
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search dashboard sections"
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button variant="outlined" onClick={() => setSearchQuery('')} sx={{ minWidth: 120 }}>
                    Reset
                  </Button>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Showing {filteredItems.length} of {featureItems.length} sections
                </Typography>
              </CardContent>
            </Card>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
                gap: { xs: 2, md: 3 },
              }}
            >
              {filteredItems.map((item) => (
                <motion.div key={item.label} variants={cardVariants}>
                  <Card
                    onClick={() => navigate(item.href)}
                    sx={{
                      cursor: 'pointer',
                      height: 250,
                      borderRadius: 2,
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
                      border: '1px solid #D7E0EA',
                      bgcolor: '#ffffff',
                      transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: 4,
                        borderColor: '#00B4D8',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: 2,
                          bgcolor: '#E6F7FC',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {item.icon}
                      </Box>

                      <Typography sx={{ fontSize: { xs: '1.15rem', md: '1.35rem' }, fontWeight: 800, color: '#001B3D', lineHeight: 1.25 }}>
                        {item.label}
                      </Typography>
                      <Typography sx={{ fontSize: { xs: '0.95rem', md: '1rem' }, color: '#52627A', lineHeight: 1.5 }}>
                        {item.description}
                      </Typography>

                      {item.metric && (
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#00AFC8' }}>
                          {item.metric}
                        </Typography>
                      )}

                      <Box sx={{ mt: 'auto' }}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(item.href)
                          }}
                          sx={{
                            bgcolor: '#E0F7FF',
                            color: '#009fd1',
                            textTransform: 'none',
                            boxShadow: 'none',
                            borderRadius: 2,
                            px: 1.75,
                            '&:hover': { bgcolor: '#c7eefb', boxShadow: 'none' },
                          }}
                        >
                          Open section
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </Box>

            {filteredItems.length === 0 && (
              <Card sx={{ borderRadius: 2, border: '1px solid #D7E0EA', mt: 2.5 }}>
                <CardContent>
                  <Typography color="text.secondary">No dashboard section found for "{searchQuery}".</Typography>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </Box>
      </Box>
    </Box>
  )
}
