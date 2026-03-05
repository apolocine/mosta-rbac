// Author: Dr Hamid MADANI drmdh@msn.com
// RBAC API handler: POST /admin/permissions/seed
import { NextResponse } from 'next/server'
import { PermissionRepository, RoleRepository, PermissionCategoryRepository } from '@mostajs/auth'
import { getDialect } from '@mostajs/orm'
import type { PermissionDefinition, RoleDefinition, CategoryDefinition } from '../types'

export interface SeedHandlerConfig {
  checkPermission: (perm: string) => Promise<{ error: NextResponse | null; session: any }>
  adminPermission: string
  permissionDefinitions: PermissionDefinition[]
  defaultRoles: Record<string, RoleDefinition>
  categoryDefinitions: CategoryDefinition[]
}

export function createSeedHandler(config: SeedHandlerConfig) {
  const {
    checkPermission,
    adminPermission,
    permissionDefinitions,
    defaultRoles,
    categoryDefinitions,
  } = config

  async function POST() {
    const { error } = await checkPermission(adminPermission)
    if (error) return error

    const catRepo = new PermissionCategoryRepository(await getDialect())
    const pRepo = new PermissionRepository(await getDialect())
    const rRepo = new RoleRepository(await getDialect())

    // Upsert categories
    for (const catDef of categoryDefinitions) {
      await catRepo.upsert({ name: catDef.name }, catDef as any)
    }

    // Upsert all permissions
    const permissionMap: Record<string, string> = {}
    for (const pDef of permissionDefinitions) {
      const perm = await pRepo.upsert(
        { name: pDef.name },
        { name: pDef.name, description: pDef.description, category: pDef.category },
      )
      permissionMap[pDef.code] = perm.id
    }

    // Upsert all default roles
    const rolesCreated: string[] = []
    for (const [, roleDef] of Object.entries(defaultRoles)) {
      const permissionIds = roleDef.permissions
        .map((code) => permissionMap[code])
        .filter(Boolean)

      await rRepo.upsert(
        { name: roleDef.name },
        {
          name: roleDef.name,
          description: roleDef.description,
          permissions: permissionIds,
        },
      )
      rolesCreated.push(roleDef.name)
    }

    return NextResponse.json({
      data: {
        categories: categoryDefinitions.length,
        permissions: permissionDefinitions.length,
        roles: rolesCreated.length,
        message: `${categoryDefinitions.length} catégories, ${permissionDefinitions.length} permissions et ${rolesCreated.length} rôles initialisés`,
      },
    })
  }

  return { POST }
}
