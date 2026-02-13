import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getCurrentUserRole, isRouteAllowed, getDashboardPath } from '../utils/roleRoutes'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * ProtectedRoute component
 * Guards routes based on user role and redirects unauthorized users
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const userRole = getCurrentUserRole()
  
  useEffect(() => {
    // Check if route is allowed for current user role
    const isAllowed = isRouteAllowed(location.pathname, userRole)
    
    if (!isAllowed) {
      // Redirect to appropriate dashboard or login
      const redirectPath = userRole ? getDashboardPath(userRole) : '/login'
      console.warn(`🚫 Access denied: ${location.pathname} not allowed for role ${userRole || 'none'}. Redirecting to ${redirectPath}`)
      navigate(redirectPath, { replace: true })
    }
  }, [location.pathname, userRole, navigate])
  
  // If route is not allowed, don't render children (will redirect)
  const isAllowed = isRouteAllowed(location.pathname, userRole)
  
  if (!isAllowed) {
    return null // Will redirect in useEffect
  }
  
  return <>{children}</>
}

