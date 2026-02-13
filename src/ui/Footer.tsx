import { Box, Container, Stack, Typography, Link as MuiLink, Divider, useTheme, alpha } from '@mui/material'
import { Link } from 'react-router-dom'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import XIcon from '@mui/icons-material/X'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import EmailIcon from '@mui/icons-material/Email'
import footerBg from '../images/footer.jpg'

export default function Footer() {
  const theme = useTheme()
  const currentYear = new Date().getFullYear()

  return (
    <Box
      component="footer"
      sx={{
        position: 'relative',
        backgroundImage: `url(${footerBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.8) 100%)',
          zIndex: 0,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.primary.dark, 0.18)} 100%)`,
          zIndex: 1,
          pointerEvents: 'none',
        },
        pt: { xs: 8, md: 10 },
        pb: { xs: 5, md: 6 },
        zIndex: 2,
      }}
    >
      <Container sx={{ position: 'relative', zIndex: 3 }}>
        {/* Top Section - Logo and Description */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={5}
          sx={{ mb: { xs: 5, md: 7 } }}
        >
          <Box sx={{ flex: { md: '0 0 40%' } }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  bgcolor: theme.palette.primary.main,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
                }}
              >
                <LocalHospitalIcon sx={{ fontSize: 28 }} />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: '#FFFFFF',
                  fontSize: { xs: '1.5rem', md: '1.75rem' },
                  letterSpacing: '-0.02em'
                }}
              >
                Healix
              </Typography>
            </Stack>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.85)',
                mb: 3.5,
                lineHeight: 1.7,
                maxWidth: 420,
                fontSize: '0.9375rem'
              }}
            >
              Your ultimate destination for discovering and comparing the best healthcare solutions available today.
            </Typography>
            <Stack direction="row" spacing={2}>
              <Box
                component="a"
                href="#"
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  border: `1px solid ${alpha('#FFFFFF', 0.25)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255, 255, 255, 0.85)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: theme.palette.primary.light,
                    color: theme.palette.primary.light,
                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                  },
                }}
              >
                <XIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box
                component="a"
                href="#"
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  border: `1px solid ${alpha('#FFFFFF', 0.25)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255, 255, 255, 0.85)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: theme.palette.primary.light,
                    color: theme.palette.primary.light,
                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                  },
                }}
              >
                <LinkedInIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box
                component="a"
                href="mailto:contact@healix.com"
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  border: `1px solid ${alpha('#FFFFFF', 0.25)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255, 255, 255, 0.85)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: theme.palette.primary.light,
                    color: theme.palette.primary.light,
                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                  },
                }}
              >
                <EmailIcon sx={{ fontSize: 20 }} />
              </Box>
            </Stack>
          </Box>

          {/* Links Columns */}
          <Box sx={{ flex: { md: '1' }, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 4, sm: 6, md: 8 } }}>
            {/* Quick Links */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: '#FFFFFF',
                  mb: 2.5,
                  fontSize: '0.9375rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Quick Links
              </Typography>
              <Stack spacing={2}>
                <MuiLink
                  component={Link}
                  to="/"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.75)',
                    textDecoration: 'none',
                    fontSize: '0.9375rem',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: theme.palette.primary.light,
                      transform: 'translateX(4px)'
                    },
                  }}
                >
                  Home
                </MuiLink>
                <MuiLink
                  component={Link}
                  to="/about"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.75)',
                    textDecoration: 'none',
                    fontSize: '0.9375rem',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: theme.palette.primary.light,
                      transform: 'translateX(4px)'
                    },
                  }}
                >
                  About Us
                </MuiLink>
                <MuiLink
                  component={Link}
                  to="/contact"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.75)',
                    textDecoration: 'none',
                    fontSize: '0.9375rem',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: theme.palette.primary.light,
                      transform: 'translateX(4px)'
                    },
                  }}
                >
                  Contact
                </MuiLink>
              </Stack>
            </Box>

            {/* Categories */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: '#FFFFFF',
                  mb: 2.5,
                  fontSize: '0.9375rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Categories
              </Typography>
              <Stack spacing={2}>
                <MuiLink
                  component={Link}
                  to="/drug-alternatives"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.75)',
                    textDecoration: 'none',
                    fontSize: '0.9375rem',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: theme.palette.primary.light,
                      transform: 'translateX(4px)'
                    },
                  }}
                >
                  Drug Alternatives
                </MuiLink>
                <MuiLink
                  component={Link}
                  to="/drug-interactions"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.75)',
                    textDecoration: 'none',
                    fontSize: '0.9375rem',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: theme.palette.primary.light,
                      transform: 'translateX(4px)'
                    },
                  }}
                >
                  Drug Interactions
                </MuiLink>
                <MuiLink
                  component={Link}
                  to="/health-records"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.75)',
                    textDecoration: 'none',
                    fontSize: '0.9375rem',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: theme.palette.primary.light,
                      transform: 'translateX(4px)'
                    },
                  }}
                >
                  Health Records
                </MuiLink>
                <MuiLink
                  component={Link}
                  to="/medication-reminder"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.75)',
                    textDecoration: 'none',
                    fontSize: '0.9375rem',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: theme.palette.primary.light,
                      transform: 'translateX(4px)'
                    },
                  }}
                >
                  Medication Reminder
                </MuiLink>
              </Stack>
            </Box>

            {/* Legal */}
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: '#FFFFFF',
                  mb: 2.5,
                  fontSize: '0.9375rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Legal
              </Typography>
              <Stack spacing={2}>
                <MuiLink
                  href="#"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.75)',
                    textDecoration: 'none',
                    fontSize: '0.9375rem',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: theme.palette.primary.light,
                      transform: 'translateX(4px)'
                    },
                  }}
                >
                  Privacy Policy
                </MuiLink>
                <MuiLink
                  href="#"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.75)',
                    textDecoration: 'none',
                    fontSize: '0.9375rem',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: theme.palette.primary.light,
                      transform: 'translateX(4px)'
                    },
                  }}
                >
                  Terms of Services
                </MuiLink>
                <MuiLink
                  href="#"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.75)',
                    textDecoration: 'none',
                    fontSize: '0.9375rem',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: theme.palette.primary.light,
                      transform: 'translateX(4px)'
                    },
                  }}
                >
                  Cookies Policy
                </MuiLink>
              </Stack>
            </Box>
          </Box>
        </Stack>

        {/* Divider */}
        <Divider
          sx={{
            borderColor: alpha('#FFFFFF', 0.15),
            mb: { xs: 3, md: 4 },
          }}
        />

        {/* Bottom Section - Copyright Only */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.75)',
              fontSize: '0.9375rem',
            }}
          >
            © {currentYear} Healix. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}
