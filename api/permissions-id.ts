// Author: Dr Hamid MADANI drmdh@msn.com
// RBAC API handler: PUT/DELETE /admin/permissions/[id]
import { NextRequest, NextResponse } from 'next/server'
import { PermissionRepository, RoleRepository } from '@mostajs/auth'
import { getDialect } from '@mostajs/orm'
import { z } from 'zod'

const updatePermissionSchema = z.object({
  description: z.string().optional(),
  category: z.string().optional(),
})

export interface PermissionsIdHandlerConfig {
  checkPermission: (perm: string) => Promise<{ error: NextResponse | null; session: any }>
  adminPermission: string
}

export function createPermissionsIdHandler(config: PermissionsIdHandlerConfig) {
  const { checkPermission, adminPermission } = config

  async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { error } = await checkPermission(adminPermission)
    if (error) return error

    const { id } = await params

    const body = await req.json()
    const parsed = updatePermissionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Données invalides', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const pRepo = new PermissionRepository(await getDialect())
    const permission = await pRepo.update(id, parsed.data)

    if (!permission) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Permission non trouvée' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: permission })
  }

  async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { error } = await checkPermission(adminPermission)
    if (error) return error

    const { id } = await params
    const pRepo = new PermissionRepository(await getDialect())

    const permission = await pRepo.findById(id)
    if (!permission) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Permission non trouvée' } },
        { status: 404 }
      )
    }

    // Remove permission from all roles that have it
    const rRepo = new RoleRepository(await getDialect())
    await rRepo.removePermissionFromAll(id)

    await pRepo.delete(id)

    return NextResponse.json({ data: { message: 'Permission supprimée' } })
  }

  return { PUT, DELETE }
}
