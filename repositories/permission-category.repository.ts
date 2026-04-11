// @mostajs/rbac — PermissionCategoryRepository
// Author: Dr Hamid MADANI drmdh@msn.com
import { BaseRepository } from '@mostajs/orm'
import { PermissionCategorySchema } from '../schemas/permission-category.schema'
import type { IDialect } from '@mostajs/orm'
import type { PermissionCategoryDTO } from '../types/index'

export class PermissionCategoryRepository extends BaseRepository<PermissionCategoryDTO> {
  constructor(dialect: IDialect) {
    super(PermissionCategorySchema, dialect)
  }

  /** Find all sorted by order then name */
  async findAllOrdered(): Promise<PermissionCategoryDTO[]> {
    return this.findAll({}, { sort: { order: 1, name: 1 } })
  }

  /** Find by name (unique) */
  async findByName(name: string): Promise<PermissionCategoryDTO | null> {
    return this.findOne({ name })
  }
}
