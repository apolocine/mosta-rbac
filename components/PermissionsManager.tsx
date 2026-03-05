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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createPermissionsApi, createCategoriesApi } from '../lib/rbac-api'
import type { RBACConfig, PermissionData, CategoryData } from '../types'

const defaultT = (key: string) => key

export interface PermissionsManagerProps extends RBACConfig {}

export function PermissionsManager({
  apiBasePath = '/api',
  t = defaultT,
}: PermissionsManagerProps) {
  const permApi = createPermissionsApi(apiBasePath)
  const catApi = createCategoriesApi(apiBasePath)
  const queryClient = useQueryClient()
  const { data: permData, isLoading } = useQuery({ queryKey: ['permissions'], queryFn: permApi.fetchPermissions })
  const { data: categoriesList } = useQuery({ queryKey: ['categories'], queryFn: catApi.fetchCategories })
  const permissions = permData?.data || []
  const categoryLabels = permData?.categories || {}
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPerm, setEditingPerm] = useState<PermissionData | null>(null)
  const [form, setForm] = useState({ name: '', description: '', category: '' })
  const [confirmDeletePerm, setConfirmDeletePerm] = useState<PermissionData | null>(null)

  const createMut = useMutation({
    mutationFn: () => permApi.createPermission(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      queryClient.invalidateQueries({ queryKey: ['matrix'] })
      setDialogOpen(false)
      resetForm()
      toast.success(t('roles.permissions.created'))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMut = useMutation({
    mutationFn: () => permApi.updatePermission(editingPerm!.id, { description: form.description, category: form.category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      queryClient.invalidateQueries({ queryKey: ['matrix'] })
      setDialogOpen(false)
      setEditingPerm(null)
      resetForm()
      toast.success(t('roles.permissions.updated'))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMut = useMutation({
    mutationFn: permApi.deletePermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      queryClient.invalidateQueries({ queryKey: ['matrix'] })
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success(t('roles.permissions.deleted'))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function resetForm() {
    setForm({ name: '', description: '', category: '' })
  }

  function openCreate() {
    resetForm()
    setEditingPerm(null)
    setDialogOpen(true)
  }

  function openEdit(perm: PermissionData) {
    setEditingPerm(perm)
    setForm({ name: perm.name, description: perm.description || '', category: perm.category || '' })
    setDialogOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingPerm) {
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
          {t('roles.permissions.create')}
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
                  <TableHead>{t('roles.permissions.name')}</TableHead>
                  <TableHead>{t('roles.permissions.description')}</TableHead>
                  <TableHead>{t('roles.permissions.category')}</TableHead>
                  <TableHead className="text-center">{t('roles.permissions.rolesUsing')}</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((perm) => (
                  <TableRow key={perm.id}>
                    <TableCell className="font-medium font-mono text-sm">{perm.name}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{perm.description || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {categoryLabels[perm.category || ''] || perm.category || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{perm.roleCount || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(perm)}
                          className="h-8 w-8"
                          disabled={perm._fallback}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setConfirmDeletePerm(perm)}
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          disabled={perm._fallback}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {permissions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                      {t('roles.permissions.noPermissions')}
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
              {editingPerm ? t('roles.permissions.edit') : t('roles.permissions.create')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('roles.permissions.name')}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('roles.permissions.namePlaceholder')}
                required
                disabled={!!editingPerm}
                pattern="^[a-z_]+:[a-z_]+$"
                title="Format requis : categorie:action (ex: caisse:view)"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('roles.permissions.description')}</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t('roles.permissions.descriptionPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('roles.permissions.category')}</Label>
              <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('roles.permissions.categoryPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {(categoriesList || []).map((cat: CategoryData) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      <AlertDialog open={confirmDeletePerm !== null} onOpenChange={(o) => !o && setConfirmDeletePerm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.actions.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('roles.permissions.confirmDelete')}
              {(confirmDeletePerm?.roleCount || 0) > 0 && (
                <span className="block mt-1 text-amber-600">{t('roles.permissions.warningRolesUsing')}</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { deleteMut.mutate(confirmDeletePerm!.id); setConfirmDeletePerm(null) }}
            >
              {t('common.actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
