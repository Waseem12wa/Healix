/**
 * Authentication utility functions
 */

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
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('authRole')
  return Boolean(token && role)
}

