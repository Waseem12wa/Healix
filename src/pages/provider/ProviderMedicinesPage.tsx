import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import BackButton from '../../ui/BackButton'

interface ProviderMedicine {
  _id: string
  medicineName: string
  genericName?: string
  category?: string
  quantity: number
  sellingPrice: number
  costPrice: number
  description?: string
  imageUrl?: string
  expiryDate?: string
  isActive: boolean
}

const emptyForm = {
  medicineName: '',
  genericName: '',
  category: '',
  quantity: 0,
  costPrice: 0,
  sellingPrice: 0,
  description: '',
  imageUrl: '',
  expiryDate: '',
}

export default function ProviderMedicinesPage() {
  const [rows, setRows] = useState<ProviderMedicine[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const token = localStorage.getItem('token') || localStorage.getItem('authToken')

  const categories = useMemo(() => {
    const unique = new Set(rows.map((r) => r.category).filter(Boolean))
    return Array.from(unique)
  }, [rows])

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoryFilter) params.set('category', categoryFilter)

      const response = await fetch(`/api/provider/medicines?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to load medicines')
      }
      setRows(payload.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load medicines')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const openEdit = (row: ProviderMedicine) => {
    setEditingId(row._id)
    setForm({
      medicineName: row.medicineName || '',
      genericName: row.genericName || '',
      category: row.category || '',
      quantity: row.quantity || 0,
      costPrice: row.costPrice || 0,
      sellingPrice: row.sellingPrice || 0,
      description: row.description || '',
      imageUrl: row.imageUrl || '',
      expiryDate: row.expiryDate ? row.expiryDate.slice(0, 10) : '',
    })
    setOpen(true)
  }

  const save = async () => {
    try {
      setError('')
      const method = editingId ? 'PUT' : 'POST'
      const endpoint = editingId ? `/api/provider/medicines/${editingId}` : '/api/provider/medicines'
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to save medicine')
      }
      setOpen(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save medicine')
    }
  }

  const remove = async (id: string) => {
    try {
      const response = await fetch(`/api/provider/medicines/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to delete medicine')
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete medicine')
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 1.5 }}>
        <BackButton />
      </Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0EA5E9' }}>Medicine Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Add Medicine</Button>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField label="Search" value={search} onChange={(e) => setSearch(e.target.value)} fullWidth />
        <TextField select label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} sx={{ minWidth: 220 }}>
          <MenuItem value="">All</MenuItem>
          {categories.map((cat) => (
            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
          ))}
        </TextField>
        <Button variant="outlined" onClick={load}>Apply</Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!rows.length && !loading ? (
        <Alert severity="info">No medicines found.</Alert>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(3, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))',
            },
            gap: 2,
          }}
        >
          {rows.map((row) => (
            <Card key={row._id} sx={{ borderRadius: 2, border: '1px solid #D7E0EA', height: '100%' }}>
              <CardContent sx={{ p: 2.25 }}>
                <Stack spacing={1.2} sx={{ height: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', minHeight: 140 }}>
                    <Box
                      component="img"
                      src={row.imageUrl || `https://placehold.co/320x220/png?text=${encodeURIComponent(row.medicineName || 'Medicine')}`}
                      alt={row.medicineName}
                      onError={(e: any) => {
                        e.currentTarget.src = `https://placehold.co/320x220/png?text=${encodeURIComponent(row.medicineName || 'Medicine')}`
                      }}
                      sx={{ maxHeight: 130, maxWidth: '100%', objectFit: 'contain' }}
                    />
                  </Box>

                  <Typography sx={{ fontWeight: 800, color: '#1B2A41', lineHeight: 1.25, minHeight: 44 }}>
                    {row.medicineName}
                  </Typography>
                  <Typography sx={{ color: '#465D75', fontSize: '0.92rem' }}>{row.category || 'General'}</Typography>
                  <Typography sx={{ color: '#465D75', fontSize: '0.92rem' }}>Stock: {row.quantity}</Typography>
                  <Typography sx={{ color: '#465D75', fontSize: '0.92rem' }}>
                    Expiry: {row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : '-'}
                  </Typography>

                  <Typography sx={{ fontSize: '1.35rem', fontWeight: 800, color: '#1B2A41' }}>
                    PKR {Number(row.sellingPrice || 0).toLocaleString()}
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
                    <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => openEdit(row)} fullWidth>
                      Edit
                    </Button>
                    <Button size="small" color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={() => remove(row._id)} fullWidth>
                      Delete
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? 'Edit Medicine' : 'Add Medicine'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Medicine Name" value={form.medicineName} onChange={(e) => setForm({ ...form, medicineName: e.target.value })} required />
            <TextField label="Generic Name" value={form.genericName} onChange={(e) => setForm({ ...form, genericName: e.target.value })} />
            <TextField label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Stack direction="row" spacing={2}>
              <TextField type="number" label="Stock Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} fullWidth />
              <TextField type="number" label="Cost Price" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })} fullWidth />
              <TextField type="number" label="Selling Price" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })} fullWidth />
            </Stack>
            <TextField label="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            <TextField type="date" label="Expiry Date" InputLabelProps={{ shrink: true }} value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
            <TextField label="Description" multiline minRows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
