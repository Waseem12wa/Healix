import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import GroupIcon from '@mui/icons-material/Group'
import SearchIcon from '@mui/icons-material/Search'
import BackButton from '../ui/BackButton'
import { getAssignedPatients, type AssignedPatientItem } from '../services/doctorService'

export default function AssignedPatients() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [patients, setPatients] = useState<AssignedPatientItem[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    const loadAssignedPatients = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getAssignedPatients()
        setPatients(Array.isArray(data) ? data : [])
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load assigned patients')
      } finally {
        setLoading(false)
      }
    }

    loadAssignedPatients()
  }, [])

  const filteredPatients = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return patients

    return patients.filter((patient) => {
      const searchable = [
        patient.patientName,
        patient.email,
        patient.mobileNumber,
        patient.gender,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchable.includes(q)
    })
  }, [patients, query])

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F5F7FA 0%, #E8F4F8 100%)', py: 4, px: 2 }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <BackButton />

        <Stack spacing={3} sx={{ mt: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  bgcolor: '#06D6A0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GroupIcon sx={{ color: '#fff', fontSize: 30 }} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#1A1A2E' }}>
                  Assigned Patients
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B' }}>
                  View all patients who selected you in their profile.
                </Typography>
              </Box>
            </Stack>

            <TextField
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, phone"
              size="small"
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: '#64748B', mr: 1 }} />,
              }}
              sx={{ minWidth: { xs: '100%', sm: 320 }, bgcolor: '#fff', borderRadius: 2 }}
            />
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}

          {loading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
              <CircularProgress />
              <Typography sx={{ mt: 2, color: '#64748B' }}>Loading assigned patients...</Typography>
            </Stack>
          ) : filteredPatients.length === 0 ? (
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #E2E8F0' }}>
              <CardContent>
                <Typography sx={{ fontSize: '1rem', color: '#1A1A2E', fontWeight: 700 }}>
                  No assigned patients found
                </Typography>
                <Typography sx={{ fontSize: '0.9rem', color: '#64748B', mt: 0.5 }}>
                  Patients who choose you in profile will appear here.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2.5 }}>
              {filteredPatients.map((patient) => (
                <Card key={patient.id} elevation={0} sx={{ borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(15,23,42,0.05)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1.5}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: '#00B4D8' }}>{(patient.patientName || 'P').charAt(0).toUpperCase()}</Avatar>
                        <Box>
                          <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#1A1A2E' }}>
                            {patient.patientName}
                          </Typography>
                          <Typography sx={{ fontSize: '0.85rem', color: '#64748B' }}>{patient.email}</Typography>
                        </Box>
                      </Stack>
                      <Chip label="Assigned" size="small" sx={{ bgcolor: 'rgba(6,214,160,0.12)', color: '#0f766e', fontWeight: 700 }} />
                    </Stack>

                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
                      {typeof patient.age === 'number' && patient.age > 0 && (
                        <Chip label={`Age: ${patient.age}`} size="small" variant="outlined" />
                      )}
                      {patient.gender && patient.gender !== 'Prefer not to say' && (
                        <Chip label={`Gender: ${patient.gender}`} size="small" variant="outlined" />
                      )}
                      {patient.mobileNumber && <Chip label={`Phone: ${patient.mobileNumber}`} size="small" variant="outlined" />}
                    </Stack>

                    {patient.bio && (
                      <Box sx={{ mt: 2 }}>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', mb: 0.4 }}>Patient Bio</Typography>
                        <Typography sx={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.6 }}>
                          {patient.bio}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Stack>
      </Box>
    </Box>
  )
}
