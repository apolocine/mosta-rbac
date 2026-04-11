// Author: Dr Hamid MADANI drmdh@msn.com
// RBAC API handler: GET/POST /admin/permissions/matrix
import { NextRequest, NextResponse } from 'next/server'
import { getRbacRepos } from '../lib/repos-factory'
import { z } from 'zod'
import type { CategoryDefinition } from '../types'

export interface MatrixHandlerConfig {
  checkPermission: (perm: string) => Promise<{ error: NextResponse | null; session: any }>
  adminPermission: string
  categoryDefinitions?: CategoryDefinition[]
}

export function createMatrixHandler(config: MatrixHandlerConfig) {
  const { checkPermission, adminPermission, categoryDefinitions = [] } = config

  async function GET() {
    const { error } = await checkPermission(adminPermission)
    if (error) return error

    const { permissions: pRepo, roles: rRepo, categories: catRepo } = await getRbacRepos()

    const [permissions, roles, dbCategories] = await Promise.all([
      pRepo.findAllSorted(),
      rRepo.findAllWithPermissions(),
      catRepo.findAllOrdered(),
    ])

    // Build category labels from DB or fallback
    const categoryLabels: Record<string, string> = {}
    if (dbCategories.length > 0) {
      for (const cat of dbCategories) {
        categoryLabels[cat.name] = cat.label
      }
    } else {
      for (const cat of categoryDefinitions) {
        categoryLabels[cat.name] = cat.label
      }
    }

    // Group permissions by category
    const categories: Record<string, any[]> = {}
    for (const p of permissions) {
      const cat = p.category || 'other'
      if (!categories[cat]) categories[cat] = []
      categories[cat].push({
        id: p.id,
        name: p.name,
        description: p.description || '',
      })
    }

    // Build matrix: roleId -> { permId: boolean }
    const matrix: Record<string, Record<string, boolean>> = {}
    for (const role of roles) {
      matrix[role.id] = {}
      const permIds = role.permissions.map((p: any) => typeof p === 'object' ? (p.id || p._id?.toString()) : p.toString())
      for (const p of permissions) {
        matrix[role.id][p.id] = permIds.includes(p.id)
      }
    }

    return NextResponse.json({
      data: {
        roles: roles.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description || '',
        })),
        categories,
        categoryLabels,
        matrix,
      },
    })
  }

  const matrixChangeSchema = z.object({
    changes: z.array(
      z.object({
        roleId: z.string(),
        permissionId: z.string(),
        granted: z.boolean(),
      })
    ),
  })

  async function POST(req: NextRequest) {
    const { error } = await checkPermission(adminPermission)
    if (error) return error

    const body = await req.json()
    const parsed = matrixChangeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Données invalides', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const { changes } = parsed.data
    const { roles: rRepo } = await getRbacRepos()
    let applied = 0

    for (const change of changes) {
      const { roleId, permissionId, granted } = change

      if (granted) {
        await rRepo.addPermission(roleId, permissionId)
      } else {
        await rRepo.removePermission(roleId, permissionId)
      }
      applied++
    }

    return NextResponse.json({
      data: { applied, message: `${applied} modification(s) appliquée(s)` },
    })
  }

  return { GET, POST }
}
