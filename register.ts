// @mostajs/rbac — Runtime module registration
// Author: Dr Hamid MADANI drmdh@msn.com
// Phase 3: rbac owns User/Role/Permission/PermissionCategory schemas + repos

import type { ModuleRegistration } from '@mostajs/socle'
import { UserSchema } from './schemas/user.schema.js'
import { RoleSchema } from './schemas/role.schema.js'
import { PermissionSchema } from './schemas/permission.schema.js'
import { PermissionCategorySchema } from './schemas/permission-category.schema.js'
import { UserRepository } from './repositories/user.repository.js'
import { RoleRepository } from './repositories/role.repository.js'
import { PermissionRepository } from './repositories/permission.repository.js'
import { PermissionCategoryRepository } from './repositories/permission-category.repository.js'
import { rbacMenuContribution } from './lib/menu.js'
import UsersPage from './pages/UsersPage.js'
import RolesPage from './pages/RolesPage.js'
import {
  usersHandlers, usersIdHandlers,
  rolesHandlers, rolesIdHandlers,
  permissionsHandlers, permissionsIdHandlers,
  categoriesHandlers, categoriesIdHandlers,
  matrixHandlers, seedHandlers,
} from './lib/route-handlers.js'

export function register(registry: { register(r: ModuleRegistration): void }): void {
  registry.register({
    manifest: {
      name: 'rbac',
      package: '@mostajs/rbac',
      version: '2.1.0',
      type: 'core',
      priority: 2,
      dependencies: ['orm'],
      displayName: 'RBAC',
      description: 'Role-Based Access Control — users, roles, permissions schemas, repos, management UI',
      icon: 'ShieldCheck',
      register: './dist/register.js',
    },

    schemas: [
      { name: 'User', schema: UserSchema },
      { name: 'Role', schema: RoleSchema },
      { name: 'Permission', schema: PermissionSchema },
      { name: 'PermissionCategory', schema: PermissionCategorySchema },
    ],

    repositories: {
      userRepo: (dialect: unknown) => new UserRepository(dialect as never),
      roleRepo: (dialect: unknown) => new RoleRepository(dialect as never),
      permissionRepo: (dialect: unknown) => new PermissionRepository(dialect as never),
      permissionCategoryRepo: (dialect: unknown) => new PermissionCategoryRepository(dialect as never),
    },

    permissions: {
      permissions: { ADMIN_ACCESS: 'admin:access' },
      definitions: [
        { code: 'admin:access', name: 'admin:access', description: 'Accéder à la gestion des utilisateurs et rôles', category: 'admin' },
      ],
      categories: [
        { name: 'admin', label: 'Administration', description: 'Gestion du panneau d\'administration', icon: 'Settings', order: 0, system: true },
      ],
    },

    routes: [
      { path: 'users', handlers: usersHandlers, permission: 'admin:access' },
      { path: 'users/[id]', handlers: usersIdHandlers, permission: 'admin:access' },
      { path: 'admin/roles', handlers: rolesHandlers, permission: 'admin:access' },
      { path: 'admin/roles/[id]', handlers: rolesIdHandlers, permission: 'admin:access' },
      { path: 'admin/permissions', handlers: permissionsHandlers, permission: 'admin:access' },
      { path: 'admin/permissions/[id]', handlers: permissionsIdHandlers, permission: 'admin:access' },
      { path: 'admin/categories', handlers: categoriesHandlers, permission: 'admin:access' },
      { path: 'admin/categories/[id]', handlers: categoriesIdHandlers, permission: 'admin:access' },
      { path: 'admin/permissions/matrix', handlers: matrixHandlers, permission: 'admin:access' },
      { path: 'admin/permissions/seed', handlers: seedHandlers, permission: 'admin:access' },
    ],

    pages: [
      { path: 'users', component: UsersPage, permission: 'user:view' },
      { path: 'roles', component: RolesPage, permission: 'role:view' },
    ],

    menu: rbacMenuContribution,
  })
}
