// @mostajs/rbac — Permission matching helpers
// Author: Dr Hamid MADANI drmdh@msn.com

/**
 * Check if a user's permissions include the required permission.
 * Supports exact match, full wildcard '*', and glob patterns like 'cloud.admin.*'.
 */
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  if (!userPermissions || userPermissions.length === 0) return false
  return userPermissions.some(perm => matchesPermission(requiredPermission, perm))
}

/**
 * Check if a single user permission matches the required permission.
 * @param required - The permission being checked (e.g. 'cloud.admin.users')
 * @param userPerm - A permission the user holds (e.g. 'cloud.admin.*')
 */
export function matchesPermission(required: string, userPerm: string): boolean {
  if (userPerm === '*') return true
  if (userPerm === required) return true
  // Wildcard pattern: 'cloud.admin.*' matches 'cloud.admin.users'
  if (userPerm.endsWith('.*')) {
    const prefix = userPerm.slice(0, -2)
    return required.startsWith(prefix + '.')
  }
  return false
}
