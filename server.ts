// Author: Dr Hamid MADANI drmdh@msn.com
// @mostajs/rbac/server — Server-side exports (ORM-dependent)
// Import from '@mostajs/rbac/server' in API routes and server code

// Repositories (depend on @mostajs/orm)
export { UserRepository } from './repositories/user.repository'
export { RoleRepository } from './repositories/role.repository'
export { PermissionRepository } from './repositories/permission.repository'
export { PermissionCategoryRepository } from './repositories/permission-category.repository'

// RBAC seed (depends on repos → ORM)
export { seedRBAC } from './lib/rbac-seed'
export type { SeedRBACOptions } from './lib/rbac-seed'

// Permission matching helpers
export { hasPermission, matchesPermission } from './helpers/permissions'

// Create admin (depends on repos → ORM + bcrypt)
export { createAdmin } from './lib/create-admin'
export type { CreateAdminOptions, CreateAdminResult } from './lib/create-admin'

// Module info (schemas, seeds, metadata — for setup discovery)
export { getSchemas, moduleInfo } from './lib/module-info'

// Server-side permission DB lookup (depends on repos → ORM)
export { getPermissionsForRoleFromDB } from './lib/permissions-server'

// API handler factories
export { createUsersHandler } from './api/users'
export { createUsersIdHandler } from './api/users-id'
export { createRolesHandler } from './api/roles'
export { createRolesIdHandler } from './api/roles-id'
export { createPermissionsHandler } from './api/permissions'
export { createPermissionsIdHandler } from './api/permissions-id'
export { createMatrixHandler } from './api/matrix'
export { createCategoriesHandler } from './api/categories'
export { createCategoriesIdHandler } from './api/categories-id'
export { createSeedHandler } from './api/seed'

// Re-export config types
export type { UsersHandlerConfig } from './api/users'
export type { UsersIdHandlerConfig } from './api/users-id'
export type { RolesHandlerConfig } from './api/roles'
export type { RolesIdHandlerConfig } from './api/roles-id'
export type { PermissionsHandlerConfig } from './api/permissions'
export type { PermissionsIdHandlerConfig } from './api/permissions-id'
export type { MatrixHandlerConfig } from './api/matrix'
export type { CategoriesHandlerConfig } from './api/categories'
export type { CategoriesIdHandlerConfig } from './api/categories-id'
export type { SeedHandlerConfig } from './api/seed'
