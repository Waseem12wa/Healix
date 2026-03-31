import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import BackButton from '../ui/BackButton';
import { deleteAdminMedicine, getAdminMedicines, type AdminMedicine } from '../services/adminService';

const formatMoney = (amount: number, currency: string) => {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `${currency || 'PKR'} ${safeAmount.toLocaleString()}`;
};

const calcDiscount = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash + name.charCodeAt(i)) % 997;
  }
  const bands = [5, 10, 15, 20, 25, 30];
  return bands[hash % bands.length];
};

export default function AdminMedicinesPage() {
  const [medicines, setMedicines] = useState<AdminMedicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMedicines = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getAdminMedicines();
      setMedicines(data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch medicines:', err);
      setError('Unable to fetch medicines.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  const handleDelete = async (medicineId: string, medicineName: string) => {
    const confirmed = window.confirm(`Remove ${medicineName} from medicine inventory?`);
    if (!confirmed) return;

    try {
      await deleteAdminMedicine(medicineId);
      setMedicines((prev) => prev.filter((item) => item.id !== medicineId));
    } catch (err) {
      console.error('Failed to delete medicine:', err);
      window.alert('Unable to remove medicine. Please try again.');
    }
  };

  return (
    <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
      <Stack spacing={2.5}>
        <BackButton />
        <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 900, color: '#00AFC8' }}>
          Medicine Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review medicines across the platform. Removing a medicine here also removes it from patient and doctor views.
        </Typography>

        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
            <CircularProgress />
          </Stack>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : medicines.length === 0 ? (
          <Alert severity="info">No medicine records available.</Alert>
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
            {medicines.map((item) => {
              const discount = calcDiscount(item.medicineName || 'medicine');
              const oldPrice = Math.round(Number(item.sellingPrice || 0) / (1 - discount / 100));

              return (
                <Box key={item.id}>
                  <Card sx={{ height: '100%', borderRadius: 2, border: '1px solid #D7E0EA' }}>
                    <CardContent sx={{ p: 2.25 }}>
                      <Stack spacing={1.2}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ px: 1.2, py: 0.5, bgcolor: '#E6F2FF', color: '#003B73', borderRadius: 0.75, fontWeight: 700, fontSize: '0.8rem' }}>
                            {discount}% Off
                          </Box>
                          <Typography sx={{ fontSize: '0.8rem', color: item.isActive ? '#0a7f4e' : '#64748B', fontWeight: 700 }}>
                            {item.isActive ? 'active' : 'inactive'}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 150 }}>
                          <Box
                            component="img"
                            src={item.imageUrl || `https://placehold.co/320x220/png?text=${encodeURIComponent(item.medicineName || 'Medicine')}`}
                            alt={item.medicineName}
                            onError={(e: any) => {
                              e.currentTarget.src = `https://placehold.co/320x220/png?text=${encodeURIComponent(item.medicineName || 'Medicine')}`;
                            }}
                            sx={{ maxHeight: 140, maxWidth: '100%', objectFit: 'contain' }}
                          />
                        </Box>

                        <Typography sx={{ fontWeight: 800, color: '#1B2A41', lineHeight: 1.25, minHeight: 50 }}>
                          {item.medicineName}
                        </Typography>

                        <Typography sx={{ color: '#465D75' }}>{item.category || 'General'}</Typography>
                        <Typography sx={{ color: '#465D75' }}>Pack Size: {item.commonDosage || '1 pack'}</Typography>
                        <Typography sx={{ color: '#465D75' }}>Stock: {item.quantity}</Typography>

                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: '#1B2A41' }}>
                            {formatMoney(item.sellingPrice, item.currency)}
                          </Typography>
                          <Typography sx={{ color: '#E63946', textDecoration: 'line-through', fontWeight: 700 }}>
                            {formatMoney(oldPrice, item.currency)}
                          </Typography>
                        </Stack>

                        <Button
                          color="error"
                          variant="outlined"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(item.id, item.medicineName)}
                          sx={{ textTransform: 'none', borderRadius: 1.2, fontWeight: 700 }}
                        >
                          Remove
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              );
            })}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
