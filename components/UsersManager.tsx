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
  DialogTrigger,
} from './ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from './ui/alert-dialog'
import { toast } from 'sonner'
import { createUsersApi } from '../lib/rbac-api'
import type { User, RBACConfig, RoleOption } from '../types'

const defaultT = (key: string) => key

export interface UsersManagerProps extends RBACConfig {
  /** Fallback role names if DB roles unavailable (e.g. ['admin', 'agent_accueil']) */
  fallbackRoles?: { value: string; label: string }[]
}

export function UsersManager({
  apiBasePath = '/api',
  t = defaultT,
  roleColors = {},
  statusColors = {},
  fallbackRoles,
}: UsersManagerProps) {
  const api = createUsersApi(apiBasePath)
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: '' as string,
    status: 'active' as string,
  })

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: api.fetchUsers,
  })

  const { data: availableRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: api.fetchRoles,
  })

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDialogOpen(false)
      resetForm()
      toast.success(t('users.created') !== 'users.created' ? t('users.created') : 'Utilisateur créé')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => api.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDialogOpen(false)
      setEditingUser(null)
      resetForm()
      toast.success(t('users.updated') !== 'users.updated' ? t('users.updated') : 'Utilisateur modifié')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: api.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(t('users.deactivated') !== 'users.deactivated' ? t('users.deactivated') : 'Utilisateur désactivé')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function resetForm() {
    setForm({ email: '', password: '', firstName: '', lastName: '', phone: '', role: '', status: 'active' })
  }

  function openCreate() {
    resetForm()
    setEditingUser(null)
    setDialogOpen(true)
  }

  function openEdit(user: User) {
    setEditingUser(user)
    setForm({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
    })
    setDialogOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingUser) {
      const data: any = { ...form }
      if (!data.password) delete data.password
      updateMutation.mutate({ id: editingUser.id, data })
    } else {
      createMutation.mutate(form)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('users.title')}</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('users.create')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? t('common.actions.edit') : t('users.create')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('users.fields.firstName')}</Label>
                  <Input
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('users.fields.lastName')}</Label>
                  <Input
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('users.fields.email')}</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {t('auth.login.form.password')}
                  {editingUser && <span className="text-xs text-gray-400 ml-1">(laisser vide pour ne pas changer)</span>}
                </Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editingUser}
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('users.fields.phone')}</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('users.fields.role')}</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles && availableRoles.length > 0 ? (
                      availableRoles.map((r: RoleOption) => {
                        const label = t(`auth.roles.${r.name}`)
                        const isTranslated = label !== `auth.roles.${r.name}` && label !== `roles.${r.name}`
                        return (
                          <SelectItem key={r.id} value={r.name}>
                            {isTranslated ? label : r.name}
                          </SelectItem>
                        )
                      })
                    ) : fallbackRoles ? (
                      fallbackRoles.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>-</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {editingUser && (
                <div className="space-y-2">
                  <Label>{t('users.fields.status')}</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t('users.statuses.active')}</SelectItem>
                      <SelectItem value="locked">{t('users.statuses.locked')}</SelectItem>
                      <SelectItem value="disabled">{t('users.statuses.disabled')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
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
                  <TableHead>{t('users.fields.lastName')}</TableHead>
                  <TableHead>{t('users.fields.email')}</TableHead>
                  <TableHead>{t('users.fields.phone')}</TableHead>
                  <TableHead>{t('users.fields.role')}</TableHead>
                  <TableHead>{t('users.fields.status')}</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge className={roleColors[user.role] || ''} variant="secondary">
                        {t(`auth.roles.${user.role}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[user.status] || ''} variant="secondary">
                        {t(`users.statuses.${user.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(user)}
                          className="h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setConfirmDeleteId(user.id)}
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {users?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                      Aucun utilisateur
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmDeleteId !== null} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.actions.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('common.confirm.deactivate')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { deleteMutation.mutate(confirmDeleteId!); setConfirmDeleteId(null) }}
            >
              {t('common.actions.deactivate')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
