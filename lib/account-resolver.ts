// @mostajs/rbac — Account resolver
//
// Resolves the personal Account owned by a User. The Account is the
// boundary entity for API keys, projects, billing, subscriptions —
// User is just identity. Centralizes the lookup-or-create pattern so
// portals (Octocloud, future tenants UIs) don't reimplement it.
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import type { IDialect } from '@mostajs/orm'
import { AccountRepository } from '../repositories/account.repository'

export interface ResolveAccountOptions {
  /** Override the auto-create account name (default: "<userEmail>-<type>"). */
  name?: string
  /** Account type for lookup + auto-create (default: 'personal'). */
  type?: string
  /** Plan to assign on auto-create (default: 'free'). */
  plan?: string
  /** Status on auto-create (default: 'active'). */
  status?: string
  /** Parent Account ID (multi-tenant β model — set on auto-create only).
   *  Si défini, le compte personnel créé devient un child du portal tenant
   *  → visible par le middleware row-level d'Octonet via expandTenant.
   *  Pas appliqué aux comptes déjà existants (pas de re-parenting). */
  parent?: string
  /** Disable auto-create — return null if not found. */
  noAutoCreate?: boolean
}

/**
 * Resolve (or auto-create) the Account owned by `userId`. Returns the
 * account ID, or null if `noAutoCreate` and not found.
 *
 * Lookup order:
 *   1. accounts WHERE owner=userId AND type=options.type
 *   2. accounts WHERE owner=userId (any type — first match)
 *   3. CREATE account (unless noAutoCreate=true)
 */
export async function resolveUserAccountId(
  dialect: IDialect,
  userId: string,
  userEmail?: string,
  options: ResolveAccountOptions = {},
): Promise<string | null> {
  const accountRepo = new AccountRepository(dialect)

  const type   = options.type   || 'personal'
  const status = options.status || 'active'
  const plan   = options.plan   || 'free'

  const existing = await accountRepo.findOne({ owner: userId, type } as any)
  if ((existing as any)?.id) return (existing as any).id

  // Fallback : owner has an account of a different type (e.g. 'system',
  // 'trial') — pick the first match rather than auto-creating a duplicate.
  const any = await accountRepo.findOne({ owner: userId } as any)
  if ((any as any)?.id) return (any as any).id

  if (options.noAutoCreate) return null

  const created = await accountRepo.create({
    name:   options.name || `${userEmail || userId}-${type}`,
    type, plan, status,
    owner:  userId,
    ...(options.parent ? { parent: options.parent } : {}),
  } as any)
  return (created as any).id
}
