import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  Typography,
  useTheme,
  alpha,
  Alert,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import InfoIcon from '@mui/icons-material/Info'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '../ui/BackButton'
import PaymentModal from '../components/PaymentModal'
import { getMedicines } from '../services/paymentService'
import type { Medicine } from '../services/paymentService'
import { getCart, addToCart, removeFromCart, clearCart } from '../services/cartService'
import { format } from 'date-fns'

const formatDateSafe = (value?: string) => {
  if (!value) return 'N/A'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'N/A'
  return format(parsed, 'MMM dd, yyyy')
}

export default function MedicineShop() {
  const theme = useTheme()
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [cartDetails, setCartDetails] = useState<Record<string, Medicine>>({})
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [selectedMedInfo, setSelectedMedInfo] = useState<Medicine | null>(null)
  const [filtering, setFiltering] = useState(false)

  useEffect(() => {
    loadMedicines()
    const cartState = getCart()
    const quantities: Record<string, number> = {}
    const details: Record<string, Medicine> = {}

    Object.entries(cartState).forEach(([id, value]) => {
      quantities[id] = value.quantity
      details[id] = value.medicine
    })

    setCart(quantities)
    setCartDetails(details)
  }, [])

  const loadMedicines = async () => {
    try {
      setLoading(true)
      const response = await getMedicines('', 50)
      setMedicines(response.medicines)
    } catch (error) {
      console.error('Error loading medicines:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    if (query.trim()) {
      setFiltering(true)
      try {
        const response = await getMedicines(query, 50)
        setMedicines(response.medicines)
      } catch (error) {
        console.error('Error searching:', error)
      } finally {
        setFiltering(false)
      }
    } else {
      setFiltering(true)
      try {
        const response = await getMedicines('', 50)
        setMedicines(response.medicines)
      } finally {
        setFiltering(false)
      }
    }
  }

  const handleAddToCart = (medicine: Medicine) => {
    const newCart = { ...cart }
    newCart[medicine._id] = (newCart[medicine._id] || 0) + 1
    setCart(newCart)

    const newCartDetails = { ...cartDetails, [medicine._id]: medicine }
    setCartDetails(newCartDetails)

    addToCart(medicine)
  }

  const handleRemoveFromCart = (medicineId: string) => {
    const newCart = { ...cart }
    const current = newCart[medicineId] || 0
    if (current <= 1) {
      delete newCart[medicineId]
    } else {
      newCart[medicineId] = current - 1
    }
    setCart(newCart)

    removeFromCart(medicineId)

    if (newCart[medicineId] === undefined) {
      const newCartDetails = { ...cartDetails }
      delete newCartDetails[medicineId]
      setCartDetails(newCartDetails)
    }
  }

  const getTotalAmount = () => {
    return Object.entries(cart).reduce((total, [medId, qty]) => {
      const med = medicines.find((m) => m._id === medId) || cartDetails[medId]
      return total + (med?.sellingPrice || 0) * qty
    }, 0)
  }

  const getCartMedicines = () => {
    return Object.entries(cart)
      .map(([medId]) => {
        const med = medicines.find((m) => m._id === medId) || cartDetails[medId]
        return med ? { ...med } : null
      })
      .filter(Boolean) as Medicine[]
  }

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date()
  }

  const isLowStock = (quantity: number) => {
    return quantity < 10
  }

  return (
    <Box>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <BackButton />
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                Medicine Shop
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Browse and purchase medicines directly
              </Typography>
            </Box>
            <ShoppingCartIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.2 }} />
          </Stack>
        </Box>

        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search medicines by name..."
          value={searchQuery}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: filtering ? (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            ) : null,
          }}
          disabled={filtering}
        />

        {/* Cart Summary Bar */}
        {Object.keys(cart).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1), border: `2px solid ${theme.palette.primary.main}` }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <ShoppingCartIcon color="primary" />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {Object.keys(cart).length} item(s) in cart
                      </Typography>
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                        Total: ${getTotalAmount().toFixed(2)}
                      </Typography>
                    </Box>
                  </Stack>
                  <Button
                    variant="contained"
                    onClick={() => setPaymentOpen(true)}
                    startIcon={<ShoppingCartIcon />}
                  >
                    Checkout
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Medicines Grid */}
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
            <CircularProgress size={50} />
            <Typography sx={{ mt: 2 }}>Loading medicines...</Typography>
          </Stack>
        ) : medicines.length === 0 ? (
          <Alert severity="info">No medicines found. Try a different search.</Alert>
        ) : (
          <Grid container spacing={2}>
            <AnimatePresence>
              {medicines.map((medicine, index) => {
                const cartQty = cart[medicine._id] || 0
                const expired = isExpired(medicine.expiryDate)
                const lowStock = isLowStock(medicine.quantity) && !expired

                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={medicine._id}>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -4 }}
                    >
                      <Card
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          opacity: expired ? 0.5 : 1,
                          border: cartQty > 0 ? `2px solid ${theme.palette.primary.main}` : undefined,
                        }}
                      >
                        {/* Medicine Image / Header */}
                        <Box
                          sx={{
                            height: 120,
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          <Typography variant="h1" sx={{ opacity: 0.1, fontSize: '4rem' }}>
                            💊
                          </Typography>
                          {expired && (
                            <Chip
                              label="EXPIRED"
                              color="error"
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                              }}
                            />
                          )}
                          {lowStock && !expired && (
                            <Chip
                              label={`${medicine.quantity} left`}
                              color="warning"
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                              }}
                            />
                          )}
                          {cartQty > 0 && (
                            <Chip
                              label={`In Cart: ${cartQty}`}
                              color="primary"
                              size="small"
                              sx={{
                                position: 'absolute',
                                bottom: 8,
                                right: 8,
                              }}
                            />
                          )}
                        </Box>

                        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          {/* Medicine Name */}
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 700, mb: 1, minHeight: '2.5rem', overflow: 'hidden' }}
                            title={medicine.medicineName}
                          >
                            {medicine.medicineName}
                          </Typography>

                          {/* Details */}
                          <Stack spacing={1} sx={{ mb: 2, flex: 1 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                              <Typography variant="caption" color="textSecondary">
                                Price:
                              </Typography>
                              <Typography
                                variant="h6"
                                sx={{ fontWeight: 700, color: 'primary.main' }}
                              >
                                ${medicine.sellingPrice.toFixed(2)}
                              </Typography>
                            </Stack>

                            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                              <Typography variant="caption" color="textSecondary">
                                Stock:
                              </Typography>
                              <Typography variant="body2">
                                {medicine.quantity > 0
                                  ? `${medicine.quantity} available`
                                  : 'Out of stock'}
                              </Typography>
                            </Stack>

                            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                              <Typography variant="caption" color="textSecondary">
                                Expires:
                              </Typography>
                              <Typography
                                variant="body2"
                                color={expired ? 'error.main' : 'textSecondary'}
                              >
                                {formatDateSafe(medicine.expiryDate)}
                              </Typography>
                            </Stack>

                            {medicine.supplierName && (
                              <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                                <Typography variant="caption" color="textSecondary">
                                  Supplier:
                                </Typography>
                                <Typography variant="caption">{medicine.supplierName}</Typography>
                              </Stack>
                            )}
                          </Stack>

                          {/* Actions */}
                          <Stack spacing={1}>
                            <Button
                              size="small"
                              variant="outlined"
                              fullWidth
                              startIcon={<InfoIcon />}
                              onClick={() => setSelectedMedInfo(medicine)}
                            >
                              Details
                            </Button>

                            {!expired && medicine.quantity > 0 ? (
                              <Stack direction="row" spacing={1}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveFromCart(medicine._id)}
                                  disabled={cartQty === 0}
                                  sx={{ flex: 1 }}
                                >
                                  <RemoveIcon fontSize="small" />
                                </IconButton>
                                <Button
                                  size="small"
                                  variant="contained"
                                  fullWidth
                                  onClick={() => handleAddToCart(medicine)}
                                  startIcon={<AddIcon />}
                                  sx={{ flex: 1 }}
                                >
                                  Add
                                </Button>
                              </Stack>
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                fullWidth
                                disabled
                              >
                                {expired ? 'Expired' : 'Out of Stock'}
                              </Button>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                )
              })}
            </AnimatePresence>
          </Grid>
        )}
      </Stack>

      {/* Payment Modal */}
      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        medicines={getCartMedicines()}
        totalAmount={getTotalAmount()}
        onSuccess={(orderId) => {
          alert(`Order placed successfully! Order ID: ${orderId}`)
          clearCart()
          setCart({})
          setCartDetails({})
          setPaymentOpen(false)
        }}
      />

      {/* Medicine Details Dialog */}
      <Dialog
        open={Boolean(selectedMedInfo)}
        onClose={() => setSelectedMedInfo(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedMedInfo && (
          <>
            <DialogTitle>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {selectedMedInfo.medicineName}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Box
                  sx={{
                    height: 120,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="h1" sx={{ fontSize: '5rem' }}>
                    💊
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary">
                      Price
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      ${selectedMedInfo.sellingPrice.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary">
                      Stock
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {selectedMedInfo.quantity}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary">
                      Expires
                    </Typography>
                    <Typography variant="body2">
                      {formatDateSafe(selectedMedInfo.expiryDate)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary">
                      Batch
                    </Typography>
                    <Typography variant="body2">{selectedMedInfo.batchNumber}</Typography>
                  </Grid>
                </Grid>

                <Divider />

                {selectedMedInfo.supplierName && (
                  <>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        Supplier Information
                      </Typography>
                      <Typography variant="body2">{selectedMedInfo.supplierName}</Typography>
                    </Box>
                    <Divider />
                  </>
                )}

                <Alert severity="info">
                  This medicine is {isExpired(selectedMedInfo.expiryDate) ? 'EXPIRED' : 'valid'}
                  {!isExpired(selectedMedInfo.expiryDate) && isLowStock(selectedMedInfo.quantity)
                    ? ' and in low stock'
                    : ''}
                </Alert>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => {
                    if (!isExpired(selectedMedInfo.expiryDate) && selectedMedInfo.quantity > 0) {
                      handleAddToCart(selectedMedInfo)
                      setSelectedMedInfo(null)
                    }
                  }}
                  disabled={isExpired(selectedMedInfo.expiryDate) || selectedMedInfo.quantity <= 0}
                  startIcon={<ShoppingCartIcon />}
                >
                  Add to Cart
                </Button>
              </Stack>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  )
}
