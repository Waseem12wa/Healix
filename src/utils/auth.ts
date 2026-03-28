/**
 * Authentication utility functions
 */

const PROFILE_COMPLETED_KEY = 'profileCompleted'

/**
 * Clear all authentication data from localStorage
 */
export function clearAuthData() {
  localStorage.removeItem('token')
  localStorage.removeItem('userId')
  localStorage.removeItem('authRole')
  localStorage.removeItem('userRole')
  localStorage.removeItem('userName')
  localStorage.removeItem('userEmail')
  localStorage.removeItem('profileImage')
  localStorage.removeItem(PROFILE_COMPLETED_KEY)
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('authRole')
  return Boolean(token && role)
}

/**
 * Persist profile completion status for route guards
 */
export function setProfileCompletionStatus(completed: boolean) {
  localStorage.setItem(PROFILE_COMPLETED_KEY, completed ? 'true' : 'false')
}

/**
 * Returns null when not yet known for current auth session
 */
export function getProfileCompletionStatus(): boolean | null {
  const raw = localStorage.getItem(PROFILE_COMPLETED_KEY)
  if (raw === null) return null
  return raw === 'true'
}

