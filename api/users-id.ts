// Author: Dr Hamid MADANI drmdh@msn.com
// RBAC API handler: GET/PUT/DELETE /users/[id]
import { NextRequest, NextResponse } from 'next/server'
import { hashPassword } from '@mostajs/auth/lib/password'
import { UserRepository, RoleRepository } from '@mostajs/auth'
import { getDialect } from '@mostajs/orm'
import { z } from 'zod'

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.string().min(1).optional(),
  status: z.enum(['active', 'locked', 'disabled']).optional(),
})

export interface UsersIdHandlerConfig {
  checkPermission: (perm: string) => Promise<{ error: NextResponse | null; session: any }>
  adminPermission: string
  knownRoles?: string[]
  getPermissionsForRole?: (role: string) => Promise<string[]>
}

export function createUsersIdHandler(config: UsersIdHandlerConfig) {
  const {
    checkPermission,
    adminPermission,
    knownRoles = [],
    getPermissionsForRole,
  } = config

  async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { error } = await checkPermission(adminPermission)
    if (error) return error

    const { id } = await params
    const repo = new UserRepository(await getDialect())

    const user = await repo.findByIdSafe(id)
    if (!user) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Utilisateur non trouvé' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: user })
  }

  async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { error } = await checkPermission(adminPermission)
    if (error) return error

    const { id } = await params

    const body = await req.json()
    const parsed = updateUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Données invalides', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const updateData: any = { ...parsed.data }

    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password)
    }

    if (updateData.role) {
      if (!knownRoles.includes(updateData.role)) {
        const rRepo = new RoleRepository(await getDialect())
        const dbRole = await rRepo.findByName(updateData.role)
        if (!dbRole) {
          return NextResponse.json(
            { error: { code: 'VALIDATION_ERROR', message: `Le rôle "${updateData.role}" n'existe pas` } },
            { status: 400 }
          )
        }
      }
      if (getPermissionsForRole) {
        updateData.permissions = await getPermissionsForRole(updateData.role)
      }
    }

    const repo = new UserRepository(await getDialect())
    const user = await repo.update(id, updateData)

    if (!user) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Utilisateur non trouvé' } },
        { status: 404 }
      )
    }

    const { password: _, ...userWithoutPassword } = user as any

    return NextResponse.json({ data: userWithoutPassword })
  }

  async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { error, session } = await checkPermission(adminPermission)
    if (error) return error

    const { id } = await params

    if (session!.user.id === id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Impossible de supprimer votre propre compte' } },
        { status: 403 }
      )
    }

    const repo = new UserRepository(await getDialect())
    const user = await repo.update(id, { status: 'disabled' })

    if (!user) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Utilisateur non trouvé' } },
        { status: 404 }
      )
    }

    const { password: _, ...userWithoutPassword } = user as any

    return NextResponse.json({ data: userWithoutPassword })
  }

  return { GET, PUT, DELETE }
}
