// Author: Dr Hamid MADANI drmdh@msn.com
// @mostajs/rbac — Client-safe barrel (NO ORM imports)
// For server-side code (repos, seed, permissions-server), use '@mostajs/rbac/server'

// Schemas (pure data definitions — no ORM dependency)
export { UserSchema } from './schemas/user.schema'
export { RoleSchema } from './schemas/role.schema'
export { PermissionSchema } from './schemas/permission.schema'
export { PermissionCategorySchema } from './schemas/permission-category.schema'

// Menu contribution
export { rbacMenuContribution } from './lib/menu'

// Pages (client-side, registered via PageRegistration)
export { default as UsersPage } from './pages/UsersPage'
export { default as RolesPage } from './pages/RolesPage'

// i18n
export { t as rbacT } from './lib/i18n'

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
  UserDTO,
  RoleDTO,
  PermissionDTO,
  PermissionCategoryDTO,
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
