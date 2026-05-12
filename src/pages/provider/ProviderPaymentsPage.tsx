import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import BackButton from '../../ui/BackButton'

interface Summary {
  transactions: number
  grossRevenue: number
  providerEarnings: number
  adminCommission: number
}

interface Transaction {
  _id: string
  transactionId: string
  orderNumber: string
  status: string
  amount: number
  providerAmount: number
  adminCommission: number
  createdAt: string
}

interface AccountForm {
  accountHolderName: string
  bankName: string
  bankAccountNumber: string
  iban: string
  walletProvider: string
  walletNumber: string
}

const emptyAccount: AccountForm = {
  accountHolderName: '',
  bankName: '',
  bankAccountNumber: '',
  iban: '',
  walletProvider: '',
  walletNumber: '',
}

export default function ProviderPaymentsPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [account, setAccount] = useState<AccountForm>(emptyAccount)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const token = localStorage.getItem('token') || localStorage.getItem('authToken')

  const load = async () => {
    try {
      setError('')
      const [summaryRes, txRes, accountRes] = await Promise.all([
        fetch('/api/provider/payments/summary', { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        fetch('/api/provider/payments/transactions', { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        fetch('/api/provider/payments/account', { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
      ])

      const [summaryPayload, txPayload, accountPayload] = await Promise.all([
        summaryRes.json(),
        txRes.json(),
        accountRes.json(),
      ])

      if (!summaryRes.ok || !summaryPayload?.success) throw new Error(summaryPayload?.message || 'Failed to load payment summary')
      if (!txRes.ok || !txPayload?.success) throw new Error(txPayload?.message || 'Failed to load transactions')
      if (!accountRes.ok || !accountPayload?.success) throw new Error(accountPayload?.message || 'Failed to load account details')

      setSummary(summaryPayload.data)
      setTransactions(txPayload.data || [])
      setAccount(accountPayload.data || emptyAccount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const saveAccount = async () => {
    try {
      setError('')
      setSuccess('')
      const response = await fetch('/api/provider/payments/account', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(account),
      })
      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to save payout details')
      }
      setSuccess('Payout details updated successfully.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save payout details')
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 1.5 }}>
        <BackButton />
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 800, color: '#0EA5E9', mb: 2 }}>
        Payment Management & Revenue Split
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Gross Revenue</Typography><Typography variant="h6">PKR {Number(summary?.grossRevenue || 0).toLocaleString()}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} md={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Provider Share (75%)</Typography><Typography variant="h6">PKR {Number(summary?.providerEarnings || 0).toLocaleString()}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} md={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Admin Share (25%)</Typography><Typography variant="h6">PKR {Number(summary?.adminCommission || 0).toLocaleString()}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} md={3}><Card><CardContent><Typography variant="body2" color="text.secondary">Transactions</Typography><Typography variant="h6">{Number(summary?.transactions || 0).toLocaleString()}</Typography></CardContent></Card></Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, border: '1px solid #E2E8F0' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Payout Account Details</Typography>
              <Stack spacing={1.5}>
                <TextField label="Account Holder Name" value={account.accountHolderName} onChange={(e) => setAccount({ ...account, accountHolderName: e.target.value })} />
                <TextField label="Bank Name" value={account.bankName} onChange={(e) => setAccount({ ...account, bankName: e.target.value })} />
                <TextField label="Bank Account Number" value={account.bankAccountNumber} onChange={(e) => setAccount({ ...account, bankAccountNumber: e.target.value })} />
                <TextField label="IBAN" value={account.iban} onChange={(e) => setAccount({ ...account, iban: e.target.value })} />
                <TextField label="Wallet Provider" value={account.walletProvider} onChange={(e) => setAccount({ ...account, walletProvider: e.target.value })} />
                <TextField label="Wallet Number" value={account.walletNumber} onChange={(e) => setAccount({ ...account, walletNumber: e.target.value })} />
                <Button variant="contained" onClick={saveAccount}>Save Payout Details</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2, border: '1px solid #E2E8F0' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Transaction History</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Transaction</TableCell>
                      <TableCell>Order</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Gross</TableCell>
                      <TableCell>Admin (25%)</TableCell>
                      <TableCell>Provider (75%)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx._id}>
                        <TableCell>
                          <Typography>{tx.transactionId}</Typography>
                          <Typography variant="body2" color="text.secondary">{new Date(tx.createdAt).toLocaleString()}</Typography>
                        </TableCell>
                        <TableCell>{tx.orderNumber || '-'}</TableCell>
                        <TableCell>{tx.status}</TableCell>
                        <TableCell>PKR {Number(tx.amount || 0).toLocaleString()}</TableCell>
                        <TableCell>PKR {Number(tx.adminCommission || 0).toLocaleString()}</TableCell>
                        <TableCell>PKR {Number(tx.providerAmount || 0).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {!transactions.length && (
                      <TableRow>
                        <TableCell colSpan={6}>No transactions available.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
