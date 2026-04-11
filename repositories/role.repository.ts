// @mostajs/rbac — RoleRepository
// Author: Dr Hamid MADANI drmdh@msn.com
import { BaseRepository } from '@mostajs/orm'
import { RoleSchema } from '../schemas/role.schema'
import type { IDialect } from '@mostajs/orm'
import type { RoleDTO } from '../types/index'

export class RoleRepository extends BaseRepository<RoleDTO> {
  constructor(dialect: IDialect) {
    super(RoleSchema, dialect)
  }

  /** Find all roles with permissions populated */
  async findAllWithPermissions(): Promise<RoleDTO[]> {
    return this.findWithRelations({}, ['permissions'])
  }

  /** Find a role by name */
  async findByName(name: string): Promise<RoleDTO | null> {
    return this.findOne({ name })
  }

  /** Find role by ID with permissions populated */
  async findByIdWithPermissions(id: string): Promise<RoleDTO | null> {
    return this.findByIdWithRelations(id, ['permissions'])
  }

  /** Add a permission to a role */
  async addPermission(roleId: string, permissionId: string): Promise<RoleDTO | null> {
    return this.addToSet(roleId, 'permissions', permissionId)
  }

  /** Remove a permission from a role */
  async removePermission(roleId: string, permissionId: string): Promise<RoleDTO | null> {
    return this.pull(roleId, 'permissions', permissionId)
  }

  /** Remove a permission from ALL roles (cascade) */
  async removePermissionFromAll(permissionId: string): Promise<number> {
    return this.updateMany(
      { permissions: permissionId } as any,
      { $pull: { permissions: permissionId } } as any,
    )
  }
}
