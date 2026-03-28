import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { AppBar, Box, Container, Toolbar, Typography, Button, Stack } from '@mui/material'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import Footer from './Footer'
import HealthAssistant from '../pages/HealthAssistant'
import footerBg from '../images/footer.jpg'
import { useEffect, useRef } from 'react'
import { getCurrentUserRole, isRouteAllowed, getDashboardPath } from '../utils/roleRoutes'

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const userRole = getCurrentUserRole()
  const previousPathRef = useRef<string>(location.pathname)

  // Validate route on location change (handles both programmatic and browser navigation)
  useEffect(() => {
    const currentPath = location.pathname

    // Skip validation if path hasn't changed
    if (previousPathRef.current === currentPath) {
      return
    }

    previousPathRef.current = currentPath

    const isAllowed = isRouteAllowed(currentPath, userRole)

    if (!isAllowed) {
      if (userRole) {
        // Route not allowed for current role, redirect to role dashboard
        const dashboardPath = getDashboardPath(userRole)
        console.warn(`🚫 Route access denied: ${currentPath} not allowed for role ${userRole}. Redirecting to ${dashboardPath}`)
        navigate(dashboardPath, { replace: true })
      } else {
        // Not logged in - only redirect if not on a public route
        const publicRoutes = ['/', '/about', '/contact', '/login', '/signup', '/forgot-password', '/reset-password']
        if (!publicRoutes.includes(currentPath)) {
          console.warn(`🚫 Route access denied: ${currentPath} requires authentication. Redirecting to login`)
          navigate('/login', { replace: true })
        }
      }
    }
  }, [location.pathname, userRole, navigate])
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          position: 'relative',
          background: 'linear-gradient(135deg, #00B4D8 0%, #0096C7 100%)',
          backgroundImage: `url(${footerBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(0, 180, 216, 0.95) 0%, rgba(0, 150, 199, 0.95) 100%)',
            zIndex: 0,
          },
          borderBottom: 'none',
          boxShadow: '0 4px 20px rgba(0, 180, 216, 0.15)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        <Toolbar sx={{ gap: 2, position: 'relative', zIndex: 2, minHeight: { xs: '70px', md: '80px' }, py: { xs: 2, md: 2.5 } }}>
          <Box
            sx={{
              width: { xs: 44, md: 48 },
              height: { xs: 44, md: 48 },
              borderRadius: 2,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.3)',
                transform: 'scale(1.05)'
              }
            }}
          >
            <LocalHospitalIcon sx={{ fontSize: { xs: 26, md: 30 } }} />
          </Box>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 0,
              fontWeight: 700,
              color: '#FFFFFF',
              fontSize: { xs: '1.35rem', md: '1.6rem' },
              letterSpacing: '-0.02em'
            }}
          >
            Healix
          </Typography>
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <Stack direction="row" spacing={2}>
              <Button
                component={Link}
                to="/"
                sx={{
                  color: '#FFFFFF',
                  fontSize: { xs: '0.9375rem', md: '1rem' },
                  fontWeight: 600,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Home
              </Button>
              <Button
                component={Link}
                to="/about"
                sx={{
                  color: '#FFFFFF',
                  fontSize: { xs: '0.9375rem', md: '1rem' },
                  fontWeight: 600,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                About
              </Button>
              <Button
                component={Link}
                to="/contact"
                sx={{
                  color: '#FFFFFF',
                  fontSize: { xs: '0.9375rem', md: '1rem' },
                  fontWeight: 600,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Contact
              </Button>
            </Stack>
          </Box>
          <Stack direction="row" spacing={1}>
            {userRole ? (
              // Logged in - show Logout button
              <Button
                onClick={() => {
                  // Clear all auth data
                  localStorage.removeItem('userRole')
                  localStorage.removeItem('authRole')
                  localStorage.removeItem('userEmail')
                  localStorage.removeItem('userName')
                  localStorage.removeItem('userId')
                  localStorage.removeItem('token')
                  // Redirect to login
                  navigate('/login')
                }}
                variant="contained"
                sx={{
                  bgcolor: '#FFFFFF',
                  color: '#00B4D8',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: '#F0F9FF',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)'
                  }
                }}
              >
                Logout
              </Button>
            ) : (
              // Not logged in - show Login and Sign up buttons
              <>
                <Button
                  component={Link}
                  to="/login"
                  variant="outlined"
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.6)',
                    borderWidth: 2,
                    color: '#FFFFFF',
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#FFFFFF',
                      bgcolor: 'rgba(255, 255, 255, 0.15)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }
                  }}
                >
                  Login
                </Button>
                <Button
                  component={Link}
                  to="/signup"
                  variant="contained"
                  sx={{
                    bgcolor: '#FFFFFF',
                    color: '#00B4D8',
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: '#F0F9FF',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)'
                    }
                  }}
                >
                  Sign up
                </Button>
              </>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      <Container
        component="main"
        maxWidth={false}
        sx={{
          flex: 1,
          py: { xs: 3, md: 4 },
          px: { xs: 2, sm: 3, md: 4 },
          background: 'linear-gradient(to bottom, #F5F5F7 0%, #FFFFFF 100%)',
          minHeight: 'calc(100vh - 200px)'
        }}
      >
        <Outlet />
      </Container>

      <Footer />
      
      {/* AI Health Assistant - Always Available */}
      <HealthAssistant />
    </Box>
  )
}

export default AppLayout



