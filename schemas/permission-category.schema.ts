// @mostajs/rbac — PermissionCategory Entity Schema
// Author: Dr Hamid MADANI drmdh@msn.com
import type { EntitySchema } from '@mostajs/orm'

export const PermissionCategorySchema: EntitySchema = {
  name: 'PermissionCategory',
  collection: 'permission_categories',
  timestamps: true,

  fields: {
    name:        { type: 'string', required: true, unique: true, lowercase: true, trim: true },
    label:       { type: 'string', required: true, trim: true },
    description: { type: 'string' },
    icon:        { type: 'string' },
    order:       { type: 'number', default: 0 },
    system:      { type: 'boolean', default: false },
  },

  relations: {},

  indexes: [
    { fields: { order: 'asc', name: 'asc' } },
  ],
}
