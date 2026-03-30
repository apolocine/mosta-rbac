// @mostajs/rbac — Create admin user
// This is RBAC's responsibility: it knows UserSchema, how to hash, how to link roles
// Called by @mostajs/setup or @mostajs/auth — NOT by the app directly
// Author: Dr Hamid MADANI drmdh@msn.com

import { getRbacRepos } from './repos-factory.js'

export interface CreateAdminOptions {
  email: string
  password: string       // plain text — will be hashed here
  firstName: string
  lastName: string
  roleName?: string      // default: 'admin'
}

export interface CreateAdminResult {
  ok: boolean
  userId?: string
  email?: string
  error?: string
}

/**
 * Create an admin user with hashed password and admin role.
 * Idempotent — if user already exists, returns existing user info.
 */
export async function createAdmin(options: CreateAdminOptions): Promise<CreateAdminResult> {
  try {
    const { users, roles } = await getRbacRepos()

    // Check if user already exists
    const existing = await users.findByEmail(options.email)
    if (existing) {
      return { ok: true, userId: existing.id, email: existing.email }
    }

    // Hash password (bcryptjs)
    const bcryptModule = await import('bcryptjs')
    const bcrypt = bcryptModule.default || bcryptModule
    const hashedPassword = await bcrypt.hash(options.password, 12)

    // Find admin role
    const roleName = options.roleName || 'admin'
    const adminRole = await roles.findByName(roleName)

    // Create user
    const user = await users.create({
      email: options.email.toLowerCase(),
      password: hashedPassword,
      firstName: options.firstName,
      lastName: options.lastName,
      status: 'active',
      roles: adminRole ? [adminRole.id] : [],
    } as any)

    return { ok: true, userId: user.id, email: user.email }
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
