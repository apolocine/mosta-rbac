// @mostajs/rbac — Server-side permission lookup (DO NOT import client-side)
// Author: Dr Hamid MADANI drmdh@msn.com
import { getRbacRepos } from './repos-factory.js'

/**
 * Resolve permissions for a role by querying the database.
 * Falls back to the provided static map if DB lookup fails.
 */
export async function getPermissionsForRoleFromDB(
  role: string,
  fallbackMap?: Record<string, string[]>,
): Promise<string[]> {
  try {
    const { roles: repo } = await getRbacRepos()
    const dbRole = await repo.findByName(role)
    if (dbRole) {
      const roleWithPerms = await repo.findByIdWithPermissions(dbRole.id)
      if (roleWithPerms?.permissions && (roleWithPerms.permissions as any[]).length > 0) {
        return (roleWithPerms.permissions as any[]).map((p: any) =>
          typeof p === 'string' ? p : p.name || p,
        )
      }
    }
  } catch (err) {
    console.error('[RBAC] DB permission lookup failed, using fallback:', err)
  }
  return fallbackMap?.[role] || []
}
