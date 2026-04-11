// Author: Dr Hamid MADANI drmdh@msn.com
'use client'

import { UsersManager } from '../components/UsersManager.js'
import { t } from '../lib/i18n.js'

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-800',
  agent_accueil: 'bg-blue-100 text-blue-800',
  agent_attraction: 'bg-green-100 text-green-800',
  superviseur: 'bg-purple-100 text-purple-800',
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  locked: 'bg-yellow-100 text-yellow-800',
  disabled: 'bg-red-100 text-red-800',
}

const fallbackRoles = [
  { value: 'admin', label: 'Administrateur' },
  { value: 'agent_accueil', label: 'Agent d\'accueil' },
  { value: 'agent_attraction', label: 'Agent d\'attraction' },
  { value: 'superviseur', label: 'Superviseur' },
]

export default function UsersPage() {
  return (
    <UsersManager
      apiBasePath="/api"
      t={t}
      roleColors={roleColors}
      statusColors={statusColors}
      fallbackRoles={fallbackRoles}
    />
  )
}
