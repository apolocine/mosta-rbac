// @mostajs/rbac — UserRepository
// Author: Dr Hamid MADANI drmdh@msn.com
import { BaseRepository } from '@mostajs/orm'
import { UserSchema } from '../schemas/user.schema'
import type { IDialect, FilterQuery, QueryOptions } from '@mostajs/orm'
import type { UserDTO } from '../types/index'

export class UserRepository extends BaseRepository<UserDTO> {
  constructor(dialect: IDialect) {
    super(UserSchema, dialect)
  }

  /** List users without password field */
  async findAllSafe(filter: FilterQuery = {}, options?: QueryOptions): Promise<UserDTO[]> {
    return this.findAll(filter, { ...options, exclude: ['password'] })
  }

  /** Find a single user by ID without password */
  async findByIdSafe(id: string): Promise<UserDTO | null> {
    return this.findById(id, { exclude: ['password'] })
  }

  /** Find user by email (for authentication) */
  async findByEmail(email: string): Promise<UserDTO | null> {
    return this.findOne({ email: email.toLowerCase() })
  }

  /** Update lastLoginAt timestamp */
  async updateLastLogin(id: string): Promise<void> {
    await this.update(id, { lastLoginAt: new Date() } as any)
  }

  /** Find user by ID with roles populated */
  async findByIdWithRoles(id: string): Promise<UserDTO | null> {
    return this.findByIdWithRelations(id, ['roles'])
  }

  /** Find all users with roles populated (no password) */
  async findAllWithRoles(filter: FilterQuery = {}, options?: QueryOptions): Promise<UserDTO[]> {
    return this.findWithRelations(filter, ['roles'], { ...options, exclude: ['password'] })
  }

  /** Count users having a specific role */
  async countByRole(roleId: string): Promise<number> {
    return this.count({ roles: roleId })
  }

  /** Add a role to a user */
  async addRole(userId: string, roleId: string): Promise<UserDTO | null> {
    return this.addToSet(userId, 'roles', roleId)
  }

  /** Remove a role from a user */
  async removeRole(userId: string, roleId: string): Promise<UserDTO | null> {
    return this.pull(userId, 'roles', roleId)
  }
}
