import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Card, CardContent, CircularProgress, List, ListItem, ListItemText, Stack, Typography } from '@mui/material'
import GridLegacy from '@mui/material/GridLegacy'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import BackButton from '../../ui/BackButton'

interface OverviewPayload {
  metrics: {
    totalMedicines: number
    totalOrders: number
    completedOrders: number
    pendingApprovals: number
    lowStockMedicines: number
    totalEarnings: number
    adminCommission: number
    grossRevenue: number
  }
  monthlyTrend: Array<{
    date: string
    totalSales: number
    orderCount: number
  }>
  notifications: Array<{
    _id: string
    title: string
    message: string
    createdAt: string
    read: boolean
  }>
}

const metricCards = [
  { key: 'totalMedicines', label: 'Total Medicines Listed', icon: <LocalPharmacyIcon color="primary" /> },
  { key: 'totalOrders', label: 'Total Orders', icon: <Inventory2Icon color="info" /> },
  { key: 'completedOrders', label: 'Completed Orders', icon: <DoneAllIcon color="success" /> },
  { key: 'pendingApprovals', label: 'Pending Approvals', icon: <PendingActionsIcon color="warning" /> },
  { key: 'totalEarnings', label: 'Total Earnings (75%)', icon: <MonetizationOnIcon color="success" /> },
  { key: 'grossRevenue', label: 'Gross Revenue', icon: <TrendingUpIcon color="primary" /> },
] as const

export default function ProviderOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<OverviewPayload | null>(null)

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token') || localStorage.getItem('authToken')
        const response = await fetch('/api/provider/overview', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        const payload = await response.json()
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || 'Failed to load overview')
        }

        setData(payload.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load overview')
      } finally {
        setLoading(false)
      }
    }

    loadOverview()
  }, [])

  const trendData = useMemo(() => (data?.monthlyTrend || []).map((item) => ({
    date: item.date.slice(5),
    totalSales: item.totalSales,
  })), [data])

  if (loading) {
    return (
      <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  const metrics = data?.metrics

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 1.5 }}>
        <BackButton />
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 800, color: '#00B4D8', mb: 2 }}>
        Dashboard Overview & Analytics
      </Typography>

      <GridLegacy container spacing={2} sx={{ mb: 3 }}>
        {metricCards.map((card) => (
          <GridLegacy item xs={12} sm={6} md={4} key={card.key}>
            <Card sx={{ borderRadius: 2, border: '1px solid #E2E8F0' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                  {card.icon}
                </Stack>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {card.key.includes('Earnings') || card.key.includes('Revenue')
                    ? `PKR ${Number(metrics?.[card.key as keyof typeof metrics] || 0).toLocaleString()}`
                    : Number(metrics?.[card.key as keyof typeof metrics] || 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </GridLegacy>
        ))}
      </GridLegacy>

      <GridLegacy container spacing={2}>
        <GridLegacy item xs={12} md={8}>
          <Card sx={{ borderRadius: 2, border: '1px solid #E2E8F0' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Monthly Sales Trend</Typography>
              <Box sx={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="totalSales" stroke="#00B4D8" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </GridLegacy>

        <GridLegacy item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, border: '1px solid #E2E8F0' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Notifications</Typography>
              <List dense>
                {(data?.notifications || []).map((item) => (
                  <ListItem key={item._id} sx={{ px: 0 }}>
                    <ListItemText
                      primary={item.title}
                      secondary={`${item.message} • ${new Date(item.createdAt).toLocaleString()}`}
                    />
                  </ListItem>
                ))}
                {!data?.notifications?.length && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    No notifications yet.
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </GridLegacy>
      </GridLegacy>
    </Box>
  )
}
