import { Avatar, Badge, Box, Card, CardContent, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack, Typography, alpha } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import EventIcon from '@mui/icons-material/Event';
import SettingsIcon from '@mui/icons-material/Settings';
import BarChartIcon from '@mui/icons-material/BarChart';
import PaymentIcon from '@mui/icons-material/Payment';
import MedicationIcon from '@mui/icons-material/Medication';
import { useEffect, useState } from 'react';
import { clearAuthData } from '../utils/auth';
import { useNotifications } from '../hooks/useNotifications';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('userName') || 'Admin');
  const [profileImage, setProfileImage] = useState<string>(() => localStorage.getItem('profileImage') || '');
  const { unreadCount } = useNotifications();

  useEffect(() => {
    const syncProfile = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (!token) return;

        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const payload = await response.json();
        if (payload?.success && payload?.data) {
          const nextName = payload.data.userName || localStorage.getItem('userName') || 'Admin';
          const nextImage = payload.data?.patientProfile?.profileImage || '';
          localStorage.setItem('userName', nextName);
          localStorage.setItem('profileImage', nextImage);
          setUserName(nextName);
          setProfileImage(nextImage);
        }
      } catch {
        // Keep local cached values when API is unavailable.
      }
    };

    syncProfile();
  }, []);

  const handleOpenProfileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleCloseProfileMenu = () => {
    setProfileMenuAnchor(null);
  };

  const handleProfileNavigate = (path: string) => {
    handleCloseProfileMenu();
    navigate(path);
  };

  const handleLogout = () => {
    clearAuthData();
    handleCloseProfileMenu();
    navigate('/login');
  };

  const featureItems = [
    {
      label: 'Admin Dashboard',
      description: 'Open live analytics overview from database.',
      icon: <BarChartIcon color="primary" />,
      href: '/admin/analytics',
    },
    {
      label: 'User Management',
      description: 'View, search, and manage all platform users.',
      icon: <PeopleIcon color="info" />,
      href: '/admin/users',
    },
    {
      label: 'Appointments',
      description: 'Review and manage complete appointment records.',
      icon: <EventIcon color="success" />,
      href: '/admin/appointments',
    },
    {
      label: 'System Settings',
      description: 'Configure system-level controls saved in database.',
      icon: <SettingsIcon color="warning" />,
      href: '/admin/settings',
    },
    {
      label: 'Payments',
      description: 'Inspect transaction records and payment statuses.',
      icon: <PaymentIcon color="secondary" />,
      href: '/admin/payments',
    },
    {
      label: 'Medicines',
      description: 'Review medicine catalog and remove invalid entries.',
      icon: <MedicationIcon color="success" />,
      href: '/admin/medicines',
    },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.25, ease: 'easeOut' },
    },
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: '#f4f7fa' }}>
      <Box
        sx={{
          bgcolor: alpha('#ffffff', 0.95),
          borderBottom: '1px solid',
          borderColor: alpha('#0f172a', 0.08),
          p: { xs: 2.5, md: 3.5 },
          px: { xs: 3, md: 4 },
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2.5}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 180, 216, 0.3)',
              }}
            >
              <LocalHospitalIcon sx={{ color: '#ffffff', fontSize: 28 }} />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: { xs: '1.75rem', md: '2.5rem' },
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2,
                }}
              >
                Admin Dashboard
              </Typography>
              <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
                Manage platform users, analytics, appointments, payments, and settings
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={2}>
            <Badge badgeContent={unreadCount} color="error" invisible={unreadCount <= 0}>
              <IconButton onClick={() => navigate('/tools/notifications')}>
                <NotificationsIcon sx={{ color: '#00B4D8' }} />
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
                '&:hover': {
                  borderColor: alpha('#0f172a', 0.15),
                  bgcolor: alpha('#ffffff', 0.45),
                },
              }}
            >
              <Avatar
                src={profileImage || undefined}
                sx={{
                  background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                  width: 40,
                  height: 40,
                }}
              >
                {userName.charAt(0)}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#00B4D8' }}>{userName}</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Administrator</Typography>
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
                <ListItemIcon>
                  <NotificationsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Notifications" />
              </MenuItem>
              <MenuItem onClick={() => handleProfileNavigate('/profile/admin')}>
                <ListItemIcon>
                  <PeopleIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Profile" />
              </MenuItem>
              <MenuItem onClick={() => handleProfileNavigate('/settings')}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Settings" />
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </MenuItem>
            </Menu>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ p: { xs: 2.5, md: 3.5 }, px: { xs: 3, md: 4 } }}>
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
                xl: 'repeat(5, minmax(0, 1fr))',
              },
              gap: { xs: 2, md: 3 },
            }}
          >
            {featureItems.map((item) => (
              <motion.div key={item.label} variants={cardVariants}>
                <Card
                  component={Link}
                  to={item.href}
                  sx={{
                    textDecoration: 'none',
                    height: 180,
                    borderRadius: 3,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflow: 'hidden',
                    bgcolor: alpha('#ffffff', 0.95),
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 28px rgba(0, 180, 216, 0.15)',
                      borderColor: '#00B4D8',
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          background: alpha('#00B4D8', 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>{item.label}</Typography>
                    </Stack>
                    <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.5 }}>
                      {item.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </Box>
        </motion.div>
      </Box>
    </Box>
  );
}
