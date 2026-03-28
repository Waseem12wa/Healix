import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material'
import { useTheme, alpha } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'

const MotionTableRow = motion(TableRow)
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import LocalAtmIcon from '@mui/icons-material/LocalAtm'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import InfoIcon from '@mui/icons-material/Info'
import ErrorIcon from '@mui/icons-material/Error'
import DownloadIcon from '@mui/icons-material/Download'
import BackButton from '../ui/BackButton'
import { getUserOrders, getOrderDetails, processRefund } from '../services/paymentService'
import type { Order } from '../services/paymentService'
import { format } from 'date-fns'

export default function OrderHistory() {
  const theme = useTheme()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [page, setPage] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [refunding, setRefunding] = useState<string | null>(null)

  const userId = localStorage.getItem('userId') || ''
  const itemsPerPage = 10

  useEffect(() => {
    loadOrders()
  }, [page])

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getUserOrders(userId, itemsPerPage, page * itemsPerPage)
      setOrders(response.orders)
      setTotalOrders(response.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleRefund = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to request a refund for this order?')) return

    try {
      setRefunding(orderId)
      await processRefund(orderId, 'Customer requested refund')
      alert('Refund request submitted successfully')
      loadOrders()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to process refund')
    } finally {
      setRefunding(null)
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'pending':
        return 'warning'
      case 'failed':
        return 'error'
      default:
        return 'default'
    }
  }

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'success'
      case 'shipped':
        return 'info'
      case 'confirmed':
        return 'warning'
      case 'cancelled':
        return 'error'
      default:
        return 'default'
    }
  }

  const getGatewayIcon = (gateway: string) => {
    switch (gateway) {
      case 'stripe':
        return '💳'
      case 'paypal':
        return '🅿️'
      case 'nayapay':
        return '🟢'
      default:
        return '💰'
    }
  }

  return (
    <Box>
      <Stack spacing={3}>
        <Box>
          <BackButton />
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                Order History
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Manage and track your medicine purchases
              </Typography>
            </Box>
            <ShoppingCartIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.2 }} />
          </Stack>
        </Box>

        {/* Summary Cards */}
        {loading && orders.length === 0 ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
            <CircularProgress size={50} />
            <Typography sx={{ mt: 2 }}>Loading orders...</Typography>
          </Stack>
        ) : error ? (
          <Alert severity="error" icon={<ErrorIcon />}>
            {error}
          </Alert>
        ) : orders.length === 0 ? (
          <Card
            sx={{
              textAlign: 'center',
              py: 8,
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
              border: `2px dashed ${theme.palette.primary.main}`,
            }}
          >
            <ShoppingCartIcon sx={{ fontSize: 64, color: 'primary.main', opacity: 0.5, mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              No orders yet
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Start shopping for medicines to see your order history here
            </Typography>
          </Card>
        ) : (
          <>
            {/* Orders Table */}
            <TableContainer component={Card}>
              <Table>
                <TableHead sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.08) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Order #</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      Amount
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Payment Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Order Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <AnimatePresence>
                    {orders.map((order, index) => (
                      <MotionTableRow
                        key={order._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                        sx={{
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.04),
                          },
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {order.orderNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{order.medicines.length} item(s)</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {getGatewayIcon(order.paymentGateway)} ${order.finalAmount.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={order.paymentStatus.toUpperCase()}
                            color={getPaymentStatusColor(order.paymentStatus) as any}
                            variant="outlined"
                            icon={
                              order.paymentStatus === 'completed' ? <CheckCircleIcon /> : undefined
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={order.orderStatus.toUpperCase()}
                            color={getOrderStatusColor(order.orderStatus) as any}
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => setSelectedOrder(order)}
                                color="primary"
                              >
                                <InfoIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download Invoice">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  alert('Invoice download feature coming soon!')
                                }}
                              >
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {order.paymentStatus === 'completed' && order.orderStatus !== 'cancelled' && (
                              <Tooltip title="Request Refund">
                                <span>
                                  <Button
                                    size="small"
                                    onClick={() => handleRefund(order._id)}
                                    disabled={refunding === order._id}
                                    sx={{ textTransform: 'none' }}
                                  >
                                    {refunding === order._id ? 'Processing...' : 'Refund'}
                                  </Button>
                                </span>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </MotionTableRow>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 3 }}>
              <Button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                variant="outlined"
              >
                Previous
              </Button>
              <Typography sx={{ py: 1, px: 2 }}>
                Page {page + 1} of {Math.ceil(totalOrders / itemsPerPage)}
              </Typography>
              <Button
                disabled={page >= Math.ceil(totalOrders / itemsPerPage) - 1}
                onClick={() => setPage(page + 1)}
                variant="outlined"
              >
                Next
              </Button>
            </Stack>
          </>
        )}
      </Stack>

      {/* Order Details Dialog */}
      <Dialog
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedOrder && (
          <>
            <DialogTitle>
              <Stack>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Order {selectedOrder.orderNumber}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {format(new Date(selectedOrder.createdAt), 'EEEE, MMMM dd, yyyy - h:mm a')}
                </Typography>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={3} sx={{ mt: 2 }}>
                {/* Status Info */}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                      Payment Status
                    </Typography>
                    <Chip
                      label={selectedOrder.paymentStatus.toUpperCase()}
                      color={getPaymentStatusColor(selectedOrder.paymentStatus) as any}
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                      Order Status
                    </Typography>
                    <Chip
                      label={selectedOrder.orderStatus.toUpperCase()}
                      color={getOrderStatusColor(selectedOrder.orderStatus) as any}
                      size="small"
                    />
                  </Grid>
                </Grid>

                <Divider />

                {/* Medicines */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    Medicines
                  </Typography>
                  <Stack spacing={1}>
                    {selectedOrder.medicines.map((med, idx) => (
                      <Card key={idx} variant="outlined" sx={{ p: 1.5 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {med.medicineName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Qty: {med.quantity}
                            </Typography>
                          </Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            ${(med.unitPrice * med.quantity).toFixed(2)}
                          </Typography>
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                </Box>

                <Divider />

                {/* Pricing Summary */}
                <Box>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Subtotal</Typography>
                      <Typography variant="body2">${selectedOrder.totalAmount.toFixed(2)}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Discount</Typography>
                      <Typography variant="body2" color="success.main">
                        -${(selectedOrder.totalAmount - selectedOrder.finalAmount).toFixed(2)}
                      </Typography>
                    </Stack>
                    <Divider />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Total
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        ${selectedOrder.finalAmount.toFixed(2)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>

                {/* Payment Method */}
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                    Payment Method
                  </Typography>
                  <Chip
                    label={`${getGatewayIcon(selectedOrder.paymentGateway)} ${selectedOrder.paymentGateway.toUpperCase()}`}
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </Stack>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  )
}
