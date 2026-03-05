// Author: Dr Hamid MADANI drmdh@msn.com
// UI-specific types for RBAC management components

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: string
  status: string
  createdAt: string
}

export interface RoleOption {
  id: string
  name: string
  description?: string
}

export interface RoleData {
  id: string
  name: string
  description?: string
  permissions: PermissionData[]
  userCount?: number
  _fallback?: boolean
}

export interface PermissionData {
  id: string
  name: string
  description?: string
  category?: string
  roleCount?: number
  _fallback?: boolean
}

export interface CategoryData {
  id: string
  name: string
  label: string
  description?: string
  icon?: string
  order: number
  system: boolean
  _fallback?: boolean
}

export interface MatrixData {
  roles: { id: string; name: string; description: string }[]
  categories: Record<string, { id: string; name: string; description: string }[]>
  categoryLabels: Record<string, string>
  matrix: Record<string, Record<string, boolean>>
}

export interface RBACConfig {
  /** Base URL for RBAC API calls (default: '/api') */
  apiBasePath?: string
  /** i18n translation function — defaults to identity (returns the key) */
  t?: (key: string, params?: Record<string, string | number>) => string
  /** System role names that cannot be renamed/deleted */
  systemRoles?: string[]
  /** Role badge colors map: roleName → CSS classes */
  roleColors?: Record<string, string>
  /** Status badge colors map: statusName → CSS classes */
  statusColors?: Record<string, string>
}

export interface PermissionDefinition {
  code: string
  name: string
  description: string
  category: string
}

export interface RoleDefinition {
  name: string
  description: string
  system: boolean
  permissions: string[]
}

export interface CategoryDefinition {
  name: string
  label: string
  description: string
  icon: string
  order: number
  system: boolean
}
