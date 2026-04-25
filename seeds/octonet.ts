// @mostajs/rbac — Octonet RBAC seed (categories, permissions, roles)
//
// Catalogue de permissions du transport @mostajs/net (Octonet) — vit ici plutôt
// que dans `mosta-net` pour être réutilisable par tout consommateur (octocloud,
// admin tools tierces, autres serveurs basés sur la même surface).
//
// Usage :
//   import { OCTONET_RBAC_SEED, seedRBAC } from '@mostajs/rbac/server'
//   await seedRBAC(OCTONET_RBAC_SEED)
//
// Naming convention : <category>:<resource>:<action> — ex. project:list,
// schema:upload. Codes alignés sur la matrice (apikey × ressource × action)
// des routes Octonet.
//
// Author: Dr Hamid MADANI <drmdh@msn.com>

import type { SeedRBACOptions } from '../lib/rbac-seed'

// ──────────────────────────────────────────────────────────────────
//  Catégories
// ──────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: 'net',     label: 'Network',        description: 'Server infrastructure (health, metrics)', icon: 'activity', order: 10, system: true },
  { name: 'project', label: 'Projects',       description: 'Multi-tenant projects (CRUD)',            icon: 'folder',   order: 20, system: true },
  { name: 'schema',  label: 'Schemas',        description: 'Entity schema management',                icon: 'database', order: 30, system: true },
  { name: 'apikey',  label: 'API keys',       description: 'API key issuance and revocation',         icon: 'key',      order: 40, system: true },
  { name: 'user',    label: 'Users',          description: 'User and account management',             icon: 'users',    order: 50, system: true },
  { name: 'admin',   label: 'Administration', description: 'Privileged superuser actions',            icon: 'shield',   order: 60, system: true },
]

// ──────────────────────────────────────────────────────────────────
//  Permissions (fine-grained)
// ──────────────────────────────────────────────────────────────────

const PERMISSIONS = [
  // net — infrastructure
  { code: 'net:health:read',    name: 'Read health probe',  description: 'GET /health',  category: 'net' },
  { code: 'net:metrics:read',   name: 'Read metrics',       description: 'GET /metrics', category: 'net' },

  // project — multi-tenant projects
  { code: 'project:list',       name: 'List projects',      description: 'List projects owned + visibility:public',  category: 'project' },
  { code: 'project:read',       name: 'Read project',       description: 'Read project metadata',                    category: 'project' },
  { code: 'project:create',     name: 'Create project',     description: 'POST /api/projects',                       category: 'project' },
  { code: 'project:update',     name: 'Update project',     description: 'PATCH /api/projects/:slug',                category: 'project' },
  { code: 'project:delete',     name: 'Delete project',     description: 'DELETE /api/projects/:slug',               category: 'project' },
  { code: 'project:write',      name: 'CRUD entities',      description: 'POST/PUT/DELETE /api/v1/:project/:entity', category: 'project' },
  { code: 'project:read:any',   name: 'Read any project',   description: 'Bypass owner filter (admin)',              category: 'project' },
  { code: 'project:write:any',  name: 'Write any project',  description: 'Bypass owner filter (admin)',              category: 'project' },

  // schema — entity schema lifecycle
  { code: 'schema:read',        name: 'Read schemas',       description: 'GET /api/schemas-config',                  category: 'schema' },
  { code: 'schema:upload',      name: 'Upload schemas',     description: 'POST /api/upload-schemas-json',            category: 'schema' },
  { code: 'schema:apply',       name: 'Apply schema',       description: 'POST /api/apply-schema',                   category: 'schema' },
  { code: 'schema:compare',     name: 'Compare schemas',    description: 'POST /api/compare-schema',                 category: 'schema' },

  // apikey — issuance & revocation
  { code: 'apikey:list',        name: 'List own apikeys',   description: 'List api keys for current account',        category: 'apikey' },
  { code: 'apikey:create',      name: 'Issue apikey',       description: 'POST /api/api-keys',                       category: 'apikey' },
  { code: 'apikey:revoke',      name: 'Revoke own apikey',  description: 'DELETE /api/api-keys/:id',                 category: 'apikey' },
  { code: 'apikey:admin',       name: 'Manage all apikeys', description: 'Cross-account key management (admin)',     category: 'apikey' },

  // user — identity / account
  { code: 'user:read',          name: 'Read own profile',   description: 'GET /api/users/me',                        category: 'user' },
  { code: 'user:update',        name: 'Update own profile', description: 'PATCH /api/users/me',                      category: 'user' },
  { code: 'user:list',          name: 'List users',         description: 'GET /api/users (admin)',                   category: 'user' },
  { code: 'user:create',        name: 'Create user',        description: 'POST /api/users (admin)',                  category: 'user' },
  { code: 'user:update:any',    name: 'Update any user',    description: 'PATCH /api/users/:id (admin)',             category: 'user' },
  { code: 'user:delete',        name: 'Delete user',        description: 'DELETE /api/users/:id (admin)',            category: 'user' },

  // admin — superuser
  { code: 'admin:bypass',       name: 'Admin bypass',       description: 'Skip all owner/visibility filters',        category: 'admin' },
]

// ──────────────────────────────────────────────────────────────────
//  Rôles + matrice par défaut
// ──────────────────────────────────────────────────────────────────

const SUBSCRIBER_PERMS = [
  'net:health:read',
  'project:list', 'project:read', 'project:create', 'project:update', 'project:delete', 'project:write',
  'schema:read', 'schema:upload', 'schema:apply', 'schema:compare',
  'apikey:list', 'apikey:create', 'apikey:revoke',
  'user:read', 'user:update',
]

const TRIAL_PERMS = [
  'net:health:read',
  'project:list', 'project:read', 'project:write',
  'schema:read',
  'apikey:list',
  'user:read',
]

const PUBLIC_PERMS = [
  'net:health:read',
  'project:list', 'project:read',
  'schema:read',
]

const ADMIN_PERMS = [
  // Admin reçoit toutes les permissions du catalogue
  ...PERMISSIONS.map(p => p.code),
]

const ROLES = {
  admin:      { name: 'admin',      description: 'Full administrative access',                  system: true, permissions: ADMIN_PERMS },
  subscriber: { name: 'subscriber', description: 'Registered tenant (T2/T3) — own resources',   system: true, permissions: SUBSCRIBER_PERMS },
  trial:      { name: 'trial',      description: 'Sandbox tenant (T1) — limited, ephemeral',    system: true, permissions: TRIAL_PERMS },
  public:     { name: 'public',     description: 'Anonymous read-only on public projects',      system: true, permissions: PUBLIC_PERMS },
}

// ──────────────────────────────────────────────────────────────────
//  Export — directly consumable by seedRBAC()
// ──────────────────────────────────────────────────────────────────

export const OCTONET_RBAC_SEED: SeedRBACOptions = {
  categories:  CATEGORIES,
  permissions: PERMISSIONS,
  roles:       ROLES,
}

/** Permission codes referenced by Octonet code paths (typed lookups). */
export const OCTONET_PERMS = {
  net:     { healthRead: 'net:health:read', metricsRead: 'net:metrics:read' },
  project: {
    list: 'project:list', read: 'project:read', create: 'project:create',
    update: 'project:update', delete: 'project:delete', write: 'project:write',
    readAny: 'project:read:any', writeAny: 'project:write:any',
  },
  schema:  { read: 'schema:read', upload: 'schema:upload', apply: 'schema:apply', compare: 'schema:compare' },
  apikey:  { list: 'apikey:list', create: 'apikey:create', revoke: 'apikey:revoke', admin: 'apikey:admin' },
  user:    {
    readSelf: 'user:read', updateSelf: 'user:update',
    list: 'user:list', create: 'user:create', updateAny: 'user:update:any', delete: 'user:delete',
  },
  admin:   { bypass: 'admin:bypass' },
} as const
