import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Chip, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import BackButton from '../../ui/BackButton'

interface ProviderOrder {
  id: string
  orderNumber: string
  patientName: string
  patientEmail: string
  medicines: Array<{
    medicineName: string
    quantity: number
    unitPrice: number
  }>
  paymentStatus: string
  orderStatus: string
  finalAmount: number
  createdAt: string
}

export default function ProviderOrdersPage() {
  const [rows, setRows] = useState<ProviderOrder[]>([])
  const [error, setError] = useState('')
  const token = localStorage.getItem('token') || localStorage.getItem('authToken')

  const load = async () => {
    try {
      setError('')
      const response = await fetch('/api/provider/orders', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to load orders')
      }
      setRows(payload.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const updateStatus = async (id: string, action: 'approve' | 'reject' | 'complete') => {
    try {
      const response = await fetch(`/api/provider/orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action }),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to update order')
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order')
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 1.5 }}>
        <BackButton />
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 800, color: '#0EA5E9', mb: 2 }}>
        Order Management & Approval
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ borderRadius: 2, border: '1px solid #E2E8F0' }}>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Medicines</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700 }}>{row.orderNumber}</Typography>
                      <Typography variant="body2" color="text.secondary">{new Date(row.createdAt).toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography>{row.patientName}</Typography>
                      <Typography variant="body2" color="text.secondary">{row.patientEmail}</Typography>
                    </TableCell>
                    <TableCell>
                      {row.medicines.map((m, index) => (
                        <Typography variant="body2" key={`${row.id}-${index}`}>
                          {m.medicineName} x{m.quantity}
                        </Typography>
                      ))}
                    </TableCell>
                    <TableCell>PKR {Number(row.finalAmount || 0).toLocaleString()}</TableCell>
                    <TableCell><Chip size="small" label={row.paymentStatus} /></TableCell>
                    <TableCell><Chip size="small" color="info" label={row.orderStatus} /></TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" variant="outlined" onClick={() => updateStatus(row.id, 'approve')}>Approve</Button>
                        <Button size="small" color="error" variant="outlined" onClick={() => updateStatus(row.id, 'reject')}>Reject</Button>
                        <Button size="small" color="success" variant="contained" onClick={() => updateStatus(row.id, 'complete')}>Complete</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!rows.length && (
                  <TableRow>
                    <TableCell colSpan={7}>No provider orders yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  )
}
