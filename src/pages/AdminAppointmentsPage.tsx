import { useEffect, useState } from 'react';
import {
  Box,
  Button,
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
import DeleteIcon from '@mui/icons-material/Delete';
import BackButton from '../ui/BackButton';
import { deleteAdminAppointment, getAdminAppointments, type AdminAppointment } from '../services/adminService';

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAppointments = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getAdminAppointments();
      setAppointments(data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      setError('Unable to fetch appointments.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleDelete = async (appointmentId: string) => {
    const confirmed = window.confirm('Delete this appointment?');
    if (!confirmed) return;

    try {
      await deleteAdminAppointment(appointmentId);
      setAppointments((prev) => prev.filter((item) => item.id !== appointmentId));
    } catch (err) {
      console.error('Failed to delete appointment:', err);
      window.alert('Unable to delete appointment.');
    }
  };

  return (
    <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
      <Stack spacing={2.5}>
        <BackButton />
        <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 900, color: '#00AFC8' }}>
          Appointments
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
                      <TableCell>Patient</TableCell>
                      <TableCell>Doctor</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appointments.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700 }}>{item.patientName}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.patientEmail}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700 }}>{item.doctorName}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.doctorEmail}</Typography>
                        </TableCell>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>{item.time}</TableCell>
                        <TableCell>
                          <Chip size="small" label={item.consultationType} />
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={item.status} color={item.status === 'approved' || item.status === 'completed' ? 'success' : item.status === 'pending' ? 'warning' : 'default'} />
                        </TableCell>
                        <TableCell align="right">
                          <Button color="error" startIcon={<DeleteIcon />} onClick={() => handleDelete(item.id)}>
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {appointments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">No appointments found.</TableCell>
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
