import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Drawer,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Tooltip as MuiTooltip,
  Typography,
  alpha,
} from '@mui/material'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCartRounded'
import AddIcon from '@mui/icons-material/AddRounded'
import RemoveIcon from '@mui/icons-material/RemoveRounded'
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded'
import SearchIcon from '@mui/icons-material/SearchRounded'
import LocalPharmacyRoundedIcon from '@mui/icons-material/LocalPharmacyRounded'
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded'
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded'
import LocalOfferRoundedIcon from '@mui/icons-material/LocalOfferRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import RemoveCircleRoundedIcon from '@mui/icons-material/RemoveCircleRounded'
import TuneRoundedIcon from '@mui/icons-material/TuneRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ShoppingBagRoundedIcon from '@mui/icons-material/ShoppingBagRounded'
import { motion, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import BackButton from '../ui/BackButton'
import { getMedicines, type Medicine } from '../services/paymentService'
import { addToCart, getCart, getCartItemCount, removeFromCart, syncCartFromServer, type CartData } from '../services/cartService'
import { BRAND_GRADIENT, HERO_BG, GLASS_SURFACE as GLASS, SOFT_BORDER, PREMIUM_SHADOW } from '../ui/premium'

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

  const handleRemove = (medicine: Medicine) => {
    removeFromCart(medicine._id, medicine.quantity)
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

  // Premium tokens
  const inStockCount = useMemo(() => cards.filter((c) => Number(c.quantity || 0) > 0).length, [cards])
  const avgDiscount = useMemo(() => {
    if (cards.length === 0) return 0
    return Math.round(cards.reduce((s, c) => s + c.discount, 0) / cards.length)
  }, [cards])

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  }
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', position: 'relative' }}>
      {/* Ambient mesh */}
      <Box sx={{
        position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none',
        backgroundImage:
          'radial-gradient(900px 500px at -10% -10%, rgba(52,211,153,0.10) 0%, transparent 60%),' +
          'radial-gradient(700px 400px at 110% 0%, rgba(37,99,235,0.10) 0%, transparent 60%),' +
          'radial-gradient(600px 400px at 50% 110%, rgba(6,182,212,0.08) 0%, transparent 60%)',
      }} />

      {/* Glass header */}
      <Box sx={{
        position: 'sticky', top: 0, zIndex: 20,
        bgcolor: GLASS, backdropFilter: 'saturate(180%) blur(16px)',
        WebkitBackdropFilter: 'saturate(180%) blur(16px)',
        borderBottom: SOFT_BORDER,
      }}>
        <Container maxWidth="xl" sx={{ py: 1.25, px: { xs: 2, md: 3 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <BackButton />
              <Stack direction="row" alignItems="center" spacing={1.25} sx={{ pl: 0.5 }}>
                <Box sx={{
                  width: 38, height: 38, borderRadius: '11px',
                  background: BRAND_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(14,165,233,0.32), 0 2px 4px rgba(37,99,235,0.18)',
                }}>
                  <LocalPharmacyRoundedIcon sx={{ color: '#FFFFFF', fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography sx={{
                    fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.01em',
                    background: BRAND_GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>Medicine Shop</Typography>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Verified Pharmacy · Fast delivery
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            <MuiTooltip title="Open cart" arrow>
              <Badge badgeContent={cartCount} max={99} sx={{ '& .MuiBadge-badge': { background: 'linear-gradient(135deg, #FB7185 0%, #F43F5E 100%)', color: '#FFFFFF', fontWeight: 700, fontSize: '0.65rem', minWidth: 18, height: 18 } }}>
                <IconButton
                  onClick={() => setCartOpen(true)}
                  aria-label="Open cart"
                  sx={{
                    width: 42, height: 42, borderRadius: 2,
                    bgcolor: alpha('#FFFFFF', 0.7), border: SOFT_BORDER, color: '#1D4ED8',
                    '&:hover': { bgcolor: '#FFFFFF', borderColor: alpha('#0EA5E9', 0.4), boxShadow: '0 4px 12px rgba(14,165,233,0.15)' },
                  }}
                >
                  <ShoppingCartIcon sx={{ fontSize: 22 }} />
                </IconButton>
              </Badge>
            </MuiTooltip>
          </Stack>
        </Container>
      </Box>

      {/* Body */}
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <Stack spacing={{ xs: 3, md: 3.5 }}>

            {/* HERO BANNER */}
            <motion.div variants={cardVariants}>
              <Card sx={{
                position: 'relative', overflow: 'hidden',
                borderRadius: 4, border: SOFT_BORDER,
                background: HERO_BG, boxShadow: PREMIUM_SHADOW,
              }}>
                <Box sx={{ position: 'absolute', top: -120, right: -100, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.22) 0%, transparent 60%)', filter: 'blur(20px)', pointerEvents: 'none' }} />
                <Box sx={{ position: 'absolute', bottom: -100, left: '40%', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 60%)', filter: 'blur(20px)', pointerEvents: 'none' }} />

                <CardContent sx={{ position: 'relative', p: { xs: 3, md: 4.5 } }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" gap={3}>
                    <Box sx={{ flex: 1 }}>
                      <Chip
                        size="small"
                        icon={<LocalOfferRoundedIcon sx={{ fontSize: 14 }} />}
                        label="VERIFIED PHARMACY"
                        sx={{
                          bgcolor: alpha('#FFFFFF', 0.65), backdropFilter: 'blur(8px)',
                          border: SOFT_BORDER, color: '#1D4ED8', fontWeight: 800, letterSpacing: '0.06em',
                          fontSize: '0.65rem', height: 24, mb: 2,
                          '& .MuiChip-icon': { color: '#06B6D4' },
                        }}
                      />
                      <Typography sx={{
                        fontSize: { xs: '1.75rem', sm: '2.15rem', md: '2.6rem' },
                        fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.025em', color: '#0F172A',
                      }}>
                        Save up to{' '}
                        <Box component="span" sx={{
                          background: BRAND_GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>{Math.max(...cards.map(c => c.discount), 0) || 30}%</Box>
                        {' '}on prescriptions
                      </Typography>
                      <Typography sx={{ fontSize: { xs: '0.95rem', md: '1.05rem' }, color: 'text.secondary', mt: 1.25, maxWidth: 620, lineHeight: 1.6 }}>
                        Browse <strong>{cards.length || 0}</strong> verified medicines from licensed pharmacies. Same-day dispatch on in-stock items.
                      </Typography>
                    </Box>

                    {/* KPI panels */}
                    <Stack direction={{ xs: 'row', md: 'row' }} spacing={1.5} sx={{ flexShrink: 0, flexWrap: 'wrap', gap: 1.5 }}>
                      {[
                        { label: 'Medicines', value: cards.length, Icon: Inventory2RoundedIcon, color: '#0EA5E9' },
                        { label: 'In Stock', value: inStockCount, Icon: CheckCircleRoundedIcon, color: '#10B981' },
                        { label: 'Categories', value: categories.length, Icon: CategoryRoundedIcon, color: '#2563EB' },
                      ].map(({ label, value, Icon, color }) => (
                        <Box key={label} sx={{
                          minWidth: 110,
                          bgcolor: alpha('#FFFFFF', 0.7), backdropFilter: 'blur(12px)',
                          border: SOFT_BORDER, borderRadius: 2.5, p: 1.5,
                        }}>
                          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.5 }}>
                            <Icon sx={{ fontSize: 14, color }} />
                            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.secondary', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</Typography>
                          </Stack>
                          <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>

            {/* SEARCH + FILTERS */}
            <motion.div variants={cardVariants}>
              <Card sx={{
                borderRadius: 3, border: SOFT_BORDER,
                bgcolor: alpha('#FFFFFF', 0.85), backdropFilter: 'blur(8px)', boxShadow: PREMIUM_SHADOW,
              }}>
                <CardContent sx={{ p: { xs: 2.25, md: 2.5 } }}>
                  <Stack spacing={1.75}>
                    {/* Search bar */}
                    <Box sx={{
                      display: 'flex', alignItems: 'center', gap: 1,
                      bgcolor: '#FFFFFF', border: SOFT_BORDER, borderRadius: 999,
                      pl: 2, pr: 0.5, py: 0.5,
                      transition: 'all 0.2s ease',
                      '&:focus-within': { borderColor: alpha('#0EA5E9', 0.45), boxShadow: '0 0 0 4px rgba(14,165,233,0.10)' },
                    }}>
                      <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                      <TextField
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by medicine name, generic, or category…"
                        variant="standard" fullWidth
                        InputProps={{ disableUnderline: true, sx: { fontSize: '0.95rem', py: 0.5 } }}
                      />
                      {searchQuery && (
                        <IconButton size="small" onClick={() => setSearchQuery('')} aria-label="Clear search">
                          <CloseRoundedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      )}
                    </Box>

                    {/* Filter pills row */}
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary', mr: 0.5 }}>
                        <TuneRoundedIcon sx={{ fontSize: 16 }} />
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Filters</Typography>
                      </Stack>

                      {/* Category */}
                      <TextField
                        select size="small" value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        SelectProps={{ native: true }}
                        sx={{
                          minWidth: 150,
                          '& .MuiOutlinedInput-root': { bgcolor: '#FFFFFF', borderRadius: 999, fontSize: '0.82rem', '& fieldset': { borderColor: 'rgba(15,23,42,0.10)' } },
                          '& .MuiInputBase-input': { py: 0.6 },
                        }}
                      >
                        <option value="all">All Categories</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </TextField>
                      <TextField
                        select size="small" value={stockFilter}
                        onChange={(e) => setStockFilter(e.target.value)}
                        SelectProps={{ native: true }}
                        sx={{
                          minWidth: 130,
                          '& .MuiOutlinedInput-root': { bgcolor: '#FFFFFF', borderRadius: 999, fontSize: '0.82rem', '& fieldset': { borderColor: 'rgba(15,23,42,0.10)' } },
                          '& .MuiInputBase-input': { py: 0.6 },
                        }}
                      >
                        <option value="all">All Stock</option>
                        <option value="in-stock">In Stock</option>
                        <option value="out-of-stock">Out of Stock</option>
                      </TextField>
                      <TextField
                        select size="small" value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'name-asc' | 'price-asc' | 'price-desc')}
                        SelectProps={{ native: true }}
                        sx={{
                          minWidth: 170,
                          '& .MuiOutlinedInput-root': { bgcolor: '#FFFFFF', borderRadius: 999, fontSize: '0.82rem', '& fieldset': { borderColor: 'rgba(15,23,42,0.10)' } },
                          '& .MuiInputBase-input': { py: 0.6 },
                        }}
                      >
                        <option value="name-asc">Name (A–Z)</option>
                        <option value="price-asc">Price (Low → High)</option>
                        <option value="price-desc">Price (High → Low)</option>
                      </TextField>
                      <Button
                        size="small" onClick={clearFilters}
                        sx={{
                          textTransform: 'none', fontWeight: 700, fontSize: '0.78rem',
                          color: 'text.secondary', borderRadius: 999, px: 1.5,
                          '&:hover': { bgcolor: alpha('#0F172A', 0.04), color: '#0F172A' },
                        }}
                      >
                        Reset
                      </Button>

                      <Box sx={{ flex: 1 }} />
                      <Chip
                        size="small"
                        label={`${filteredCards.length} of ${cards.length}`}
                        sx={{ bgcolor: alpha('#0EA5E9', 0.10), color: '#1D4ED8', fontWeight: 700, height: 24, fontSize: '0.7rem' }}
                      />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>

            {/* PRODUCT GRID */}
            {loading ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 2.5 }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <Card key={i} sx={{ borderRadius: 3, border: SOFT_BORDER, p: 2 }}>
                    <Skeleton variant="rounded" height={160} sx={{ borderRadius: 2, mb: 1.5 }} />
                    <Skeleton variant="text" width="70%" />
                    <Skeleton variant="text" width="40%" />
                    <Skeleton variant="rounded" height={36} sx={{ mt: 1, borderRadius: 1.5 }} />
                  </Card>
                ))}
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
            ) : filteredCards.length === 0 ? (
              <Card sx={{ borderRadius: 3, border: SOFT_BORDER, p: 5, textAlign: 'center', bgcolor: alpha('#FFFFFF', 0.7) }}>
                <Box sx={{
                  width: 56, height: 56, mx: 'auto', mb: 2, borderRadius: 2,
                  background: `linear-gradient(135deg, ${alpha('#0EA5E9', 0.18)} 0%, ${alpha('#0EA5E9', 0.06)} 100%)`,
                  border: `1px solid ${alpha('#0EA5E9', 0.25)}`, color: '#0EA5E9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Inventory2RoundedIcon sx={{ fontSize: 28 }} />
                </Box>
                <Typography sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>No medicines found</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', mb: 2 }}>Try a different search term or reset your filters.</Typography>
                <Button onClick={clearFilters} sx={{ textTransform: 'none', fontWeight: 700, color: '#1D4ED8' }}>Reset filters</Button>
              </Card>
            ) : (
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)', xl: 'repeat(5, 1fr)' },
                gap: { xs: 2, md: 2.5 },
              }}>
                {filteredCards.map((item) => {
                  const inStock = Number(item.quantity || 0) > 0
                  return (
                    <motion.div key={item._id} variants={cardVariants} whileHover={{ y: -6 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
                      <Card sx={{
                        position: 'relative', overflow: 'hidden', height: '100%',
                        display: 'flex', flexDirection: 'column',
                        borderRadius: 3, border: SOFT_BORDER,
                        bgcolor: alpha('#FFFFFF', 0.92), backdropFilter: 'blur(8px)',
                        boxShadow: PREMIUM_SHADOW,
                        transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
                        '&:hover': { borderColor: alpha('#0EA5E9', 0.4), boxShadow: '0 16px 40px rgba(14,165,233,0.20)' },
                        '&:hover .product-img': { transform: 'scale(1.04)' },
                      }}>
                        {/* Image area with gradient backdrop */}
                        <Box sx={{
                          position: 'relative',
                          height: 180,
                          background: 'linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(6,182,212,0.08) 50%, rgba(37,99,235,0.08) 100%)',
                          borderBottom: SOFT_BORDER,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          overflow: 'hidden',
                        }}>
                          <Box
                            className="product-img"
                            component="img"
                            src={item.imageUrl || `https://placehold.co/320x220/png?text=${encodeURIComponent(item.medicineName || 'Medicine')}`}
                            alt={item.medicineName}
                            onError={(e: any) => {
                              e.currentTarget.src = `https://placehold.co/320x220/png?text=${encodeURIComponent(item.medicineName || 'Medicine')}`
                            }}
                            sx={{
                              maxHeight: 144, maxWidth: '78%', objectFit: 'contain',
                              filter: 'drop-shadow(0 4px 12px rgba(15,23,42,0.10))',
                              transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                          />

                          {/* Discount badge */}
                          {item.discount > 0 && (
                            <Chip
                              size="small"
                              label={`-${item.discount}%`}
                              sx={{
                                position: 'absolute', top: 10, left: 10,
                                background: BRAND_GRADIENT, color: '#FFFFFF',
                                fontWeight: 800, fontSize: '0.72rem', height: 24,
                                boxShadow: '0 4px 12px rgba(14,165,233,0.28)',
                              }}
                            />
                          )}

                          {/* Stock badge */}
                          <Chip
                            size="small"
                            icon={inStock ? <CheckCircleRoundedIcon sx={{ fontSize: '0.85rem !important' }} /> : <RemoveCircleRoundedIcon sx={{ fontSize: '0.85rem !important' }} />}
                            label={inStock ? 'In stock' : 'Out of stock'}
                            sx={{
                              position: 'absolute', top: 10, right: 10,
                              bgcolor: alpha('#FFFFFF', 0.92), backdropFilter: 'blur(6px)',
                              border: SOFT_BORDER,
                              color: inStock ? '#059669' : '#94A3B8',
                              fontWeight: 700, fontSize: '0.7rem', height: 22,
                              '& .MuiChip-icon': { color: inStock ? '#10B981' : '#94A3B8', ml: 0.5 },
                            }}
                          />
                        </Box>

                        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
                          <Typography sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.3, fontSize: '0.95rem', mb: 0.5, minHeight: 48, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {item.medicineName}
                          </Typography>

                          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.75 }}>
                            <Chip
                              size="small"
                              label={item.category || 'General'}
                              sx={{ bgcolor: alpha('#0F172A', 0.04), color: '#475569', fontWeight: 600, fontSize: '0.65rem', height: 20 }}
                            />
                            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 500 }}>
                              {formatPackSize(item.commonDosage)}
                            </Typography>
                          </Stack>

                          <Box sx={{ flex: 1 }} />

                          {/* Price */}
                          <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1.5 }}>
                            <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em', lineHeight: 1 }}>
                              {formatPrice(Number(item.sellingPrice || 0), item.currency || 'PKR')}
                            </Typography>
                            {item.discount > 0 && (
                              <Typography sx={{ fontSize: '0.78rem', color: 'text.disabled', textDecoration: 'line-through', fontWeight: 600 }}>
                                {formatPrice(item.oldPrice, item.currency || 'PKR')}
                              </Typography>
                            )}
                          </Stack>

                          {/* CTA */}
                          <Button
                            fullWidth
                            disabled={!inStock}
                            onClick={() => handleAddToCart(item)}
                            startIcon={<AddIcon sx={{ fontSize: 18 }} />}
                            sx={{
                              textTransform: 'none', fontWeight: 700, fontSize: '0.85rem',
                              color: '#FFFFFF',
                              background: inStock ? BRAND_GRADIENT : alpha('#0F172A', 0.06),
                              backgroundSize: '200% 200%', backgroundPosition: '0% 50%',
                              borderRadius: 1.5, py: 0.95,
                              boxShadow: inStock ? '0 6px 16px rgba(14,165,233,0.28)' : 'none',
                              transition: 'all 0.3s ease',
                              '&:hover': inStock ? { backgroundPosition: '100% 50%', boxShadow: '0 10px 22px rgba(14,165,233,0.38)' } : {},
                              '&.Mui-disabled': { color: alpha('#0F172A', 0.35) },
                            }}
                          >
                            {inStock ? 'Add to cart' : 'Unavailable'}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </Box>
            )}
          </Stack>
        </motion.div>
      </Container>

      {/* CART DRAWER */}
      <Drawer
        anchor="right"
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        PaperProps={{ sx: { width: { xs: '100vw', sm: 420 }, bgcolor: alpha('#FFFFFF', 0.96), backdropFilter: 'blur(16px)' } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Drawer header */}
          <Box sx={{
            position: 'relative', overflow: 'hidden',
            background: HERO_BG, borderBottom: SOFT_BORDER,
            p: 2.5,
          }}>
            <Box sx={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.22) 0%, transparent 60%)', filter: 'blur(16px)', pointerEvents: 'none' }} />
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ position: 'relative' }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: 2,
                  background: BRAND_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(14,165,233,0.28)',
                }}>
                  <ShoppingBagRoundedIcon sx={{ fontSize: 22, color: '#FFFFFF' }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>Your cart</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {cartCount} {cartCount === 1 ? 'item' : 'items'}
                  </Typography>
                </Box>
              </Stack>
              <IconButton onClick={() => setCartOpen(false)} aria-label="Close cart" sx={{ color: 'text.secondary' }}>
                <CloseRoundedIcon />
              </IconButton>
            </Stack>
          </Box>

          {/* Drawer body */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {cartItems.length === 0 ? (
              <Box sx={{ py: 6, px: 2, textAlign: 'center' }}>
                <Box sx={{
                  width: 56, height: 56, mx: 'auto', mb: 2, borderRadius: 2,
                  background: `linear-gradient(135deg, ${alpha('#0EA5E9', 0.18)} 0%, ${alpha('#0EA5E9', 0.06)} 100%)`,
                  border: `1px solid ${alpha('#0EA5E9', 0.25)}`, color: '#0EA5E9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ShoppingCartIcon sx={{ fontSize: 28 }} />
                </Box>
                <Typography sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>Your cart is empty</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>Add medicines to start an order.</Typography>
              </Box>
            ) : (
              <Stack spacing={1.25}>
                <AnimatePresence initial={false}>
                  {cartItems.map((entry) => (
                    <motion.div
                      key={entry.medicine._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card sx={{ borderRadius: 2, border: SOFT_BORDER, boxShadow: 'none', bgcolor: alpha('#FFFFFF', 0.85) }}>
                        <CardContent sx={{ p: 1.5 }}>
                          <Stack direction="row" spacing={1.5} alignItems="flex-start">
                            <Box sx={{
                              width: 56, height: 56, flexShrink: 0,
                              borderRadius: 1.5,
                              background: 'linear-gradient(135deg, rgba(52,211,153,0.10) 0%, rgba(6,182,212,0.10) 50%, rgba(37,99,235,0.10) 100%)',
                              border: SOFT_BORDER,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              overflow: 'hidden',
                            }}>
                              <Box
                                component="img"
                                src={entry.medicine.imageUrl || `https://placehold.co/120x120/png?text=Rx`}
                                alt={entry.medicine.medicineName}
                                onError={(e: any) => { e.currentTarget.src = `https://placehold.co/120x120/png?text=Rx` }}
                                sx={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }}
                              />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                {entry.medicine.medicineName}
                              </Typography>
                              <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#1D4ED8', mt: 0.25 }}>
                                {formatPrice(Number(entry.medicine.sellingPrice || 0) * entry.quantity, entry.medicine.currency || 'PKR')}
                              </Typography>
                              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                                <IconButton
                                  size="small" onClick={() => handleDecrement(entry.medicine)}
                                  aria-label="Decrease quantity"
                                  sx={{ width: 26, height: 26, border: SOFT_BORDER, borderRadius: 1.25 }}
                                >
                                  <RemoveIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                                <Typography sx={{ minWidth: 26, textAlign: 'center', fontWeight: 800, fontSize: '0.85rem', color: '#0F172A' }}>{entry.quantity}</Typography>
                                <IconButton
                                  size="small" onClick={() => handleIncrement(entry.medicine)}
                                  aria-label="Increase quantity"
                                  sx={{ width: 26, height: 26, border: SOFT_BORDER, borderRadius: 1.25, color: '#1D4ED8' }}
                                >
                                  <AddIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                                <Box sx={{ flex: 1 }} />
                                <IconButton
                                  size="small" onClick={() => handleRemove(entry.medicine)}
                                  aria-label="Remove from cart"
                                  sx={{ width: 26, height: 26, color: '#F43F5E', '&:hover': { bgcolor: alpha('#F43F5E', 0.08) } }}
                                >
                                  <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Stack>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </Stack>
            )}
          </Box>

          {/* Drawer footer */}
          {cartItems.length > 0 && (
            <Box sx={{ p: 2, borderTop: SOFT_BORDER, bgcolor: alpha('#FFFFFF', 0.7), backdropFilter: 'blur(10px)' }}>
              <Card sx={{ borderRadius: 2, border: SOFT_BORDER, boxShadow: 'none', bgcolor: alpha('#0EA5E9', 0.04), mb: 2 }}>
                <CardContent sx={{ p: 1.75, '&:last-child': { pb: 1.75 } }}>
                  <Stack spacing={0.75}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', fontWeight: 500 }}>Subtotal</Typography>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>{formatPrice(cartTotal, 'PKR')}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', fontWeight: 500 }}>Delivery</Typography>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#10B981' }}>FREE</Typography>
                    </Stack>
                    <Divider sx={{ my: 0.5 }} />
                    <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                      <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>Total</Typography>
                      <Typography sx={{
                        fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.01em',
                        background: BRAND_GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      }}>{formatPrice(cartTotal, 'PKR')}</Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
              <Button
                fullWidth
                onClick={handleProceedToCheckout}
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{
                  background: BRAND_GRADIENT,
                  backgroundSize: '200% 200%', backgroundPosition: '0% 50%',
                  color: '#FFFFFF', textTransform: 'none', py: 1.25,
                  borderRadius: 2, fontWeight: 800, fontSize: '0.95rem',
                  boxShadow: '0 10px 24px rgba(14,165,233,0.32), 0 4px 10px rgba(37,99,235,0.18)',
                  transition: 'all 0.3s ease',
                  '&:hover': { backgroundPosition: '100% 50%', boxShadow: '0 14px 28px rgba(14,165,233,0.40)' },
                }}
              >
                Proceed to checkout
              </Button>
              <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', textAlign: 'center', mt: 1, fontWeight: 500 }}>
                Secure checkout · Avg. discount {avgDiscount}%
              </Typography>
            </Box>
          )}
        </Box>
      </Drawer>
    </Box>
  )
}
