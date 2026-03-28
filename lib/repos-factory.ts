// repos-factory.ts — Centralized repository factory for dual ORM/NET mode
// In ORM mode: returns ORM repositories (BaseRepository + IDialect)
// In NET mode: returns NetClient-backed repositories with the same API
// Author: Dr Hamid MADANI drmdh@msn.com

import { isNetMode } from './data-mode.js';
import type { UserDTO, RoleDTO, PermissionDTO, PermissionCategoryDTO } from '../types/index.js';

// ============================================================
// Repository interfaces (same API for ORM and NET)
// ============================================================

export interface IUserRepository {
  findAllSafe(filter?: any, options?: any): Promise<UserDTO[]>;
  findByIdSafe(id: string): Promise<UserDTO | null>;
  findByEmail(email: string): Promise<UserDTO | null>;
  updateLastLogin(id: string): Promise<void>;
  findByIdWithRoles(id: string): Promise<UserDTO | null>;
  findAllWithRoles(filter?: any, options?: any): Promise<UserDTO[]>;
  countByRole(roleId: string): Promise<number>;
  addRole(userId: string, roleId: string): Promise<UserDTO | null>;
  removeRole(userId: string, roleId: string): Promise<UserDTO | null>;
  create(data: any): Promise<UserDTO>;
  update(id: string, data: any): Promise<UserDTO | null>;
  delete(id: string): Promise<boolean>;
  findById(id: string, options?: any): Promise<UserDTO | null>;
  findOne(filter: any): Promise<UserDTO | null>;
  findAll(filter?: any, options?: any): Promise<UserDTO[]>;
  count(filter?: any): Promise<number>;
}

export interface IRoleRepository {
  findAll(filter?: any, options?: any): Promise<RoleDTO[]>;
  findByName(name: string): Promise<RoleDTO | null>;
  findAllWithPermissions(): Promise<RoleDTO[]>;
  findByIdWithPermissions(id: string): Promise<RoleDTO | null>;
  addPermission(roleId: string, permId: string): Promise<RoleDTO | null>;
  removePermission(roleId: string, permId: string): Promise<RoleDTO | null>;
  removePermissionFromAll(permId: string): Promise<void | number>;
  create(data: any): Promise<RoleDTO>;
  update(id: string, data: any): Promise<RoleDTO | null>;
  delete(id: string): Promise<boolean>;
  findById(id: string, options?: any): Promise<RoleDTO | null>;
  count(filter?: any): Promise<number>;
}

export interface IPermissionRepository {
  findAllSorted(): Promise<PermissionDTO[]>;
  findByName(name: string): Promise<PermissionDTO | null>;
  countByCategory(categoryId: string): Promise<number>;
  create(data: any): Promise<PermissionDTO>;
  update(id: string, data: any): Promise<PermissionDTO | null>;
  delete(id: string): Promise<boolean>;
  findAll(filter?: any, options?: any): Promise<PermissionDTO[]>;
  findById(id: string): Promise<PermissionDTO | null>;
  count(filter?: any): Promise<number>;
}

export interface IPermissionCategoryRepository {
  findAllOrdered(): Promise<PermissionCategoryDTO[]>;
  findByName(name: string): Promise<PermissionCategoryDTO | null>;
  create(data: any): Promise<PermissionCategoryDTO>;
  update(id: string, data: any): Promise<PermissionCategoryDTO | null>;
  delete(id: string): Promise<boolean>;
  findAll(filter?: any, options?: any): Promise<PermissionCategoryDTO[]>;
  findById(id: string): Promise<PermissionCategoryDTO | null>;
  count(filter?: any): Promise<number>;
  upsert(filter: any, data: any): Promise<PermissionCategoryDTO>;
}

// ============================================================
// Factory — returns repos for current mode
// ============================================================

export interface RbacRepos {
  users: IUserRepository;
  roles: IRoleRepository;
  permissions: IPermissionRepository;
  categories: IPermissionCategoryRepository;
}

let _cached: RbacRepos | null = null;

/** Get RBAC repositories for the current data mode (ORM or NET) */
export async function getRbacRepos(): Promise<RbacRepos> {
  if (_cached) return _cached;

  if (isNetMode()) {
    _cached = await createNetRepos();
  } else {
    _cached = await createOrmRepos();
  }
  return _cached;
}

/** Reset cache (for tests) */
export function resetRbacRepos(): void { _cached = null; }

// ============================================================
// ORM mode — original repositories
// ============================================================

async function createOrmRepos(): Promise<RbacRepos> {
  const { getDialect, registerSchemas } = await import('@mostajs/orm');
  const { UserSchema } = await import('../schemas/user.schema.js');
  const { RoleSchema } = await import('../schemas/role.schema.js');
  const { PermissionSchema } = await import('../schemas/permission.schema.js');
  const { PermissionCategorySchema } = await import('../schemas/permission-category.schema.js');
  const { UserRepository } = await import('../repositories/user.repository.js');
  const { RoleRepository } = await import('../repositories/role.repository.js');
  const { PermissionRepository } = await import('../repositories/permission.repository.js');
  const { PermissionCategoryRepository } = await import('../repositories/permission-category.repository.js');

  registerSchemas([UserSchema, RoleSchema, PermissionSchema, PermissionCategorySchema]);
  const dialect = await getDialect();

  return {
    users: new UserRepository(dialect) as IUserRepository,
    roles: new RoleRepository(dialect) as IRoleRepository,
    permissions: new PermissionRepository(dialect) as IPermissionRepository,
    categories: new PermissionCategoryRepository(dialect) as IPermissionCategoryRepository,
  };
}

// ============================================================
// NET mode — NetClient-backed repositories
// ============================================================

async function createNetRepos(): Promise<RbacRepos> {
  const { NetClient } = await import('@mostajs/net/client');
  const client = new NetClient({ url: process.env.MOSTA_NET_URL! });

  return {
    users: createNetUserRepo(client),
    roles: createNetRoleRepo(client),
    permissions: createNetPermissionRepo(client),
    categories: createNetCategoryRepo(client),
  };
}

function createNetUserRepo(c: any): IUserRepository {
  return {
    findAllSafe: (filter = {}, options?) => c.findAll('users', filter, { ...options, exclude: ['password'] }),
    findByIdSafe: (id) => c.findById('users', id),  // NET-side can add exclude later
    findByEmail: (email) => c.findOne('users', { email: email.toLowerCase() }),
    updateLastLogin: async (id) => { await c.update('users', id, { lastLoginAt: new Date().toISOString() }); },
    findByIdWithRoles: (id) => c.findByIdWithRelations('users', id, ['roles']),
    findAllWithRoles: (filter = {}, options?) => c.findWithRelations('users', filter, ['roles'], options),
    countByRole: (roleId) => c.count('users', { roles: roleId }),
    addRole: (userId, roleId) => c.addToSet('users', userId, 'roles', roleId),
    removeRole: (userId, roleId) => c.pull('users', userId, 'roles', roleId),
    create: (data) => c.create('users', data),
    update: (id, data) => c.update('users', id, data),
    delete: (id) => c.delete('users', id),
    findById: (id) => c.findById('users', id),
    findOne: (filter) => c.findOne('users', filter),
    findAll: (filter = {}, options?) => c.findAll('users', filter, options),
    count: (filter?) => c.count('users', filter),
  };
}

function createNetRoleRepo(c: any): IRoleRepository {
  return {
    findAll: (filter = {}, options?) => c.findAll('roles', filter, options),
    findByName: (name) => c.findOne('roles', { name }),
    findAllWithPermissions: () => c.findWithRelations('roles', {}, ['permissions']),
    findByIdWithPermissions: (id) => c.findByIdWithRelations('roles', id, ['permissions']),
    addPermission: (roleId, permId) => c.addToSet('roles', roleId, 'permissions', permId),
    removePermission: (roleId, permId) => c.pull('roles', roleId, 'permissions', permId),
    removePermissionFromAll: async (permId) => {
      const roles = await c.findAll('roles');
      for (const role of roles) {
        if (role.permissions?.includes(permId)) {
          await c.pull('roles', role.id, 'permissions', permId);
        }
      }
    },
    create: (data) => c.create('roles', data),
    update: (id, data) => c.update('roles', id, data),
    delete: (id) => c.delete('roles', id),
    findById: (id) => c.findById('roles', id),
    count: (filter?) => c.count('roles', filter),
  };
}

function createNetPermissionRepo(c: any): IPermissionRepository {
  return {
    findAllSorted: () => c.findAll('permissions', {}, { sort: { category: 1, name: 1 } }),
    findByName: (name) => c.findOne('permissions', { name }),
    countByCategory: (catId) => c.count('permissions', { category: catId }),
    create: (data) => c.create('permissions', data),
    update: (id, data) => c.update('permissions', id, data),
    delete: (id) => c.delete('permissions', id),
    findAll: (filter = {}, options?) => c.findAll('permissions', filter, options),
    findById: (id) => c.findById('permissions', id),
    count: (filter?) => c.count('permissions', filter),
  };
}

function createNetCategoryRepo(c: any): IPermissionCategoryRepository {
  return {
    findAllOrdered: () => c.findAll('permission_categories', {}, { sort: { order: 1, name: 1 } }),
    findByName: (name) => c.findOne('permission_categories', { name }),
    create: (data) => c.create('permission_categories', data),
    update: (id, data) => c.update('permission_categories', id, data),
    delete: (id) => c.delete('permission_categories', id),
    findAll: (filter = {}, options?) => c.findAll('permission_categories', filter, options),
    findById: (id) => c.findById('permission_categories', id),
    count: (filter?) => c.count('permission_categories', filter),
    upsert: (filter, data) => c.upsert('permission_categories', filter, data),
  };
}
