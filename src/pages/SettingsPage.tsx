import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import BackButton from '../ui/BackButton';
import { getAppSettings, saveAppSettings } from '../utils/settings';
import { clearAuthData } from '../utils/auth';
import { deleteMyAccount } from '../services/patientService';
import { useNavigate } from 'react-router-dom';
import { BRAND_GRADIENT, HERO_BG, colors } from '../ui/premium';

export default function SettingsPage() {
  const navigate = useNavigate();
  const role = (localStorage.getItem('authRole') || 'patient').toLowerCase();
  const registeredEmail = (localStorage.getItem('userEmail') || '').trim().toLowerCase();

  const [settings, setSettings] = useState(() => getAppSettings());
  const [savingKey, setSavingKey] = useState<null | keyof typeof settings>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canDelete = useMemo(() => {
    const confirm = deleteConfirmText.trim();
    const matchesDeleteKeyword = confirm.toUpperCase() === 'DELETE';
    const matchesRegisteredEmail = Boolean(registeredEmail) && confirm.toLowerCase() === registeredEmail;
    return (matchesDeleteKeyword || matchesRegisteredEmail) && deletePassword.trim().length > 0;
  }, [deleteConfirmText, deletePassword, registeredEmail]);

  const handleSettingToggle = async (key: keyof typeof settings, value: boolean) => {
    setError(null);
    setSuccess(null);
    setSavingKey(key);
    const next = saveAppSettings({ [key]: value });
    setSettings(next);
    setSavingKey(null);
  };

  const handleDeleteAccount = async () => {
    if (!canDelete) return;

    try {
      setDeleting(true);
      setError(null);
      await deleteMyAccount(deletePassword.trim(), deleteConfirmText.trim());
      clearAuthData();
      setSuccess('Account deleted successfully.');
      navigate('/signup', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete account. Please verify your password.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: HERO_BG, py: 4, px: 2 }}>
      <Box sx={{ maxWidth: 960, mx: 'auto' }}>
        <BackButton />

        <Stack spacing={3} sx={{ mt: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ width: 56, height: 56, borderRadius: 2, background: BRAND_GRADIENT, boxShadow: '0 8px 20px rgba(14,165,233,0.28), 0 2px 6px rgba(37,99,235,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SettingsIcon sx={{ color: colors.surface, fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: colors.ink }}>Settings</Typography>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                Manage your account preferences as {role}.
              </Typography>
            </Box>
          </Stack>

          {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
          {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}

          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Notifications</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notificationsEnabled}
                    onChange={(e) => handleSettingToggle('notificationsEnabled', e.target.checked)}
                  />
                }
                label={settings.notificationsEnabled ? 'Enable notifications' : 'Disable notifications'}
              />
              <Typography variant="body2" sx={{ color: '#64748B', mt: 1 }}>
                When disabled, notification polling and unread counters are paused.
              </Typography>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Appearance</Typography>
              <Stack spacing={1.5}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.darkMode}
                      onChange={(e) => handleSettingToggle('darkMode', e.target.checked)}
                    />
                  }
                  label={settings.darkMode ? 'Dark mode enabled' : 'Dark mode disabled'}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.monochromeMode}
                      onChange={(e) => handleSettingToggle('monochromeMode', e.target.checked)}
                    />
                  }
                  label={settings.monochromeMode ? 'Black and white mode enabled' : 'Black and white mode disabled'}
                />
              </Stack>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 1 }}>
                Black and white mode helps with high-contrast visual preference.
              </Typography>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(244,63,94, 0.25)' }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                <DeleteForeverIcon sx={{ color: '#F43F5E' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#B42318' }}>Delete Account</Typography>
              </Stack>

              <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
                This action permanently removes your account and related personal records.
              </Typography>

              <Stack spacing={2}>
                <TextField
                  label="Type DELETE or your registered email"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  helperText={registeredEmail ? `Registered email: ${registeredEmail}` : 'Use DELETE if email is not shown.'}
                />
                <TextField
                  label="Current password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                />
                <Divider />
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleDeleteAccount}
                  disabled={!canDelete || deleting}
                >
                  {deleting ? 'Deleting account...' : 'Delete my account'}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {savingKey && (
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Saving {savingKey} preference...
            </Typography>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
