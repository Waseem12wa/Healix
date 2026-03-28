import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getCurrentUserRole, isRouteAllowed, getDashboardPath, type UserRole } from '../utils/roleRoutes'
import { clearAuthData, getProfileCompletionStatus, isAuthenticated, setProfileCompletionStatus } from '../utils/auth'

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
  const authenticated = isAuthenticated()
  const [checkingProfile, setCheckingProfile] = useState(false)
  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(getProfileCompletionStatus())

  const requiresCompletion = userRole === 'patient' || userRole === 'doctor'

  const completionPath = useMemo(() => {
    if (userRole === 'doctor') return '/doctor-profile'
    if (userRole === 'patient') return '/tools/profile'
    return null
  }, [userRole])

  const isBypassRoute = useMemo(() => {
    const roleBypassRoutes: Record<UserRole, string[]> = {
      patient: ['/dashboard', '/tools/profile', '/profile/patient'],
      doctor: ['/doctor-dashboard', '/doctor-profile'],
      admin: ['/admin', '/profile/admin'],
      provider: ['/provider-dashboard', '/profile/provider'],
    }

    if (!userRole) return false

    return roleBypassRoutes[userRole].some((route) =>
      location.pathname === route || location.pathname.startsWith(`${route}/`)
    )
  }, [location.pathname, userRole])
  
  useEffect(() => {
    const syncProfileStatus = async () => {
      if (!authenticated) {
        clearAuthData()
        if (location.pathname !== '/login') {
          navigate('/login', { replace: true })
        }
        return
      }

      const isAllowed = isRouteAllowed(location.pathname, userRole)
      if (!isAllowed) {
        const redirectPath = userRole ? getDashboardPath(userRole) : '/login'
        console.warn(`🚫 Access denied: ${location.pathname} not allowed for role ${userRole || 'none'}. Redirecting to ${redirectPath}`)
        navigate(redirectPath, { replace: true })
        return
      }

      if (!requiresCompletion || isBypassRoute) {
        return
      }

      const localStatus = getProfileCompletionStatus()
      if (localStatus !== null) {
        setProfileCompleted(localStatus)
        if (!localStatus && completionPath) {
          navigate(completionPath, { replace: true })
        }
        return
      }

      try {
        setCheckingProfile(true)
        const token = localStorage.getItem('token')
        const response = await fetch('/api/auth/me', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        const payload = await response.json().catch(() => null)
        const completed = Boolean(payload?.data?.profileCompleted)

        setProfileCompletionStatus(completed)
        setProfileCompleted(completed)

        if (!completed && completionPath) {
          navigate(completionPath, { replace: true })
        }
      } catch {
        setProfileCompletionStatus(false)
        setProfileCompleted(false)
        if (completionPath) {
          navigate(completionPath, { replace: true })
        }
      } finally {
        setCheckingProfile(false)
      }
    }

    syncProfileStatus()
  }, [
    authenticated,
    completionPath,
    isBypassRoute,
    location.pathname,
    navigate,
    requiresCompletion,
    userRole,
  ])

  if (!authenticated) {
    return null
  }
  
  // If route is not allowed, don't render children (will redirect)
  const isAllowed = isRouteAllowed(location.pathname, userRole)
  
  if (!isAllowed) {
    return null // Will redirect in useEffect
  }

  if (checkingProfile) {
    return null
  }

  if (requiresCompletion && !isBypassRoute && profileCompleted === false) {
    return null
  }
  
  return <>{children}</>
}

