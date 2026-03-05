// Author: Dr Hamid MADANI drmdh@msn.com
// @mostajs/rbac — Reusable RBAC Management UI & API handlers
//
// CLIENT-SAFE exports only. Server-side API handlers are available
// via deep imports: @mostajs/rbac/api/roles, @mostajs/rbac/api/seed, etc.

// Components (client-side)
export { UsersManager } from './components/UsersManager'
export { RBACManager } from './components/RBACManager'
export { RolesManager } from './components/RolesManager'
export { PermissionsManager } from './components/PermissionsManager'
export { CategoriesManager } from './components/CategoriesManager'
export { PermissionMatrix } from './components/PermissionMatrix'

// API helpers (client-side fetch wrappers — no server deps)
export {
  createUsersApi,
  createRolesApi,
  createPermissionsApi,
  createMatrixApi,
  createCategoriesApi,
} from './lib/rbac-api'

// Types (type-only exports — zero runtime cost)
export type {
  User,
  RoleOption,
  RoleData,
  PermissionData,
  CategoryData,
  MatrixData,
  RBACConfig,
  PermissionDefinition,
  RoleDefinition,
  CategoryDefinition,
} from './types'

// Config types for API handlers (type-only — safe for client)
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
