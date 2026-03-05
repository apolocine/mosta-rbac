// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useState, useCallback, Fragment } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { Checkbox } from './ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { Loader2, Save, Database } from 'lucide-react'
import { toast } from 'sonner'
import { createMatrixApi } from '../lib/rbac-api'
import type { RBACConfig } from '../types'

const defaultT = (key: string) => key

export interface PermissionMatrixProps extends RBACConfig {}

export function PermissionMatrix({
  apiBasePath = '/api',
  t = defaultT,
}: PermissionMatrixProps) {
  const api = createMatrixApi(apiBasePath)
  const queryClient = useQueryClient()
  const { data: matrix, isLoading } = useQuery({ queryKey: ['matrix'], queryFn: api.fetchMatrix })
  const [pendingChanges, setPendingChanges] = useState<Record<string, Record<string, boolean>>>({})

  const pendingCount = Object.values(pendingChanges).reduce(
    (acc, perms) => acc + Object.keys(perms).length, 0
  )

  const seedMutation = useMutation({
    mutationFn: api.seedRbac,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix'] })
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['permissions'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success(t('roles.matrix.initialized'))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const changes: { roleId: string; permissionId: string; granted: boolean }[] = []
      for (const [roleId, perms] of Object.entries(pendingChanges)) {
        for (const [permId, granted] of Object.entries(perms)) {
          changes.push({ roleId, permissionId: permId, granted })
        }
      }
      return api.saveChanges(changes)
    },
    onSuccess: () => {
      setPendingChanges({})
      queryClient.invalidateQueries({ queryKey: ['matrix'] })
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success(t('roles.matrix.saved'))
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const toggleCell = useCallback((roleId: string, permId: string, currentValue: boolean) => {
    setPendingChanges((prev) => {
      const copy = { ...prev }
      if (!copy[roleId]) copy[roleId] = {}
      const newValue = !currentValue
      copy[roleId] = { ...copy[roleId], [permId]: newValue }
      return copy
    })
  }, [])

  const getCellValue = useCallback((roleId: string, permId: string): boolean => {
    if (pendingChanges[roleId]?.[permId] !== undefined) {
      return pendingChanges[roleId][permId]
    }
    return matrix?.matrix[roleId]?.[permId] || false
  }, [pendingChanges, matrix])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  // No data — show init button
  if (!matrix || Object.keys(matrix.categories).length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <Database className="h-12 w-12 text-gray-300" />
          <p className="text-gray-500">{t('roles.matrix.noData')}</p>
          <Button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
          >
            {seedMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Database className="mr-2 h-4 w-4" />
            {t('roles.matrix.initRbac')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const categoryLabels = matrix.categoryLabels || {}

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              {pendingCount} {t('roles.matrix.pending')}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            size="sm"
          >
            {seedMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
            {t('roles.matrix.initRbac')}
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={pendingCount === 0 || saveMutation.isPending}
            size="sm"
          >
            {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {t('roles.matrix.save')}
          </Button>
        </div>
      </div>

      {/* Matrix table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-white z-10 min-w-[250px]">Permission</TableHead>
                {matrix.roles.map((role) => (
                  <TableHead key={role.id} className="text-center min-w-[120px]">
                    <div className="font-medium">{role.name}</div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(matrix.categories).map(([category, perms]) => (
                <Fragment key={category}>
                  {/* Category header row */}
                  <TableRow className="bg-gray-50">
                    <TableCell
                      colSpan={matrix.roles.length + 1}
                      className="font-semibold text-gray-700 py-2"
                    >
                      {categoryLabels[category] || category}
                    </TableCell>
                  </TableRow>
                  {/* Permission rows */}
                  {perms.map((perm) => (
                    <TableRow key={perm.id}>
                      <TableCell className="sticky left-0 bg-white z-10">
                        <div>
                          <span className="font-mono text-sm">{perm.name}</span>
                          {perm.description && (
                            <p className="text-xs text-gray-400 mt-0.5">{perm.description}</p>
                          )}
                        </div>
                      </TableCell>
                      {matrix.roles.map((role) => {
                        const checked = getCellValue(role.id, perm.id)
                        const isPending = pendingChanges[role.id]?.[perm.id] !== undefined
                        return (
                          <TableCell key={`${role.id}-${perm.id}`} className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() =>
                                  toggleCell(role.id, perm.id, getCellValue(role.id, perm.id))
                                }
                                className={isPending ? 'ring-2 ring-amber-400' : ''}
                              />
                            </div>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
