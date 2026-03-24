import { Box, Button, Card, CardContent, Stack, TextField, Typography, InputAdornment } from '@mui/material'
import BackButton from '../../ui/BackButton'
import Grid from '@mui/material/GridLegacy'
import PersonIcon from '@mui/icons-material/Person'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import SaveIcon from '@mui/icons-material/Save'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'

export default function ProviderProfile() {
  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F5F5F7 0%, #E8F4F8 100%)',
      py: { xs: 4, md: 6 },
      px: { xs: 2, md: 4 }
    }}>
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        <Stack spacing={4}>
          {/* Back Button */}
          <Box>
            <BackButton />
          </Box>

          {/* Page Header */}
          <Box>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
              <Box sx={{
                width: 56,
                height: 56,
                borderRadius: 2.5,
                bgcolor: '#06D6A0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(6, 214, 160, 0.3)'
              }}>
                <PersonIcon sx={{ fontSize: 32, color: '#FFFFFF' }} />
              </Box>
              <Box>
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{
                    color: '#1A1A2E',
                    fontSize: { xs: '1.75rem', md: '2.25rem' },
                    lineHeight: 1.2,
                    mb: 0.5
                  }}
                >
                  Doctor Profile
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748B', fontSize: '14px' }}>
                  Manage your professional information and practice details
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Profile Form */}
          <Card elevation={0} sx={{
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            bgcolor: '#FFFFFF'
          }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack spacing={4} component="form" onSubmit={(e) => e.preventDefault()}>

                {/* Personal Information Section */}
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#1A1A2E', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon sx={{ color: '#06D6A0' }} />
                    Personal Information
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Full Name"
                        defaultValue="Dr. John Doe"
                        fullWidth
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#F5F5F7',
                            borderRadius: 2,
                            '& fieldset': { borderColor: '#E2E8F0' },
                            '&:hover fieldset': { borderColor: '#00B4D8' },
                            '&.Mui-focused fieldset': { borderColor: '#00B4D8' }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Specialization"
                        defaultValue="Cardiologist"
                        fullWidth
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#F5F5F7',
                            borderRadius: 2,
                            '& fieldset': { borderColor: '#E2E8F0' },
                            '&:hover fieldset': { borderColor: '#00B4D8' },
                            '&.Mui-focused fieldset': { borderColor: '#00B4D8' }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Email Address"
                        defaultValue="doctor@healix.com"
                        fullWidth
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: '#64748B' }} /></InputAdornment>,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#F5F5F7',
                            borderRadius: 2,
                            '& fieldset': { borderColor: '#E2E8F0' },
                            '&:hover fieldset': { borderColor: '#00B4D8' },
                            '&.Mui-focused fieldset': { borderColor: '#00B4D8' }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Phone Number"
                        defaultValue="+1 (555) 123-4567"
                        fullWidth
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ color: '#64748B' }} /></InputAdornment>,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#F5F5F7',
                            borderRadius: 2,
                            '& fieldset': { borderColor: '#E2E8F0' },
                            '&:hover fieldset': { borderColor: '#00B4D8' },
                            '&.Mui-focused fieldset': { borderColor: '#00B4D8' }
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Practice Details Section */}
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ color: '#1A1A2E', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalHospitalIcon sx={{ color: '#06D6A0' }} />
                    Practice Details
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Clinic/Hospital Name"
                        defaultValue="Healix Medical Center"
                        fullWidth
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#F5F5F7',
                            borderRadius: 2,
                            '& fieldset': { borderColor: '#E2E8F0' },
                            '&:hover fieldset': { borderColor: '#00B4D8' },
                            '&.Mui-focused fieldset': { borderColor: '#00B4D8' }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Experience (Years)"
                        defaultValue="12"
                        type="number"
                        fullWidth
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#F5F5F7',
                            borderRadius: 2,
                            '& fieldset': { borderColor: '#E2E8F0' },
                            '&:hover fieldset': { borderColor: '#00B4D8' },
                            '&.Mui-focused fieldset': { borderColor: '#00B4D8' }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Clinic Address"
                        defaultValue="123 Medical Plaza, Suite 400, New York, NY 10001"
                        fullWidth
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><LocationOnIcon sx={{ color: '#64748B' }} /></InputAdornment>,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#F5F5F7',
                            borderRadius: 2,
                            '& fieldset': { borderColor: '#E2E8F0' },
                            '&:hover fieldset': { borderColor: '#00B4D8' },
                            '&.Mui-focused fieldset': { borderColor: '#00B4D8' }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Services Offered"
                        multiline
                        minRows={3}
                        defaultValue="General Cardiology, ECG, Echocardiogram, Stress Testing, Holter Monitoring"
                        fullWidth
                        InputProps={{
                          startAdornment: <InputAdornment position="start" sx={{ mt: 1.5 }}><MedicalServicesIcon sx={{ color: '#64748B' }} /></InputAdornment>,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#F5F5F7',
                            borderRadius: 2,
                            '& fieldset': { borderColor: '#E2E8F0' },
                            '&:hover fieldset': { borderColor: '#00B4D8' },
                            '&.Mui-focused fieldset': { borderColor: '#00B4D8' }
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    sx={{
                      bgcolor: '#06D6A0',
                      color: '#FFFFFF',
                      px: 4,
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 700,
                      textTransform: 'none',
                      fontSize: '1rem',
                      boxShadow: '0 4px 12px rgba(6, 214, 160, 0.3)',
                      '&:hover': {
                        bgcolor: '#04A777',
                        boxShadow: '0 6px 16px rgba(6, 214, 160, 0.4)'
                      }
                    }}
                  >
                    Save Changes
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Box>
  )
}


