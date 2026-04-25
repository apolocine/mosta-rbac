// Author: Dr Hamid MADANI drmdh@msn.com
// @mostajs/rbac/server — Server-side exports (ORM-dependent)
// Import from '@mostajs/rbac/server' in API routes and server code

// Schemas (re-exported here so server-side consumers don't need to load
// the UI barrel which pulls in lucide-react and other React deps)
export { UserSchema } from './schemas/user.schema'
export { RoleSchema } from './schemas/role.schema'
export { PermissionSchema } from './schemas/permission.schema'
export { PermissionCategorySchema } from './schemas/permission-category.schema'
export { AccountSchema } from './schemas/account.schema'

// Repositories (depend on @mostajs/orm)
export { UserRepository } from './repositories/user.repository'
export { RoleRepository } from './repositories/role.repository'
export { PermissionRepository } from './repositories/permission.repository'
export { PermissionCategoryRepository } from './repositories/permission-category.repository'
export { AccountRepository } from './repositories/account.repository'

// RBAC seed (depends on repos → ORM)
export { seedRBAC } from './lib/rbac-seed'
export type { SeedRBACOptions } from './lib/rbac-seed'

// Pre-built RBAC seeds (categories + permissions + roles ready to apply)
export { OCTONET_RBAC_SEED, OCTONET_PERMS } from './seeds/octonet'

// Permission matching helpers
export { hasPermission, matchesPermission } from './helpers/permissions'

// Create admin (depends on repos → ORM + bcrypt)
export { createAdmin } from './lib/create-admin'
export type { CreateAdminOptions, CreateAdminResult } from './lib/create-admin'

// Module info (schemas, seeds, metadata — for setup discovery)
export { getSchemas, moduleInfo } from './lib/module-info'

// Server-side permission DB lookup (depends on repos → ORM)
export { getPermissionsForRoleFromDB } from './lib/permissions-server'

// API handler factories are NOT re-exported here — they depend on Next.js
// (Request/Response types). Consumers that need them should import directly:
//   import { createUsersHandler } from '@mostajs/rbac/api/users'
// This keeps '@mostajs/rbac/server' Next-free for pure backend runtimes
// (Fastify, Express, raw Node) like Octonet.




// API handler factories
//export { createUsersHandler } from './api/users'
//export { createUsersIdHandler } from './api/users-id'
//export { createRolesHandler } from './api/roles'
//export { createRolesIdHandler } from './api/roles-id'
//export { createPermissionsHandler } from './api/permissions'
//export { createPermissionsIdHandler } from './api/permissions-id'
//export { createMatrixHandler } from './api/matrix'
//export { createCategoriesHandler } from './api/categories'
//export { createCategoriesIdHandler } from './api/categories-id'
//export { createSeedHandler } from './api/seed'

// Re-//export config types
//export type { UsersHandlerConfig } from './api/users'
//export type { UsersIdHandlerConfig } from './api/users-id'
//export type { RolesHandlerConfig } from './api/roles'
//export type { RolesIdHandlerConfig } from './api/roles-id'
//export type { PermissionsHandlerConfig } from './api/permissions'
//export type { PermissionsIdHandlerConfig } from './api/permissions-id'
//export type { MatrixHandlerConfig } from './api/matrix'
//export type { CategoriesHandlerConfig } from './api/categories'
//export type { CategoriesIdHandlerConfig } from './api/categories-id'
//export type { SeedHandlerConfig } from './api/seed'
