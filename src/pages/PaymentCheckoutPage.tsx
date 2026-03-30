import { type ReactNode, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import PaymentsIcon from '@mui/icons-material/Payments'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import BackButton from '../ui/BackButton'
import DoctorReviewPrompt from '../components/DoctorReviewPrompt'
import { clearCart, getCart, syncCartFromServer } from '../services/cartService'
import {
  createPaymentIntent,
  savePaymentMethod,
  type Medicine,
} from '../services/paymentService'

const pkrFormatter = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
})

const formatPkr = (value: number) => pkrFormatter.format(value || 0)

type CheckoutMethod = 'card' | 'paypal' | 'nayapay'

const methodConfig: Array<{
  value: CheckoutMethod
  title: string
  subtitle: string
  icon: ReactNode
}> = [
  {
    value: 'card',
    title: 'Card Payment',
    subtitle: 'Visa, Mastercard, Amex and other major cards',
    icon: <CreditCardIcon />,
  },
  {
    value: 'paypal',
    title: 'PayPal',
    subtitle: 'Pay securely with your PayPal account',
    icon: <PaymentsIcon />,
  },
  {
    value: 'nayapay',
    title: 'NayaPay',
    subtitle: 'Pay using NayaPay digital wallet',
    icon: <AccountBalanceWalletIcon />,
  },
]

export default function PaymentCheckoutPage() {
  const theme = useTheme()
  const navigate = useNavigate()

  const [method, setMethod] = useState<CheckoutMethod>('card')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saveMethod, setSaveMethod] = useState(true)

  const [cardHolderName, setCardHolderName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiryMonth, setExpiryMonth] = useState('')
  const [expiryYear, setExpiryYear] = useState('')
  const [cvc, setCvc] = useState('')

  const [paypalEmail, setPaypalEmail] = useState('')
  const [nayaPayId, setNayaPayId] = useState('')
  const [phone, setPhone] = useState('')
  const [cartLoaded, setCartLoaded] = useState(false)
  const [doctorApprovalStatus, setDoctorApprovalStatus] = useState<'not-requested' | 'pending' | 'approved' | 'rejected' | 'modified'>('not-requested')

  const cartData = getCart()

  useEffect(() => {
    const hydrateCart = async () => {
      await syncCartFromServer()
      setCartLoaded(true)
    }

    hydrateCart()
  }, [])

  const items = useMemo(() => {
    return Object.values(cartData)
      .map((entry) => ({
        medicine: entry.medicine as Medicine,
        quantity: entry.quantity,
        subtotal: entry.quantity * (entry.medicine?.sellingPrice || 0),
      }))
      .filter((item) => item.quantity > 0)
  }, [cartData])

  const total = useMemo(() => items.reduce((sum, item) => sum + item.subtotal, 0), [items])

  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail') || ''
    setPaypalEmail(userEmail)
  }, [])

  const validateForm = () => {
    if (items.length === 0) {
      setError('Your cart is empty. Add medicines before proceeding to payment.')
      return false
    }

    if (doctorApprovalStatus !== 'approved') {
      setError('Please confirm with your assigned doctor and get approval before proceeding to payment.')
      return false
    }

    if (method === 'card') {
      const normalizedCard = cardNumber.replace(/\s+/g, '')
      if (!cardHolderName.trim()) {
        setError('Card holder name is required.')
        return false
      }
      if (!/^\d{13,19}$/.test(normalizedCard)) {
        setError('Please enter a valid card number.')
        return false
      }
      if (!/^\d{2}$/.test(expiryMonth) || Number(expiryMonth) < 1 || Number(expiryMonth) > 12) {
        setError('Please enter a valid expiry month (MM).')
        return false
      }
      if (!/^\d{2,4}$/.test(expiryYear)) {
        setError('Please enter a valid expiry year (YY or YYYY).')
        return false
      }
      if (!/^\d{3,4}$/.test(cvc)) {
        setError('Please enter a valid CVC code.')
        return false
      }
    }

    if (method === 'paypal' && !/^\S+@\S+\.\S+$/.test(paypalEmail.trim())) {
      setError('Please enter a valid PayPal email.')
      return false
    }

    if (method === 'nayapay' && !nayaPayId.trim()) {
      setError('Please enter your NayaPay wallet ID.')
      return false
    }

    setError(null)
    return true
  }

  const handleProceedPayment = async () => {
    if (!validateForm()) return

    const userEmail = localStorage.getItem('userEmail') || ''
    const userId = localStorage.getItem('userId') || ''
    if (!userEmail) {
      setError('User email not found. Please login again before checkout.')
      return
    }
    if (!userId) {
      setError('User identity not found. Please login again before checkout.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const medicinesPayload = items.map((item) => ({
        medicineId: item.medicine._id,
        quantity: item.quantity,
        price: item.medicine.sellingPrice,
      }))

      const gateway = method === 'card' ? 'stripe' : method
      const paymentIntent = await createPaymentIntent({
        userId,
        userEmail,
        amount: total,
        currency: 'PKR',
        paymentGateway: gateway,
        medicines: medicinesPayload,
        customerEmail: userEmail,
        customerPhone: phone || undefined,
        description: `Medicine checkout (${items.length} items)`,
      })

      if (saveMethod) {
        if (method === 'card') {
          const normalized = cardNumber.replace(/\s+/g, '')
          const last4 = normalized.slice(-4)
          const brand = normalized.startsWith('4')
            ? 'Visa'
            : normalized.startsWith('5')
              ? 'Mastercard'
              : 'Card'

          await savePaymentMethod({
            userId,
            userEmail,
            type: 'card',
            provider: brand,
            holderName: cardHolderName,
            last4,
            expiryMonth: Number(expiryMonth),
            expiryYear: Number(expiryYear.length === 2 ? `20${expiryYear}` : expiryYear),
            setDefault: true,
          })
        }

        if (method === 'paypal') {
          await savePaymentMethod({
            userId,
            userEmail,
            type: 'paypal',
            provider: 'PayPal',
            holderName: paypalEmail,
            walletIdMasked: paypalEmail.replace(/(.{2}).*(@.*)/, '$1***$2'),
            setDefault: true,
          })
        }

        if (method === 'nayapay') {
          await savePaymentMethod({
            userId,
            userEmail,
            type: 'nayapay',
            provider: 'NayaPay',
            holderName: nayaPayId,
            walletIdMasked: `${nayaPayId.slice(0, 2)}***${nayaPayId.slice(-2)}`,
            setDefault: true,
          })
        }
      }

      if (paymentIntent.redirectUrl) {
        window.location.href = paymentIntent.redirectUrl
        return
      }

      setSuccess('Payment processed successfully. Your order has been placed.')
      clearCart()
      setTimeout(() => {
        navigate('/shop/orders')
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Unable to complete payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 4, px: 2 }}>
      <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
        <BackButton />

        <Stack spacing={3} sx={{ mt: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                Secure Checkout
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Complete your payment using NayaPay, PayPal, or card methods.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: { xs: 1, md: 0 } }}>
              <VerifiedUserIcon color="success" />
              <Typography variant="body2" color="text.secondary">
                We store only masked payment details. Full card number and CVC are never stored.
              </Typography>
            </Stack>
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Payment Method
                  </Typography>

                  <Stack spacing={1.5} sx={{ mb: 3 }}>
                    {methodConfig.map((entry) => (
                      <Card
                        key={entry.value}
                        variant="outlined"
                        onClick={() => setMethod(entry.value)}
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 2,
                          borderColor: method === entry.value ? 'primary.main' : 'divider',
                          bgcolor: method === entry.value ? alpha(theme.palette.primary.main, 0.08) : 'background.paper',
                        }}
                      >
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            {entry.icon}
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                {entry.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {entry.subtitle}
                              </Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>

                  {method === 'card' && (
                    <Stack spacing={2}>
                      <TextField label="Card Holder Name" value={cardHolderName} onChange={(e) => setCardHolderName(e.target.value)} fullWidth />
                      <TextField label="Card Number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} fullWidth placeholder="4111 1111 1111 1111" />
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 4 }}>
                          <TextField label="MM" value={expiryMonth} onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, '').slice(0, 2))} fullWidth />
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                          <TextField label="YY" value={expiryYear} onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, '').slice(0, 4))} fullWidth />
                        </Grid>
                        <Grid size={{ xs: 4 }}>
                          <TextField label="CVC" value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} fullWidth />
                        </Grid>
                      </Grid>
                    </Stack>
                  )}

                  {method === 'paypal' && (
                    <Stack spacing={2}>
                      <TextField label="PayPal Email" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} fullWidth />
                    </Stack>
                  )}

                  {method === 'nayapay' && (
                    <Stack spacing={2}>
                      <TextField label="NayaPay Wallet ID" value={nayaPayId} onChange={(e) => setNayaPayId(e.target.value)} fullWidth />
                    </Stack>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Stack spacing={1.5}>
                    <TextField label="Contact Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
                    <FormControlLabel
                      control={<Checkbox checked={saveMethod} onChange={(e) => setSaveMethod(e.target.checked)} />}
                      label="Save this payment method securely to my account"
                    />
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleProceedPayment}
                      disabled={loading || doctorApprovalStatus !== 'approved'}
                      startIcon={loading ? <CircularProgress size={18} /> : <PaymentsIcon />}
                    >
                      {doctorApprovalStatus !== 'approved' ? 'Awaiting Doctor Approval' : `Proceed to Pay ${formatPkr(total)}`}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Card sx={{ borderRadius: 3, position: 'sticky', top: 16 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Order Summary
                  </Typography>
                  {!cartLoaded && (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">Syncing your cart...</Typography>
                    </Stack>
                  )}
                  <Stack spacing={1.2}>
                    {items.map((item) => (
                      <Stack key={item.medicine._id} direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.medicine.medicineName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Qty {item.quantity} x {formatPkr(item.medicine.sellingPrice)}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {formatPkr(item.subtotal)}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Total
                    </Typography>
                    <Typography variant="h5" color="primary" sx={{ fontWeight: 800 }}>
                      {formatPkr(total)}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Doctor Review Section */}
          <Box sx={{ mt: 2 }}>
            <DoctorReviewPrompt
              feature="medication-pharmacy"
              patientQuery={`Checkout Purchase - ${items.length} item(s)`}
              aiResultText={items.length > 0 ? items
                .map((item) => `${item.medicine.medicineName} - Qty ${item.quantity} - ${formatPkr(item.medicine.sellingPrice)} each - Subtotal ${formatPkr(item.subtotal)}`)
                .join('\n') : ''}
              aiResultData={items.length > 0 ? {
                medicines: items.map((item) => ({
                  medicineId: item.medicine._id,
                  medicineName: item.medicine.medicineName,
                  quantity: item.quantity,
                  price: item.medicine.sellingPrice,
                  subtotal: item.subtotal,
                })),
                totalAmount: total,
                cartSize: items.length,
              } : undefined}
              onStatusChange={(status) => setDoctorApprovalStatus(status)}
            />
          </Box>
        </Stack>
      </Box>
    </Box>
  )
}
