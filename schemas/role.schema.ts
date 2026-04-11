// @mostajs/rbac — Role Entity Schema
// Author: Dr Hamid MADANI drmdh@msn.com
import type { EntitySchema } from '@mostajs/orm'

export const RoleSchema: EntitySchema = {
  name: 'Role',
  collection: 'roles',
  timestamps: true,

  fields: {
    name:        { type: 'string', required: true, unique: true },
    description: { type: 'string' },
  },

  relations: {
    permissions: { target: 'Permission', type: 'many-to-many', through: 'role_permissions' },
  },

  indexes: [],
}
