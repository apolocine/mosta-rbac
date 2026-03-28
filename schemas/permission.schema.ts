// @mostajs/rbac — Permission Entity Schema
// Author: Dr Hamid MADANI drmdh@msn.com
import type { EntitySchema } from '@mostajs/orm'

export const PermissionSchema: EntitySchema = {
  name: 'Permission',
  collection: 'permissions',
  timestamps: true,

  fields: {
    name:        { type: 'string', required: true, unique: true },
    description: { type: 'string' },
    category:    { type: 'string' },
  },

  relations: {},
  indexes: [],
}
