/**
 * Role-based route configuration
 * Maps routes to allowed roles and provides role-specific dashboard paths
 */

export type UserRole = 'patient' | 'doctor' | 'admin' | 'provider'

export interface RouteConfig {
  path: string
  allowedRoles: UserRole[]
  isPublic?: boolean
}

/**
 * Route to role mapping
 * Defines which routes are accessible by which roles
 */
export const roleRoutes: RouteConfig[] = [
  // Public routes (accessible to all, even when not logged in)
  { path: '/', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/about', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/contact', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/patient', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/pateint', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/doctor', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/provider', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/patient/drug-interaction-checker', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/patient/drug-food-interaction', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/patient/drug-alternatives', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/patient/side-effect-predictor', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/patient/medicine-shop', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/patient/medication-reminder', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/patient/ai-health-assistant', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/patient/record-summarization', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/patient/doctor-appointments', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/doctor/set-reminder', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/doctor/assigned-patient', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/doctor/drug-interaction-checker', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/doctor/drug-food-interaction', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/doctor/drug-alternatives', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/doctor/side-effect-predictor', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/doctor/medicine-manager', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/doctor/ai-health-assistant', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/doctor/record-summarization', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/doctor/my-appointment', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/provider/dashboard-overview-analytics', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/provider/medicine-management', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/provider/order-management-approvals', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/guide/provider/payment-management-revenue-split', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/login', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/signup', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/forgot-password', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  { path: '/reset-password', allowedRoles: ['patient', 'doctor', 'admin', 'provider'], isPublic: true },
  
  // Patient-specific routes
  { path: '/dashboard', allowedRoles: ['patient'] },
  { path: '/tools/drug-interactions', allowedRoles: ['patient', 'doctor'] },
  { path: '/tools/drug-food-interactions', allowedRoles: ['patient', 'doctor'] },
  { path: '/tools/drug-alternatives', allowedRoles: ['patient', 'doctor'] },
  { path: '/tools/side-effects', allowedRoles: ['patient', 'doctor'] },
  { path: '/tools/medication-reminder', allowedRoles: ['patient'] },
  { path: '/tools/ai-chatbot', allowedRoles: ['patient'] },
  { path: '/tools/health-summary', allowedRoles: ['patient'] },
  { path: '/tools/appointments', allowedRoles: ['patient', 'doctor'] },
  { path: '/tools/notifications', allowedRoles: ['patient', 'doctor', 'admin', 'provider'] },
  { path: '/settings', allowedRoles: ['patient', 'doctor', 'admin', 'provider'] },
  { path: '/tools/profile', allowedRoles: ['patient', 'doctor'] },
  { path: '/shop/medicines', allowedRoles: ['patient', 'doctor'] },
  { path: '/shop/checkout', allowedRoles: ['patient', 'doctor'] },
  { path: '/shop/orders', allowedRoles: ['patient', 'doctor'] },
  { path: '/shop/orders/:orderId/confirmation', allowedRoles: ['patient', 'doctor'] },
  { path: '/profile/patient', allowedRoles: ['patient'] },
  
  // Doctor-specific routes
  { path: '/doctor-dashboard', allowedRoles: ['doctor'] },
  { path: '/doctor-profile', allowedRoles: ['doctor'] },
  { path: '/doctor-history', allowedRoles: ['doctor'] },
  { path: '/doctor-assigned-patients', allowedRoles: ['doctor'] },
  { path: '/doctor-appointments', allowedRoles: ['doctor'] },
  { path: '/doctor-reviews/ddi', allowedRoles: ['doctor'] },
  { path: '/doctor-reviews/dfi', allowedRoles: ['doctor'] },
  { path: '/doctor-reviews/alternatives', allowedRoles: ['doctor'] },
  { path: '/doctor-reviews/side-effects', allowedRoles: ['doctor'] },
  { path: '/doctor-reviews/ai-assistant', allowedRoles: ['doctor'] },
  { path: '/doctor-reviews/medication-pharmacy', allowedRoles: ['doctor'] },
  { path: '/doctor-reviews/health-summary', allowedRoles: ['doctor'] },
  { path: '/doctor-medicines', allowedRoles: ['doctor'] },
  
  // Admin-specific routes
  { path: '/admin', allowedRoles: ['admin'] },
  { path: '/admin/analytics', allowedRoles: ['admin'] },
  { path: '/admin/users', allowedRoles: ['admin'] },
  { path: '/admin/appointments', allowedRoles: ['admin'] },
  { path: '/admin/payments', allowedRoles: ['admin'] },
  { path: '/admin/medicines', allowedRoles: ['admin'] },
  { path: '/admin/settings', allowedRoles: ['admin'] },
  { path: '/profile/admin', allowedRoles: ['admin'] },
  
  // Provider-specific routes
  { path: '/provider-dashboard', allowedRoles: ['provider'] },
  { path: '/provider/overview', allowedRoles: ['provider'] },
  { path: '/provider/medicines', allowedRoles: ['provider'] },
  { path: '/provider/orders', allowedRoles: ['provider'] },
  { path: '/provider/payments', allowedRoles: ['provider'] },
  { path: '/profile/provider', allowedRoles: ['provider'] },
]

/**
 * Get the dashboard path for a specific role
 */
export function getDashboardPath(role: UserRole | null): string {
  if (!role) return '/login'
  
  const roleMap: Record<UserRole, string> = {
    patient: '/dashboard',
    doctor: '/doctor-dashboard',
    admin: '/admin',
    provider: '/provider-dashboard',
  }
  
  return roleMap[role] || '/login'
}

/**
 * Match a config path (which may contain :param segments) against an actual URL path.
 * Examples:
 *   matchPath('/shop/orders/:orderId/confirmation', '/shop/orders/abc/confirmation') === true
 *   matchPath('/shop/orders', '/shop/orders/abc') === false
 */
function matchPath(configPath: string, actualPath: string): boolean {
  if (configPath === actualPath) return true
  if (!configPath.includes(':')) return false
  const configSegments = configPath.split('/')
  const actualSegments = actualPath.split('/')
  if (configSegments.length !== actualSegments.length) return false
  return configSegments.every((seg, i) =>
    seg.startsWith(':') ? actualSegments[i].length > 0 : seg === actualSegments[i]
  )
}

/**
 * Check if a route is allowed for a specific role
 */
export function isRouteAllowed(path: string, role: UserRole | null): boolean {
  const route = roleRoutes.find(r => matchPath(r.path, path))

  if (!role) {
    // Check if route is public
    return route?.isPublic === true
  }

  if (!route) {
    // If route not found in config, deny access (fail secure)
    return false
  }

  return route.allowedRoles.includes(role)
}

/**
 * Get the current user role from localStorage
 */
export function getCurrentUserRole(): UserRole | null {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('authRole')
  if (!token || !role) return null
  
  const validRoles: UserRole[] = ['patient', 'doctor', 'admin', 'provider']
  return validRoles.includes(role as UserRole) ? (role as UserRole) : null
}

/**
 * Get all allowed routes for a specific role
 */
export function getAllowedRoutes(role: UserRole | null): string[] {
  if (!role) {
    return roleRoutes.filter(r => r.isPublic).map(r => r.path)
  }
  
  return roleRoutes
    .filter(r => r.allowedRoles.includes(role) || r.isPublic)
    .map(r => r.path)
}

