import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Card,
  CardContent,
  TextField,
  CircularProgress,
  Alert,
  Box,
  Chip,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
  Divider,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import LocalAtmIcon from '@mui/icons-material/LocalAtm'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import {
  getAvailableGateways,
  createPaymentIntent,
} from '../services/paymentService'
import type { PaymentGateway, Medicine } from '../services/paymentService'
import { loadStripe } from '@stripe/stripe-js'
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '')

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  medicines: Medicine[]
  totalAmount: number
  onSuccess: (orderId: string) => void
}

interface PaymentFormData {
  email: string
  phone: string
  gateway: 'stripe' | 'easypaisa' | 'jazzcash'
}

function StripePaymentForm({
  amount,
  medicines,
  formData,
  onSuccess,
  onClose,
}: {
  amount: number
  medicines: Medicine[]
  formData: PaymentFormData
  onSuccess: (orderId: string) => void
  onClose: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    try {
      // Create payment intent
      const intent = await createPaymentIntent({
        amount,
        currency: 'USD',
        paymentGateway: 'stripe',
        medicines: medicines.map((m) => ({
          medicineId: m._id,
          quantity: 1,
          price: m.sellingPrice,
        })),
        email: formData.email,
        phone: formData.phone,
      })

      if (!intent.clientSecret) throw new Error('No client secret received')

      // Confirm payment with stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        intent.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: { email: formData.email },
          },
        }
      )

      if (stripeError) {
        setError(stripeError.message || 'Payment failed')
        setLoading(false)
        return
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess(intent.paymentId)
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2}>
        {error && (
          <Alert severity="error" icon={<ErrorIcon />}>
            {error}
          </Alert>
        )}
        <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
          <CardElement
            options={{
              style: {
                base: { fontSize: '16px', color: '#424242' },
                invalid: { color: '#d32f2f' },
              },
            }}
          />
        </Box>
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={!stripe || loading}
          startIcon={loading ? <CircularProgress size={20} /> : <CreditCardIcon />}
        >
          {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </Button>
      </Stack>
    </form>
  )
}

function GatewayPaymentForm({
  gateway,
  amount,
  medicines,
  formData,
  onClose,
}: {
  gateway: 'easypaisa' | 'jazzcash'
  amount: number
  medicines: Medicine[]
  formData: PaymentFormData
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)

  const handlePayment = async () => {
    setLoading(true)
    try {
      const intent = await createPaymentIntent({
        amount,
        currency: 'PKR',
        paymentGateway: gateway,
        medicines: medicines.map((m) => ({
          medicineId: m._id,
          quantity: 1,
          price: m.sellingPrice,
        })),
        email: formData.email,
        phone: formData.phone,
      })

      if (intent.redirectUrl) {
        setRedirectUrl(intent.redirectUrl)
        onClose()
        // In real scenario, redirect to gateway
        window.location.href = intent.redirectUrl
      }
    } catch (err) {
      console.error('Payment error:', err)
      alert(err instanceof Error ? err.message : 'Payment failed')
      setLoading(false)
    }
  }

  if (redirectUrl) {
    return (
      <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ py: 3 }}>
        <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main' }} />
        <Typography>Redirecting to {gateway === 'easypaisa' ? 'Easypaisa' : 'JazzCash'}...</Typography>
      </Stack>
    )
  }

  return (
    <Stack spacing={2}>
      <Alert severity="info">
        You will be redirected to {gateway === 'easypaisa' ? 'Easypaisa' : 'JazzCash'} to complete payment
      </Alert>
      <Button
        variant="contained"
        fullWidth
        onClick={handlePayment}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : <LocalAtmIcon />}
      >
        {loading ? 'Proceeding...' : `Pay PKR ${amount.toLocaleString()}`}
      </Button>
    </Stack>
  )
}

export default function PaymentModal({
  open,
  onClose,
  medicines,
  totalAmount,
  onSuccess,
}: PaymentModalProps) {
  const [gateways, setGateways] = useState<PaymentGateway[]>([])
  const [loadingGateways, setLoadingGateways] = useState(true)
  const [formData, setFormData] = useState<PaymentFormData>({
    email: localStorage.getItem('userEmail') || '',
    phone: '',
    gateway: 'stripe',
  })
  const [currentStep, setCurrentStep] = useState<'form' | 'payment'>('form')

  useEffect(() => {
    if (open) {
      loadAvailableGateways()
    }
  }, [open])

  const loadAvailableGateways = async () => {
    try {
      setLoadingGateways(true)
      const available = await getAvailableGateways()
      setGateways(available)
      // Set first available gateway as default
      if (available.length > 0) {
        setFormData((prev) => ({ ...prev, gateway: available[0].name as any }))
      }
    } catch (error) {
      console.error('Error loading gateways:', error)
    } finally {
      setLoadingGateways(false)
    }
  }

  const handleProceed = () => {
    if (!formData.email) {
      alert('Please enter your email')
      return
    }
    setCurrentStep('payment')
  }

  const handleBackToForm = () => {
    setCurrentStep('form')
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Checkout</Typography>
          <Chip
            label={`Total: $${totalAmount.toFixed(2)}`}
            color="primary"
            variant="outlined"
          />
        </Stack>
      </DialogTitle>

      <DialogContent>
        <AnimatePresence mode="wait">
          {currentStep === 'form' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <Stack spacing={3} sx={{ mt: 2 }}>
                {/* Order Summary */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Order Summary
                    </Typography>
                    <Stack spacing={1}>
                      {medicines.map((med) => (
                        <Stack key={med._id} direction="row" justifyContent="space-between">
                          <Typography variant="body2">{med.medicineName}</Typography>
                          <Typography variant="body2" fontWeight={600}>
                            ${med.sellingPrice.toFixed(2)}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                    <Divider sx={{ my: 1 }} />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography fontWeight={600}>Total</Typography>
                      <Typography variant="h6" color="primary" fontWeight={700}>
                        ${totalAmount.toFixed(2)}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <div>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Contact Information
                  </Typography>
                  <Stack spacing={2}>
                    <TextField
                      label="Email"
                      type="email"
                      fullWidth
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    />
                    <TextField
                      label="Phone (optional)"
                      fullWidth
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </Stack>
                </div>

                {/* Payment Gateway Selection */}
                <div>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                    Payment Method
                  </Typography>
                  {loadingGateways ? (
                    <Stack alignItems="center" justifyContent="center" sx={{ py: 2 }}>
                      <CircularProgress size={32} />
                    </Stack>
                  ) : (
                    <FormControl component="fieldset" fullWidth>
                      <Stack spacing={1}>
                        {gateways.map((gateway) => (
                          <motion.div
                            key={gateway.name}
                            whileHover={{ scale: 1.02 }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <Card
                              variant={formData.gateway === gateway.name ? 'elevation' : 'outlined'}
                              sx={{
                                cursor: 'pointer',
                                border:
                                  formData.gateway === gateway.name
                                    ? '2px solid'
                                    : '1px solid',
                                borderColor:
                                  formData.gateway === gateway.name ? 'primary.main' : 'divider',
                                opacity: gateway.active ? 1 : 0.5,
                              }}
                            >
                              <CardContent
                                onClick={() =>
                                  gateway.active &&
                                  setFormData((prev) => ({ ...prev, gateway: gateway.name as any }))
                                }
                              >
                                <FormControlLabel
                                  control={
                                    <Radio
                                      checked={formData.gateway === gateway.name}
                                      disabled={!gateway.active}
                                    />
                                  }
                                  label={
                                    <Box>
                                      <Typography variant="subtitle2" fontWeight={600}>
                                        {gateway.label}
                                      </Typography>
                                      {gateway.region && (
                                        <Typography variant="caption" color="textSecondary">
                                          {gateway.region}
                                        </Typography>
                                      )}
                                      {!gateway.active && (
                                        <Typography variant="caption" color="error">
                                          {' '}
                                          (Unavailable)
                                        </Typography>
                                      )}
                                    </Box>
                                  }
                                  slotProps={{ typography: { sx: { mb: 0 } } }}
                                />
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </Stack>
                    </FormControl>
                  )}
                </div>
              </Stack>
            </motion.div>
          ) : (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <Stack spacing={3} sx={{ mt: 2 }}>
                {formData.gateway === 'stripe' ? (
                  <Elements stripe={stripePromise}>
                    <StripePaymentForm
                      amount={totalAmount}
                      medicines={medicines}
                      formData={formData}
                      onSuccess={onSuccess}
                      onClose={onClose}
                    />
                  </Elements>
                ) : (
                  <GatewayPaymentForm
                    gateway={formData.gateway}
                    amount={totalAmount}
                    medicines={medicines}
                    formData={formData}
                    onClose={onClose}
                  />
                )}
                <Button variant="text" onClick={handleBackToForm}>
                  ← Back to Payment Method
                </Button>
              </Stack>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>

      {currentStep === 'form' && (
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleProceed} variant="contained" disabled={!formData.email}>
            Continue to Payment
          </Button>
        </DialogActions>
      )}
    </Dialog>
  )
}
