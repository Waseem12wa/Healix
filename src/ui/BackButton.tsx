import { IconButton } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useNavigate, useLocation } from 'react-router-dom'
import { getCurrentUserRole, getDashboardPath, isRouteAllowed } from '../utils/roleRoutes'
import { useEffect, useRef } from 'react'

export default function BackButton() {
  const navigate = useNavigate()
  const location = useLocation()
  const userRole = getCurrentUserRole()
  const roleHistoryRef = useRef<string[]>([])

  // Track role-specific navigation history
  useEffect(() => {
    const currentPath = location.pathname
    const isAllowed = isRouteAllowed(currentPath, userRole)

    if (isAllowed && userRole) {
      // Only track allowed routes for current role
      const history = roleHistoryRef.current
      const lastPath = history[history.length - 1]

      // Avoid duplicate consecutive entries
      if (lastPath !== currentPath) {
        roleHistoryRef.current = [...history, currentPath]
        // Keep only last 20 entries to prevent memory issues
        if (roleHistoryRef.current.length > 20) {
          roleHistoryRef.current = roleHistoryRef.current.slice(-20)
        }
      }
    }
  }, [location.pathname, userRole])

  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (!userRole) {
      // Not logged in, go to login
      navigate('/login')
      return
    }

    const dashboardPath = getDashboardPath(userRole)
    const history = roleHistoryRef.current

    // If on a tools/ feature page, navigate to role-specific dashboard
    if (location.pathname.startsWith('/tools/')) {
      navigate(dashboardPath, { replace: false })
      return
    }

    // Try to use role-specific history first
    if (history.length > 1) {
      // Find the last valid route in history (excluding current)
      const previousPath = history[history.length - 2]
      if (previousPath && isRouteAllowed(previousPath, userRole)) {
        roleHistoryRef.current = history.slice(0, -1)
        navigate(previousPath, { replace: false })
        return
      }
    }

    // Fallback: use browser history, but validate the route
    if (window.history.length > 1) {
      // Use browser back, but we'll validate in ProtectedRoute
      navigate(-1)
    } else {
      // No history, go to role-specific dashboard
      navigate(dashboardPath, { replace: false })
    }
  }

  return (
    <IconButton
      onClick={handleBack}
      sx={{
        width: 44,
        height: 44,
        bgcolor: '#06D6A0',
        color: '#FFFFFF',
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(6, 214, 160, 0.3)',
        transition: 'all 0.2s ease',
        '&:hover': {
          bgcolor: '#04A777',
          boxShadow: '0 6px 16px rgba(6, 214, 160, 0.4)',
          transform: 'translateY(-2px)'
        },
        '&:active': {
          transform: 'translateY(0px)',
          boxShadow: '0 2px 8px rgba(6, 214, 160, 0.3)'
        }
      }}
    >
      <ArrowBackIcon sx={{ fontSize: 20 }} />
    </IconButton>
  )
}
