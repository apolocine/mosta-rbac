// Author: Dr Hamid MADANI drmdh@msn.com
// RBAC API handler: GET/POST /admin/roles
import { NextRequest, NextResponse } from 'next/server'
import { getRbacRepos } from '../lib/repos-factory'
import { z } from 'zod'
import type { RoleDefinition } from '../types'

const createRoleSchema = z.object({
  name: z.string().min(1).regex(/^[a-z][a-z0-9_]*$/, 'Le nom doit être en minuscules (lettres, chiffres, underscores)'),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).optional(),
})

export interface RolesHandlerConfig {
  checkPermission: (perm: string) => Promise<{ error: NextResponse | null; session: any }>
  adminPermission: string
  defaultRoles?: Record<string, RoleDefinition>
}

export function createRolesHandler(config: RolesHandlerConfig) {
  const { checkPermission, adminPermission, defaultRoles = {} } = config

  async function GET() {
    const { error } = await checkPermission(adminPermission)
    if (error) return error

    const { roles: rRepo, users: uRepo } = await getRbacRepos()
    let roles = await rRepo.findAllWithPermissions()

    // Fallback: if DB is empty, return hardcoded defaults
    if (roles.length === 0) {
      const fallbackRoles = Object.values(defaultRoles).map((r, i) => ({
        id: `fallback_${i}`,
        name: r.name,
        description: r.description,
        permissions: r.permissions.map((p) => ({ name: p })),
        userCount: 0,
        _fallback: true,
      }))
      return NextResponse.json({ data: fallbackRoles })
    }
    const allUsers = await uRepo.findAllSafe()
    const rolesWithCount = roles.map((r) => ({
      ...r,
      userCount: allUsers.filter((u) => {
        const userRoles: string[] = Array.isArray(u.roles) ? u.roles : []
        return userRoles.includes(r.id)
      }).length,
    }))

    return NextResponse.json({ data: rolesWithCount })
  }

  async function POST(req: NextRequest) {
    const { error } = await checkPermission(adminPermission)
    if (error) return error

    const body = await req.json()
    const parsed = createRoleSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Données invalides', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const { name, description, permissionIds } = parsed.data
    const { roles: rRepo } = await getRbacRepos()

    const existing = await rRepo.findByName(name)
    if (existing) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE', message: 'Un rôle avec ce nom existe déjà' } },
        { status: 409 }
      )
    }

    const role = await rRepo.create({
      name,
      description: description || '',
      permissions: permissionIds || [],
    })

    const populated = await rRepo.findByIdWithPermissions(role.id)

    return NextResponse.json({ data: populated }, { status: 201 })
  }

  return { GET, POST }
}
