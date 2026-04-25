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
}
