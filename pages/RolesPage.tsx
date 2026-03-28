// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { RBACManager } from '../components/RBACManager.js'
import { t } from '../lib/i18n.js'

const SYSTEM_ROLES = ['admin', 'agent_accueil', 'agent_attraction', 'superviseur']

export default function RolesPage() {
  return (
    <RBACManager
      apiBasePath="/api"
      t={t}
      systemRoles={SYSTEM_ROLES}
    />
  )
}
