// Author: Dr Hamid MADANI drmdh@msn.com
// RBAC API handler: PUT/DELETE /admin/categories/[id]
import { NextRequest, NextResponse } from 'next/server'
import { getRbacRepos } from '../lib/repos-factory'
import { z } from 'zod'

const updateCategorySchema = z.object({
  label: z.string().min(1).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().int().min(0).optional(),
})

export interface CategoriesIdHandlerConfig {
  checkPermission: (perm: string) => Promise<{ error: NextResponse | null; session: any }>
  adminPermission: string
}

export function createCategoriesIdHandler(config: CategoriesIdHandlerConfig) {
  const { checkPermission, adminPermission } = config

  async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { error } = await checkPermission(adminPermission)
    if (error) return error

    const { id } = await params
    const body = await req.json()
    const parsed = updateCategorySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Donnees invalides', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const { categories: catRepo } = await getRbacRepos()

    const category = await catRepo.findById(id)
    if (!category) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Categorie introuvable' } },
        { status: 404 }
      )
    }

    const updates: Record<string, unknown> = {}
    if (parsed.data.label !== undefined) updates.label = parsed.data.label
    if (parsed.data.description !== undefined) updates.description = parsed.data.description
    if (parsed.data.icon !== undefined) updates.icon = parsed.data.icon
    if (parsed.data.order !== undefined) updates.order = parsed.data.order

    const updated = await catRepo.update(id, updates)

    return NextResponse.json({ data: updated })
  }

  async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { error } = await checkPermission(adminPermission)
    if (error) return error

    const { id } = await params
    const { categories: catRepo, permissions: pRepo } = await getRbacRepos()

    const category = await catRepo.findById(id)
    if (!category) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Categorie introuvable' } },
        { status: 404 }
      )
    }

    if (category.system) {
      return NextResponse.json(
        { error: { code: 'SYSTEM_PROTECTED', message: 'Les categories systeme ne peuvent pas etre supprimees' } },
        { status: 403 }
      )
    }

    // Check if permissions are using this category
    const permCount = await pRepo.count({ category: category.name })
    if (permCount > 0) {
      return NextResponse.json(
        { error: { code: 'IN_USE', message: `Impossible : ${permCount} permission(s) utilisent cette categorie` } },
        { status: 409 }
      )
    }

    await catRepo.delete(id)

    return NextResponse.json({ data: { message: 'Categorie supprimee' } })
  }

  return { PUT, DELETE }
}
