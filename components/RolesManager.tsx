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
import { createRolesApi } from '../lib/rbac-api'
import type { RBACConfig, RoleData } from '../types'

const defaultT = (key: string) => key

export interface RolesManagerProps extends RBACConfig {}

export function RolesManager({
  apiBasePath = '/api',
  t = defaultT,
  systemRoles = [],
}: RolesManagerProps) {
  const api = createRolesApi(apiBasePath)
  const queryClient = useQueryClient()
  const { data: roles, isLoading } = useQuery({ queryKey: ['roles'], queryFn: api.fetchRoles })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleData | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const createMut = useMutation({
    mutationFn: () => api.createRole(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['matrix'] })
      setDialogOpen(false)
      resetForm()
      toast.success(t('roles.roles.created'))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMut = useMutation({
    mutationFn: () => api.updateRole(editingRole!.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['matrix'] })
      setDialogOpen(false)
      setEditingRole(null)
      resetForm()
      toast.success(t('roles.roles.updated'))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMut = useMutation({
    mutationFn: api.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['matrix'] })
      toast.success(t('roles.roles.deleted'))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function resetForm() {
    setForm({ name: '', description: '' })
  }

  function openCreate() {
    resetForm()
    setEditingRole(null)
    setDialogOpen(true)
  }

  function openEdit(role: RoleData) {
    setEditingRole(role)
    setForm({ name: role.name, description: role.description || '' })
    setDialogOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingRole) {
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
          {t('roles.roles.create')}
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
                  <TableHead>{t('roles.roles.name')}</TableHead>
                  <TableHead>{t('roles.roles.description')}</TableHead>
                  <TableHead className="text-center">{t('roles.roles.permissions')}</TableHead>
                  <TableHead className="text-center">{t('roles.roles.users')}</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles?.map((role) => {
                  const isSystem = systemRoles.includes(role.name)
                  return (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium font-mono">{role.name}</TableCell>
                      <TableCell className="text-gray-500 text-sm">{role.description || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{role.permissions?.length || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className={role.userCount ? 'bg-blue-100 text-blue-800' : ''}>
                          {role.userCount || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {isSystem ? (
                          <Badge className="bg-amber-100 text-amber-800">{t('roles.roles.system')}</Badge>
                        ) : (
                          <Badge variant="secondary">Custom</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(role)}
                            className="h-8 w-8"
                            disabled={role._fallback}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (isSystem) {
                                toast.error(t('roles.roles.cannotDeleteSystem'))
                                return
                              }
                              if ((role.userCount || 0) > 0) {
                                toast.error(t('roles.roles.cannotDeleteUsersAssigned'))
                                return
                              }
                              setConfirmDeleteId(role.id)
                            }}
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            disabled={role._fallback || isSystem}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {(!roles || roles.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                      {t('roles.roles.noRoles')}
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
              {editingRole ? t('roles.roles.edit') : t('roles.roles.create')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('roles.roles.name')}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('roles.roles.namePlaceholder')}
                required
                disabled={!!editingRole && systemRoles.includes(editingRole.name)}
                pattern="^[a-z][a-z0-9_]*$"
                title="Minuscules, chiffres et underscores uniquement"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('roles.roles.description')}</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t('roles.roles.descriptionPlaceholder')}
              />
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
            <AlertDialogDescription>{t('roles.roles.confirmDelete')}</AlertDialogDescription>
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
