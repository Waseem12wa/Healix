import { Box, Button, Card, CardContent, Chip, Stack, Typography, Avatar, Badge, IconButton, CircularProgress } from '@mui/material'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import NotificationsIcon from '@mui/icons-material/Notifications'
import PersonIcon from '@mui/icons-material/Person'
import LogoutIcon from '@mui/icons-material/Logout'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import EventIcon from '@mui/icons-material/Event'
import ScienceIcon from '@mui/icons-material/Science'
import FastfoodIcon from '@mui/icons-material/Fastfood'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import { useMemo, useState, useEffect } from 'react'
import { useNotifications } from '../hooks/useNotifications'
import AlarmIcon from '@mui/icons-material/Alarm'

interface Appointment {
  _id?: string
  id?: number
  patientName: string
  patientEmail?: string
  date: string
  time: string
  reason?: string
  notes?: string
  status: 'pending' | 'approved' | 'rejected'
  specialization?: string
  location?: string
  consultationType?: string
  fee?: number
}

interface DrugInteraction {
  id: number
  patientName: string
  drug1: string
  drug2: string
  severity: 'None' | 'Mild' | 'Severe'
  note: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

interface DrugFoodInteraction {
  id: number
  patientName: string
  drug: string
  food: string
  type: 'safe' | 'avoid'
  description: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export default function DoctorDashboard() {
  const userName = useMemo(() => {
    return (localStorage.getItem('userName') || 'Doctor')
  }, [])

  const { unreadCount } = useNotifications()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)

  // Reminder modal state
  const [reminderModalOpen, setReminderModalOpen] = useState(false)

  const [drugInteractions, setDrugInteractions] = useState<DrugInteraction[]>([
    {
      id: 1,
      patientName: 'John Doe',
      drug1: 'Metformin',
      drug2: 'Lisinopril',
      severity: 'Mild',
      note: 'CYP3A4 inhibition can increase plasma levels.',
      status: 'pending',
      createdAt: '2025-01-10',
    },
    {
      id: 2,
      patientName: 'Jane Smith',
      drug1: 'Atorvastatin',
      drug2: 'Warfarin',
      severity: 'Severe',
      note: 'Severe interaction requires careful monitoring.',
      status: 'approved',
      createdAt: '2025-01-09',
    },
  ])

  const [drugFoodInteractions, setDrugFoodInteractions] = useState<DrugFoodInteraction[]>([
    {
      id: 1,
      patientName: 'John Doe',
      drug: 'Metformin',
      food: 'Grapefruit',
      type: 'avoid',
      description: 'Grapefruit juice inhibits intestinal CYP3A4.',
      status: 'pending',
      createdAt: '2025-01-11',
    },
    {
      id: 2,
      patientName: 'Robert Johnson',
      drug: 'Warfarin',
      food: 'Leafy Greens',
      type: 'avoid',
      description: 'Vitamin K can antagonize anticoagulant effect.',
      status: 'approved',
      createdAt: '2025-01-10',
    },
  ])

  const featureItems = [
    { label: 'Set Reminders', description: 'Schedule medication reminders for your patients.', icon: <AlarmIcon color="warning" />, onClick: () => setReminderModalOpen(true) },
    { label: 'Drug Interaction Checker', description: 'Review and validate drug-drug interactions.', icon: <ScienceIcon color="primary" />, href: '/tools/drug-interactions' },
    { label: 'Drug-Food Interaction', description: 'Check how diet impacts current medications.', icon: <FastfoodIcon color="success" />, href: '/tools/drug-food-interactions' },
    { label: 'Drug Alternatives', description: 'Explore alternative therapies for your patients.', icon: <SwapHorizIcon color="info" />, href: '/tools/drug-alternatives' },
    { label: 'Notifications', description: 'Stay on top of alerts across your panel.', icon: <NotificationsIcon color="error" />, href: '/tools/notifications' },
    { label: 'Profile', description: 'Complete your profile to be visible to patients.', icon: <PersonIcon color="info" />, href: '/doctor-profile' },
    { label: 'Logout', description: 'Securely sign out of your Healix account.', icon: <LogoutIcon color="secondary" />, href: '/login' },
  ]

  useEffect(() => {
    loadAppointments()
    try {
      const savedDrugs = localStorage.getItem('doctorDrugInteractions')
      if (savedDrugs) setDrugInteractions(JSON.parse(savedDrugs))
      const savedFoods = localStorage.getItem('doctorFoodInteractions')
      if (savedFoods) setDrugFoodInteractions(JSON.parse(savedFoods))
    } catch { }
  }, [])

  // Load appointments from API
  const loadAppointments = async () => {
    setLoadingAppointments(true)
    try {
      const userEmail = localStorage.getItem('userEmail')
      if (!userEmail) {
        console.error('User email not found')
        return
      }

      const response = await fetch(`http://localhost:5000/api/appointments/doctor?email=${encodeURIComponent(userEmail)}`)
      const data = await response.json()

      if (data.success) {
        // Map API data to component format
        const mappedAppointments = data.data.map((apt: any) => ({
          _id: apt._id,
          id: apt._id,
          patientName: apt.patientName,
          patientEmail: apt.patientEmail,
          date: apt.date,
          time: apt.time,
          reason: apt.notes || '',
          notes: apt.notes || '',
          status: apt.status === 'approved' ? 'approved' : apt.status === 'rejected' ? 'rejected' : 'pending',
          specialization: apt.specialization,
          location: apt.location,
          consultationType: apt.consultationType,
          fee: apt.fee
        }))
        setAppointments(mappedAppointments)
      }
    } catch (err) {
      console.error('Error loading appointments:', err)
    } finally {
      setLoadingAppointments(false)
    }
  }

  const handleApprove = async (type: 'appointment' | 'drug' | 'food', id: number | string) => {
    if (type === 'appointment') {
      try {
        const userEmail = localStorage.getItem('userEmail')
        if (!userEmail) {
          console.error('User email not found')
          return
        }

        const appointmentId = typeof id === 'string' ? id : appointments.find(a => a.id === id)?._id
        if (!appointmentId) {
          console.error('Appointment not found')
          return
        }

        const response = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'approved',
            doctorEmail: userEmail
          })
        })

        const data = await response.json()

        if (data.success) {
          loadAppointments() // Reload appointments
        } else {
          console.error('Failed to approve appointment:', data.message)
        }
      } catch (err) {
        console.error('Error approving appointment:', err)
      }
    } else if (type === 'drug') {
      const updated = drugInteractions.map(di => di.id === id ? { ...di, status: 'approved' as const } : di)
      setDrugInteractions(updated)
      try { localStorage.setItem('doctorDrugInteractions', JSON.stringify(updated)) } catch { }
    } else if (type === 'food') {
      const updated = drugFoodInteractions.map(dfi => dfi.id === id ? { ...dfi, status: 'approved' as const } : dfi)
      setDrugFoodInteractions(updated)
      try { localStorage.setItem('doctorFoodInteractions', JSON.stringify(updated)) } catch { }
    }
  }

  const handleReject = async (type: 'appointment' | 'drug' | 'food', id: number | string) => {
    if (type === 'appointment') {
      try {
        const userEmail = localStorage.getItem('userEmail')
        if (!userEmail) {
          console.error('User email not found')
          return
        }

        const appointmentId = typeof id === 'string' ? id : appointments.find(a => a.id === id)?._id
        if (!appointmentId) {
          console.error('Appointment not found')
          return
        }

        const response = await fetch(`http://localhost:5000/api/appointments/${appointmentId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'rejected',
            doctorEmail: userEmail
          })
        })

        const data = await response.json()

        if (data.success) {
          loadAppointments() // Reload appointments
        } else {
          console.error('Failed to reject appointment:', data.message)
        }
      } catch (err) {
        console.error('Error rejecting appointment:', err)
      }
    } else if (type === 'drug') {
      const updated = drugInteractions.map(di => di.id === id ? { ...di, status: 'rejected' as const } : di)
      setDrugInteractions(updated)
      try { localStorage.setItem('doctorDrugInteractions', JSON.stringify(updated)) } catch { }
    } else if (type === 'food') {
      const updated = drugFoodInteractions.map(dfi => dfi.id === id ? { ...dfi, status: 'rejected' as const } : dfi)
      setDrugFoodInteractions(updated)
      try { localStorage.setItem('doctorFoodInteractions', JSON.stringify(updated)) } catch { }
    }
  }

  const pendingAppointments = appointments.filter(apt => apt.status === 'pending')
  const approvedAppointments = appointments.filter(apt => apt.status === 'approved')
  const pendingDrugInteractions = drugInteractions.filter(di => di.status === 'pending')
  const approvedDrugInteractions = drugInteractions.filter(di => di.status === 'approved')
  const pendingFoodInteractions = drugFoodInteractions.filter(dfi => dfi.status === 'pending')
  const approvedFoodInteractions = drugFoodInteractions.filter(dfi => dfi.status === 'approved')

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
      bgcolor: '#f5f7fa',
      overflowX: 'hidden'
    }}>
      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
        {/* Header */}
        <Box sx={{ bgcolor: '#ffffff', borderBottom: '1px solid', borderColor: 'divider', p: { xs: 2.5, md: 3.5 }, px: { xs: 3, md: 4 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2.5}>
              <Box sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                bgcolor: '#06D6A0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <LocalHospitalIcon sx={{ color: '#ffffff' }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' }, fontWeight: 900, color: '#1A1A2E' }}>
                  Doctor Dashboard
                </Typography>
                <Typography sx={{ fontSize: '0.9rem', color: '#64748B' }}>
                  Overview of your clinical workload and patient interactions
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Badge badgeContent={unreadCount + pendingAppointments.length + pendingDrugInteractions.length + pendingFoodInteractions.length} color="error">
                <IconButton component={Link} to="/tools/notifications"><NotificationsIcon /></IconButton>
              </Badge>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar sx={{ bgcolor: '#06D6A0', width: 40, height: 40 }}>{userName.charAt(0)}</Avatar>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#1A1A2E' }}>{userName}</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#64748B' }}>Doctor</Typography>
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
            <Stack spacing={4}>
              {/* Feature Navigation - cards like patient dashboard */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' },
                gap: { xs: 2, md: 3 },
                mb: 1
              }}>
                {featureItems.map((item) => (
                  <motion.div key={item.label} variants={cardVariants} whileHover="hover">
                    <Card
                      component={item.href ? Link : 'div'}
                      to={item.href || undefined}
                      onClick={item.onClick}
                      sx={{
                        textDecoration: 'none',
                        height: 180,
                        borderRadius: 2,
                        boxShadow: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        p: 0,
                        overflow: 'hidden',
                        bgcolor: '#ffffff',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 6
                        }
                      }}
                    >
                      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
                          <Box sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 1.5,
                            bgcolor: '#EEF2FF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {item.icon}
                          </Box>
                          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
                            {item.label}
                          </Typography>
                        </Stack>
                        <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
                          {item.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </Box>

              {/* Summary Cards */}
              {/* Summary Cards */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: { xs: 2, md: 3 } }}>
                <motion.div variants={cardVariants}>
                  <Card sx={{ borderRadius: 1.5, boxShadow: 2, bgcolor: '#ffffff', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}>
                    <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{ width: 48, height: 48, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#1947D2', color: '#ffffff' }}>
                          <EventIcon />
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#64748B', mb: 0.5 }}>Pending Appointments</Typography>
                          <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: '#1A1A2E', lineHeight: 1 }}>{pendingAppointments.length}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div variants={cardVariants}>
                  <Card sx={{ borderRadius: 1.5, boxShadow: 2, bgcolor: '#ffffff', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}>
                    <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{ width: 48, height: 48, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#10b981', color: '#ffffff' }}>
                          <CheckCircleIcon />
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#64748B', mb: 0.5 }}>Approved Appointments</Typography>
                          <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: '#1A1A2E', lineHeight: 1 }}>{approvedAppointments.length}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div variants={cardVariants}>
                  <Card sx={{ borderRadius: 1.5, boxShadow: 2, bgcolor: '#ffffff', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}>
                    <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{ width: 48, height: 48, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#ef4444', color: '#ffffff' }}>
                          <ScienceIcon />
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#64748B', mb: 0.5 }}>Drug Interactions</Typography>
                          <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: '#1A1A2E', lineHeight: 1 }}>{pendingDrugInteractions.length}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div variants={cardVariants}>
                  <Card sx={{ borderRadius: 1.5, boxShadow: 2, bgcolor: '#ffffff', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}>
                    <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{ width: 48, height: 48, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f59e0b', color: '#ffffff' }}>
                          <FastfoodIcon />
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#64748B', mb: 0.5 }}>Food Interactions</Typography>
                          <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: '#1A1A2E', lineHeight: 1 }}>{pendingFoodInteractions.length}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>

              {/* Pending Appointments */}
              <motion.div variants={cardVariants}>
                <Card sx={{ boxShadow: 2, borderRadius: 1.5, border: 'none' }}>
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 900, color: '#06D6A0', mb: 3 }}>
                      Pending Appointments
                    </Typography>
                    {loadingAppointments ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                      </Box>
                    ) : (
                      <Stack spacing={2}>
                        {pendingAppointments.map((apt) => (
                          <Box key={apt._id || apt.id} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                            <Box>
                              <Typography sx={{ fontWeight: 700, color: '#1A1A2E', mb: 0.5 }}>{apt.patientName}</Typography>
                              <Typography variant="body2" color="text.secondary">{apt.date} at {apt.time}</Typography>
                              {apt.notes && <Typography variant="body2" color="text.secondary">{apt.notes}</Typography>}
                              {apt.location && <Typography variant="body2" color="text.secondary">Location: {apt.location}</Typography>}
                              {apt.fee && <Typography variant="body2" color="text.secondary">Fee: PKR {apt.fee.toLocaleString()}</Typography>}
                            </Box>
                            <Stack direction="row" spacing={1}>
                              <Button variant="contained" color="success" size="small" onClick={() => {
                                const appointmentId = apt._id || apt.id
                                if (appointmentId) handleApprove('appointment', appointmentId)
                              }}>
                                Approve
                              </Button>
                              <Button variant="outlined" color="error" size="small" onClick={() => {
                                const appointmentId = apt._id || apt.id
                                if (appointmentId) handleReject('appointment', appointmentId)
                              }}>
                                Reject
                              </Button>
                            </Stack>
                          </Box>
                        ))}
                        {pendingAppointments.length === 0 && (
                          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                            No pending appointments
                          </Typography>
                        )}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Approved Appointments */}
              {approvedAppointments.length > 0 && (
                <motion.div variants={cardVariants}>
                  <Card sx={{ boxShadow: 2, borderRadius: 1.5, border: 'none' }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 900, color: '#06D6A0', mb: 3 }}>
                        Approved Appointments
                      </Typography>
                      <Stack spacing={2}>
                        {approvedAppointments.map((apt) => (
                          <Box key={apt.id} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: '#f0fdf4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography sx={{ fontWeight: 700, color: '#1A1A2E', mb: 0.5 }}>{apt.patientName}</Typography>
                              <Typography variant="body2" color="text.secondary">{apt.date} at {apt.time}</Typography>
                              <Typography variant="body2" color="text.secondary">{apt.reason}</Typography>
                            </Box>
                            <Chip label="Approved" color="success" size="small" />
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Pending Drug-Drug Interactions */}
              <motion.div variants={cardVariants}>
                <Card sx={{ boxShadow: 2, borderRadius: 1.5, border: 'none' }}>
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 900, color: '#06D6A0', mb: 3 }}>
                      Pending Drug-Drug Interactions
                    </Typography>
                    <Stack spacing={2}>
                      {pendingDrugInteractions.map((di) => (
                        <Box key={di.id} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: '#ffffff' }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 2 }} flexWrap="wrap" gap={2}>
                            <Box>
                              <Typography sx={{ fontWeight: 700, color: '#1A1A2E', mb: 0.5 }}>{di.patientName}</Typography>
                              <Typography variant="body2" color="text.secondary">{di.drug1} + {di.drug2}</Typography>
                              <Chip label={di.severity} color={di.severity === 'Severe' ? 'error' : di.severity === 'Mild' ? 'warning' : 'success'} size="small" sx={{ mt: 1 }} />
                            </Box>
                            <Stack direction="row" spacing={1}>
                              <Button variant="contained" color="success" size="small" onClick={() => handleApprove('drug', di.id)}>
                                Approve
                              </Button>
                              <Button variant="outlined" color="error" size="small" onClick={() => handleReject('drug', di.id)}>
                                Reject
                              </Button>
                            </Stack>
                          </Stack>
                          <Typography variant="body2" color="text.secondary">{di.note}</Typography>
                        </Box>
                      ))}
                      {pendingDrugInteractions.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                          No pending drug interactions
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Approved Drug-Drug Interactions */}
              {approvedDrugInteractions.length > 0 && (
                <motion.div variants={cardVariants}>
                  <Card sx={{ boxShadow: 2, borderRadius: 1.5, border: 'none' }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 900, color: '#06D6A0', mb: 3 }}>
                        Approved Drug-Drug Interactions
                      </Typography>
                      <Stack spacing={2}>
                        {approvedDrugInteractions.map((di) => (
                          <Box key={di.id} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: '#f0fdf4' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="start">
                              <Box>
                                <Typography sx={{ fontWeight: 700, color: '#1A1A2E', mb: 0.5 }}>{di.patientName}</Typography>
                                <Typography variant="body2" color="text.secondary">{di.drug1} + {di.drug2}</Typography>
                                <Chip label={di.severity} color={di.severity === 'Severe' ? 'error' : di.severity === 'Mild' ? 'warning' : 'success'} size="small" sx={{ mt: 1 }} />
                              </Box>
                              <Chip label="Approved" color="success" size="small" />
                            </Stack>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{di.note}</Typography>
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Pending Drug-Food Interactions */}
              <motion.div variants={cardVariants}>
                <Card sx={{ boxShadow: 2, borderRadius: 1.5, border: 'none' }}>
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 900, color: '#06D6A0', mb: 3 }}>
                      Pending Drug-Food Interactions
                    </Typography>
                    <Stack spacing={2}>
                      {pendingFoodInteractions.map((dfi) => (
                        <Box key={dfi.id} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: '#ffffff' }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 2 }} flexWrap="wrap" gap={2}>
                            <Box>
                              <Typography sx={{ fontWeight: 700, color: '#1A1A2E', mb: 0.5 }}>{dfi.patientName}</Typography>
                              <Typography variant="body2" color="text.secondary">{dfi.drug} + {dfi.food}</Typography>
                              <Chip label={dfi.type} color={dfi.type === 'avoid' ? 'warning' : 'success'} size="small" sx={{ mt: 1 }} />
                            </Box>
                            <Stack direction="row" spacing={1}>
                              <Button variant="contained" color="success" size="small" onClick={() => handleApprove('food', dfi.id)}>
                                Approve
                              </Button>
                              <Button variant="outlined" color="error" size="small" onClick={() => handleReject('food', dfi.id)}>
                                Reject
                              </Button>
                            </Stack>
                          </Stack>
                          <Typography variant="body2" color="text.secondary">{dfi.description}</Typography>
                        </Box>
                      ))}
                      {pendingFoodInteractions.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                          No pending food interactions
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Approved Drug-Food Interactions */}
              {approvedFoodInteractions.length > 0 && (
                <motion.div variants={cardVariants}>
                  <Card sx={{ boxShadow: 2, borderRadius: 1.5, border: 'none' }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 900, color: '#06D6A0', mb: 3 }}>
                        Approved Drug-Food Interactions
                      </Typography>
                      <Stack spacing={2}>
                        {approvedFoodInteractions.map((dfi) => (
                          <Box key={dfi.id} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: '#f0fdf4' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="start">
                              <Box>
                                <Typography sx={{ fontWeight: 700, color: '#1A1A2E', mb: 0.5 }}>{dfi.patientName}</Typography>
                                <Typography variant="body2" color="text.secondary">{dfi.drug} + {dfi.food}</Typography>
                                <Chip label={dfi.type} color={dfi.type === 'avoid' ? 'warning' : 'success'} size="small" sx={{ mt: 1 }} />
                              </Box>
                              <Chip label="Approved" color="success" size="small" />
                            </Stack>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{dfi.description}</Typography>
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </Stack>
          </motion.div>
        </Box>
      </Box>

      {/* Set Reminder Modal */}
      <SetReminderModal
        open={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
      />
    </Box>
  )
}

// Set Reminder Modal Component
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Alert, Autocomplete } from '@mui/material'
import { LocalizationProvider, TimePicker, DatePicker } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

interface SetReminderModalProps {
  open: boolean
  onClose: () => void
}

interface ApprovedPatient {
  patientId: string
  patientEmail: string
  patientName: string
  appointmentId: string
}

function SetReminderModal({ open, onClose }: SetReminderModalProps) {
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<ApprovedPatient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<ApprovedPatient | null>(null)

  // Form fields  
  const [medicineName, setMedicineName] = useState('')
  const [dose, setDose] = useState('')
  const [frequency, setFrequency] = useState<1 | 2 | 3>(1)
  const [times, setTimes] = useState<Date[]>([new Date()])
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [duration, setDuration] = useState(7)

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  // Load approved patients when modal opens
  useEffect(() => {
    if (open) {
      loadApprovedPatients()
      // Reset form
      setSelectedPatient(null)
      setMedicineName('')
      setDose('')
      setFrequency(1)
      setTimes([new Date()])
      setStartDate(new Date())
      setDuration(7)
    }
  }, [open])

  // Update times array when frequency changes
  useEffect(() => {
    const newTimes = Array(frequency).fill(null).map((_, i) => {
      if (times[i]) return times[i]
      const defaultTime = new Date()
      defaultTime.setHours(9 + i * 6, 0, 0, 0) // 9 AM, 3 PM, 9 PM
      return defaultTime
    })
    setTimes(newTimes)
  }, [frequency])

  const loadApprovedPatients = async () => {
    try {
      const doctorEmail = localStorage.getItem('userEmail')
      const response = await fetch(`http://localhost:5000/api/reminders/approved-patients?doctorEmail=${encodeURIComponent(doctorEmail || '')}`)
      const data = await response.json()
      if (data.success) {
        setPatients(data.data)
      }
    } catch (error) {
      console.error('Error loading approved patients:', error)
      setSnackbar({ open: true, message: 'Failed to load patients', severity: 'error' })
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const doctorEmail = localStorage.getItem('userEmail')
      const doctorName = localStorage.getItem('userName')

      const formattedTimes = times.map(t => {
        const hours = t.getHours().toString().padStart(2, '0')
        const minutes = t.getMinutes().toString().padStart(2, '0')
        return `${hours}:${minutes}`
      })

      const formattedStartDate = startDate.toISOString().split('T')[0]

      const response = await fetch('http://localhost:5000/api/reminders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorEmail,
          doctorName,
          patientId: selectedPatient?.patientId,
          patientEmail: selectedPatient?.patientEmail,
          patientName: selectedPatient?.patientName,
          appointmentId: selectedPatient?.appointmentId,
          medicineName,
          dose,
          frequency,
          times: formattedTimes,
          startDate: formattedStartDate,
          duration
        })
      })

      const data = await response.json()

      if (data.success) {
        setSnackbar({ open: true, message: `Successfully created ${data.data.count} reminders!`, severity: 'success' })
        setTimeout(() => onClose(), 1500)
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
            {/* Section 1: Select Patient */}
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

            {/* Section 2: Medicine Details */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ color: '#06D6A0', fontWeight: 700 }}>
                2. Medicine Details
              </Typography>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label="Medicine Name"
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  required
                  fullWidth
                />
                <TextField
                  label="Dose"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  placeholder="e.g., 1 tablet, 2 capsules"
                  required
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel>Frequency (times per day)</InputLabel>
                  <Select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as 1 | 2 | 3)}
                    label="Frequency (times per day)"
                  >
                    <MenuItem value={1}>Once daily</MenuItem>
                    <MenuItem value={2}>Twice daily</MenuItem>
                    <MenuItem value={3}>Three times daily</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Box>

            {/* Section 3: Reminder Times */}
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

            {/* Section 4: Duration */}
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
                    This will create <strong>{getTotalReminders()} reminders</strong> from{' '}
                    {startDate.toLocaleDateString()} for {duration} days
                  </Alert>
                </Stack>
              </LocalizationProvider>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !selectedPatient || !medicineName || !dose}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Reminders'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  )
}
