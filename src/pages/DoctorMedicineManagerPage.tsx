import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
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
import { getMedicines, type Medicine } from '../services/paymentService';

const formatMoney = (amount?: number, currency?: string) => {
  const value = Number.isFinite(Number(amount || 0)) ? Number(amount || 0) : 0;
  return `${currency || 'PKR'} ${value.toLocaleString()}`;
};

export default function DoctorMedicineManagerPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMedicines = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await getMedicines({ limit: 200, page: 1, sortBy: 'medicineName', sortOrder: 'asc' });
      setMedicines(response.medicines || []);
      setError('');
    } catch (err) {
      console.error('Failed to load medicines:', err);
      setError('Unable to load medicine records.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  return (
    <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
      <Stack spacing={2.5}>
        <BackButton />
        <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 900, color: '#00AFC8' }}>
          Medicine Manager
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Doctors can view platform medicines here. Providers will add medicines in a future release, and admin can review/remove any incorrect entries.
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
                      <TableCell>Medicine</TableCell>
                      <TableCell>Formula</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Use</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Stock</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {medicines.map((item) => (
                      <TableRow key={item._id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{item.medicineName}</TableCell>
                        <TableCell>{item.genericName || 'N/A'}</TableCell>
                        <TableCell>{item.category || 'N/A'}</TableCell>
                        <TableCell>{item.therapeuticUse || 'N/A'}</TableCell>
                        <TableCell>{formatMoney(item.sellingPrice, item.currency)}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                      </TableRow>
                    ))}
                    {medicines.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No medicines are available yet.
                        </TableCell>
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
