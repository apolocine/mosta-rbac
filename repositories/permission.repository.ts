// @mostajs/rbac — PermissionRepository
// Author: Dr Hamid MADANI drmdh@msn.com
import { BaseRepository } from '@mostajs/orm'
import { PermissionSchema } from '../schemas/permission.schema'
import type { IDialect } from '@mostajs/orm'
import type { PermissionDTO } from '../types/index'

export class PermissionRepository extends BaseRepository<PermissionDTO> {
  constructor(dialect: IDialect) {
    super(PermissionSchema, dialect)
  }

  /** Find all sorted by category then name */
  async findAllSorted(): Promise<PermissionDTO[]> {
    return this.findAll({}, { sort: { category: 1, name: 1 } })
  }

  /** Find by name (unique) */
  async findByName(name: string): Promise<PermissionDTO | null> {
    return this.findOne({ name })
  }

  /** Count permissions in a category */
  async countByCategory(category: string): Promise<number> {
    return this.count({ category })
  }
}
