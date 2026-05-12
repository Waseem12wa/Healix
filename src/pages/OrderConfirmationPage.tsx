import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import EmailIcon from '@mui/icons-material/Email'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy'
import HomeIcon from '@mui/icons-material/Home'
import HistoryIcon from '@mui/icons-material/History'
import { useNavigate, useParams } from 'react-router-dom'
import BackButton from '../ui/BackButton'
import { getOrderDetails, type Order } from '../services/paymentService'

const pkrFormatter = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
})
const formatPkr = (value: number) => pkrFormatter.format(value || 0)

type OrderWithExtras = Order & {
  finalAmount?: number
  totalAmount?: number
  currency?: string
  paymentCompletedAt?: string
  paymentIntentId?: string
  transactionId?:
    | string
    | {
        _id?: string
        cardDetails?: { last4Digits?: string; cardBrand?: string }
      }
}

export default function OrderConfirmationPage() {
  const { orderId = '' } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<OrderWithExtras | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) {
      setError('Missing order id.')
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const data = (await getOrderDetails(orderId)) as OrderWithExtras
        if (!cancelled) setOrder(data)
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Unable to load order details.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [orderId])

  const userEmail = localStorage.getItem('userEmail') || 'your registered email'

  const renderBody = () => {
    if (loading) {
      return (
        <Stack alignItems="center" spacing={2} sx={{ py: 8 }}>
          <CircularProgress />
          <Typography color="text.secondary">Loading your order...</Typography>
        </Stack>
      )
    }

    if (error || !order) {
      return (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error || 'Order not found.'}
        </Alert>
      )
    }

    const total = order.finalAmount ?? order.totalAmount ?? 0
    const currency = order.currency || 'PKR'
    const placedAt = order.paymentCompletedAt || order.createdAt
    const txn = typeof order.transactionId === 'object' ? order.transactionId : undefined
    const cardLine = txn?.cardDetails?.last4Digits
      ? `${txn.cardDetails.cardBrand || 'Card'} ending in ${txn.cardDetails.last4Digits}`
      : `Paid via ${order.paymentGateway || 'card'}`

    return (
      <Stack spacing={3}>
        {/* Success banner */}
        <Card
          sx={{
            borderRadius: 3,
            background: 'linear-gradient(135deg, #34D399 0%, #06B6D4 50%, #2563EB 100%)',
            color: '#fff',
            boxShadow: '0 10px 30px rgba(0,119,182,0.25)',
          }}
        >
          <CardContent sx={{ py: { xs: 3, md: 4 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 40, color: '#fff' }} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                  Payment Successful
                </Typography>
                <Typography sx={{ mt: 0.5, opacity: 0.95 }}>
                  You have successfully purchased these items. A confirmation email has been
                  sent to <strong>{userEmail}</strong> &mdash; please check your inbox or
                  spam folder.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Order summary header */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              spacing={2}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <ReceiptLongIcon color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Order Number
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {order.orderNumber || order._id}
                  </Typography>
                </Box>
              </Stack>
              <Stack spacing={0.5} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                <Chip
                  label={`Payment: ${order.paymentStatus}`}
                  color="success"
                  size="small"
                  sx={{ textTransform: 'capitalize', fontWeight: 700 }}
                />
                <Typography variant="caption" color="text.secondary">
                  Placed {placedAt ? new Date(placedAt).toLocaleString() : '-'}
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Items */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <LocalPharmacyIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Purchased Items
              </Typography>
            </Stack>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Medicine</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">
                      Qty
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Unit Price
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Subtotal
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(order.medicines || []).map((line, idx) => {
                    const subtotal =
                      (line as any).subtotal ??
                      Number(line.unitPrice || 0) * Number(line.quantity || 1)
                    return (
                      <TableRow key={String((line as any).medicineId || idx)}>
                        <TableCell>{line.medicineName || 'Medicine'}</TableCell>
                        <TableCell align="center">{line.quantity}</TableCell>
                        <TableCell align="right">{formatPkr(line.unitPrice)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {formatPkr(subtotal)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Box>
          </CardContent>
        </Card>

        {/* Payment + totals */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Payment Details
            </Typography>
            <Stack spacing={1.2}>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Method</Typography>
                <Typography sx={{ fontWeight: 600 }}>{cardLine}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Currency</Typography>
                <Typography sx={{ fontWeight: 600 }}>{currency}</Typography>
              </Stack>
              {order.paymentIntentId && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Reference</Typography>
                  <Typography sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                    {order.paymentIntentId}
                  </Typography>
                </Stack>
              )}
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Total Paid
              </Typography>
              <Typography variant="h5" color="primary" sx={{ fontWeight: 800 }}>
                {formatPkr(total)}
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* Email reassurance */}
        <Alert
          icon={<EmailIcon />}
          severity="info"
          sx={{ borderRadius: 2, '& .MuiAlert-icon': { color: 'primary.main' } }}
        >
          A detailed receipt has been emailed to <strong>{userEmail}</strong>. If you do not
          see it within a few minutes, please check your spam / promotions folder.
        </Alert>

        {/* CTAs */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant="contained"
            startIcon={<HistoryIcon />}
            onClick={() => navigate('/shop/orders')}
            sx={{ fontWeight: 700 }}
          >
            View Order History
          </Button>
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{ fontWeight: 700 }}
          >
            Back to Dashboard
          </Button>
        </Stack>
      </Stack>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 4, px: 2 }}>
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        <BackButton />
        <Box sx={{ mt: 2 }}>{renderBody()}</Box>
      </Box>
    </Box>
  )
}
