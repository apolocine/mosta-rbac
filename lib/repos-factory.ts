// repos-factory.ts — Centralized repository factory
// Uses @mostajs/data-plug to get the right dialect (ORM or NET)
// Author: Dr Hamid MADANI drmdh@msn.com

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
// Factory — uses octoswitcher (ORM or NET, transparent)
// ============================================================

export interface RbacRepos {
  users: IUserRepository;
  roles: IRoleRepository;
  permissions: IPermissionRepository;
  categories: IPermissionCategoryRepository;
}

let _cached: RbacRepos | null = null;

/** Get RBAC repositories — dialect resolved by octoswitcher (ORM or NET) */
export async function getRbacRepos(): Promise<RbacRepos> {
  if (_cached) return _cached;

  const { getDialect } = await import('@mostajs/data-plug');
  const { registerSchemas } = await import('@mostajs/orm');
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
  // Ensure tables exist (initSchema may have been called before our schemas were registered)
  if (typeof (dialect as any).initSchema === 'function') {
    const { getAllSchemas } = await import('@mostajs/orm');
    await (dialect as any).initSchema(getAllSchemas());
  }

  _cached = {
    users: new UserRepository(dialect as any) as IUserRepository,
    roles: new RoleRepository(dialect as any) as IRoleRepository,
    permissions: new PermissionRepository(dialect as any) as IPermissionRepository,
    categories: new PermissionCategoryRepository(dialect as any) as IPermissionCategoryRepository,
  };
  return _cached;
}

/** Reset cache (for tests) */
export function resetRbacRepos(): void { _cached = null; }
