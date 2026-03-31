import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
  Alert,
  Tab,
  Tabs,
  Paper,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  ContentCopy as CopyIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  getDoctorAppointments,
  updateAppointmentStatus,
  updateAppointmentDetails,
  cancelAppointment,
  completeAppointment,
  addAppointmentPrescription,
  type Appointment,
} from '../services/appointmentService';
import BackButton from '../ui/BackButton';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`appointment-tabpanel-${index}`}
      aria-labelledby={`appointment-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'approve' | 'edit'>('edit');
  const [prescriptionDialog, setPrescriptionDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState({
    doctorComments: '',
    meetingLink: '',
    appointmentLocationDetails: '',
  });
  const [prescriptionForm, setPrescriptionForm] = useState({
    conditionDescription: '',
    medicines: [{ name: '', dosage: '', instructions: '' }],
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      const data = await getDoctorAppointments();
      setAppointments(data);
      if (!hasLoadedOnce) {
        setHasLoadedOnce(true);
      }
    } catch (err) {
      setError('Failed to load appointments. Please try again.');
      console.error(err);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [hasLoadedOnce]);

  useEffect(() => {
    loadAppointments();
    const interval = setInterval(() => loadAppointments({ silent: true }), 5000);
    return () => clearInterval(interval);
  }, [loadAppointments]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleApproveAppointment = (appointmentId: string) => {
    const appointment = appointments.find((a) => a._id === appointmentId);
    if (!appointment) {
      setMessage({ type: 'error', text: 'Unable to open appointment approval form' });
      return;
    }

    setSelectedAppointment(appointment);
    setFormData({
      doctorComments: appointment.doctorComments || '',
      meetingLink: appointment.meetingLink || '',
      appointmentLocationDetails: appointment.appointmentLocationDetails || '',
    });
    setDialogMode('approve');
    setDetailsDialog(true);
  };

  const handleRejectAppointment = async (appointmentId: string) => {
    try {
      await updateAppointmentStatus(appointmentId, 'rejected');
      setMessage({ type: 'success', text: 'Appointment rejected successfully' });
      loadAppointments();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to reject appointment' });
      console.error(err);
    }
  };

  const isPastAppointment = (appointment: Appointment) => {
    const datePart = String(appointment.date || '').trim();
    const timePart = String(appointment.time || '').trim();
    if (!datePart || !timePart) return false;
    const normalizedTime = timePart.length === 5 ? `${timePart}:00` : timePart;
    const parsed = new Date(`${datePart}T${normalizedTime}`);
    if (Number.isNaN(parsed.getTime())) return false;
    return parsed.getTime() <= Date.now();
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      await completeAppointment(appointmentId);
      setMessage({ type: 'success', text: 'Appointment marked as completed' });
      loadAppointments();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to complete appointment' });
      console.error(err);
    }
  };

  const handleOpenPrescriptionDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setPrescriptionForm({
      conditionDescription: '',
      medicines: [{ name: '', dosage: '', instructions: '' }],
    });
    setPrescriptionDialog(true);
  };

  const handleClosePrescriptionDialog = () => {
    setPrescriptionDialog(false);
    setSelectedAppointment(null);
    setPrescriptionForm({
      conditionDescription: '',
      medicines: [{ name: '', dosage: '', instructions: '' }],
    });
  };

  const handleAddMedicineField = () => {
    setPrescriptionForm((prev) => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', dosage: '', instructions: '' }],
    }));
  };

  const handleRemoveMedicineField = (index: number) => {
    setPrescriptionForm((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, idx) => idx !== index),
    }));
  };

  const handleUpdateMedicineField = (index: number, key: 'name' | 'dosage' | 'instructions', value: string) => {
    setPrescriptionForm((prev) => ({
      ...prev,
      medicines: prev.medicines.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)),
    }));
  };

  const handleSavePrescription = async () => {
    if (!selectedAppointment) return;

    const conditionDescription = prescriptionForm.conditionDescription.trim();
    const medicines = prescriptionForm.medicines
      .map((med) => ({
        name: med.name.trim(),
        dosage: med.dosage.trim(),
        instructions: med.instructions.trim(),
      }))
      .filter((med) => med.name);

    if (!conditionDescription) {
      setMessage({ type: 'error', text: 'Condition description is required' });
      return;
    }

    if (medicines.length === 0) {
      setMessage({ type: 'error', text: 'Add at least one medicine in the prescription' });
      return;
    }

    try {
      setSubmitting(true);
      await addAppointmentPrescription(selectedAppointment._id, {
        conditionDescription,
        medicines,
      });
      setMessage({ type: 'success', text: 'Digital prescription saved successfully' });
      handleClosePrescriptionDialog();
      loadAppointments();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to save prescription' });
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDetailsDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setFormData({
      doctorComments: appointment.doctorComments || '',
      meetingLink: appointment.meetingLink || '',
      appointmentLocationDetails: appointment.appointmentLocationDetails || '',
    });
    setDialogMode('edit');
    setDetailsDialog(true);
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialog(false);
    setSelectedAppointment(null);
    setDialogMode('edit');
    setFormData({
      doctorComments: '',
      meetingLink: '',
      appointmentLocationDetails: '',
    });
  };

  const getApprovalValidationError = () => {
    if (!selectedAppointment || dialogMode !== 'approve') return '';

    if (selectedAppointment.consultationType === 'online' && !formData.meetingLink.trim()) {
      return 'Meeting link is required before approving an online appointment.';
    }

    if (selectedAppointment.consultationType === 'in-person' && !formData.appointmentLocationDetails.trim()) {
      return 'Location details are required before approving an in-person appointment.';
    }

    return '';
  };

  const handleSaveDetails = async () => {
    if (!selectedAppointment) return;
    const validationError = getApprovalValidationError();

    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }

    try {
      setSubmitting(true);
      if (dialogMode === 'approve') {
        await updateAppointmentStatus(selectedAppointment._id, 'approved', {
          doctorComments: formData.doctorComments,
          meetingLink: formData.meetingLink,
          appointmentLocationDetails: formData.appointmentLocationDetails,
        });
        setMessage({ type: 'success', text: 'Appointment approved successfully' });
      } else {
        await updateAppointmentDetails(selectedAppointment._id, formData);
        setMessage({ type: 'success', text: 'Appointment details updated successfully' });
      }

      handleCloseDetailsDialog();
      loadAppointments();
    } catch (err) {
      setMessage({
        type: 'error',
        text: dialogMode === 'approve' ? 'Failed to approve appointment' : 'Failed to update appointment details',
      });
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await cancelAppointment(appointmentId);
        setMessage({ type: 'success', text: 'Appointment cancelled successfully' });
        loadAppointments();
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to cancel appointment' });
        console.error(err);
      }
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'Copied to clipboard' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
      case 'completed':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const approvedAppointments = appointments.filter(a => a.status === 'approved');
  const completedAppointments = appointments.filter(a => a.status === 'completed');
  const rejectedAppointments = appointments.filter(a => a.status === 'rejected');

  const renderAppointmentCard = (appointment: Appointment) => (
    <motion.div
      key={appointment._id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{ mb: 2, borderLeft: '4px solid #06D6A0' }}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="start">
              <div>
                <Typography variant="h6" sx={{ color: '#1a202c', mb: 1 }}>
                  {appointment.patientName}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  <Chip
                    label={getStatusLabel(appointment.status)}
                    color={getStatusColor(appointment.status) as any}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={appointment.consultationType === 'online' ? '🌐 Online' : '📍 In-Person'}
                    size="small"
                    variant="filled"
                    sx={{ backgroundColor: '#e0f2fe' }}
                  />
                </Stack>
              </div>
            </Stack>

            <Divider />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flex-wrap="wrap">
              <Box sx={{ flex: { xs: '100%', sm: '50%' } }}>
                <Typography variant="caption" sx={{ color: '#718096', display: 'block' }}>
                  Date & Time
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                  {appointment.date} at {appointment.time}
                </Typography>
              </Box>
              <Box sx={{ flex: { xs: '100%', sm: '50%' } }}>
                <Typography variant="caption" sx={{ color: '#718096', display: 'block' }}>
                  Consultation Fee
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                  Rs. {appointment.fee}
                </Typography>
              </Box>
              <Box sx={{ flex: { xs: '100%', sm: '50%' } }}>
                <Typography variant="caption" sx={{ color: '#718096', display: 'block' }}>
                  Patient Email
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                  {appointment.patientEmail}
                </Typography>
              </Box>
              <Box sx={{ flex: { xs: '100%', sm: '50%' } }}>
                <Typography variant="caption" sx={{ color: '#718096', display: 'block' }}>
                  Location
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                  {appointment.location}
                </Typography>
              </Box>
            </Stack>

            {appointment.notes && (
              <>
                <Divider />
                <div>
                  <Typography variant="caption" sx={{ color: '#718096', display: 'block' }}>
                    Patient Notes
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {appointment.notes}
                  </Typography>
                </div>
              </>
            )}

            {appointment.status === 'approved' && (
              <>
                <Divider />
                <div>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: '#06D6A0', fontWeight: 600 }}>
                    Appointment Details
                  </Typography>
                  
                  {appointment.doctorComments && (
                    <Stack spacing={1} sx={{ mb: 1 }}>
                      <Typography variant="caption" sx={{ color: '#718096' }}>
                        Doctor Comments
                      </Typography>
                      <Typography variant="body2" sx={{ backgroundColor: '#f7fafc', p: 1, borderRadius: 1 }}>
                        {appointment.doctorComments}
                      </Typography>
                    </Stack>
                  )}

                  {appointment.consultationType === 'online' && appointment.meetingLink && (
                    <Stack spacing={1} sx={{ mb: 1 }}>
                      <Typography variant="caption" sx={{ color: '#718096' }}>
                        Meeting Link
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography
                          variant="body2"
                          sx={{
                            backgroundColor: '#f7fafc',
                            p: 1,
                            borderRadius: 1,
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {appointment.meetingLink}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleCopyToClipboard(appointment.meetingLink!)}
                          title="Copy link"
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          href={appointment.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open link"
                        >
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                  )}

                  {appointment.consultationType === 'in-person' && appointment.appointmentLocationDetails && (
                    <Stack spacing={1} sx={{ mb: 1 }}>
                      <Typography variant="caption" sx={{ color: '#718096' }}>
                        Location Details
                      </Typography>
                      <Typography variant="body2" sx={{ backgroundColor: '#f7fafc', p: 1, borderRadius: 1 }}>
                        {appointment.appointmentLocationDetails}
                      </Typography>
                    </Stack>
                  )}
                </div>
              </>
            )}

            <Divider />

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              {appointment.status === 'pending' && (
                <>
                  <Button
                    variant="contained"
                    size="small"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleApproveAppointment(appointment._id)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => handleRejectAppointment(appointment._id)}
                  >
                    Reject
                  </Button>
                </>
              )}

              {appointment.status === 'approved' && (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenDetailsDialog(appointment)}
                  >
                    Edit Details
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    color="success"
                    onClick={() => handleCompleteAppointment(appointment._id)}
                    disabled={!isPastAppointment(appointment)}
                  >
                    Mark Completed
                  </Button>
                </>
              )}

              {appointment.status === 'completed' && (
                <Button
                  variant="contained"
                  size="small"
                  color="primary"
                  onClick={() => handleOpenPrescriptionDialog(appointment)}
                >
                  Add Prescription
                </Button>
              )}

              {appointment.status !== 'rejected' && appointment.status !== 'completed' && (
                <Button
                  variant="text"
                  size="small"
                  color="error"
                  onClick={() => handleCancelAppointment(appointment._id)}
                >
                  Cancel
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading && !hasLoadedOnce) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
        <Stack spacing={3}>
          <BackButton />

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div>
              <Typography variant="h4" sx={{ mb: 1, color: '#1a202c', fontWeight: 700 }}>
                My Appointments
              </Typography>
              <Typography variant="body2" sx={{ color: '#718096' }}>
                Manage and review your patient appointments
              </Typography>
            </div>
          </motion.div>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {message && (
            <Alert severity={message.type} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}

          <Paper sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="appointment tabs">
              <Tab label={`Pending (${pendingAppointments.length})`} id="appointment-tab-0" />
              <Tab label={`Approved (${approvedAppointments.length})`} id="appointment-tab-1" />
              <Tab label={`Completed (${completedAppointments.length})`} id="appointment-tab-2" />
              <Tab label={`Rejected (${rejectedAppointments.length})`} id="appointment-tab-3" />
            </Tabs>
          </Paper>

          <TabPanel value={tabValue} index={0}>
            {pendingAppointments.length === 0 ? (
              <Alert severity="info">No pending appointments</Alert>
            ) : (
              <Stack spacing={2}>
                {pendingAppointments.map(renderAppointmentCard)}
              </Stack>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {approvedAppointments.length === 0 ? (
              <Alert severity="info">No approved appointments</Alert>
            ) : (
              <Stack spacing={2}>
                {approvedAppointments.map(renderAppointmentCard)}
              </Stack>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {completedAppointments.length === 0 ? (
              <Alert severity="info">No completed appointments</Alert>
            ) : (
              <Stack spacing={2}>
                {completedAppointments.map(renderAppointmentCard)}
              </Stack>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            {rejectedAppointments.length === 0 ? (
              <Alert severity="info">No rejected appointments</Alert>
            ) : (
              <Stack spacing={2}>
                {rejectedAppointments.map(renderAppointmentCard)}
              </Stack>
            )}
          </TabPanel>
        </Stack>
      </Box>

      {/* Details Dialog */}
      <Dialog open={detailsDialog} onClose={handleCloseDetailsDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'approve' ? 'Approve Appointment' : 'Add Appointment Details'}
          <Typography variant="body2" sx={{ color: '#718096', fontWeight: 400 }}>
            {selectedAppointment?.patientName} -{' '}
            {selectedAppointment?.consultationType === 'online' ? '🌐 Online' : '📍 In-Person'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2}>
            {dialogMode === 'approve' && (
              <Alert severity="info">
                {selectedAppointment?.consultationType === 'online'
                  ? 'Meeting link is required before approval.'
                  : 'Location details are required before approval.'}
              </Alert>
            )}
            <TextField
              label="Comments for Patient"
              value={formData.doctorComments}
              onChange={(e) => setFormData({ ...formData, doctorComments: e.target.value })}
              multiline
              rows={3}
              placeholder="e.g., Please bring recent test reports..."
              fullWidth
              variant="outlined"
            />

            {selectedAppointment?.consultationType === 'online' && (
              <TextField
                label="Meeting Link"
                value={formData.meetingLink}
                onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                placeholder="e.g., https://zoom.us/j/..."
                fullWidth
                variant="outlined"
                required={dialogMode === 'approve'}
              />
            )}

            {selectedAppointment?.consultationType === 'in-person' && (
              <TextField
                label="Location Details"
                value={formData.appointmentLocationDetails}
                onChange={(e) => setFormData({ ...formData, appointmentLocationDetails: e.target.value })}
                multiline
                rows={3}
                placeholder="e.g., Room 201, Building A, Ground Floor..."
                fullWidth
                variant="outlined"
                required={dialogMode === 'approve'}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDetailsDialog}>Cancel</Button>
          <Button
            onClick={handleSaveDetails}
            variant="contained"
            disabled={submitting || Boolean(getApprovalValidationError())}
          >
            {submitting ? 'Saving...' : dialogMode === 'approve' ? 'Approve Appointment' : 'Save Details'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={prescriptionDialog} onClose={handleClosePrescriptionDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Add Digital Prescription
          <Typography variant="body2" sx={{ color: '#718096', fontWeight: 400 }}>
            {selectedAppointment?.patientName}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2}>
            <TextField
              label="Patient Condition Description"
              value={prescriptionForm.conditionDescription}
              onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, conditionDescription: e.target.value }))}
              multiline
              rows={3}
              required
              fullWidth
            />

            <Divider />

            <Typography variant="subtitle2" sx={{ color: '#1A1A2E', fontWeight: 700 }}>
              Prescribed Medicines
            </Typography>

            {prescriptionForm.medicines.map((medicine, index) => (
              <Stack key={index} spacing={1.2} sx={{ border: '1px solid #E2E8F0', borderRadius: 1.5, p: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Medicine {index + 1}</Typography>
                  {prescriptionForm.medicines.length > 1 && (
                    <Button size="small" color="error" onClick={() => handleRemoveMedicineField(index)}>
                      Remove
                    </Button>
                  )}
                </Stack>

                <TextField
                  label="Medicine Name"
                  required
                  value={medicine.name}
                  onChange={(e) => handleUpdateMedicineField(index, 'name', e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Dosage"
                  placeholder="e.g., 1 tablet twice daily"
                  value={medicine.dosage}
                  onChange={(e) => handleUpdateMedicineField(index, 'dosage', e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Instructions"
                  placeholder="e.g., After meal"
                  value={medicine.instructions}
                  onChange={(e) => handleUpdateMedicineField(index, 'instructions', e.target.value)}
                  multiline
                  rows={2}
                  fullWidth
                />
              </Stack>
            ))}

            <Button variant="outlined" onClick={handleAddMedicineField}>
              Add Another Medicine
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClosePrescriptionDialog}>Cancel</Button>
          <Button onClick={handleSavePrescription} variant="contained" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Prescription'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
