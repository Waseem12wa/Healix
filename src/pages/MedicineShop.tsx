import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
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
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import InfoIcon from '@mui/icons-material/Info'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import BackButton from '../ui/BackButton'
import { getMedicineFilterOptions, getMedicines } from '../services/paymentService'
import type { Medicine, MedicineFilterOptions, MedicineQueryOptions } from '../services/paymentService'
import { getCart, addToCart, removeFromCart, clearCart, syncCartFromServer } from '../services/cartService'
import { format } from 'date-fns'

const formatDateSafe = (value?: string) => {
  if (!value) return 'N/A'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'N/A'
  return format(parsed, 'MMM dd, yyyy')
}

const pkrFormatter = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
})

const formatPkr = (value?: number) => pkrFormatter.format(Number(value || 0))

export default function MedicineShop() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [formulaInput, setFormulaInput] = useState('')
  const [formulaQuery, setFormulaQuery] = useState('')
  const [typeInput, setTypeInput] = useState('')
  const [typeQuery, setTypeQuery] = useState('')
  const [category, setCategory] = useState('')
  const [sortBy, setSortBy] = useState<MedicineQueryOptions['sortBy']>('medicineName')
  const [sortOrder, setSortOrder] = useState<MedicineQueryOptions['sortOrder']>('asc')
  const [filterOptions, setFilterOptions] = useState<MedicineFilterOptions>({ categories: [], medicineTypes: [] })
  const [filterError, setFilterError] = useState<string | null>(null)
  const [cart, setCart] = useState<Record<string, number>>({})
  const [cartDetails, setCartDetails] = useState<Record<string, Medicine>>({})
  const [selectedMedInfo, setSelectedMedInfo] = useState<Medicine | null>(null)
  const [filtering, setFiltering] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [cartExpanded, setCartExpanded] = useState(true)

  const pageSize = 30

  useEffect(() => {
    const loadCartState = async () => {
      const cartState = await syncCartFromServer()
      const quantities: Record<string, number> = {}
      const details: Record<string, Medicine> = {}

      Object.entries(cartState).forEach(([id, value]) => {
        quantities[id] = value.quantity
        details[id] = value.medicine
      })

      setCart(quantities)
      setCartDetails(details)
    }

    loadCartState()

    const loadFilterOptions = async () => {
      try {
        const data = await getMedicineFilterOptions()
        setFilterOptions(data)
      } catch {
        setFilterError('Could not load category/type filters. Search is still available.')
      }
    }

    loadFilterOptions()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim())
      setFormulaQuery(formulaInput.trim())
      setTypeQuery(typeInput.trim())
      setPage(1)
    }, 350)

    return () => clearTimeout(timer)
  }, [searchInput, formulaInput, typeInput])

  const loadMedicines = async (targetPage = 1) => {
    try {
      setLoading(true)
      setFiltering(true)
      const response = await getMedicines({
        search: searchQuery,
        category: category || undefined,
        formula: formulaQuery || undefined,
        medicineType: typeQuery || undefined,
        sortBy,
        sortOrder,
        limit: pageSize,
        page: targetPage,
      })
      const incoming = response.medicines || []
      setMedicines(incoming)
      const total = response.pagination?.total ?? response.total ?? incoming.length
      const pages = response.pagination?.pages ?? Math.max(1, Math.ceil(total / pageSize))
      setTotalCount(total)
      setPage(targetPage)
      setTotalPages(pages)
    } catch (error) {
      console.error('Error loading medicines:', error)
    } finally {
      setLoading(false)
      setFiltering(false)
    }
  }

  useEffect(() => {
    loadMedicines(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery, formulaQuery, typeQuery, category, sortBy, sortOrder])

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

  const getTotalItems = () => Object.values(cart).reduce((sum, qty) => sum + qty, 0)

  const handleRemoveItemCompletely = (medicineId: string) => {
    const qty = cart[medicineId] || 0
    if (qty <= 0) return
    removeFromCart(medicineId, qty)
    const newCart = { ...cart }
    delete newCart[medicineId]
    setCart(newCart)

    const newCartDetails = { ...cartDetails }
    delete newCartDetails[medicineId]
    setCartDetails(newCartDetails)
  }

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false
    const parsed = new Date(expiryDate)
    if (Number.isNaN(parsed.getTime())) return false
    return parsed < new Date()
  }

  const isLowStock = (quantity: number) => {
    return quantity < 10
  }

  const activeFilterCount = useMemo(() => {
    return [searchQuery, formulaQuery, typeQuery, category].filter(Boolean).length
  }, [searchQuery, formulaQuery, typeQuery, category])

  const clearFilters = () => {
    setSearchInput('')
    setFormulaInput('')
    setTypeInput('')
    setSearchQuery('')
    setFormulaQuery('')
    setTypeQuery('')
    setCategory('')
    setSortBy('medicineName')
    setSortOrder('asc')
    setPage(1)
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

        {/* Filter Panel */}
        <Card sx={{ borderRadius: 2 }}>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Search & Filter Medicines
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  {activeFilterCount > 0 && (
                    <Chip label={`${activeFilterCount} active filters`} size="small" color="primary" />
                  )}
                  <Button size="small" onClick={clearFilters} disabled={activeFilterCount === 0}>
                    Clear Filters
                  </Button>
                </Stack>
              </Stack>

              {filterError && <Alert severity="warning">{filterError}</Alert>}

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    placeholder="Search by medicine name"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    placeholder="Formula / Generic name"
                    value={formulaInput}
                    onChange={(e) => setFormulaInput(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel id="category-filter-label">Category</InputLabel>
                    <Select
                      labelId="category-filter-label"
                      value={category}
                      label="Category"
                      onChange={(e) => {
                        setCategory(String(e.target.value))
                        setPage(1)
                      }}
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {filterOptions.categories.map((value) => (
                        <MenuItem key={value} value={value}>{value}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="Type (e.g. diabetes)"
                    value={typeInput}
                    onChange={(e) => setTypeInput(e.target.value)}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel id="sort-by-label">Sort By</InputLabel>
                    <Select
                      labelId="sort-by-label"
                      value={sortBy || 'medicineName'}
                      label="Sort By"
                      onChange={(e) => {
                        setSortBy(e.target.value as MedicineQueryOptions['sortBy'])
                        setPage(1)
                      }}
                    >
                      <MenuItem value="medicineName">Medicine Name</MenuItem>
                      <MenuItem value="sellingPrice">Price</MenuItem>
                      <MenuItem value="quantity">Stock</MenuItem>
                      <MenuItem value="category">Category</MenuItem>
                      <MenuItem value="genericName">Formula</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel id="sort-order-label">Sort Order</InputLabel>
                    <Select
                      labelId="sort-order-label"
                      value={sortOrder || 'asc'}
                      label="Sort Order"
                      onChange={(e) => {
                        setSortOrder(e.target.value as MedicineQueryOptions['sortOrder'])
                        setPage(1)
                      }}
                    >
                      <MenuItem value="asc">Ascending</MenuItem>
                      <MenuItem value="desc">Descending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Stack>
          </CardContent>
        </Card>

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
                        {getTotalItems()} item(s) in cart • {Object.keys(cart).length} medicine(s)
                      </Typography>
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                        Total: {formatPkr(getTotalAmount())}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="text"
                      onClick={() => setCartExpanded((v) => !v)}
                      endIcon={cartExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    >
                      {cartExpanded ? 'Hide Cart' : 'View Cart'}
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => navigate('/shop/checkout')}
                      startIcon={<ShoppingCartIcon />}
                    >
                      Proceed to Payment
                    </Button>
                  </Stack>
                </Stack>

                <Collapse in={cartExpanded}>
                  <Divider sx={{ my: 2 }} />
                  <List dense>
                    {Object.entries(cart).map(([medId, qty]) => {
                      const med = medicines.find((m) => m._id === medId) || cartDetails[medId]
                      if (!med) return null
                      return (
                        <ListItem key={medId} sx={{ borderRadius: 1, mb: 0.5, bgcolor: alpha(theme.palette.common.white, 0.4) }}>
                          <ListItemText
                            primary={med.medicineName}
                            secondary={`Qty ${qty} • ${formatPkr(med.sellingPrice)} each • Subtotal ${formatPkr(med.sellingPrice * qty)}`}
                          />
                          <ListItemSecondaryAction>
                            <Stack direction="row" spacing={0.5}>
                              <Tooltip title="Decrease quantity">
                                <span>
                                  <IconButton size="small" onClick={() => handleRemoveFromCart(medId)}>
                                    <RemoveIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Increase quantity">
                                <span>
                                  <IconButton size="small" onClick={() => handleAddToCart(med)}>
                                    <AddIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Remove item">
                                <span>
                                  <IconButton size="small" color="error" onClick={() => handleRemoveItemCompletely(medId)}>
                                    <DeleteOutlineIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Stack>
                          </ListItemSecondaryAction>
                        </ListItem>
                      )
                    })}
                  </List>
                </Collapse>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Showing page {page.toLocaleString()} of {totalPages.toLocaleString()} • {medicines.length.toLocaleString()} results on this page • {totalCount.toLocaleString()} total
          </Typography>
          <Stack direction="row" spacing={1}>
            {searchQuery && <Chip label={`Name: ${searchQuery}`} size="small" color="primary" variant="outlined" />}
            {formulaQuery && <Chip label={`Formula: ${formulaQuery}`} size="small" color="secondary" variant="outlined" />}
            {typeQuery && <Chip label={`Type: ${typeQuery}`} size="small" color="info" variant="outlined" />}
            {category && <Chip label={`Category: ${category}`} size="small" color="success" variant="outlined" />}
          </Stack>
        </Stack>

        {/* Medicines Table Layout */}
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
            <CircularProgress size={50} />
            <Typography sx={{ mt: 2 }}>Loading medicines...</Typography>
          </Stack>
        ) : medicines.length === 0 ? (
          <Alert severity="info">No medicines found. Try a different search.</Alert>
        ) : (
          <TableContainer component={Card} sx={{ maxHeight: 620 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Medicine</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Formula</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type / Use</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Stock</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <AnimatePresence>
                  {medicines.map((medicine) => {
                    const cartQty = cart[medicine._id] || 0
                    const expired = isExpired(medicine.expiryDate)
                    const lowStock = isLowStock(medicine.quantity) && !expired

                    return (
                      <TableRow
                        key={medicine._id}
                        hover
                        sx={{
                          opacity: expired ? 0.55 : 1,
                          bgcolor: cartQty > 0 ? alpha(theme.palette.primary.main, 0.05) : undefined,
                        }}
                      >
                        <TableCell>
                          <Stack spacing={0.4}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {medicine.medicineName}
                            </Typography>
                            <Stack direction="row" spacing={0.5}>
                              {expired && <Chip label="Expired" size="small" color="error" />}
                              {lowStock && <Chip label="Low Stock" size="small" color="warning" />}
                              {cartQty > 0 && <Chip label={`In Cart: ${cartQty}`} size="small" color="primary" />}
                            </Stack>
                          </Stack>
                        </TableCell>
                        <TableCell>{medicine.genericName || 'N/A'}</TableCell>
                        <TableCell>{medicine.category || 'General'}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 240 }} noWrap title={medicine.therapeuticUse || 'N/A'}>
                            {medicine.therapeuticUse || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{formatPkr(medicine.sellingPrice)}</TableCell>
                        <TableCell>{medicine.quantity > 0 ? `${medicine.quantity}` : 'Out of stock'}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                            <Tooltip title="View details">
                              <IconButton size="small" onClick={() => setSelectedMedInfo(medicine)}>
                                <InfoIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Decrease">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveFromCart(medicine._id)}
                                  disabled={cartQty === 0}
                                >
                                  <RemoveIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Add to cart">
                              <span>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleAddToCart(medicine)}
                                  disabled={expired || medicine.quantity <= 0}
                                >
                                  <AddIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {!loading && medicines.length > 0 && (
          <Stack direction="row" justifyContent="center" sx={{ py: 1 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Stack>
        )}
      </Stack>

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
                      {formatPkr(selectedMedInfo.sellingPrice)}
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
                      Formula
                    </Typography>
                    <Typography variant="body2">{selectedMedInfo.genericName || 'N/A'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="textSecondary">
                      Category
                    </Typography>
                    <Typography variant="body2">{selectedMedInfo.category || 'General'}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="textSecondary">
                      Therapeutic Use
                    </Typography>
                    <Typography variant="body2">{selectedMedInfo.therapeuticUse || 'N/A'}</Typography>
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
