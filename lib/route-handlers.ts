// @mostajs/rbac — Self-contained route handlers for runtime registration
// Author: Dr Hamid MADANI drmdh@msn.com
// Phase 5: Bare handlers — permission checking by catch-all.

import { createUsersHandler } from '../api/users.js'
import { createUsersIdHandler } from '../api/users-id.js'
import { createRolesHandler } from '../api/roles.js'
import { createRolesIdHandler } from '../api/roles-id.js'
import { createPermissionsHandler } from '../api/permissions.js'
import { createPermissionsIdHandler } from '../api/permissions-id.js'
import { createCategoriesHandler } from '../api/categories.js'
import { createCategoriesIdHandler } from '../api/categories-id.js'
import { createMatrixHandler } from '../api/matrix.js'
import { createSeedHandler } from '../api/seed.js'

// No-op auth — catch-all enforces permissions
const noAuth = async (_perm: string) => ({ error: null as never, session: { user: { id: '' } } })

const users = createUsersHandler({
  checkPermission: noAuth as any,
  adminPermission: 'admin:access',
})
const usersId = createUsersIdHandler({
  checkPermission: noAuth as any,
  adminPermission: 'admin:access',
})
const roles = createRolesHandler({
  checkPermission: noAuth as any,
  adminPermission: 'admin:access',
  defaultRoles: {},
})
const rolesId = createRolesIdHandler({
  checkPermission: noAuth as any,
  adminPermission: 'admin:access',
})
const permissions = createPermissionsHandler({
  checkPermission: noAuth as any,
  adminPermission: 'admin:access',
  permissionDefinitions: [],
  categoryDefinitions: [],
})
const permissionsId = createPermissionsIdHandler({
  checkPermission: noAuth as any,
  adminPermission: 'admin:access',
})
const categories = createCategoriesHandler({
  checkPermission: noAuth as any,
  adminPermission: 'admin:access',
  categoryDefinitions: [],
})
const categoriesId = createCategoriesIdHandler({
  checkPermission: noAuth as any,
  adminPermission: 'admin:access',
})
const matrix = createMatrixHandler({
  checkPermission: noAuth as any,
  adminPermission: 'admin:access',
  categoryDefinitions: [],
})
const seed = createSeedHandler({
  checkPermission: noAuth as any,
  adminPermission: 'admin:access',
  permissionDefinitions: [],
  categoryDefinitions: [],
  defaultRoles: {},
})

export const usersHandlers = { GET: users.GET as any, POST: users.POST as any }
export const usersIdHandlers = { GET: usersId.GET as any, PUT: usersId.PUT as any, DELETE: usersId.DELETE as any }
export const rolesHandlers = { GET: roles.GET as any, POST: roles.POST as any }
export const rolesIdHandlers = { GET: rolesId.GET as any, PUT: rolesId.PUT as any, DELETE: rolesId.DELETE as any }
export const permissionsHandlers = { GET: permissions.GET as any, POST: permissions.POST as any }
export const permissionsIdHandlers = { PUT: permissionsId.PUT as any, DELETE: permissionsId.DELETE as any }
export const categoriesHandlers = { GET: categories.GET as any, POST: categories.POST as any }
export const categoriesIdHandlers = { PUT: categoriesId.PUT as any, DELETE: categoriesId.DELETE as any }
export const matrixHandlers = { GET: matrix.GET as any, POST: matrix.POST as any }
export const seedHandlers = { POST: seed.POST as any }
