import { useEffect, useMemo, useState } from 'react';
import { alpha, Box, Card, CardContent, Chip, CircularProgress, Stack, Typography, useTheme } from '@mui/material';
import BackButton from '../ui/BackButton';
import { getAdminAnalytics, type AdminAnalytics } from '../services/adminService';

const POLL_INTERVAL_MS = 10000;

export default function AdminAnalyticsPage() {
  const theme = useTheme();
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getAdminAnalytics();
      setAnalytics(data);
      setError('');
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
      if (!silent) setError('Unable to load analytics right now.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const intervalId = window.setInterval(() => {
      fetchAnalytics(true);
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  const statCards = useMemo(() => {
    if (!analytics) return [];
    return [
      { label: 'Total Users', value: analytics.totals.totalUsers },
      { label: 'Total Appointments', value: analytics.totals.totalAppointments },
      { label: 'Total Payments', value: analytics.totals.totalPayments },
      { label: 'Total Orders', value: analytics.totals.totalOrders },
      { label: 'Successful Payments', value: analytics.totals.totalSuccessfulPayments },
      { label: 'Total Revenue', value: `${analytics.totals.totalRevenue.toLocaleString()} PKR` },
    ];
  }, [analytics]);

  return (
    <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
      <Stack spacing={2.5}>
        <BackButton />
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 900, color: '#00AFC8' }}>
            Admin Analytics
          </Typography>
          {analytics && (
            <Chip
              label={`Live sync: ${new Date(analytics.generatedAt).toLocaleTimeString()}`}
              sx={{ fontWeight: 700, bgcolor: alpha('#0EA5E9', 0.1), color: '#1D4ED8' }}
            />
          )}
        </Stack>

        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
            <CircularProgress />
          </Stack>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <Stack spacing={3}>
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
              }}
            >
              {statCards.map((item) => (
                <Card key={item.label} sx={{ borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.divider, 0.5) }}>
                  <CardContent>
                    <Typography sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.9rem' }}>{item.label}</Typography>
                    <Typography sx={{ mt: 1, fontSize: '1.6rem', fontWeight: 900, color: '#111827' }}>{item.value}</Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {analytics && (
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography sx={{ fontWeight: 800, mb: 2 }}>User Distribution</Typography>
                    <Stack spacing={1.25}>
                      <Typography>Patients: {analytics.usersByRole.patient}</Typography>
                      <Typography>Doctors: {analytics.usersByRole.doctor}</Typography>
                      <Typography>Providers: {analytics.usersByRole.provider}</Typography>
                      <Typography>Admins: {analytics.usersByRole.admin}</Typography>
                    </Stack>
                  </CardContent>
                </Card>

                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography sx={{ fontWeight: 800, mb: 2 }}>Appointment Status</Typography>
                    <Stack spacing={1.25}>
                      <Typography>Pending: {analytics.appointmentsByStatus.pending}</Typography>
                      <Typography>Approved: {analytics.appointmentsByStatus.approved}</Typography>
                      <Typography>Completed: {analytics.appointmentsByStatus.completed}</Typography>
                      <Typography>Rejected: {analytics.appointmentsByStatus.rejected}</Typography>
                      <Typography>Cancelled: {analytics.appointmentsByStatus.cancelled}</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
