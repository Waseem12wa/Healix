import { useEffect, useMemo, useState } from 'react'
import { Alert, Avatar, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'
import BackButton from '../../ui/BackButton'
import Grid from '@mui/material/GridLegacy'
import { setProfileCompletionStatus } from '../../utils/auth'

interface AdminMeResponse {
  success: boolean
  data?: {
    id: string
    email: string
    userName?: string
    profileCompleted?: boolean
    patientProfile?: {
      profileImage?: string
    }
  }
  message?: string
}

export default function AdminProfile() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const token = useMemo(() => localStorage.getItem('token') || localStorage.getItem('authToken') || '', [])

  const syncLocalProfile = (nextName: string, nextImage: string) => {
    localStorage.setItem('userName', nextName)
    localStorage.setItem('profileImage', nextImage || '')
    const completed = Boolean(String(nextName || '').trim() && String(nextImage || '').trim())
    setProfileCompletionStatus(completed)
  }

  const loadProfile = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/auth/me', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      const payload = (await response.json()) as AdminMeResponse

      if (!payload.success || !payload.data) {
        throw new Error(payload.message || 'Failed to load profile')
      }

      const nextName = payload.data.userName || ''
      const nextEmail = payload.data.email || ''
      const nextImage = payload.data.patientProfile?.profileImage || ''

      setName(nextName)
      setEmail(nextEmail)
      setProfileImage(nextImage)
      syncLocalProfile(nextName, nextImage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const response = await fetch('/api/auth/me/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ userName: name })
      })

      const payload = (await response.json()) as AdminMeResponse
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.message || 'Failed to save profile')
      }

      const savedName = payload.data.userName || name
      const savedImage = payload.data.patientProfile?.profileImage || profileImage
      setName(savedName)
      setProfileImage(savedImage)
      syncLocalProfile(savedName, savedImage)
      setSuccess('Profile updated successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/auth/me/profile-image', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      const payload = await response.json()
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Failed to upload image')
      }

      const uploadedImage = payload?.data?.profileImage || ''
      setProfileImage(uploadedImage)
      syncLocalProfile(name, uploadedImage)
      setSuccess('Profile picture updated successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          position: 'fixed',
          left: { xs: 16, md: 24 },
          top: { xs: 16, md: 24 },
          zIndex: 1100
        }}
      >
        <BackButton />
      </Box>

      <Typography variant="h4" fontWeight={800}>Admin Profile</Typography>

      <Paper variant="outlined" sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {loading ? (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <CircularProgress size={20} />
            <Typography>Loading profile...</Typography>
          </Stack>
        ) : (
          <Grid container spacing={2} component="form" onSubmit={handleSave}>
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar src={profileImage || undefined} sx={{ width: 72, height: 72 }}>
                  {name?.charAt(0)?.toUpperCase() || 'A'}
                </Avatar>
                <Button variant="outlined" component="label" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Change Profile Picture'}
                  <input hidden type="file" accept="image/*" onChange={handleImageChange} />
                </Button>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Full name"
                required
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Email" fullWidth value={email} disabled />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" disabled={saving || uploading}>
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </Grid>
          </Grid>
        )}
      </Paper>
    </Stack>
  )
}
