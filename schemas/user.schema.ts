// @mostajs/rbac — User Entity Schema
// Author: Dr Hamid MADANI drmdh@msn.com
// v2.2.0: added SaaS/Cloud fields (verified, stripe, avatar, locale, tokens)
import type { EntitySchema } from '@mostajs/orm'

export const UserSchema: EntitySchema = {
  name: 'User',
  collection: 'users',
  timestamps: true,

  fields: {
    // Identity
    email:       { type: 'string', required: true, unique: true, lowercase: true, trim: true },
    password:    { type: 'string', required: true },
    firstName:   { type: 'string', required: true, trim: true },
    lastName:    { type: 'string', required: true, trim: true },
    phone:       { type: 'string', trim: true },

    // Status & auth
    status:      { type: 'string', enum: ['active', 'locked', 'disabled'], default: 'active' },
    lastLoginAt: { type: 'date' },

    // Email verification
    verified:              { type: 'boolean', default: false },
    verifyToken:           { type: 'string' },
    verifyTokenExpiresAt:  { type: 'string' },

    // Password reset
    resetToken:            { type: 'string' },
    resetTokenExpiresAt:   { type: 'string' },

    // SaaS / Cloud
    stripeCustomerId:      { type: 'string' },
    avatar:                { type: 'string' },
    locale:                { type: 'string', default: 'fr' },
  },

  relations: {
    roles: { target: 'Role', type: 'many-to-many', through: 'user_roles' },
  },

  indexes: [
    { fields: { status: 'asc' } },
  ],
}
