// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from './ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createCategoriesApi, createPermissionsApi } from '../lib/rbac-api'
import type { RBACConfig, CategoryData } from '../types'

const defaultT = (key: string) => key

export interface CategoriesManagerProps extends RBACConfig {}

export function CategoriesManager({
  apiBasePath = '/api',
  t = defaultT,
}: CategoriesManagerProps) {
  const catApi = createCategoriesApi(apiBasePath)
  const permApi = createPermissionsApi(apiBasePath)
  const queryClient = useQueryClient()
  const { data: categories, isLoading } = useQuery({ queryKey: ['categories'], queryFn: catApi.fetchCategories })
  const { data: permData } = useQuery({ queryKey: ['permissions'], queryFn: permApi.fetchPermissions })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<CategoryData | null>(null)
  const [form, setForm] = useState({ name: '', label: '', description: '', icon: '', order: 0 })
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Count permissions per category
  const permCountByCategory: Record<string, number> = {}
  if (permData?.data) {
    for (const p of permData.data) {
      const cat = p.category || 'other'
      permCountByCategory[cat] = (permCountByCategory[cat] || 0) + 1
    }
  }

  const createMut = useMutation({
    mutationFn: () => catApi.createCategory(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      queryClient.invalidateQueries({ queryKey: ['matrix'] })
      setDialogOpen(false)
      resetForm()
      toast.success(t('roles.categories.created'))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMut = useMutation({
    mutationFn: () => catApi.updateCategory(editingCat!.id, {
      label: form.label,
      description: form.description,
      icon: form.icon,
      order: form.order,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      queryClient.invalidateQueries({ queryKey: ['matrix'] })
      setDialogOpen(false)
      setEditingCat(null)
      resetForm()
      toast.success(t('roles.categories.updated'))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMut = useMutation({
    mutationFn: catApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success(t('roles.categories.deleted'))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function resetForm() {
    setForm({ name: '', label: '', description: '', icon: '', order: 0 })
  }

  function openCreate() {
    resetForm()
    setEditingCat(null)
    setDialogOpen(true)
  }

  function openEdit(cat: CategoryData) {
    setEditingCat(cat)
    setForm({
      name: cat.name,
      label: cat.label,
      description: cat.description || '',
      icon: cat.icon || '',
      order: cat.order,
    })
    setDialogOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingCat) {
      updateMut.mutate()
    } else {
      createMut.mutate()
    }
  }

  const isPending = createMut.isPending || updateMut.isPending

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('roles.categories.create')}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('roles.categories.name')}</TableHead>
                  <TableHead>{t('roles.categories.label')}</TableHead>
                  <TableHead>{t('roles.categories.description')}</TableHead>
                  <TableHead className="text-center">{t('roles.categories.order')}</TableHead>
                  <TableHead className="text-center">{t('roles.categories.permissions')}</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories?.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium font-mono text-sm">{cat.name}</TableCell>
                    <TableCell>{cat.label}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{cat.description || '-'}</TableCell>
                    <TableCell className="text-center">{cat.order}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{permCountByCategory[cat.name] || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {cat.system ? (
                        <Badge className="bg-amber-100 text-amber-800">{t('roles.categories.system')}</Badge>
                      ) : (
                        <Badge variant="secondary">Custom</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(cat)}
                          className="h-8 w-8"
                          disabled={cat._fallback}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (cat.system) {
                              toast.error(t('roles.categories.cannotDeleteSystem'))
                              return
                            }
                            if ((permCountByCategory[cat.name] || 0) > 0) {
                              toast.error(t('roles.categories.cannotDeletePermissionsUsing'))
                              return
                            }
                            setConfirmDeleteId(cat.id)
                          }}
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          disabled={cat._fallback || cat.system}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!categories || categories.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                      {t('roles.categories.noCategories')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCat ? t('roles.categories.edit') : t('roles.categories.create')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('roles.categories.name')}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('roles.categories.namePlaceholder')}
                required
                disabled={!!editingCat}
                pattern="^[a-z][a-z0-9_]*$"
                title="Minuscules, chiffres et underscores uniquement"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('roles.categories.label')}</Label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder={t('roles.categories.labelPlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t('roles.categories.description')}</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('roles.categories.icon')}</Label>
                <Input
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="ex: UserCheck"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('roles.categories.order')}</Label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                  min={0}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t('common.actions.cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('common.actions.save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDeleteId !== null} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.actions.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('roles.categories.confirmDelete')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { deleteMut.mutate(confirmDeleteId!); setConfirmDeleteId(null) }}
            >
              {t('common.actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
