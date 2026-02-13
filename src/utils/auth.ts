/**
 * Authentication utility functions
 */

/**
 * Clear all authentication data from localStorage
 */
export function clearAuthData() {
  localStorage.removeItem('authRole')
  localStorage.removeItem('userName')
  localStorage.removeItem('userEmail')
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const role = localStorage.getItem('authRole')
  return !!role
}

