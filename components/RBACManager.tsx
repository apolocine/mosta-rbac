// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Shield } from 'lucide-react'
import { PermissionMatrix } from './PermissionMatrix'
import { RolesManager } from './RolesManager'
import { PermissionsManager } from './PermissionsManager'
import { CategoriesManager } from './CategoriesManager'
import type { RBACConfig } from '../types'

const defaultT = (key: string) => key

export interface RBACManagerProps extends RBACConfig {}

export function RBACManager({
  apiBasePath = '/api',
  t = defaultT,
  systemRoles = [],
  roleColors,
  statusColors,
}: RBACManagerProps) {
  const [tab, setTab] = useState('matrix')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-sky-600" />
        <h1 className="text-2xl font-bold text-gray-900">{t('roles.title')}</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="matrix">{t('roles.tabs.matrix')}</TabsTrigger>
          <TabsTrigger value="roles">{t('roles.tabs.roles')}</TabsTrigger>
          <TabsTrigger value="permissions">{t('roles.tabs.permissions')}</TabsTrigger>
          <TabsTrigger value="categories">{t('roles.tabs.categories')}</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix">
          <PermissionMatrix apiBasePath={apiBasePath} t={t} />
        </TabsContent>
        <TabsContent value="roles">
          <RolesManager apiBasePath={apiBasePath} t={t} systemRoles={systemRoles} />
        </TabsContent>
        <TabsContent value="permissions">
          <PermissionsManager apiBasePath={apiBasePath} t={t} />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesManager apiBasePath={apiBasePath} t={t} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
