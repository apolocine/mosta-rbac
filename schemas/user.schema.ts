// @mostajs/rbac — User Entity Schema
// Author: Dr Hamid MADANI drmdh@msn.com
import type { EntitySchema } from '@mostajs/orm'

export const UserSchema: EntitySchema = {
  name: 'User',
  collection: 'users',
  timestamps: true,

  fields: {
    email:       { type: 'string', required: true, unique: true, lowercase: true, trim: true },
    password:    { type: 'string', required: true },
    firstName:   { type: 'string', required: true, trim: true },
    lastName:    { type: 'string', required: true, trim: true },
    phone:       { type: 'string', trim: true },
    status:      { type: 'string', enum: ['active', 'locked', 'disabled'], default: 'active' },
    lastLoginAt: { type: 'date' },
  },

  relations: {
    roles: { target: 'Role', type: 'many-to-many', through: 'user_roles' },
  },

  indexes: [
    { fields: { status: 'asc' } },
  ],
}
