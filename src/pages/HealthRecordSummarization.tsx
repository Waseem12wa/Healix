import { useRef, useState } from 'react'
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Stack,
    Typography,
    useTheme,
    alpha,
    Alert
} from '@mui/material'
import SummarizeIcon from '@mui/icons-material/Summarize'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DownloadIcon from '@mui/icons-material/Download'
import DescriptionIcon from '@mui/icons-material/Description'
import { motion, AnimatePresence } from 'framer-motion'
import BackButton from '../ui/BackButton'
import { summarizeMedicalRecord } from '../utils/medicalRecordClient'

export default function HealthRecordSummarization() {
    const theme = useTheme()
    const [fileName, setFileName] = useState('')
    const [loading, setLoading] = useState(false)
    const [summary, setSummary] = useState('')
    const [error, setError] = useState('')
    const [entities, setEntities] = useState<any>(null)
    const inputRef = useRef<HTMLInputElement | null>(null)

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return
        const f = files[0]
        setFileName(f.name)
        setLoading(true)
        setSummary('')
        setError('')

        try {
            const result = await summarizeMedicalRecord(f)
            if (result.success) {
                setSummary(result.summary || 'Summary generated successfully')
                setEntities(result.entities)
            } else {
                setError(result.error || 'Failed to summarize medical record')
            }
        } catch (error: any) {
            setError(error.message || 'An error occurred while processing the file')
        } finally {
            setLoading(false)
        }
    }

    const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
        e.preventDefault()
        handleFiles(e.dataTransfer.files)
    }
    const onBrowse = () => inputRef.current?.click()

    const downloadPdf = () => {
        let content = `Medical Record Summary\n\n${summary}\n\n`

        if (entities) {
            content += 'Key Medical Entities:\n\n'
            if (entities.medications?.length > 0) {
                content += `Medications: ${entities.medications.join(', ')}\n`
            }
            if (entities.conditions?.length > 0) {
                content += `Conditions: ${entities.conditions.join(', ')}\n`
            }
            if (entities.procedures?.length > 0) {
                content += `Procedures: ${entities.procedures.join(', ')}\n`
            }
            if (entities.vitals?.length > 0) {
                content += `Vitals: ${entities.vitals.join(', ')}\n`
            }
        }

        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'health-summary.txt'
        a.click()
        URL.revokeObjectURL(url)
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
                            <SummarizeIcon sx={{ fontSize: 32, color: '#00B4D8' }} />
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
                                Health Record Summarization
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Upload your health records for AI-powered summarization
                            </Typography>
                        </Box>
                    </Stack>

                    {/* Upload Card */}
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
                                    Upload Medical Report
                                </Typography>
                                <Box
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={onDrop}
                                    sx={{
                                        p: 4,
                                        border: '2px dashed',
                                        borderColor: fileName ? '#00B4D8' : 'divider',
                                        borderRadius: 3,
                                        textAlign: 'center',
                                        bgcolor: fileName ? alpha('#00B4D8', 0.05) : alpha(theme.palette.action.hover, 0.5),
                                        transition: 'all 0.3s',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            borderColor: '#00B4D8',
                                            bgcolor: alpha('#00B4D8', 0.05)
                                        }
                                    }}
                                    onClick={onBrowse}
                                >
                                    <CloudUploadIcon sx={{ fontSize: 48, color: '#00B4D8', mb: 2 }} />
                                    {fileName ? (
                                        <Stack spacing={1} alignItems="center">
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <DescriptionIcon sx={{ color: '#00B4D8' }} />
                                                <Typography fontWeight={600} color="#00B4D8">
                                                    {fileName}
                                                </Typography>
                                            </Stack>
                                            <Typography variant="body2" color="text.secondary">
                                                Click to change file
                                            </Typography>
                                        </Stack>
                                    ) : (
                                        <Stack spacing={1}>
                                            <Typography variant="h6" fontWeight={600}>
                                                Drag & drop your file here
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                or click to browse
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Supports PDF, text, and image files
                                            </Typography>
                                        </Stack>
                                    )}
                                    <input
                                        ref={inputRef}
                                        type="file"
                                        accept=".pdf,.txt,image/*"
                                        hidden
                                        onChange={(e) => handleFiles(e.target.files)}
                                    />
                                </Box>

                                {loading && (
                                    <Alert
                                        severity="info"
                                        icon={<CircularProgress size={20} />}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        Generating AI summary... This may take a few moments.
                                    </Alert>
                                )}
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Error Alert */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Alert
                                    severity="error"
                                    sx={{ borderRadius: 2 }}
                                    onClose={() => setError('')}
                                >
                                    {error}
                                </Alert>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Summary Card */}
                    <AnimatePresence>
                        {summary && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
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
                                                AI-Generated Summary
                                            </Typography>
                                            <Box sx={{
                                                p: 3,
                                                borderRadius: 2,
                                                bgcolor: alpha(theme.palette.background.paper, 0.5),
                                                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                                            }}>
                                                <Typography color="text.primary" sx={{ lineHeight: 1.8 }}>
                                                    {summary}
                                                </Typography>
                                            </Box>

                                            {/* Extracted Entities */}
                                            {entities && (
                                                <Box>
                                                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: theme.palette.primary.main }}>
                                                        Key Medical Entities
                                                    </Typography>
                                                    <Stack spacing={2}>
                                                        {entities.medications && entities.medications.length > 0 && (
                                                            <Box>
                                                                <Typography variant="subtitle2" fontWeight={600} color="primary">
                                                                    Medications:
                                                                </Typography>
                                                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                                                    {entities.medications.map((med: string, idx: number) => (
                                                                        <Chip key={idx} label={med} size="small" variant="outlined" />
                                                                    ))}
                                                                </Stack>
                                                            </Box>
                                                        )}
                                                        {entities.conditions && entities.conditions.length > 0 && (
                                                            <Box>
                                                                <Typography variant="subtitle2" fontWeight={600} color="primary">
                                                                    Conditions:
                                                                </Typography>
                                                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                                                    {entities.conditions.map((cond: string, idx: number) => (
                                                                        <Chip key={idx} label={cond} size="small" variant="outlined" color="secondary" />
                                                                    ))}
                                                                </Stack>
                                                            </Box>
                                                        )}
                                                        {entities.procedures && entities.procedures.length > 0 && (
                                                            <Box>
                                                                <Typography variant="subtitle2" fontWeight={600} color="primary">
                                                                    Procedures:
                                                                </Typography>
                                                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                                                    {entities.procedures.map((proc: string, idx: number) => (
                                                                        <Chip key={idx} label={proc} size="small" variant="outlined" color="info" />
                                                                    ))}
                                                                </Stack>
                                                            </Box>
                                                        )}
                                                    </Stack>
                                                </Box>
                                            )}
                                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                                <Button
                                                    variant="contained"
                                                    onClick={downloadPdf}
                                                    startIcon={<DownloadIcon />}
                                                    sx={{
                                                        borderRadius: 3,
                                                        px: 4,
                                                        py: 1.5,
                                                        background: 'linear-gradient(135deg, #00B4D8 0%, #06D6A0 100%)',
                                                        boxShadow: '0 4px 12px rgba(0, 180, 216, 0.3)',
                                                        '&:hover': {
                                                            background: 'linear-gradient(135deg, #0096C7 0%, #05B586 100%)',
                                                            boxShadow: '0 6px 16px rgba(0, 180, 216, 0.4)'
                                                        }
                                                    }}
                                                >
                                                    Download Summary
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    onClick={() => { setFileName(''); setSummary(''); setError(''); setEntities(null) }}
                                                    sx={{
                                                        borderRadius: 3,
                                                        px: 4,
                                                        py: 1.5,
                                                        borderColor: '#00B4D8',
                                                        color: '#00B4D8',
                                                        '&:hover': {
                                                            borderColor: '#0096C7',
                                                            bgcolor: alpha('#00B4D8', 0.05)
                                                        }
                                                    }}
                                                >
                                                    Upload New File
                                                </Button>
                                            </Stack>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Stack>
            </Box>
        </Box>
    )
}
