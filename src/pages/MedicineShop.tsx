import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import SearchIcon from '@mui/icons-material/Search'
import { useNavigate } from 'react-router-dom'
import BackButton from '../ui/BackButton'
import { getMedicines, type Medicine } from '../services/paymentService'
import { addToCart, getCart, getCartItemCount, removeFromCart, syncCartFromServer, type CartData } from '../services/cartService'

const formatPrice = (value: number, currency: string) => {
  const amount = Number.isFinite(value) ? value : 0
  return `${currency || 'PKR'} ${amount.toLocaleString()}`
}

const calcDiscount = (name: string) => {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash + name.charCodeAt(i)) % 997
  }
  const bands = [5, 10, 15, 20, 25, 30]
  return bands[hash % bands.length]
}

export default function MedicineShop() {
  const navigate = useNavigate()
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cart, setCart] = useState<CartData>({})
  const [cartOpen, setCartOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'name-asc' | 'price-asc' | 'price-desc'>('name-asc')

  const refreshCart = () => {
    setCart(getCart())
  }

  useEffect(() => {
    const loadMedicines = async () => {
      setLoading(true)
      try {
        const response = await getMedicines({ limit: 200, page: 1, sortBy: 'medicineName', sortOrder: 'asc' })
        setMedicines(response.medicines || [])
        setError('')
      } catch (err) {
        console.error('Failed to load medicines:', err)
        setError('Unable to load medicines right now.')
      } finally {
        setLoading(false)
      }
    }

    loadMedicines()
  }, [])

  useEffect(() => {
    const hydrate = async () => {
      await syncCartFromServer()
      refreshCart()
    }
    hydrate()
  }, [])

  const cards = useMemo(() => {
    return medicines.map((item) => {
      const discount = calcDiscount(item.medicineName || '')
      const price = Number(item.sellingPrice || 0)
      const oldPrice = Math.round(price / (1 - discount / 100))

      return {
        ...item,
        discount,
        oldPrice,
      }
    })
  }, [medicines])

  const categories = useMemo(() => {
    const unique = new Set<string>()
    cards.forEach((item) => {
      if (item.category) unique.add(item.category)
    })
    return Array.from(unique).sort((a, b) => a.localeCompare(b))
  }, [cards])

  const filteredCards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    const next = cards.filter((item) => {
      const matchesQuery =
        !query ||
        String(item.medicineName || '').toLowerCase().includes(query) ||
        String(item.genericName || '').toLowerCase().includes(query) ||
        String(item.category || '').toLowerCase().includes(query)

      const matchesCategory = categoryFilter === 'all' || (item.category || '') === categoryFilter

      const quantity = Number(item.quantity || 0)
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'in-stock' && quantity > 0) ||
        (stockFilter === 'out-of-stock' && quantity <= 0)

      return matchesQuery && matchesCategory && matchesStock
    })

    next.sort((a, b) => {
      if (sortBy === 'name-asc') return String(a.medicineName || '').localeCompare(String(b.medicineName || ''))
      if (sortBy === 'price-asc') return Number(a.sellingPrice || 0) - Number(b.sellingPrice || 0)
      return Number(b.sellingPrice || 0) - Number(a.sellingPrice || 0)
    })

    return next
  }, [cards, categoryFilter, searchQuery, sortBy, stockFilter])

  const clearFilters = () => {
    setSearchQuery('')
    setCategoryFilter('all')
    setStockFilter('all')
    setSortBy('name-asc')
  }

  const cartItems = useMemo(() => Object.values(cart), [cart])
  const cartCount = useMemo(() => getCartItemCount(), [cart])
  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.medicine.sellingPrice || 0) * item.quantity, 0),
    [cartItems]
  )

  const handleAddToCart = (medicine: Medicine) => {
    addToCart(medicine, 1)
    refreshCart()
    setCartOpen(true)
  }

  const handleIncrement = (medicine: Medicine) => {
    addToCart(medicine, 1)
    refreshCart()
  }

  const handleDecrement = (medicine: Medicine) => {
    removeFromCart(medicine._id, 1)
    refreshCart()
  }

  const handleProceedToCheckout = () => {
    setCartOpen(false)
    navigate('/shop/checkout')
  }

  const formatPackSize = (value?: string) => {
    if (!value) return '1 pack'
    return value.replace(/^pack\s*size:\s*/i, '').trim()
  }

  return (
    <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
      <Stack spacing={2.5}>
        <BackButton />
        <Box>
          <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 900, color: '#00AFC8' }}>
            Medicine Shop
          </Typography>
          <Typography variant="body2" color="text.secondary">Popular Products</Typography>
        </Box>

        <Stack direction="row" justifyContent="flex-end">
          <IconButton
            onClick={() => setCartOpen(true)}
            sx={{ border: '1px solid #00AFC8', borderRadius: 2, px: 1.5, color: '#00AFC8' }}
          >
            <Badge badgeContent={cartCount} color="error">
              <ShoppingCartIcon />
            </Badge>
          </IconButton>
        </Stack>

        <Card sx={{ borderRadius: 2, border: '1px solid #D7E0EA' }}>
          <CardContent sx={{ p: { xs: 2, md: 2.25 } }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
              <TextField
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search medicine, generic name or category"
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                select
                label="Category"
                size="small"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                sx={{ minWidth: 170 }}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Stock"
                size="small"
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="in-stock">In Stock</MenuItem>
                <MenuItem value="out-of-stock">Out of Stock</MenuItem>
              </TextField>
              <TextField
                select
                label="Sort"
                size="small"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name-asc' | 'price-asc' | 'price-desc')}
                sx={{ minWidth: 170 }}
              >
                <MenuItem value="name-asc">Name (A-Z)</MenuItem>
                <MenuItem value="price-asc">Price (Low to High)</MenuItem>
                <MenuItem value="price-desc">Price (High to Low)</MenuItem>
              </TextField>
              <Button variant="outlined" onClick={clearFilters}>Reset</Button>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Showing {filteredCards.length} of {cards.length} medicines
            </Typography>
          </CardContent>
        </Card>

        {loading ? (
          <Stack alignItems="center" sx={{ py: 7 }}>
            <CircularProgress />
          </Stack>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : filteredCards.length === 0 ? (
          <Alert severity="info">No medicines available yet.</Alert>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
                lg: 'repeat(5, minmax(0, 1fr))',
              },
              gap: 2,
            }}
          >
            {filteredCards.map((item) => (
              <Box key={item._id}>
                <Card sx={{ height: '100%', borderRadius: 2, border: '1px solid #D7E0EA' }}>
                  <CardContent sx={{ p: 2.25 }}>
                    <Stack spacing={1.2}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Box sx={{ px: 1.2, py: 0.5, bgcolor: '#E6F2FF', color: '#003B73', borderRadius: 0.75, fontWeight: 700, fontSize: '0.8rem' }}>
                          {item.discount}% Off
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160 }}>
                        <Box
                          component="img"
                          src={item.imageUrl || `https://placehold.co/320x220/png?text=${encodeURIComponent(item.medicineName || 'Medicine')}`}
                          alt={item.medicineName}
                          onError={(e: any) => {
                            e.currentTarget.src = `https://placehold.co/320x220/png?text=${encodeURIComponent(item.medicineName || 'Medicine')}`
                          }}
                          sx={{ maxHeight: 150, maxWidth: '100%', objectFit: 'contain' }}
                        />
                      </Box>

                      <Typography sx={{ fontWeight: 800, color: '#1B2A41', lineHeight: 1.25, minHeight: 54 }}>
                        {item.medicineName}
                      </Typography>

                      <Typography sx={{ color: '#465D75' }}>{item.category || 'General'}</Typography>
                      <Typography sx={{ color: '#465D75' }}>Pack Size: {formatPackSize(item.commonDosage)}</Typography>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color: '#1B2A41' }}>
                          {formatPrice(Number(item.sellingPrice || 0), item.currency || 'PKR')}
                        </Typography>
                        <Typography sx={{ color: '#E63946', textDecoration: 'line-through', fontWeight: 700 }}>
                          {formatPrice(item.oldPrice, item.currency || 'PKR')}
                        </Typography>
                      </Stack>

                      <Button
                        variant="contained"
                        onClick={() => handleAddToCart(item)}
                        sx={{
                          mt: 0.4,
                          bgcolor: '#00AFC8',
                          textTransform: 'none',
                          borderRadius: 1.2,
                          py: 1,
                          fontWeight: 700,
                          '&:hover': { bgcolor: '#009BB2' },
                        }}
                      >
                        Add to cart
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        )}
      </Stack>

      <Drawer anchor="right" open={cartOpen} onClose={() => setCartOpen(false)}>
        <Box sx={{ width: { xs: 320, sm: 380 }, p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: '#00AFC8' }}>Your Cart</Typography>
            <Badge badgeContent={cartCount} color="error">
              <ShoppingCartIcon sx={{ color: '#00AFC8' }} />
            </Badge>
          </Stack>

          {cartItems.length === 0 ? (
            <Alert severity="info">Your cart is empty.</Alert>
          ) : (
            <>
              <List sx={{ p: 0 }}>
                {cartItems.map((entry) => (
                  <ListItem key={entry.medicine._id} disableGutters sx={{ py: 1.2, alignItems: 'flex-start' }}>
                    <ListItemText
                      primary={<Typography sx={{ fontWeight: 700 }}>{entry.medicine.medicineName}</Typography>}
                      secondary={
                        <Typography sx={{ color: '#465D75' }}>
                          {formatPrice(Number(entry.medicine.sellingPrice || 0), entry.medicine.currency || 'PKR')} x {entry.quantity}
                        </Typography>
                      }
                    />
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <IconButton
                        size="small"
                        onClick={() => handleDecrement(entry.medicine)}
                        sx={{ border: '1px solid #D7E0EA' }}
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <Typography sx={{ minWidth: 20, textAlign: 'center', fontWeight: 700 }}>{entry.quantity}</Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleIncrement(entry.medicine)}
                        sx={{ border: '1px solid #D7E0EA' }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 700 }}>Total</Typography>
                <Typography sx={{ fontWeight: 800, color: '#00AFC8' }}>{formatPrice(cartTotal, 'PKR')}</Typography>
              </Stack>

              <Button
                fullWidth
                variant="contained"
                onClick={handleProceedToCheckout}
                sx={{
                  bgcolor: '#00AFC8',
                  textTransform: 'none',
                  py: 1,
                  borderRadius: 1.2,
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#009BB2' },
                }}
              >
                Proceed to Payment
              </Button>
            </>
          )}
        </Box>
      </Drawer>
    </Box>
  )
}
