import { useNavigate, useLocation } from 'react-router-dom'
import { useCallback, useEffect, useRef } from 'react'
import { getCurrentUserRole, getDashboardPath, isRouteAllowed } from '../utils/roleRoutes'

/**
 * Custom hook for role-aware navigation
 * Ensures all navigation respects the current user's role
 */
export function useRoleNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const userRole = getCurrentUserRole()
  const roleHistoryRef = useRef<string[]>([])
  
  // Track role-specific navigation history
  useEffect(() => {
    const currentPath = location.pathname
    const isAllowed = isRouteAllowed(currentPath, userRole)
    
    if (isAllowed && userRole) {
      const history = roleHistoryRef.current
      const lastPath = history[history.length - 1]
      
      // Avoid duplicate consecutive entries
      if (lastPath !== currentPath) {
        roleHistoryRef.current = [...history, currentPath]
        // Keep only last 20 entries
        if (roleHistoryRef.current.length > 20) {
          roleHistoryRef.current = roleHistoryRef.current.slice(-20)
        }
      }
    }
  }, [location.pathname, userRole])
  
  /**
   * Navigate to a path, but only if allowed for current role
   */
  const navigateTo = useCallback((path: string, options?: { replace?: boolean }) => {
    if (!userRole) {
      console.warn('No user role found, redirecting to login')
      navigate('/login', { replace: true })
      return
    }
    
    if (!isRouteAllowed(path, userRole)) {
      console.warn(`Route ${path} not allowed for role ${userRole}, redirecting to dashboard`)
      const dashboardPath = getDashboardPath(userRole)
      navigate(dashboardPath, { replace: true })
      return
    }
    
    navigate(path, options)
  }, [navigate, userRole])
  
  /**
   * Navigate back within role boundaries
   */
  const navigateBack = useCallback(() => {
    if (!userRole) {
      navigate('/login')
      return
    }
    
    const dashboardPath = getDashboardPath(userRole)
    const history = roleHistoryRef.current
    
    // Try role-specific history first
    if (history.length > 1) {
      const previousPath = history[history.length - 2]
      if (previousPath && isRouteAllowed(previousPath, userRole)) {
        roleHistoryRef.current = history.slice(0, -1)
        navigate(previousPath)
        return
      }
    }
    
    // Fallback to role-specific dashboard
    navigate(dashboardPath)
  }, [navigate, userRole])
  
  /**
   * Navigate to role-specific dashboard
   */
  const navigateToDashboard = useCallback(() => {
    if (!userRole) {
      navigate('/login')
      return
    }
    
    const dashboardPath = getDashboardPath(userRole)
    navigate(dashboardPath)
  }, [navigate, userRole])
  
  return {
    navigateTo,
    navigateBack,
    navigateToDashboard,
    userRole,
    currentPath: location.pathname,
  }
}

