// @mostajs/rbac — RBAC Seed function
// Author: Dr Hamid MADANI drmdh@msn.com
import { getRbacRepos } from './repos-factory.js'
import type { CategoryDefinition, PermissionDefinition, RoleDefinition } from '../types/index.js'

export interface SeedRBACOptions {
  categories: CategoryDefinition[]
  permissions: PermissionDefinition[]
  roles: Record<string, RoleDefinition>
}

/**
 * Idempotent seed of categories, permissions and roles.
 * Uses upsert — safe to call multiple times.
 */
export async function seedRBAC(options: SeedRBACOptions): Promise<{
  categoryCount: number
  permissionCount: number
  roleCount: number
}> {
  const { categories: catRepo, permissions: permRepo, roles: roleRepo } = await getRbacRepos()

  // 1. Upsert categories
  for (const cat of options.categories) {
    await catRepo.upsert({ name: cat.name }, cat)
  }

  // 2. Upsert permissions — build code→id map
  const permissionMap: Record<string, string> = {}
  for (const pDef of options.permissions) {
    const displayName = pDef.name || pDef.code
    const perm = await (permRepo as any).upsert(
      { name: displayName },
      { name: displayName, description: pDef.description, category: pDef.category },
    )
    permissionMap[pDef.code] = perm.id
  }

  // 3. Upsert roles with permission IDs
  for (const [, roleDef] of Object.entries(options.roles)) {
    const permissionIds = roleDef.permissions
      .map((code) => permissionMap[code])
      .filter(Boolean)

    await (roleRepo as any).upsert(
      { name: roleDef.name },
      { name: roleDef.name, description: roleDef.description, permissions: permissionIds },
    )
  }

  return {
    categoryCount: options.categories.length,
    permissionCount: options.permissions.length,
    roleCount: Object.keys(options.roles).length,
  }
}

// seedCloudRBAC supprime — utiliser @mostajs/cloud-config bootstrapRBAC(seedRBAC) a la place
