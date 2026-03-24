import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import BackButton from '../../ui/BackButton'
import Grid from '@mui/material/GridLegacy'

export default function AdminProfile() {
  return (
    <Stack spacing={3}>
      <Box sx={{
        position: 'fixed',
        left: { xs: 16, md: 24 },
        top: { xs: 16, md: 24 },
        zIndex: 1100
      }}>
        <BackButton />
      </Box>
      <Typography variant="h4" fontWeight={800}>Admin Profile</Typography>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Grid container spacing={2} component="form" onSubmit={(e) => e.preventDefault()}>
          <Grid item xs={12} sm={6}><TextField label="Full name" required fullWidth /></Grid>
          <Grid item xs={12} sm={6}><TextField label="Organization" fullWidth /></Grid>
          <Grid item xs={12} sm={6}><TextField label="Role/Title" fullWidth /></Grid>
          <Grid item xs={12} sm={6}><TextField label="Phone" fullWidth /></Grid>
          <Grid item xs={12}><TextField label="Responsibilities" multiline minRows={3} fullWidth /></Grid>
          <Grid item xs={12}><Button type="submit" variant="contained">Save Profile</Button></Grid>
        </Grid>
      </Paper>
    </Stack>
  )
}


