import { useEffect, useMemo, useState } from 'react'
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
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import LockIcon from '@mui/icons-material/Lock'
import PaymentsIcon from '@mui/icons-material/Payments'
import { loadStripe } from '@stripe/stripe-js'
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import BackButton from '../ui/BackButton'
import { clearCart, getCart, syncCartFromServer } from '../services/cartService'
import {
  confirmStripePayment,
  createPaymentIntent,
  savePaymentMethod,
  type Medicine,
} from '../services/paymentService'

const stripePublishableKey = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '').trim()
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null

const pkrFormatter = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
})
const formatPkr = (value: number) => pkrFormatter.format(value || 0)

type CartItem = {
  medicine: Medicine
  quantity: number
  subtotal: number
}

interface CheckoutFormProps {
  items: CartItem[]
  total: number
  cartLoaded: boolean
}

function CheckoutForm({ items, total, cartLoaded }: CheckoutFormProps) {
  const theme = useTheme()
  const navigate = useNavigate()
  const stripe = useStripe()
  const elements = useElements()

  const [cardHolderName, setCardHolderName] = useState('')
  const [phone, setPhone] = useState('')
  const [saveMethod, setSaveMethod] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)

  const handlePay = async () => {
    setError(null)
    setSuccess(null)

    if (!stripePromise) {
      setError(
        'Stripe is not configured. Set VITE_STRIPE_PUBLISHABLE_KEY in your frontend env (use a Stripe TEST publishable key).'
      )
      return
    }
    if (!stripe || !elements) {
      setError('Payment form is still loading. Please wait a moment and try again.')
      return
    }

    if (items.length === 0) {
      setError('Your cart is empty. Add medicines before proceeding to payment.')
      return
    }
    if (!cardHolderName.trim()) {
      setError('Card holder name is required.')
      return
    }
    if (!cardComplete) {
      setError('Please enter complete card details.')
      return
    }

    const userEmail = localStorage.getItem('userEmail') || ''
    const userId = localStorage.getItem('userId') || ''
    if (!userEmail || !userId) {
      setError('Session expired. Please log in again before checkout.')
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setError('Card input not ready. Please refresh and try again.')
      return
    }

    setLoading(true)
    try {
      const medicinesPayload = items.map((item) => ({
        medicineId: item.medicine._id,
        quantity: item.quantity,
        price: item.medicine.sellingPrice,
      }))

      // 1. Create the payment intent on the server (also creates the Order if needed).
      const intent = await createPaymentIntent({
        userId,
        userEmail,
        amount: total,
        currency: 'PKR',
        paymentGateway: 'stripe',
        medicines: medicinesPayload,
        customerEmail: userEmail,
        customerPhone: phone || undefined,
        description: `Medicine checkout (${items.length} items)`,
      })

      if (!intent.clientSecret || !intent.paymentIntentId || !intent.transactionId) {
        throw new Error('Server did not return a valid payment intent. Please try again.')
      }

      // 2. Confirm card payment with Stripe (test mode).
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        intent.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: cardHolderName.trim(),
              email: userEmail,
              phone: phone || undefined,
            },
          },
        }
      )

      if (stripeError) {
        throw new Error(stripeError.message || 'Card was declined.')
      }
      if (paymentIntent?.status !== 'succeeded') {
        throw new Error(`Payment did not complete (status: ${paymentIntent?.status || 'unknown'}).`)
      }

      // 3. Tell the server to finalise: marks the order paid, decrements stock, sends email.
      const confirmation = await confirmStripePayment({
        paymentIntentId: intent.paymentIntentId,
        transactionId: intent.transactionId,
      })

      if (!confirmation.success) {
        throw new Error(confirmation.message || 'Server failed to confirm the payment.')
      }

      // 4. Optional: persist masked card to user's saved methods.
      if (saveMethod && paymentIntent?.payment_method) {
        const last4 = confirmation.transaction?.cardDetails?.last4 ?? ''
        const brand = confirmation.transaction?.cardDetails?.brand ?? 'Card'
        if (last4) {
          try {
            await savePaymentMethod({
              userId,
              userEmail,
              type: 'card',
              provider: brand,
              holderName: cardHolderName.trim(),
              last4,
              expiryMonth: confirmation.transaction?.cardDetails?.expiryMonth,
              expiryYear: confirmation.transaction?.cardDetails?.expiryYear,
              setDefault: true,
            })
          } catch {
            // Non-blocking: payment already succeeded.
          }
        }
      }

      // 5. Done — clear cart and route to the confirmation page.
      clearCart()
      const orderId = confirmation.orderId || confirmation.order?._id
      setSuccess('Payment successful! Redirecting to confirmation...')
      if (orderId) {
        navigate(`/shop/orders/${orderId}/confirmation`, { replace: true })
      } else {
        navigate('/shop/orders', { replace: true })
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to complete payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Secure Checkout
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter your card details and click Proceed to Pay. Payments run on Stripe test mode.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: { xs: 1, md: 0 } }}>
          <VerifiedUserIcon sx={{ color: 'primary.main' }} />
          <Typography variant="body2" color="text.secondary">
            Card details are tokenised by Stripe. Healix never stores full card numbers or CVCs.
          </Typography>
        </Stack>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}
      {success && <Alert severity="success">{success}</Alert>}

      {!stripePromise && (
        <Alert severity="warning">
          Stripe publishable key is missing. Set <code>VITE_STRIPE_PUBLISHABLE_KEY</code> in your frontend
          <code>.env.local</code> with a Stripe <strong>test</strong> publishable key (starts with
          <code> pk_test_</code>).
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <CreditCardIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Card Payment
                </Typography>
              </Stack>

              <Stack spacing={2}>
                <TextField
                  label="Card Holder Name"
                  value={cardHolderName}
                  onChange={(e) => setCardHolderName(e.target.value)}
                  fullWidth
                  autoComplete="cc-name"
                />

                <Box
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Card details (Stripe Elements)
                  </Typography>
                  <CardElement
                    onChange={(event) => setCardComplete(event.complete)}
                    options={{
                      hidePostalCode: true,
                      style: {
                        base: {
                          fontSize: '16px',
                          color: theme.palette.text.primary,
                          '::placeholder': { color: theme.palette.text.secondary },
                        },
                        invalid: { color: theme.palette.error.main },
                      },
                    }}
                  />
                </Box>

                <Typography variant="caption" color="text.secondary">
                  Test card: <code>4242 4242 4242 4242</code> &middot; any future expiry &middot; any 3-digit CVC.
                </Typography>

                <TextField
                  label="Contact Phone (optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  fullWidth
                  autoComplete="tel"
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={saveMethod}
                      onChange={(e) => setSaveMethod(e.target.checked)}
                    />
                  }
                  label="Save this card (masked) to my account for next time"
                />

                <Divider sx={{ my: 1 }} />

                <Button
                  variant="contained"
                  size="large"
                  onClick={handlePay}
                  disabled={loading || !stripe || !cartLoaded || items.length === 0 || !stripePromise}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LockIcon />}
                  sx={{ py: 1.4, fontWeight: 700 }}
                >
                  {loading ? 'Processing...' : `Proceed to Pay ${formatPkr(total)}`}
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
                  <Typography variant="body2" color="text.secondary">
                    Syncing your cart...
                  </Typography>
                </Stack>
              )}
              <Stack spacing={1.2}>
                {items.length === 0 && cartLoaded && (
                  <Typography variant="body2" color="text.secondary">
                    Your cart is empty. Add medicines from the shop to checkout.
                  </Typography>
                )}
                {items.map((item) => (
                  <Stack
                    key={item.medicine._id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
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

              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                <PaymentsIcon fontSize="small" color="primary" />
                <Typography variant="caption" color="text.secondary">
                  Powered by Stripe (test mode)
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  )
}

export default function PaymentCheckoutPage() {
  const [cartLoaded, setCartLoaded] = useState(false)
  const cartData = getCart()

  useEffect(() => {
    syncCartFromServer().finally(() => setCartLoaded(true))
  }, [])

  const items = useMemo<CartItem[]>(() => {
    return Object.values(cartData)
      .map((entry) => ({
        medicine: entry.medicine as Medicine,
        quantity: entry.quantity,
        subtotal: entry.quantity * (entry.medicine?.sellingPrice || 0),
      }))
      .filter((item) => item.quantity > 0)
  }, [cartData])

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.subtotal, 0),
    [items]
  )

  // CheckoutForm calls useStripe()/useElements(), which require an <Elements> ancestor.
  // If the publishable key is missing we render a clear warning instead of mounting the
  // form (otherwise React throws "Could not find Elements context").
  if (!stripePromise) {
    return (
      <Box sx={{ minHeight: '100vh', py: 4, px: 2 }}>
        <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
          <BackButton />
          <Box sx={{ mt: 2 }}>
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              Stripe is not configured. Set <code>VITE_STRIPE_PUBLISHABLE_KEY</code> in your
              frontend <code>.env.local</code> with a Stripe <strong>test</strong> publishable
              key (starts with <code>pk_test_</code>), then restart the dev server and reload
              this page.
            </Alert>
          </Box>
        </Box>
      </Box>
    )
  }

  return (
    <Elements stripe={stripePromise}>
      <Box sx={{ minHeight: '100vh', py: 4, px: 2 }}>
        <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
          <BackButton />
          <Box sx={{ mt: 2 }}>
            <CheckoutForm items={items} total={total} cartLoaded={cartLoaded} />
          </Box>
        </Box>
      </Box>
    </Elements>
  )
}
