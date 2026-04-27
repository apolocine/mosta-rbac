// @mostajs/rbac — Account Entity Schema
//
// Multi-tenant container référencé comme target:'Account' par ApiKey, Project,
// Subscription, Invoice, UsageLog (across mosta-api-keys, mosta-project-life,
// mosta-subscriptions-plan).
//
// Hiérarchie (depuis 2.4.0, modèle β multi-tenant) :
//   - `parent` (nullable many-to-one Account → Account) permet de modéliser
//     une forêt de comptes : un Account 'portal' (octocloud-amia) en racine,
//     les Accounts 'personal' des users qui s'inscrivent ont parent=portal.
//   - Les modules consomateurs (mosta-net Octonet) utilisent ce parent comme
//     frontière de cloisonnement : une apikey rattachée à un portal Account
//     voit uniquement les données dont l'`account` ∈ {portal} ∪ {children
//     de portal}.
//
// Types existants :
//   - personal     : compte personnel d'un user
//   - organization : équipe/société (futur)
//   - trial        : sandbox transient (T1 /try)
//   - system       : compte système (public-demo, services internes)
//   - portal       : tenant racine d'un octocloud (ajouté en 2.4.0)
//
// Author: Dr Hamid MADANI drmdh@msn.com

import type { EntitySchema } from '@mostajs/orm'

export const AccountSchema: EntitySchema = {
  name: 'Account',
  collection: 'accounts',
  timestamps: true,

  fields: {
    name:             { type: 'string', required: true, trim: true },
    type:             { type: 'string', enum: ['personal', 'organization', 'trial', 'system', 'portal'], default: 'personal' },
    plan:             { type: 'string', default: 'free' },
    status:           { type: 'string', enum: ['active', 'suspended', 'deleted'], default: 'active' },
    stripeCustomerId: { type: 'string' },
    metadata:         { type: 'json' },
  },

  relations: {
    owner:   { type: 'many-to-one',  target: 'User',    required: true },
    parent:  { type: 'many-to-one',  target: 'Account', required: false },
    members: { type: 'many-to-many', target: 'User',    through: 'account_members' },
  },

  indexes: [
    { fields: { type:   'asc' } },
    { fields: { status: 'asc' } },
    { fields: { parent: 'asc' } },
  ],
}
