// @mostajs/rbac — Account Entity Schema
// Multi-tenant container referenced as target:'Account' by ApiKey, Project,
// Subscription, Invoice, UsageLog (across mosta-api-keys, mosta-project-life,
// mosta-subscriptions-plan).
// Author: Dr Hamid MADANI drmdh@msn.com

import type { EntitySchema } from '@mostajs/orm'

export const AccountSchema: EntitySchema = {
  name: 'Account',
  collection: 'accounts',
  timestamps: true,

  fields: {
    name:             { type: 'string', required: true, trim: true },
    type:             { type: 'string', enum: ['personal', 'organization', 'trial', 'system'], default: 'personal' },
    plan:             { type: 'string', default: 'free' },
    status:           { type: 'string', enum: ['active', 'suspended', 'deleted'], default: 'active' },
    stripeCustomerId: { type: 'string' },
    metadata:         { type: 'json' },
  },

  relations: {
    owner:   { type: 'many-to-one',  target: 'User', required: true },
    members: { type: 'many-to-many', target: 'User', through: 'account_members' },
  },

  indexes: [
    { fields: { type:   'asc' } },
    { fields: { status: 'asc' } },
  ],
}
