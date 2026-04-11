// Author: Dr Hamid MADANI drmdh@msn.com
// RBAC API handler: GET/POST /admin/permissions
import { NextRequest, NextResponse } from 'next/server'
import { getRbacRepos } from '../lib/repos-factory'
import { z } from 'zod'
import type { PermissionDefinition, CategoryDefinition } from '../types'

const createPermissionSchema = z.object({
  name: z.string().min(1).regex(/^[a-z_]+:[a-z_]+$/, 'Format requis : categorie:action'),
  description: z.string().optional(),
  category: z.string().optional(),
})

export interface PermissionsHandlerConfig {
  checkPermission: (perm: string) => Promise<{ error: NextResponse | null; session: any }>
  adminPermission: string
  permissionDefinitions?: PermissionDefinition[]
  categoryDefinitions?: CategoryDefinition[]
}

export function createPermissionsHandler(config: PermissionsHandlerConfig) {
  const {
    checkPermission,
    adminPermission,
    permissionDefinitions = [],
    categoryDefinitions = [],
  } = config

  async function GET() {
    const { error } = await checkPermission(adminPermission)
    if (error) return error

    // Read category labels from DB, fallback to hardcoded
    const { categories: catRepo, permissions: pRepo, roles: rRepo } = await getRbacRepos()
    const dbCategories = await catRepo.findAllOrdered()
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
    let permissions = await pRepo.findAllSorted()

    // Fallback: if DB is empty, return hardcoded definitions
    if (permissions.length === 0) {
      const fallback = permissionDefinitions.map((p, i) => ({
        id: `fallback_${i}`,
        name: p.name,
        description: p.description,
        category: p.category,
        _fallback: true,
      }))
      return NextResponse.json({ data: fallback, categories: categoryLabels })
    }

    // Count roles per permission
    const roles = await rRepo.findAllWithPermissions()
    const permRoleCount: Record<string, number> = {}
    for (const role of roles) {
      for (const permId of role.permissions) {
        const key = typeof permId === 'object' ? (permId as any).id || (permId as any)._id?.toString() : permId.toString()
        permRoleCount[key] = (permRoleCount[key] || 0) + 1
      }
    }

    const permissionsWithCount = permissions.map((p) => ({
      ...p,
      roleCount: permRoleCount[p.id] || 0,
    }))

    // Group by category
    const grouped: Record<string, typeof permissionsWithCount> = {}
    for (const p of permissionsWithCount) {
      const cat = p.category || 'other'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(p)
    }

    return NextResponse.json({ data: permissionsWithCount, grouped, categories: categoryLabels })
  }

  async function POST(req: NextRequest) {
    const { error } = await checkPermission(adminPermission)
    if (error) return error

    const body = await req.json()
    const parsed = createPermissionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Données invalides', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const { name, description, category } = parsed.data
    const { permissions: pRepo, categories: catRepo } = await getRbacRepos()

    const existing = await pRepo.findByName(name)
    if (existing) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE', message: 'Une permission avec ce nom existe déjà' } },
        { status: 409 }
      )
    }

    // Auto-derive category from name if not provided
    const derivedCategory = category || name.split(':')[0]

    // Validate category exists in DB or in fallback definitions
    const catExists = await catRepo.findByName(derivedCategory)
    if (!catExists) {
      const fallbackExists = categoryDefinitions.some((c) => c.name === derivedCategory)
      if (!fallbackExists) {
        return NextResponse.json(
          { error: { code: 'INVALID_CATEGORY', message: `La categorie '${derivedCategory}' n'existe pas` } },
          { status: 400 }
        )
      }
    }

    const permission = await pRepo.create({
      name,
      description: description || '',
      category: derivedCategory,
    })

    return NextResponse.json({ data: permission }, { status: 201 })
  }

  return { GET, POST }
}
