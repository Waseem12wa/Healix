import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import BackButton from '../ui/BackButton';
import { getAdminPayments, type AdminPayment } from '../services/adminService';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const data = await getAdminPayments();
        setPayments(data);
        setError('');
      } catch (err) {
        console.error('Failed to load payments:', err);
        setError('Unable to load payment transactions.');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  return (
    <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
      <Stack spacing={2.5}>
        <BackButton />
        <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 900, color: '#00AFC8' }}>
          Payments
        </Typography>

        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
            <CircularProgress />
          </Stack>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Transaction</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Gateway</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700 }}>{payment.transactionId}</Typography>
                          <Typography variant="caption" color="text.secondary">{payment.orderNumber || 'No order ref'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700 }}>{payment.userName || 'Unknown'}</Typography>
                          <Typography variant="caption" color="text.secondary">{payment.userEmail}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={payment.gateway} />
                        </TableCell>
                        <TableCell>{payment.amount} {payment.currency}</TableCell>
                        <TableCell>
                          <Chip size="small" label={payment.status} color={payment.status === 'succeeded' || payment.status === 'captured' ? 'success' : payment.status === 'failed' ? 'error' : 'warning'} />
                        </TableCell>
                        <TableCell>{new Date(payment.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {payments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">No payment transactions found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
