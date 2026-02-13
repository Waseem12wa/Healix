import { Box, Button, Card, CardContent, Chip, IconButton, Stack, Typography, Avatar, Badge, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, useTheme, alpha } from '@mui/material'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import MenuIcon from '@mui/icons-material/Menu'
import NotificationsIcon from '@mui/icons-material/Notifications'
import PeopleIcon from '@mui/icons-material/People'
import LogoutIcon from '@mui/icons-material/Logout'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import EventIcon from '@mui/icons-material/Event'
import ScienceIcon from '@mui/icons-material/Science'
import SettingsIcon from '@mui/icons-material/Settings'
import BarChartIcon from '@mui/icons-material/BarChart'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import { useMemo, useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'

interface User {
  id: number
  name: string
  email: string
  role: 'patient' | 'doctor' | 'provider'
  status: 'active' | 'inactive'
  joinedDate: string
}

interface Appointment {
  id: number
  patientName: string
  doctorName: string
  date: string
  time: string
  status: 'confirmed' | 'pending' | 'cancelled'
}

interface SystemStats {
  totalUsers: number
  totalDoctors: number
  totalPatients: number
  totalAppointments: number
  activeReminders: number
  drugInteractions: number
}

export default function AdminPanel() {
  const theme = useTheme()
  const [selectedTab, setSelectedTab] = useState('dashboard')
  const [openDialog, setOpenDialog] = useState(false)
  const [users, setUsers] = useState<User[]>([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'patient', status: 'active', joinedDate: '2024-01-15' },
    { id: 2, name: 'Dr. Sarah Johnson', email: 'sarah@example.com', role: 'doctor', status: 'active', joinedDate: '2024-02-10' },
    { id: 3, name: 'Jane Smith', email: 'jane@example.com', role: 'patient', status: 'active', joinedDate: '2024-03-05' },
    { id: 4, name: 'Dr. Michael Chen', email: 'michael@example.com', role: 'doctor', status: 'active', joinedDate: '2024-01-20' },
    { id: 5, name: 'City Hospital', email: 'contact@cityhospital.com', role: 'provider', status: 'active', joinedDate: '2024-01-01' },
  ])

  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: 1, patientName: 'John Doe', doctorName: 'Dr. Sarah Johnson', date: '2025-01-15', time: '10:00 AM', status: 'confirmed' },
    { id: 2, patientName: 'Jane Smith', doctorName: 'Dr. Michael Chen', date: '2025-01-16', time: '2:30 PM', status: 'pending' },
    { id: 3, patientName: 'Robert Johnson', doctorName: 'Dr. Sarah Johnson', date: '2025-01-18', time: '11:00 AM', status: 'confirmed' },
    { id: 4, patientName: 'Emily Davis', doctorName: 'Dr. Michael Chen', date: '2025-01-20', time: '3:00 PM', status: 'pending' },
  ])

  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 1250,
    totalDoctors: 45,
    totalPatients: 1180,
    totalAppointments: 3456,
    activeReminders: 5600,
    drugInteractions: 892,
  })

  const userName = useMemo(() => {
    return (localStorage.getItem('userName') || 'Admin')
  }, [])

  const featureItems = [
    { label: 'Admin Dashboard', description: 'High-level view of system health and usage.', icon: <BarChartIcon color="primary" />, value: 'dashboard' as const },
    { label: 'User Management', description: 'Manage patients, doctors and providers.', icon: <PeopleIcon color="info" />, value: 'users' as const },
    { label: 'Appointments', description: 'Review and audit scheduled appointments.', icon: <EventIcon color="success" />, value: 'appointments' as const },
    { label: 'System Settings', description: 'Configure global settings and support details.', icon: <SettingsIcon color="warning" />, value: 'settings' as const },
    { label: 'Notifications', description: 'Open notification center.', icon: <NotificationsIcon color="error" />, href: '/tools/notifications' as const },
    { label: 'Logout', description: 'Sign out from the admin console.', icon: <LogoutIcon color="secondary" />, href: '/login' as const },
  ]

  const monthlyData = [
    { month: 'Jan', users: 1200, appointments: 2800, interactions: 650 },
    { month: 'Feb', users: 1350, appointments: 3100, interactions: 720 },
    { month: 'Mar', users: 1480, appointments: 3400, interactions: 810 },
    { month: 'Apr', users: 1620, appointments: 3700, interactions: 850 },
    { month: 'May', users: 1780, appointments: 4000, interactions: 890 },
    { month: 'Jun', users: 1950, appointments: 4300, interactions: 920 },
  ]

  const handleDeleteUser = (id: number) => {
    setUsers(users.filter(user => user.id !== id))
  }

  const handleToggleStatus = (id: number) => {
    setUsers(users.map(user =>
      user.id === id
        ? { ...user, status: user.status === 'active' ? 'inactive' as const : 'active' as const }
        : user
    ))
  }

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
    }
  }

  return (
    <Box sx={{
      width: '100%',
      minHeight: '100vh',
      bgcolor: theme.palette.background.default,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Decorative Elements */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'none'
      }}>
        {/* Gradient blob 1 - Top right */}
        <Box sx={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 180, 216, 0.15) 0%, rgba(0, 180, 216, 0.05) 50%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'float 20s ease-in-out infinite'
        }} />
        {/* Gradient blob 2 - Bottom left */}
        <Box sx={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 214, 160, 0.15) 0%, rgba(6, 214, 160, 0.05) 50%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'float 25s ease-in-out infinite reverse'
        }} />
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <Box sx={{
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.1),
          p: { xs: 2.5, md: 3.5 },
          px: { xs: 3, md: 4 }
        }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2.5}>
              <Box sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 180, 216, 0.3)'
              }}>
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
                    lineHeight: 1.2
                  }}
                >
                  Admin Dashboard
                </Typography>
                <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
                  Manage platform users, appointments and global settings
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Badge badgeContent={3} color="error">
                <IconButton><NotificationsIcon sx={{ color: '#00B4D8' }} /></IconButton>
              </Badge>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar sx={{
                  background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                  width: 40,
                  height: 40
                }}>{userName.charAt(0)}</Avatar>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#00B4D8' }}>{userName}</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Administrator</Typography>
                </Box>
              </Stack>
            </Stack>
          </Stack>
        </Box>

        {/* Dashboard Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2.5, md: 3.5 }, px: { xs: 3, md: 4 }, width: '100%' }}>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Top feature cards for navigation */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' },
              gap: { xs: 2, md: 3 },
              mb: 3
            }}>
              {featureItems.map((item) => {
                const isTab = !item.href
                const isActive = isTab && selectedTab === item.value
                const cardProps = isTab
                  ? { onClick: () => setSelectedTab(item.value) }
                  : { component: Link, to: item.href }

                return (
                  <motion.div key={item.label} variants={cardVariants}>
                    <Card
                      {...cardProps}
                      sx={{
                        cursor: 'pointer',
                        textDecoration: 'none',
                        height: 180,
                        borderRadius: 3,
                        boxShadow: isActive ? '0 8px 24px rgba(0, 180, 216, 0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
                        border: isActive ? '2px solid #00B4D8' : '1px solid rgba(0,0,0,0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        p: 0,
                        overflow: 'hidden',
                        bgcolor: alpha('#ffffff', 0.95),
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 32px rgba(0, 180, 216, 0.15)',
                          borderColor: '#00B4D8'
                        }
                      }}
                    >
                      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
                          <Box sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            background: isActive
                              ? 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)'
                              : alpha('#00B4D8', 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.3s ease'
                          }}>
                            {item.icon}
                          </Box>
                          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
                            {item.label}
                          </Typography>
                        </Stack>
                        <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.5 }}>
                          {item.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </Box>

            {/* Dashboard View */}
            {selectedTab === 'dashboard' && (
              <Stack spacing={3}>
                {/* Summary Cards */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: { xs: 2, md: 3 } }}>
                  <motion.div variants={cardVariants}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', bgcolor: alpha('#ffffff', 0.95), backdropFilter: 'blur(10px)', border: '1px solid rgba(0,0,0,0.06)', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0, 180, 216, 0.15)' } }}>
                      <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Box sx={{ width: 56, height: 56, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)', color: '#ffffff', boxShadow: '0 4px 12px rgba(0, 180, 216, 0.3)' }}>
                            <PeopleIcon sx={{ fontSize: 28 }} />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>Total Users</Typography>
                            <Typography sx={{ fontSize: '2rem', fontWeight: 900, background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>{stats.totalUsers}</Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                  <motion.div variants={cardVariants}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', bgcolor: alpha('#ffffff', 0.95), backdropFilter: 'blur(10px)', border: '1px solid rgba(0,0,0,0.06)', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(6, 214, 160, 0.15)' } }}>
                      <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Box sx={{ width: 56, height: 56, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #06D6A0 0%, #00B4D8 100%)', color: '#ffffff', boxShadow: '0 4px 12px rgba(6, 214, 160, 0.3)' }}>
                            <EventIcon sx={{ fontSize: 28 }} />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>Total Appointments</Typography>
                            <Typography sx={{ fontSize: '2rem', fontWeight: 900, background: 'linear-gradient(135deg, #06D6A0 0%, #00B4D8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>{stats.totalAppointments}</Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Box>

                {/* Charts */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
                  <motion.div variants={cardVariants}>
                    <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderRadius: 3, height: 400, bgcolor: alpha('#ffffff', 0.95), backdropFilter: 'blur(10px)', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                        <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 3 }}>
                          Monthly Growth Trends
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                            <XAxis dataKey="month" stroke="#64748B" />
                            <YAxis stroke="#64748B" />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="users" stroke="#00B4D8" strokeWidth={3} name="Users" />
                            <Line type="monotone" dataKey="appointments" stroke="#06D6A0" strokeWidth={3} name="Appointments" />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={cardVariants}>
                    <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderRadius: 3, height: 400, bgcolor: alpha('#ffffff', 0.95), backdropFilter: 'blur(10px)', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                        <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 3 }}>
                          User Distribution
                        </Typography>
                        <Stack spacing={3} sx={{ mt: 4 }}>
                          <Box>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                              <Typography variant="body2" fontWeight={600}>Patients</Typography>
                              <Typography variant="body2" fontWeight={700} sx={{ color: '#00B4D8' }}>{stats.totalPatients}</Typography>
                            </Stack>
                            <Box sx={{ height: 10, bgcolor: alpha('#00B4D8', 0.1), borderRadius: 2, overflow: 'hidden' }}>
                              <Box sx={{ width: '94%', height: '100%', background: 'linear-gradient(90deg, #00B4D8 0%, #06D6A0 100%)', borderRadius: 2 }} />
                            </Box>
                          </Box>
                          <Box>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                              <Typography variant="body2" fontWeight={600}>Doctors</Typography>
                              <Typography variant="body2" fontWeight={700} sx={{ color: '#06D6A0' }}>{stats.totalDoctors}</Typography>
                            </Stack>
                            <Box sx={{ height: 10, bgcolor: alpha('#06D6A0', 0.1), borderRadius: 2, overflow: 'hidden' }}>
                              <Box sx={{ width: '4%', height: '100%', background: 'linear-gradient(90deg, #06D6A0 0%, #00B4D8 100%)', borderRadius: 2 }} />
                            </Box>
                          </Box>
                          <Box>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                              <Typography variant="body2" fontWeight={600}>Providers</Typography>
                              <Typography variant="body2" fontWeight={700} sx={{ color: '#0096C7' }}>{stats.totalUsers - stats.totalPatients - stats.totalDoctors}</Typography>
                            </Stack>
                            <Box sx={{ height: 10, bgcolor: alpha('#0096C7', 0.1), borderRadius: 2, overflow: 'hidden' }}>
                              <Box sx={{ width: '2%', height: '100%', bgcolor: '#0096C7', borderRadius: 2 }} />
                            </Box>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Box>
              </Stack>
            )}

            {/* User Management View */}
            {selectedTab === 'users' && (
              <Stack spacing={3}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    User Management
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setOpenDialog(true)}
                    sx={{
                      background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                      '&:hover': { background: 'linear-gradient(135deg, #0096C7 0%, #05b588 100%)' },
                      textTransform: 'none',
                      fontWeight: 700,
                      boxShadow: '0 4px 12px rgba(0, 180, 216, 0.3)'
                    }}
                  >
                    Add User
                  </Button>
                </Stack>

                <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderRadius: 3, bgcolor: alpha('#ffffff', 0.95), backdropFilter: 'blur(10px)', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: alpha('#00B4D8', 0.05) }}>
                          <TableCell sx={{ fontWeight: 700, color: '#00B4D8' }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#00B4D8' }}>Email</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#00B4D8' }}>Role</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#00B4D8' }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#00B4D8' }}>Joined</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#00B4D8' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Chip
                                label={user.role}
                                size="small"
                                color={user.role === 'doctor' ? 'primary' : user.role === 'patient' ? 'success' : 'info'}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={user.status}
                                size="small"
                                color={user.status === 'active' ? 'success' : 'default'}
                              />
                            </TableCell>
                            <TableCell>{user.joinedDate}</TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleToggleStatus(user.id)}
                                  color={user.status === 'active' ? 'warning' : 'success'}
                                >
                                  {user.status === 'active' ? <CancelIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                                </IconButton>
                                <IconButton size="small" color="error" onClick={() => handleDeleteUser(user.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              </Stack>
            )}

            {/* Appointments View */}
            {selectedTab === 'appointments' && (
              <Stack spacing={3}>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  All Appointments
                </Typography>

                <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderRadius: 3, bgcolor: alpha('#ffffff', 0.95), backdropFilter: 'blur(10px)', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: alpha('#00B4D8', 0.05) }}>
                          <TableCell sx={{ fontWeight: 700 }}>Patient</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Doctor</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {appointments.map((apt) => (
                          <TableRow key={apt.id}>
                            <TableCell>{apt.patientName}</TableCell>
                            <TableCell>{apt.doctorName}</TableCell>
                            <TableCell>{apt.date}</TableCell>
                            <TableCell>{apt.time}</TableCell>
                            <TableCell>
                              <Chip
                                label={apt.status}
                                size="small"
                                color={apt.status === 'confirmed' ? 'success' : apt.status === 'pending' ? 'warning' : 'error'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              </Stack>
            )}

            {/* Settings View */}
            {selectedTab === 'settings' && (
              <Stack spacing={3}>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: '#1947D2' }}>
                  System Settings
                </Typography>

                <Card sx={{ boxShadow: 2, borderRadius: 1.5 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Stack spacing={3}>
                      <Typography variant="h6" fontWeight={700}>General Settings</Typography>
                      <TextField label="System Name" defaultValue="Healix" fullWidth />
                      <TextField label="Admin Email" defaultValue="admin@healix.com" fullWidth />
                      <TextField label="Support Email" defaultValue="support@healix.com" fullWidth />
                      <Button variant="contained" sx={{ alignSelf: 'flex-start', bgcolor: '#1947D2', '&:hover': { bgcolor: '#1E40AF' } }}>
                        Save Changes
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            )}
          </motion.div>
        </Box>
      </Box>
    </Box>
  )
}
