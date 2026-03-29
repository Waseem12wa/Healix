import { useEffect, useRef, useState } from 'react'
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Stack,
    TextField,
    Typography,
    useTheme,
    alpha,
    Alert,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
    Snackbar
} from '@mui/material'
import { addToCart as addAlternativeToCart } from '../services/cartService'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import SearchIcon from '@mui/icons-material/Search'
import InfoIcon from '@mui/icons-material/Info'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import BackButton from '../ui/BackButton'
import PaymentModal from '../components/PaymentModal'
import DoctorReviewPrompt from '../components/DoctorReviewPrompt'
import type { Medicine } from '../services/paymentService'
import { correctDrugTerm } from '../utils/medicalAutoCorrect'

type Alternative = {
    name: string
    generic_name?: string
    composition?: string
    price?: number
    similarity: number
    mechanism: string
    indications: string
    category: string
    atc_code: string
    medicineId?: string | null
    actualSellingPrice?: number
    actualCostPrice?: number
    inventoryQuantity?: number
    inStock?: boolean
    expiryDate?: string
    note?: string
}

type ApiResponse = {
    success: boolean
    medicine: string
    matched_name?: string
    alternatives: Alternative[]
    explanation?: string
    source?: string
    error?: string
}


export default function DrugAlternatives() {
    const theme = useTheme()
    const [searchParams] = useSearchParams()
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] = useState<ApiResponse | null>(null)
    const [paymentOpen, setPaymentOpen] = useState(false)
    const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null)
    const [toastMessage, setToastMessage] = useState<string | null>(null)
    const autoRunQueryRef = useRef('')

    const handleSearch = async (incomingQuery?: string) => {
        const term = (incomingQuery ?? query).trim()
        if (!term) return

        const rawQuery = term
        const correctedQuery = correctDrugTerm(rawQuery)

        setLoading(true)
        setError(null)
        setResult(null)

        try {
            if (correctedQuery !== rawQuery) {
                setError(`Corrected '${rawQuery}' to '${correctedQuery}'`)
            }

                setQuery(correctedQuery)

            const response = await fetch('/api/alternative/recommend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    medicine: correctedQuery,
                    top_n: 5
                }),
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to get alternatives')
            }

            setResult(data)

        } catch (err: any) {
            console.error('Error fetching alternatives:', err)
            setError(err.message || 'Failed to fetch alternatives. Please ensure the alternative service is running.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const medicine = (searchParams.get('medicine') || '').trim()
        if (!medicine) return

        const key = medicine.toLowerCase()
        if (autoRunQueryRef.current === key) return
        autoRunQueryRef.current = key

        setQuery(medicine)
        handleSearch(medicine)
    }, [searchParams])

    const getSimilarityColor = (similarity: number) => {
        if (similarity >= 80) return theme.palette.success.main
        if (similarity >= 60) return theme.palette.info.main
        if (similarity >= 40) return theme.palette.warning.main
        return theme.palette.error.main
    }

    const handleAddToCart = (alternative: Alternative) => {
        if (!alternative.inStock || !alternative.medicineId) {
            setToastMessage(`${alternative.name} is not available in inventory. Alternative recommendation only.`)
            return
        }

        const medicineToCart: Medicine = {
            _id: alternative.medicineId,
            medicineName: alternative.name,
            quantity: alternative.inventoryQuantity || 0,
            sellingPrice: alternative.actualSellingPrice || alternative.price || 25,
            expiryDate: alternative.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            batchNumber: `ALT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            supplierName: 'Alternative Medicine'
        }

        addAlternativeToCart(medicineToCart)
        setToastMessage(`Added ${alternative.name} (Rs. ${alternative.actualSellingPrice}) to cart.`)
    }

    return (
        <Box sx={{
            width: '100%',
            minHeight: '100vh',
            bgcolor: theme.palette.background.default,
            position: 'relative',
            overflowX: 'hidden'
        }}>
            {/* Background Decorative Elements */}
            <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflow: 'hidden',
                zIndex: 0,
                pointerEvents: 'none'
            }}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: -100,
                        right: -100,
                        width: 500,
                        height: 500,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 70%)`,
                        filter: 'blur(60px)',
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: -80,
                        left: -80,
                        width: 400,
                        height: 400,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.05)} 0%, transparent 70%)`,
                        filter: 'blur(50px)',
                    }}
                />
            </Box>

            {/* Main Content */}
            <Box sx={{ position: 'relative', zIndex: 1, p: { xs: 2, md: 4 } }}>
                <Stack spacing={4}>
                    <BackButton />

                    {/* Header */}
                    <Stack direction="row" spacing={2.5} alignItems="center">
                        <Box sx={{
                            width: 60,
                            height: 60,
                            borderRadius: '20px',
                            background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.1) 0%, rgba(6, 214, 160, 0.1) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid',
                            borderColor: 'rgba(0, 180, 216, 0.2)',
                            boxShadow: '0 8px 32px rgba(0, 180, 216, 0.1)'
                        }}>
                            <SwapHorizIcon sx={{ fontSize: 32, color: '#00B4D8' }} />
                        </Box>
                        <Box>
                            <Typography
                                variant="h4"
                                fontWeight={800}
                                sx={{
                                    background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontSize: { xs: '1.75rem', md: '2.25rem' },
                                    lineHeight: 1.2,
                                    mb: 0.5
                                }}
                            >
                                Drug Alternatives
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Find alternative medications using AI-powered similarity analysis
                            </Typography>
                        </Box>
                    </Stack>

                    {/* Search Card */}
                    <Card sx={{
                        borderRadius: '24px',
                        boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
                        bgcolor: alpha(theme.palette.background.paper, 0.6),
                        backdropFilter: 'blur(20px)',
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    }}>
                        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                            <Stack spacing={3}>
                                <Typography variant="h6" fontWeight={700} sx={{
                                    background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>
                                    Search Medication
                                </Typography>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <TextField
                                        label="Enter medicine name"
                                        placeholder="e.g., Aspirin, Paracetamol, Metformin"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        fullWidth
                                        disabled={loading}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                    />
                                    <Button
                                        variant="contained"
                                        startIcon={loading ? <CircularProgress size={20} sx={{ color: 'inherit' }} /> : <SearchIcon />}
                                        onClick={() => {
                                            handleSearch()
                                        }}
                                        disabled={!query.trim() || loading}
                                        sx={{
                                            borderRadius: 3,
                                            px: 4,
                                            background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #0096C7 0%, #05B586 100%)',
                                            },
                                            '&:disabled': {
                                                background: alpha(theme.palette.action.disabled, 0.12),
                                                color: theme.palette.action.disabled
                                            }
                                        }}
                                    >
                                        {loading ? 'Searching...' : 'Search'}
                                    </Button>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Error Alert */}
                    {error && (
                        <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Results */}
                    {result && result.alternatives.length > 0 && (
                        <DoctorReviewPrompt
                            feature="alternatives"
                            patientQuery={result.matched_name || result.medicine || query}
                            aiResultText={result.alternatives.map((alt) => `${alt.name} (${alt.similarity}% similar)`).join('\n')}
                            aiResultData={result}
                        />
                    )}

                    {result && result.alternatives.length > 0 && (
                        <Card sx={{
                            borderRadius: '24px',
                            boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.05)}`,
                            bgcolor: alpha(theme.palette.background.paper, 0.6),
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        }}>
                            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                                <Typography variant="h6" fontWeight={700} sx={{
                                    mb: 2,
                                    background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>
                                    Alternatives for {result.matched_name || result.medicine}
                                </Typography>

                                {result.explanation && (
                                    <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                                        {result.explanation}
                                    </Alert>
                                )}

                                <Stack spacing={2}>
                                    <AnimatePresence>
                                        {result.alternatives.map((alt, idx) => (
                                            <motion.div
                                                key={alt.name}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{ duration: 0.3, delay: idx * 0.05 }}
                                            >
                                                <Card sx={{
                                                    borderRadius: '16px',
                                                    boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.05)}`,
                                                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                                                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                                    transition: 'all 0.2s',
                                                    '&:hover': {
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.1)}`
                                                    }
                                                }}>
                                                    <CardContent sx={{ p: 3 }}>
                                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                                            <Box sx={{ flex: 1 }}>
                                                                <Typography variant="h6" fontWeight={700} sx={{
                                                                    fontSize: '1.1rem',
                                                                    background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                                                                    WebkitBackgroundClip: 'text',
                                                                    WebkitTextFillColor: 'transparent',
                                                                    mb: 0.5
                                                                }}>
                                                                    {alt.name}
                                                                </Typography>
                                                                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                                                                    <Chip
                                                                        label={`${alt.similarity}% Similar`}
                                                                        size="small"
                                                                        sx={{
                                                                            borderRadius: '8px',
                                                                            fontWeight: 700,
                                                                            bgcolor: alpha(getSimilarityColor(alt.similarity), 0.15),
                                                                            color: getSimilarityColor(alt.similarity),
                                                                            border: `1px solid ${alpha(getSimilarityColor(alt.similarity), 0.3)}`
                                                                        }}
                                                                    />
                                                                    <Chip
                                                                        label={alt.category}
                                                                        size="small"
                                                                        sx={{
                                                                            borderRadius: '8px',
                                                                            fontWeight: 600,
                                                                            bgcolor: alpha('#00B4D8', 0.1),
                                                                            color: '#00B4D8'
                                                                        }}
                                                                    />
                                                                    {alt.atc_code !== 'N/A' && (
                                                                        <Chip
                                                                            label={`ATC: ${alt.atc_code}`}
                                                                            size="small"
                                                                            sx={{
                                                                                borderRadius: '8px',
                                                                                fontWeight: 600,
                                                                                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                                                                color: theme.palette.secondary.main
                                                                            }}
                                                                        />
                                                                    )}
                                                                </Stack>
                                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                                                                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                                                                        Composition:
                                                                    </Typography>
                                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                        {alt.composition || alt.generic_name || 'N/A'}
                                                                    </Typography>
                                                                </Stack>
                                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                                                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                                                                        Price:
                                                                    </Typography>
                                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                                                                        Rs. {alt.actualSellingPrice ? alt.actualSellingPrice.toFixed(2) : (alt.price?.toFixed(2) ?? 'N/A')}
                                                                    </Typography>
                                                                    {alt.inStock === false && (
                                                                        <Chip label="Out of Stock" size="small" color="error" variant="filled" />
                                                                    )}
                                                                    {alt.inStock === true && (
                                                                        <Chip label={`${alt.inventoryQuantity || 0} in stock`} size="small" color="success" variant="filled" />
                                                                    )}
                                                                </Stack>
                                                            </Box>
                                                        </Stack>

                                                        {/* Details Accordion */}
                                                        <Accordion
                                                            sx={{
                                                                borderRadius: '12px !important',
                                                                '&:before': { display: 'none' },
                                                                boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
                                                                bgcolor: alpha(theme.palette.background.paper, 0.5)
                                                            }}
                                                        >
                                                            <AccordionSummary
                                                                expandIcon={<ExpandMoreIcon />}
                                                                sx={{
                                                                    borderRadius: '12px',
                                                                    '&:hover': {
                                                                        bgcolor: alpha(theme.palette.primary.main, 0.02)
                                                                    }
                                                                }}
                                                            >
                                                                <Typography variant="subtitle2" fontWeight={700} sx={{
                                                                    background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                                                                    WebkitBackgroundClip: 'text',
                                                                    WebkitTextFillColor: 'transparent'
                                                                }}>
                                                                    📋 View Detailed Information
                                                                </Typography>
                                                            </AccordionSummary>
                                                            <AccordionDetails sx={{ pt: 2 }}>
                                                                <Stack spacing={2}>
                                                                    <Box>
                                                                        <Typography variant="subtitle2" fontWeight={700} sx={{
                                                                            color: '#00B4D8',
                                                                            mb: 1,
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: 0.5
                                                                        }}>
                                                                            🔬 Mechanism of Action
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{
                                                                            color: 'text.secondary',
                                                                            lineHeight: 1.7,
                                                                            whiteSpace: 'pre-line'
                                                                        }}>
                                                                            {alt.mechanism}
                                                                        </Typography>
                                                                    </Box>

                                                                    <Divider />

                                                                    <Box>
                                                                        <Typography variant="subtitle2" fontWeight={700} sx={{
                                                                            color: theme.palette.info.main,
                                                                            mb: 1,
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: 0.5
                                                                        }}>
                                                                            💊 Indications
                                                                        </Typography>
                                                                        <Typography variant="body2" sx={{
                                                                            color: 'text.secondary',
                                                                            lineHeight: 1.7,
                                                                            whiteSpace: 'pre-line'
                                                                        }}>
                                                                            {alt.indications}
                                                                        </Typography>
                                                                    </Box>
                                                                </Stack>
                                                            </AccordionDetails>
                                                        </Accordion>

                                                        {/* Action Buttons */}
                                                        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                                                            <Button
                                                                variant="outlined"
                                                                fullWidth
                                                                onClick={() => handleAddToCart(alt)}
                                                                disabled={!alt.inStock || !alt.medicineId}
                                                                startIcon={<ShoppingCartIcon />}
                                                            >
                                                                {alt.inStock && alt.medicineId ? 'Add to Cart' : 'Not In Stock'}
                                                            </Button>

                                                            <Button
                                                                variant="contained"
                                                                fullWidth
                                                                disabled={!alt.inStock || !alt.medicineId}
                                                                startIcon={<ShoppingCartIcon />}
                                                                onClick={() => {
                                                                    if (alt.medicineId && alt.inStock) {
                                                                        setSelectedMedicine({
                                                                            _id: alt.medicineId,
                                                                            medicineName: alt.name,
                                                                            quantity: alt.inventoryQuantity || 0,
                                                                            sellingPrice: alt.actualSellingPrice || alt.price || 25,
                                                                            expiryDate: alt.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                                                                            batchNumber: 'ALT-' + Date.now(),
                                                                            supplierName: 'Alternative Medicine'
                                                                        })
                                                                        setPaymentOpen(true)
                                                                    }
                                                                }}
                                                                sx={{
                                                                    background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                                                                    '&:hover': {
                                                                        background: 'linear-gradient(135deg, #0096C7 0%, #05B586 100%)',
                                                                    }
                                                                }}
                                                            >
                                                                {alt.inStock && alt.medicineId ? 'Buy Now' : 'Unavailable'}
                                                            </Button>
                                                        </Stack>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </Stack>
                            </CardContent>
                        </Card>
                    )}

                    {/* No Results */}
                    {result && result.alternatives.length === 0 && (
                        <Alert severity="info" icon={<InfoIcon />} sx={{ borderRadius: 2 }}>
                            No alternatives found for "{result.medicine}". Try a different medicine name.
                        </Alert>
                    )}
                </Stack>
            </Box>

            {/* Payment Modal */}
            {selectedMedicine && (
                <PaymentModal
                    open={paymentOpen}
                    onClose={() => setPaymentOpen(false)}
                    medicines={[selectedMedicine]}
                    totalAmount={selectedMedicine.sellingPrice}
                    onSuccess={(orderId) => {
                        alert(`Order placed successfully! Order ID: ${orderId}\n\nYou will receive your medicine shortly.`)
                        setPaymentOpen(false)
                        setSelectedMedicine(null)
                    }}
                />
            )}

            <Snackbar
                open={Boolean(toastMessage)}
                autoHideDuration={3000}
                onClose={() => setToastMessage(null)}
                message={toastMessage}
            />
        </Box>
    )
}
