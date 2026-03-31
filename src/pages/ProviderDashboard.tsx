import { Box, Button, Card, CardContent, Chip, IconButton, Stack, Typography, Avatar, Badge, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import MenuIcon from '@mui/icons-material/Menu'
import NotificationsIcon from '@mui/icons-material/Notifications'
import PersonIcon from '@mui/icons-material/Person'
import LogoutIcon from '@mui/icons-material/Logout'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import MedicationIcon from '@mui/icons-material/Medication'
import InventoryIcon from '@mui/icons-material/Inventory'
import PaymentIcon from '@mui/icons-material/Payment'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import WarningIcon from '@mui/icons-material/Warning'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'
import SettingsIcon from '@mui/icons-material/Settings'
import { clearAuthData } from '../utils/auth'

interface Medicine {
  id: number
  name: string
  category: string
  stock: number
  price: number
  status: 'available' | 'low_stock' | 'out_of_stock'
  lastUpdated: string
}

interface MedicineRequest {
  id: number
  patientName: string
  medicineName: string
  quantity: number
  requestedDate: string
  status: 'pending' | 'approved' | 'rejected'
}

interface Payment {
  id: number
  patientName: string
  medicines: string
  amount: number
  paymentMethod: string
  status: 'pending' | 'verified' | 'failed'
  date: string
}

export default function ProviderDashboard() {
  const navigate = useNavigate()
  const [selectedTab, setSelectedTab] = useState('dashboard')
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null)
  
  const [medicines, setMedicines] = useState<Medicine[]>([
    { id: 1, name: 'Aspirin', category: 'Pain Relief', stock: 500, price: 5.99, status: 'available', lastUpdated: '2025-01-10' },
    { id: 2, name: 'Lisinopril', category: 'Blood Pressure', stock: 50, price: 12.50, status: 'low_stock', lastUpdated: '2025-01-12' },
    { id: 3, name: 'Metformin', category: 'Diabetes', stock: 0, price: 8.75, status: 'out_of_stock', lastUpdated: '2025-01-08' },
    { id: 4, name: 'Ibuprofen', category: 'Pain Relief', stock: 350, price: 6.50, status: 'available', lastUpdated: '2025-01-15' },
    { id: 5, name: 'Atorvastatin', category: 'Cholesterol', stock: 200, price: 15.00, status: 'available', lastUpdated: '2025-01-14' },
    { id: 6, name: 'Omeprazole', category: 'Digestive', stock: 30, price: 9.99, status: 'low_stock', lastUpdated: '2025-01-11' },
  ])

  const [requests, setRequests] = useState<MedicineRequest[]>([
    { id: 1, patientName: 'John Doe', medicineName: 'Aspirin', quantity: 2, requestedDate: '2025-01-15', status: 'pending' },
    { id: 2, patientName: 'Jane Smith', medicineName: 'Lisinopril', quantity: 1, requestedDate: '2025-01-16', status: 'pending' },
    { id: 3, patientName: 'Robert Johnson', medicineName: 'Ibuprofen', quantity: 3, requestedDate: '2025-01-16', status: 'pending' },
    { id: 4, patientName: 'Emily Davis', medicineName: 'Atorvastatin', quantity: 1, requestedDate: '2025-01-14', status: 'approved' },
  ])

  const [payments, setPayments] = useState<Payment[]>([
    { id: 1, patientName: 'John Doe', medicines: 'Aspirin x2', amount: 11.98, paymentMethod: 'Credit Card', status: 'pending', date: '2025-01-15' },
    { id: 2, patientName: 'Jane Smith', medicines: 'Lisinopril x1', amount: 12.50, paymentMethod: 'Cash', status: 'pending', date: '2025-01-16' },
    { id: 3, patientName: 'Emily Davis', medicines: 'Atorvastatin x1', amount: 15.00, paymentMethod: 'Insurance', status: 'verified', date: '2025-01-14' },
    { id: 4, patientName: 'Michael Brown', medicines: 'Ibuprofen x2', amount: 13.00, paymentMethod: 'Debit Card', status: 'pending', date: '2025-01-16' },
  ])

  const userName = useMemo(() => {
    return (localStorage.getItem('userName') || 'Provider')
  }, [])

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

  const handleLogout = () => {
    clearAuthData()
    handleCloseProfileMenu()
    navigate('/login')
  }

  const featureItems = [
    { label: 'Provider Dashboard', description: 'Overview of inventory, requests and payments.', icon: <InventoryIcon color="primary" />, value: 'dashboard' as const },
    { label: 'Medicine Inventory', description: 'Manage stock levels and product details.', icon: <MedicationIcon color="success" />, value: 'inventory' as const },
    { label: 'Medicine Requests', description: 'Approve or reject patient medicine requests.', icon: <LocalHospitalIcon color="info" />, value: 'requests' as const },
    { label: 'Payment Verification', description: 'Verify and track incoming payments.', icon: <PaymentIcon color="warning" />, value: 'payments' as const },
    { label: 'Notifications', description: 'Open notification center.', icon: <NotificationsIcon color="error" />, href: '/tools/notifications' as const },
    { label: 'Profile', description: 'Update provider profile and settings.', icon: <PersonIcon color="info" />, href: '/profile/provider' as const },
    { label: 'Logout', description: 'Sign out from the provider console.', icon: <LogoutIcon color="secondary" />, href: '/login' as const },
  ]

  const handleApproveRequest = (id: number) => {
    setRequests(requests.map(req => 
      req.id === id ? { ...req, status: 'approved' as const } : req
    ))
  }

  const handleRejectRequest = (id: number) => {
    setRequests(requests.map(req => 
      req.id === id ? { ...req, status: 'rejected' as const } : req
    ))
  }

  const handleVerifyPayment = (id: number) => {
    setPayments(payments.map(pay => 
      pay.id === id ? { ...pay, status: 'verified' as const } : pay
    ))
  }

  const handleRejectPayment = (id: number) => {
    setPayments(payments.map(pay => 
      pay.id === id ? { ...pay, status: 'failed' as const } : pay
    ))
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const pendingPayments = payments.filter(p => p.status === 'pending')
  const lowStockMedicines = medicines.filter(m => m.status === 'low_stock' || m.status === 'out_of_stock')
  const availableMedicines = medicines.filter(m => m.status === 'available')

  const stockData = [
    { name: 'Available', value: availableMedicines.length, color: '#10b981' },
    { name: 'Low Stock', value: medicines.filter(m => m.status === 'low_stock').length, color: '#f59e0b' },
    { name: 'Out of Stock', value: medicines.filter(m => m.status === 'out_of_stock').length, color: '#ef4444' },
  ]

  const salesData = [
    { month: 'Jan', sales: 12500, orders: 145 },
    { month: 'Feb', sales: 15800, orders: 178 },
    { month: 'Mar', sales: 14200, orders: 165 },
    { month: 'Apr', sales: 18900, orders: 210 },
    { month: 'May', sales: 21000, orders: 235 },
    { month: 'Jun', sales: 23500, orders: 268 },
  ]

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
                  bgcolor: '#1947D2',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <LocalHospitalIcon sx={{ color: '#ffffff' }} />
              </Box>
              <Box>
              <Typography sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' }, fontWeight: 900, color: '#1947D2' }}>
                Provider Dashboard
              </Typography>
                <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
                  Manage pharmacy inventory, requests and billing
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Badge badgeContent={pendingRequests.length + pendingPayments.length + lowStockMedicines.length} color="error">
                <IconButton><NotificationsIcon /></IconButton>
              </Badge>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                onClick={handleOpenProfileMenu}
                sx={{ cursor: 'pointer', px: 1.25, py: 0.75, borderRadius: 2, border: '1px solid', borderColor: 'transparent', '&:hover': { borderColor: '#E2E8F0', bgcolor: '#F8FAFC' } }}
              >
                <Avatar sx={{ bgcolor: '#1947D2', width: 40, height: 40 }}>{userName.charAt(0)}</Avatar>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#1947D2' }}>{userName}</Typography>
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
                        borderRadius: 2,
                        boxShadow: isActive ? 5 : 2,
                        border: isActive ? '2px solid #1947D2' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        p: 0,
                        overflow: 'hidden',
                        bgcolor: '#ffffff',
                        transition: 'transform 0.2s, box-shadow 0.2s, border 0.2s',
                        '&:hover': {
                          transform: 'translateY(-3px)',
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
                )
              })}
            </Box>

            {/* Dashboard View */}
            {selectedTab === 'dashboard' && (
              <Stack spacing={3}>
                {/* Summary Cards */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: { xs: 2, md: 3 } }}>
                  <motion.div variants={cardVariants}>
                    <Card sx={{ borderRadius: 1.5, boxShadow: 2, bgcolor: '#ffffff', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}>
                      <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Box sx={{ width: 48, height: 48, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#1947D2', color: '#ffffff' }}>
                            <MedicationIcon />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>Total Medicines</Typography>
                            <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: '#1947D2', lineHeight: 1 }}>{medicines.length}</Typography>
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
                            <WarningIcon />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>Low Stock Alerts</Typography>
                            <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: '#1947D2', lineHeight: 1 }}>{lowStockMedicines.length}</Typography>
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
                            <LocalHospitalIcon />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>Pending Requests</Typography>
                            <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: '#1947D2', lineHeight: 1 }}>{pendingRequests.length}</Typography>
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
                            <PaymentIcon />
                          </Box>
                          <Box>
                            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>Pending Payments</Typography>
                            <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: '#1947D2', lineHeight: 1 }}>{pendingPayments.length}</Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Box>

                {/* Charts */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
                  <motion.div variants={cardVariants}>
                    <Card sx={{ boxShadow: 2, borderRadius: 1.5, height: 400 }}>
                      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                        <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: '#1947D2', mb: 3 }}>
                          Monthly Sales & Orders
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={salesData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="sales" fill="#1947D2" name="Sales ($)" />
                            <Bar dataKey="orders" fill="#10b981" name="Orders" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={cardVariants}>
                    <Card sx={{ boxShadow: 2, borderRadius: 1.5, height: 400 }}>
                      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                        <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: '#1947D2', mb: 3 }}>
                          Stock Status
                        </Typography>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={stockData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, value }) => `${name}: ${value}`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {stockData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Box>

                {/* Low Stock Alert */}
                {lowStockMedicines.length > 0 && (
                  <motion.div variants={cardVariants}>
                    <Card sx={{ boxShadow: 2, borderRadius: 1.5, bgcolor: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <WarningIcon sx={{ color: '#f59e0b', fontSize: 40 }} />
                          <Box>
                            <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#92400e' }}>
                              Low Stock Alert!
                            </Typography>
                            <Typography color="text.secondary">
                              {lowStockMedicines.length} medicine(s) need restocking. Check inventory for details.
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </Stack>
            )}

            {/* Inventory View */}
            {selectedTab === 'inventory' && (
              <Stack spacing={3}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: '#1947D2' }}>
                    Medicine Inventory
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{
                      bgcolor: '#1947D2',
                      '&:hover': { bgcolor: '#1E40AF' },
                      textTransform: 'none',
                      fontWeight: 700,
                    }}
                  >
                    Add Medicine
                  </Button>
                </Stack>

                <Card sx={{ boxShadow: 2, borderRadius: 1.5 }}>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Medicine Name</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Stock</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Last Updated</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {medicines.map((medicine) => (
                          <TableRow key={medicine.id}>
                            <TableCell sx={{ fontWeight: 600 }}>{medicine.name}</TableCell>
                            <TableCell>{medicine.category}</TableCell>
                            <TableCell>
                              <Typography sx={{ 
                                fontWeight: 700,
                                color: medicine.status === 'out_of_stock' ? '#ef4444' : medicine.status === 'low_stock' ? '#f59e0b' : '#10b981'
                              }}>
                                {medicine.stock}
                              </Typography>
                            </TableCell>
                            <TableCell>${medicine.price.toFixed(2)}</TableCell>
                            <TableCell>
                              <Chip 
                                label={medicine.status.replace('_', ' ')} 
                                size="small" 
                                color={medicine.status === 'available' ? 'success' : medicine.status === 'low_stock' ? 'warning' : 'error'}
                              />
                            </TableCell>
                            <TableCell>{medicine.lastUpdated}</TableCell>
                            <TableCell>
                              <IconButton size="small" color="primary">
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              </Stack>
            )}

            {/* Medicine Requests View */}
            {selectedTab === 'requests' && (
              <Stack spacing={3}>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: '#1947D2' }}>
                  Medicine Requests
                </Typography>

                <Card sx={{ boxShadow: 2, borderRadius: 1.5 }}>
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, mb: 3 }}>Pending Requests</Typography>
                    <Stack spacing={2}>
                      {pendingRequests.map((request) => (
                        <Box key={request.id} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                          <Box>
                            <Typography sx={{ fontWeight: 700, color: '#1947D2', mb: 0.5 }}>{request.patientName}</Typography>
                            <Typography variant="body2" color="text.secondary">Medicine: {request.medicineName}</Typography>
                            <Typography variant="body2" color="text.secondary">Quantity: {request.quantity}</Typography>
                            <Typography variant="body2" color="text.secondary">Date: {request.requestedDate}</Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Button 
                              variant="contained" 
                              color="success" 
                              size="small" 
                              onClick={() => handleApproveRequest(request.id)}
                              startIcon={<CheckCircleIcon />}
                            >
                              Approve
                            </Button>
                            <Button 
                              variant="outlined" 
                              color="error" 
                              size="small" 
                              onClick={() => handleRejectRequest(request.id)}
                              startIcon={<CancelIcon />}
                            >
                              Reject
                            </Button>
                          </Stack>
                        </Box>
                      ))}
                      {pendingRequests.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                          No pending requests
                        </Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>

                {/* Approved Requests */}
                {requests.filter(r => r.status === 'approved').length > 0 && (
                  <Card sx={{ boxShadow: 2, borderRadius: 1.5 }}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                      <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, mb: 3 }}>Approved Requests</Typography>
                      <Stack spacing={2}>
                        {requests.filter(r => r.status === 'approved').map((request) => (
                          <Box key={request.id} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: '#f0fdf4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography sx={{ fontWeight: 700, color: '#1947D2', mb: 0.5 }}>{request.patientName}</Typography>
                              <Typography variant="body2" color="text.secondary">Medicine: {request.medicineName} x {request.quantity}</Typography>
                              <Typography variant="body2" color="text.secondary">Date: {request.requestedDate}</Typography>
                            </Box>
                            <Chip label="Approved" color="success" size="small" />
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                )}
              </Stack>
            )}

            {/* Payment Verification View */}
            {selectedTab === 'payments' && (
              <Stack spacing={3}>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: '#1947D2' }}>
                  Payment Verification
                </Typography>

                <Card sx={{ boxShadow: 2, borderRadius: 1.5 }}>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Patient Name</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Medicines</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Payment Method</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell sx={{ fontWeight: 600 }}>{payment.patientName}</TableCell>
                            <TableCell>{payment.medicines}</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#1947D2' }}>${payment.amount.toFixed(2)}</TableCell>
                            <TableCell>{payment.paymentMethod}</TableCell>
                            <TableCell>{payment.date}</TableCell>
                            <TableCell>
                              <Chip 
                                label={payment.status} 
                                size="small" 
                                color={payment.status === 'verified' ? 'success' : payment.status === 'pending' ? 'warning' : 'error'}
                              />
                            </TableCell>
                            <TableCell>
                              {payment.status === 'pending' && (
                                <Stack direction="row" spacing={1}>
                                  <IconButton 
                                    size="small" 
                                    color="success"
                                    onClick={() => handleVerifyPayment(payment.id)}
                                  >
                                    <CheckCircleIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={() => handleRejectPayment(payment.id)}
                                  >
                                    <CancelIcon fontSize="small" />
                                  </IconButton>
                                </Stack>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              </Stack>
            )}
          </motion.div>
        </Box>
      </Box>
    </Box>
  )
}

