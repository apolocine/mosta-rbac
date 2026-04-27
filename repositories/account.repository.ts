// @mostajs/rbac — AccountRepository
// Author: Dr Hamid MADANI drmdh@msn.com
import { BaseRepository } from '@mostajs/orm'
import { AccountSchema } from '../schemas/account.schema'
import type { IDialect } from '@mostajs/orm'
import type { AccountDTO } from '../types/index'

export class AccountRepository extends BaseRepository<AccountDTO> {
  constructor(dialect: IDialect) {
    super(AccountSchema, dialect)
  }

  /** Find the account whose primary owner is the given user */
  async findByOwner(userId: string): Promise<AccountDTO | null> {
    return this.findOne({ owner: userId })
  }

  /** Find the unique system account by type — useful for the 'trial' shared playground */
  async findByType(type: string): Promise<AccountDTO | null> {
    return this.findOne({ type })
  }

  /** Find direct children of a parent account (1 level). */
  async findChildren(parentId: string): Promise<AccountDTO[]> {
    return this.findAll({ parent: parentId } as any)
  }

  /**
   * Expand a parent account ID into the set of "tenant accounts" :
   * the parent itself + all its direct children. Used by the row-level
   * scoping middleware (mosta-net) to filter account-scoped entities.
   *
   * Returns an array of account IDs.
   *
   * Note : 1 niveau seulement pour l'instant. Si on adopte une vraie
   * récursivité (forêt profonde), implémenter un CTE récursif (postgres
   * `WITH RECURSIVE`) ou itérer ici.
   */
  async expandTenant(parentId: string): Promise<string[]> {
    const children = await this.findChildren(parentId)
    return [parentId, ...children.map((c: any) => c.id)]
  }
}
