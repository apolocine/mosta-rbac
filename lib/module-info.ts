// @mostajs/rbac — Module info (schemas, seeds, metadata)
// Used by @mostajs/setup to auto-discover what this module provides
// Author: Dr Hamid MADANI drmdh@msn.com

import { UserSchema } from '../schemas/user.schema.js'
import { RoleSchema } from '../schemas/role.schema.js'
import { PermissionSchema } from '../schemas/permission.schema.js'
import { PermissionCategorySchema } from '../schemas/permission-category.schema.js'

/** All schemas provided by this module (plain objects — JSON-serializable) */
export function getSchemas() {
  return [UserSchema, RoleSchema, PermissionSchema, PermissionCategorySchema]
}

/** Module metadata for setup discovery */
export const moduleInfo = {
  name: 'rbac',
  version: '2.1.0',
  label: 'Roles & Permissions',
  description: 'User, Role, Permission, PermissionCategory management',
  schemas: getSchemas,
  /** Default seed data — called by setup after schema creation */
  seed: async (options?: any) => {
    const { seedRBAC } = await import('./rbac-seed.js')
    if (options?.categories && options?.permissions && options?.roles) {
      return seedRBAC(options)
    }
    // No seed data provided — skip
    return { categoryCount: 0, permissionCount: 0, roleCount: 0 }
  },
  /** Create admin user — called by setup after seed */
  createAdmin: async (options: { email: string; password: string; firstName: string; lastName: string }) => {
    const { createAdmin } = await import('./create-admin.js')
    return createAdmin(options)
  },
}
