// @mostajs/rbac — Menu contribution
// Author: Dr Hamid MADANI drmdh@msn.com

import { Users, Shield } from 'lucide-react'
import type { ModuleMenuContribution } from '@mostajs/menu'

export const rbacMenuContribution: ModuleMenuContribution = {
  moduleKey: 'rbac',
  mergeIntoGroup: 'Administration',
  order: 70,
  items: [
    {
      label: 'users.title',
      href: '/dashboard/users',
      icon: Users,
      permission: 'admin:access',
    },
    {
      label: 'roles.title',
      href: '/dashboard/roles',
      icon: Shield,
      permission: 'admin:access',
    },
  ],
}
