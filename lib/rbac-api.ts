// Author: Dr Hamid MADANI drmdh@msn.com
// Shared fetch helpers for RBAC components — configurable base URL
import type { User, RoleOption, RoleData, PermissionData, CategoryData, MatrixData } from '../types'

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }))
    throw new Error(err.error?.message || `Erreur ${res.status}`)
  }
  return res.json()
}

// ---- Users ----

export function createUsersApi(basePath: string, rolesBasePath?: string) {
  const base = `${basePath}/users`
  const rolesBase = rolesBasePath || `${basePath}/admin/roles`

  return {
    async fetchUsers(): Promise<User[]> {
      const data = await apiFetch<{ data: User[] }>(base)
      return data.data
    },
    async fetchRoles(): Promise<RoleOption[]> {
      try {
        const data = await apiFetch<{ data: RoleOption[] }>(rolesBase)
        return data.data
      } catch {
        return []
      }
    },
    async createUser(user: Record<string, unknown>): Promise<User> {
      const data = await apiFetch<{ data: User }>(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      })
      return data.data
    },
    async updateUser(id: string, user: Record<string, unknown>): Promise<User> {
      const data = await apiFetch<{ data: User }>(`${base}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      })
      return data.data
    },
    async deleteUser(id: string): Promise<void> {
      await apiFetch(`${base}/${id}`, { method: 'DELETE' })
    },
  }
}

// ---- Roles ----

export function createRolesApi(basePath: string) {
  const base = `${basePath}/admin/roles`

  return {
    async fetchRoles(): Promise<RoleData[]> {
      const data = await apiFetch<{ data: RoleData[] }>(base)
      return data.data
    },
    async createRole(role: { name: string; description: string }): Promise<RoleData> {
      const data = await apiFetch<{ data: RoleData }>(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(role),
      })
      return data.data
    },
    async updateRole(id: string, role: { name?: string; description?: string }): Promise<RoleData> {
      const data = await apiFetch<{ data: RoleData }>(`${base}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(role),
      })
      return data.data
    },
    async deleteRole(id: string): Promise<void> {
      await apiFetch(`${base}/${id}`, { method: 'DELETE' })
    },
  }
}

// ---- Permissions ----

export function createPermissionsApi(basePath: string) {
  const base = `${basePath}/admin/permissions`

  return {
    async fetchPermissions(): Promise<{ data: PermissionData[]; categories: Record<string, string> }> {
      return apiFetch<{ data: PermissionData[]; categories: Record<string, string> }>(base)
    },
    async createPermission(perm: { name: string; description: string; category: string }): Promise<PermissionData> {
      const data = await apiFetch<{ data: PermissionData }>(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(perm),
      })
      return data.data
    },
    async updatePermission(id: string, perm: { description?: string; category?: string }): Promise<PermissionData> {
      const data = await apiFetch<{ data: PermissionData }>(`${base}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(perm),
      })
      return data.data
    },
    async deletePermission(id: string): Promise<void> {
      await apiFetch(`${base}/${id}`, { method: 'DELETE' })
    },
  }
}

// ---- Matrix ----

export function createMatrixApi(basePath: string) {
  const base = `${basePath}/admin/permissions/matrix`
  const seedUrl = `${basePath}/admin/permissions/seed`

  return {
    async fetchMatrix(): Promise<MatrixData> {
      const data = await apiFetch<{ data: MatrixData }>(base)
      return data.data
    },
    async saveChanges(changes: { roleId: string; permissionId: string; granted: boolean }[]): Promise<{ applied: number; message: string }> {
      const data = await apiFetch<{ data: { applied: number; message: string } }>(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes }),
      })
      return data.data
    },
    async seedRbac(): Promise<unknown> {
      const data = await apiFetch<{ data: unknown }>(seedUrl, { method: 'POST' })
      return data.data
    },
  }
}

// ---- Categories ----

export function createCategoriesApi(basePath: string) {
  const base = `${basePath}/admin/categories`

  return {
    async fetchCategories(): Promise<CategoryData[]> {
      const data = await apiFetch<{ data: CategoryData[] }>(base)
      return data.data
    },
    async createCategory(cat: { name: string; label: string; description: string; icon: string; order: number }): Promise<CategoryData> {
      const data = await apiFetch<{ data: CategoryData }>(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cat),
      })
      return data.data
    },
    async updateCategory(id: string, cat: { label?: string; description?: string; icon?: string; order?: number }): Promise<CategoryData> {
      const data = await apiFetch<{ data: CategoryData }>(`${base}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cat),
      })
      return data.data
    },
    async deleteCategory(id: string): Promise<void> {
      await apiFetch(`${base}/${id}`, { method: 'DELETE' })
    },
  }
}
