// Author: Dr Hamid MADANI drmdh@msn.com
// @mostajs/rbac/server — Server-side API handler factories
// Import from '@mostajs/rbac/server' in Next.js API routes (route.ts)

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

// Re-export config types for convenience
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
