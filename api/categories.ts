// Author: Dr Hamid MADANI drmdh@msn.com
// RBAC API handler: GET/POST /admin/categories
import { NextRequest, NextResponse } from 'next/server'
import { PermissionCategoryRepository } from '@mostajs/auth'
import { getDialect } from '@mostajs/orm'
import { z } from 'zod'
import type { CategoryDefinition } from '../types'

const createCategorySchema = z.object({
  name: z.string().min(1).regex(/^[a-z][a-z0-9_]*$/, 'Format requis : minuscules, chiffres et underscores'),
  label: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().int().min(0).optional(),
})

export interface CategoriesHandlerConfig {
  checkPermission: (perm: string) => Promise<{ error: NextResponse | null; session: any }>
  adminPermission: string
  categoryDefinitions?: CategoryDefinition[]
}

export function createCategoriesHandler(config: CategoriesHandlerConfig) {
  const { checkPermission, adminPermission, categoryDefinitions = [] } = config

  async function GET() {
    const { error } = await checkPermission(adminPermission)
    if (error) return error

    const repo = new PermissionCategoryRepository(await getDialect())
    let categories = await repo.findAllOrdered()

    // Fallback: if DB is empty, return hardcoded definitions
    if (categories.length === 0) {
      const fallback = categoryDefinitions.map((c, i) => ({
        id: `fallback_${i}`,
        name: c.name,
        label: c.label,
        description: c.description,
        icon: c.icon,
        order: c.order,
        system: c.system,
        _fallback: true,
      }))
      return NextResponse.json({ data: fallback })
    }

    return NextResponse.json({ data: categories })
  }

  async function POST(req: NextRequest) {
    const { error } = await checkPermission(adminPermission)
    if (error) return error

    const body = await req.json()
    const parsed = createCategorySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Donnees invalides', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const { name, label, description, icon, order } = parsed.data
    const repo = new PermissionCategoryRepository(await getDialect())

    const existing = await repo.findByName(name)
    if (existing) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE', message: 'Une categorie avec ce nom existe deja' } },
        { status: 409 }
      )
    }

    const category = await repo.create({
      name,
      label,
      description: description || '',
      icon: icon || '',
      order: order ?? 0,
      system: false,
    })

    return NextResponse.json({ data: category }, { status: 201 })
  }

  return { GET, POST }
}
