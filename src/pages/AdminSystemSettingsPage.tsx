import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import BackButton from '../ui/BackButton';
import {
  getAdminSystemSettings,
  updateAdminSystemSettings,
  type AdminSystemSettings,
} from '../services/adminService';

const defaultFormState: AdminSystemSettings = {
  platformName: 'Healix',
  supportEmail: '',
  maintenanceMode: false,
  allowNewRegistrations: true,
  enableEmailNotifications: true,
  appointmentReminderLeadMinutes: 15,
  defaultThemeMode: 'light',
  defaultBlackAndWhiteMode: false,
};

export default function AdminSystemSettingsPage() {
  const [form, setForm] = useState<AdminSystemSettings>(defaultFormState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const data = await getAdminSystemSettings();
        setForm({
          platformName: data.platformName || 'Healix',
          supportEmail: data.supportEmail || '',
          maintenanceMode: Boolean(data.maintenanceMode),
          allowNewRegistrations: Boolean(data.allowNewRegistrations),
          enableEmailNotifications: Boolean(data.enableEmailNotifications),
          appointmentReminderLeadMinutes: Number(data.appointmentReminderLeadMinutes) || 15,
          defaultThemeMode: data.defaultThemeMode === 'dark' ? 'dark' : 'light',
          defaultBlackAndWhiteMode: Boolean(data.defaultBlackAndWhiteMode),
        });
        setError('');
      } catch (err) {
        console.error('Failed to load settings:', err);
        setError('Unable to load system settings.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (field: keyof AdminSystemSettings, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await updateAdminSystemSettings(form);
      setForm({
        platformName: updated.platformName || 'Healix',
        supportEmail: updated.supportEmail || '',
        maintenanceMode: Boolean(updated.maintenanceMode),
        allowNewRegistrations: Boolean(updated.allowNewRegistrations),
        enableEmailNotifications: Boolean(updated.enableEmailNotifications),
        appointmentReminderLeadMinutes: Number(updated.appointmentReminderLeadMinutes) || 15,
        defaultThemeMode: updated.defaultThemeMode === 'dark' ? 'dark' : 'light',
        defaultBlackAndWhiteMode: Boolean(updated.defaultBlackAndWhiteMode),
      });
      setSuccess('Settings saved successfully.');
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Unable to save settings. Please check the values and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
      <Stack spacing={2.5}>
        <BackButton />
        <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 900, color: '#00AFC8' }}>
          System Settings
        </Typography>

        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack spacing={2.5}>
                <TextField
                  label="Platform Name"
                  value={form.platformName}
                  onChange={(event) => handleChange('platformName', event.target.value)}
                  fullWidth
                />
                <TextField
                  label="Support Email"
                  value={form.supportEmail}
                  onChange={(event) => handleChange('supportEmail', event.target.value)}
                  fullWidth
                />
                <TextField
                  label="Appointment Reminder Lead Minutes"
                  type="number"
                  value={form.appointmentReminderLeadMinutes}
                  onChange={(event) => handleChange('appointmentReminderLeadMinutes', Number(event.target.value))}
                  inputProps={{ min: 5, max: 120 }}
                  fullWidth
                />
                <TextField
                  select
                  label="Default Theme"
                  value={form.defaultThemeMode}
                  onChange={(event) => handleChange('defaultThemeMode', event.target.value as 'light' | 'dark')}
                  fullWidth
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                </TextField>

                <FormControlLabel
                  control={<Switch checked={form.maintenanceMode} onChange={(event) => handleChange('maintenanceMode', event.target.checked)} />}
                  label="Maintenance Mode"
                />
                <FormControlLabel
                  control={<Switch checked={form.allowNewRegistrations} onChange={(event) => handleChange('allowNewRegistrations', event.target.checked)} />}
                  label="Allow New Registrations"
                />
                <FormControlLabel
                  control={<Switch checked={form.enableEmailNotifications} onChange={(event) => handleChange('enableEmailNotifications', event.target.checked)} />}
                  label="Enable Email Notifications"
                />
                <FormControlLabel
                  control={<Switch checked={form.defaultBlackAndWhiteMode} onChange={(event) => handleChange('defaultBlackAndWhiteMode', event.target.checked)} />}
                  label="Default Black and White Mode"
                />

                {error && <Typography color="error">{error}</Typography>}
                {success && <Typography color="success.main">{success}</Typography>}

                <Stack direction="row" justifyContent="flex-end">
                  <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ textTransform: 'none' }}>
                    {saving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
