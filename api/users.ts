// Author: Dr Hamid MADANI drmdh@msn.com
// RBAC API handler: GET/POST /users
import { NextRequest, NextResponse } from 'next/server'
import { hashPassword } from '@mostajs/auth/lib/password'
import { getRbacRepos } from '../lib/repos-factory'
import { z } from 'zod'

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  role: z.string().min(1),
})

export interface UsersHandlerConfig {
  checkPermission: (perm: string) => Promise<{ error: NextResponse | null; session: any }>
  adminPermission: string
  knownRoles?: string[]
  getPermissionsForRole?: (role: string) => Promise<string[]>
  logAudit?: (entry: Record<string, unknown>) => Promise<void>
  getAuditUser?: (session: any) => Record<string, unknown>
}

export function createUsersHandler(config: UsersHandlerConfig) {
  const {
    checkPermission,
    adminPermission,
    knownRoles = [],
    getPermissionsForRole,
    logAudit,
    getAuditUser,
  } = config

  async function GET() {
    const { error } = await checkPermission(adminPermission)
    if (error) return error

    const { users: repo } = await getRbacRepos()
    const users = await repo.findAllSafe({}, { sort: { createdAt: -1 } })

    return NextResponse.json({ data: users })
  }

  async function POST(req: NextRequest) {
    const { error, session } = await checkPermission(adminPermission)
    if (error) return error

    const body = await req.json()
    const parsed = createUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Données invalides', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const { email, password, firstName, lastName, phone, role } = parsed.data
    const { users: repo, roles: rRepo } = await getRbacRepos()

    const existing = await repo.findByEmail(email)
    if (existing) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE', message: 'Cet email est déjà utilisé' } },
        { status: 409 }
      )
    }

    // Validate role exists (known constants or DB)
    if (!knownRoles.includes(role)) {
      const dbRole = await rRepo.findByName(role)
      if (!dbRole) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: `Le rôle "${role}" n'existe pas` } },
          { status: 400 }
        )
      }
    }

    const hashedPassword = await hashPassword(password)
    const permissions = getPermissionsForRole ? await getPermissionsForRole(role) : []

    const user = await repo.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role,
      permissions,
      status: 'active',
    } as any)

    const { password: _, ...userWithoutPassword } = user as any

    if (logAudit && getAuditUser) {
      await logAudit({
        ...getAuditUser(session!),
        action: 'user_create',
        module: 'users',
        resource: `${firstName} ${lastName}`,
        resourceId: user.id,
        details: { email, role },
      })
    }

    return NextResponse.json({ data: userWithoutPassword }, { status: 201 })
  }

  return { GET, POST }
}
