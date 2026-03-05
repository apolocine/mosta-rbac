# @mostajs/rbac

> Reusable RBAC management UI — Users, Roles, Permissions, Categories, Matrix.

[![npm version](https://img.shields.io/npm/v/@mostajs/rbac.svg)](https://www.npmjs.com/package/@mostajs/rbac)
[![license](https://img.shields.io/npm/l/@mostajs/rbac.svg)](LICENSE)

Part of the [@mosta suite](https://mostajs.dev). Fournit des composants React complets et des factories API pour gerer les utilisateurs, roles, permissions et matrice RBAC.

---

## Table des matieres

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Integration complete dans une nouvelle app](#integration-complete)
4. [Composants React](#composants-react)
5. [API Route Factories (serveur)](#api-route-factories)
6. [Definitions RBAC (seed)](#definitions-rbac)
7. [Internationalisation (i18n)](#internationalisation)
8. [API Reference](#api-reference)
9. [Architecture](#architecture)

---

## Installation

```bash
npm install @mostajs/rbac @mostajs/auth @mostajs/orm
```

Peer dependencies a installer :

```bash
npm install @tanstack/react-query lucide-react sonner
```

> `@mostajs/audit` est optionnel — si installe, les actions CRUD seront journalisees automatiquement.

---

## Quick Start

### 1. Page d'administration RBAC (frontend)

```tsx
// src/app/dashboard/roles/page.tsx
'use client'
import { RBACManager } from '@mostajs/rbac'

export default function RolesPage() {
  return <RBACManager apiBasePath="/api" />
}
```

C'est tout. Le composant `RBACManager` affiche 4 onglets : Matrice, Roles, Permissions, Categories.

### 2. Routes API (backend)

```typescript
// src/app/api/admin/roles/route.ts
import { createRolesHandler } from '@mostajs/rbac/server'
import { checkPermission } from '@/lib/auth'

export const { GET, POST } = createRolesHandler({
  checkPermission,
  adminPermission: 'roles:manage',
})
```

---

## Integration complete

Guide pas-a-pas pour integrer `@mostajs/rbac` dans une nouvelle application Next.js.

### Etape 1 — Installer les packages

```bash
npm install @mostajs/rbac @mostajs/auth @mostajs/orm
npm install @tanstack/react-query lucide-react sonner
```

### Etape 2 — Definir vos permissions et roles

Creez un fichier de definitions RBAC propre a votre app :

```typescript
// src/lib/rbac-definitions.ts
import type { PermissionDefinition, RoleDefinition, CategoryDefinition } from '@mostajs/rbac'

// Categories de permissions
export const CATEGORIES: CategoryDefinition[] = [
  { name: 'users',    label: 'Utilisateurs',  description: 'Gestion des utilisateurs',  icon: 'Users',   order: 1, system: true },
  { name: 'products', label: 'Produits',       description: 'Gestion des produits',      icon: 'Package', order: 2, system: false },
  { name: 'orders',   label: 'Commandes',      description: 'Gestion des commandes',     icon: 'Receipt', order: 3, system: false },
  { name: 'reports',  label: 'Rapports',       description: 'Consultation des rapports', icon: 'BarChart', order: 4, system: false },
]

// Permissions
export const PERMISSIONS_DEFS: PermissionDefinition[] = [
  { code: 'users:view',    name: 'users:view',    description: 'Voir les utilisateurs',     category: 'users' },
  { code: 'users:create',  name: 'users:create',  description: 'Creer un utilisateur',      category: 'users' },
  { code: 'users:edit',    name: 'users:edit',    description: 'Modifier un utilisateur',   category: 'users' },
  { code: 'users:delete',  name: 'users:delete',  description: 'Supprimer un utilisateur',  category: 'users' },
  { code: 'products:view', name: 'products:view', description: 'Voir les produits',         category: 'products' },
  { code: 'products:edit', name: 'products:edit', description: 'Modifier les produits',     category: 'products' },
  { code: 'orders:view',   name: 'orders:view',   description: 'Voir les commandes',        category: 'orders' },
  { code: 'orders:manage', name: 'orders:manage', description: 'Gerer les commandes',       category: 'orders' },
  { code: 'reports:view',  name: 'reports:view',  description: 'Consulter les rapports',    category: 'reports' },
]

// Roles par defaut
export const DEFAULT_ROLES: Record<string, RoleDefinition> = {
  admin: {
    name: 'admin',
    description: 'Administrateur — acces complet',
    system: true,
    permissions: PERMISSIONS_DEFS.map(p => p.code),
  },
  manager: {
    name: 'manager',
    description: 'Manager — gestion produits et commandes',
    system: false,
    permissions: ['users:view', 'products:view', 'products:edit', 'orders:view', 'orders:manage', 'reports:view'],
  },
  viewer: {
    name: 'viewer',
    description: 'Consultation seule',
    system: false,
    permissions: ['products:view', 'orders:view', 'reports:view'],
  },
}

// Constantes de permissions pour les guards
export const PERMISSIONS = Object.fromEntries(
  PERMISSIONS_DEFS.map(p => [p.code.replace(':', '_').toUpperCase(), p.code])
) as Record<string, string>
```

### Etape 3 — Creer les routes API

Chaque entite RBAC a besoin de deux routes : collection et item par ID.

```typescript
// src/app/api/admin/roles/route.ts
import { createRolesHandler } from '@mostajs/rbac/server'
import { checkPermission } from '@/lib/auth'
import { logAudit, getAuditUser } from '@mostajs/audit/lib/audit'  // optionnel

export const { GET, POST } = createRolesHandler({
  checkPermission,
  adminPermission: 'roles:manage',
  logAudit,        // optionnel
  getAuditUser,    // optionnel
})
```

```typescript
// src/app/api/admin/roles/[id]/route.ts
import { createRolesIdHandler } from '@mostajs/rbac/server'
import { checkPermission } from '@/lib/auth'

export const { GET, PUT, DELETE } = createRolesIdHandler({
  checkPermission,
  adminPermission: 'roles:manage',
})
```

```typescript
// src/app/api/admin/permissions/route.ts
import { createPermissionsHandler } from '@mostajs/rbac/server'
import { checkPermission } from '@/lib/auth'
import { PERMISSIONS_DEFS } from '@/lib/rbac-definitions'

export const { GET, POST } = createPermissionsHandler({
  checkPermission,
  adminPermission: 'permissions:manage',
  permissionDefinitions: PERMISSIONS_DEFS,
})
```

```typescript
// src/app/api/admin/permissions/[id]/route.ts
import { createPermissionsIdHandler } from '@mostajs/rbac/server'
import { checkPermission } from '@/lib/auth'

export const { PUT, DELETE } = createPermissionsIdHandler({
  checkPermission,
  adminPermission: 'permissions:manage',
})
```

```typescript
// src/app/api/admin/permissions/matrix/route.ts
import { createMatrixHandler } from '@mostajs/rbac/server'
import { checkPermission } from '@/lib/auth'

export const { GET, POST } = createMatrixHandler({
  checkPermission,
  adminPermission: 'permissions:manage',
})
```

```typescript
// src/app/api/admin/categories/route.ts
import { createCategoriesHandler } from '@mostajs/rbac/server'
import { checkPermission } from '@/lib/auth'
import { CATEGORIES } from '@/lib/rbac-definitions'

export const { GET, POST } = createCategoriesHandler({
  checkPermission,
  adminPermission: 'categories:manage',
  categoryDefinitions: CATEGORIES,
})
```

```typescript
// src/app/api/admin/categories/[id]/route.ts
import { createCategoriesIdHandler } from '@mostajs/rbac/server'
import { checkPermission } from '@/lib/auth'

export const { PUT, DELETE } = createCategoriesIdHandler({
  checkPermission,
  adminPermission: 'categories:manage',
})
```

```typescript
// src/app/api/admin/permissions/seed/route.ts
import { createSeedHandler } from '@mostajs/rbac/server'
import { checkPermission } from '@/lib/auth'
import { PERMISSIONS_DEFS, DEFAULT_ROLES, CATEGORIES } from '@/lib/rbac-definitions'

export const { POST } = createSeedHandler({
  checkPermission,
  adminPermission: 'admin',
  permissionDefinitions: PERMISSIONS_DEFS,
  defaultRoles: DEFAULT_ROLES,
  categoryDefinitions: CATEGORIES,
})
```

```typescript
// src/app/api/users/route.ts
import { createUsersHandler } from '@mostajs/rbac/server'
import { checkPermission } from '@/lib/auth'

export const { GET, POST } = createUsersHandler({
  checkPermission,
  adminPermission: 'users:manage',
  knownRoles: ['admin', 'manager', 'viewer'],
})
```

```typescript
// src/app/api/users/[id]/route.ts
import { createUsersIdHandler } from '@mostajs/rbac/server'
import { checkPermission } from '@/lib/auth'

export const { GET, PUT, DELETE } = createUsersIdHandler({
  checkPermission,
  adminPermission: 'users:manage',
})
```

### Etape 4 — Provider TanStack Query

Les composants RBAC utilisent `@tanstack/react-query`. Ajoutez le provider :

```tsx
// src/app/providers.tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

```tsx
// src/app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### Etape 5 — Pages d'administration

```tsx
// src/app/dashboard/roles/page.tsx
'use client'
import { RBACManager } from '@mostajs/rbac'

export default function RolesPage() {
  return (
    <RBACManager
      apiBasePath="/api"
      systemRoles={['admin']}
      roleColors={{ admin: 'bg-red-100 text-red-800', manager: 'bg-blue-100 text-blue-800' }}
    />
  )
}
```

```tsx
// src/app/dashboard/users/page.tsx
'use client'
import { UsersManager } from '@mostajs/rbac'

export default function UsersPage() {
  return (
    <UsersManager
      apiBasePath="/api"
      roleColors={{ admin: 'bg-red-100 text-red-800', manager: 'bg-blue-100 text-blue-800' }}
      statusColors={{ active: 'bg-green-100 text-green-800', inactive: 'bg-gray-100 text-gray-800' }}
    />
  )
}
```

### Etape 6 — Initialiser les donnees (seed)

Au premier lancement, initialisez les permissions, roles et categories :

```bash
# Via l'UI : cliquer "Initialiser" dans l'onglet Matrice

# Ou via curl :
curl -X POST http://localhost:3000/api/admin/permissions/seed \
  -H 'Cookie: next-auth.session-token=...'
```

Reponse :

```json
{
  "data": {
    "categories": 4,
    "permissions": 9,
    "roles": 3,
    "message": "4 categories, 9 permissions et 3 roles initialises"
  }
}
```

### Etape 7 — Verification

```bash
npm run dev

# Ouvrir http://localhost:3000/dashboard/roles
# → 4 onglets : Matrice, Roles, Permissions, Categories
# → Cliquer "Initialiser" pour seed

# Ouvrir http://localhost:3000/dashboard/users
# → Liste des utilisateurs avec CRUD
```

---

## Composants React

Tous les composants sont `'use client'` et s'importent depuis `@mostajs/rbac`.

### RBACManager

Orchestrateur principal avec 4 onglets (Matrice, Roles, Permissions, Categories).

```tsx
import { RBACManager } from '@mostajs/rbac'

<RBACManager
  apiBasePath="/api"           // Prefixe des routes API (defaut: '/api')
  t={traductionFunction}       // Fonction i18n (optionnel)
  systemRoles={['admin']}      // Roles proteges (lecture seule)
  roleColors={{                // Couleurs badges roles (optionnel)
    admin: 'bg-red-100 text-red-800',
    manager: 'bg-blue-100 text-blue-800',
  }}
/>
```

### UsersManager

Gestion des utilisateurs : liste, creation, edition, suppression.

```tsx
import { UsersManager } from '@mostajs/rbac'

<UsersManager
  apiBasePath="/api"
  roleColors={{ admin: 'bg-red-100 text-red-800' }}
  statusColors={{ active: 'bg-green-100 text-green-800' }}
/>
```

### RolesManager

CRUD roles avec protection des roles systeme.

```tsx
import { RolesManager } from '@mostajs/rbac'

<RolesManager apiBasePath="/api" systemRoles={['admin']} />
```

### PermissionsManager

CRUD permissions groupees par categorie.

```tsx
import { PermissionsManager } from '@mostajs/rbac'

<PermissionsManager apiBasePath="/api" />
```

### CategoriesManager

CRUD categories avec ordonnancement et protection systeme.

```tsx
import { CategoriesManager } from '@mostajs/rbac'

<CategoriesManager apiBasePath="/api" />
```

### PermissionMatrix

Matrice roles/permissions avec checkboxes, groupement par categorie, et boutons Sauvegarder/Initialiser.

```tsx
import { PermissionMatrix } from '@mostajs/rbac'

<PermissionMatrix apiBasePath="/api" />
```

---

## API Route Factories

Toutes les factories s'importent depuis `@mostajs/rbac/server`. Chaque factory retourne des handlers HTTP (GET, POST, PUT, DELETE).

### Pattern commun

Toutes les factories prennent un `checkPermission` injectable :

```typescript
interface Config {
  checkPermission: (perm: string) => Promise<{
    error: NextResponse | null  // null = autorise
    session: any                // session utilisateur
  }>
  adminPermission: string       // permission requise (ex: 'roles:manage')
  logAudit?: (entry) => void    // optionnel, journalisation
  getAuditUser?: (session) => {} // optionnel, extraction user
}
```

### Factories disponibles

| Factory | Import | Routes | Methodes |
|---------|--------|--------|----------|
| `createUsersHandler` | `@mostajs/rbac/server` | `/api/users` | GET, POST |
| `createUsersIdHandler` | `@mostajs/rbac/server` | `/api/users/[id]` | GET, PUT, DELETE |
| `createRolesHandler` | `@mostajs/rbac/server` | `/api/admin/roles` | GET, POST |
| `createRolesIdHandler` | `@mostajs/rbac/server` | `/api/admin/roles/[id]` | GET, PUT, DELETE |
| `createPermissionsHandler` | `@mostajs/rbac/server` | `/api/admin/permissions` | GET, POST |
| `createPermissionsIdHandler` | `@mostajs/rbac/server` | `/api/admin/permissions/[id]` | PUT, DELETE |
| `createMatrixHandler` | `@mostajs/rbac/server` | `/api/admin/permissions/matrix` | GET, POST |
| `createCategoriesHandler` | `@mostajs/rbac/server` | `/api/admin/categories` | GET, POST |
| `createCategoriesIdHandler` | `@mostajs/rbac/server` | `/api/admin/categories/[id]` | PUT, DELETE |
| `createSeedHandler` | `@mostajs/rbac/server` | `/api/admin/permissions/seed` | POST |

### Client-side API helpers

Pour appeler les routes depuis le frontend (utilises en interne par les composants) :

```typescript
import { createUsersApi, createRolesApi, createPermissionsApi, createMatrixApi, createCategoriesApi } from '@mostajs/rbac'

const usersApi = createUsersApi('/api')
const users = await usersApi.fetchUsers()
await usersApi.createUser({ email: 'a@b.com', password: '123456', firstName: 'A', lastName: 'B', role: 'viewer' })

const rolesApi = createRolesApi('/api')
const roles = await rolesApi.fetchRoles()

const matrixApi = createMatrixApi('/api')
const matrix = await matrixApi.fetchMatrix()
await matrixApi.seedRbac()
```

---

## Definitions RBAC

Le systeme de seed permet d'initialiser les categories, permissions et roles depuis des definitions TypeScript.

### PermissionDefinition

```typescript
interface PermissionDefinition {
  code: string       // Identifiant unique (ex: 'users:view')
  name: string       // Nom en DB (generalement = code)
  description: string
  category: string   // Nom de la categorie parente
}
```

### RoleDefinition

```typescript
interface RoleDefinition {
  name: string
  description: string
  system: boolean         // true = protege (ne peut pas etre supprime)
  permissions: string[]   // Liste des codes permission
}
```

### CategoryDefinition

```typescript
interface CategoryDefinition {
  name: string        // Identifiant unique
  label: string       // Label affiche
  description: string
  icon: string        // Nom d'icone Lucide
  order: number       // Ordre d'affichage
  system: boolean     // true = ne peut pas etre supprime
}
```

---

## Internationalisation

Tous les composants acceptent une fonction `t(key)` pour l'i18n :

```tsx
const t = (key: string) => translations[key] || key

<RBACManager apiBasePath="/api" t={t} />
```

Cles utilisees :

| Cle | Defaut |
|-----|--------|
| `roles.title` | Titre de la page |
| `roles.tabs.matrix` | Onglet Matrice |
| `roles.tabs.roles` | Onglet Roles |
| `roles.tabs.permissions` | Onglet Permissions |
| `roles.tabs.categories` | Onglet Categories |

---

## API Reference

### Exports client (`@mostajs/rbac`)

| Export | Type | Description |
|--------|------|-------------|
| `RBACManager` | Component | Orchestrateur 4 onglets |
| `UsersManager` | Component | CRUD utilisateurs |
| `RolesManager` | Component | CRUD roles |
| `PermissionsManager` | Component | CRUD permissions |
| `CategoriesManager` | Component | CRUD categories |
| `PermissionMatrix` | Component | Matrice roles/permissions |
| `createUsersApi(basePath)` | Function | Helpers fetch users |
| `createRolesApi(basePath)` | Function | Helpers fetch roles |
| `createPermissionsApi(basePath)` | Function | Helpers fetch permissions |
| `createMatrixApi(basePath)` | Function | Helpers fetch matrix + seed |
| `createCategoriesApi(basePath)` | Function | Helpers fetch categories |

### Exports serveur (`@mostajs/rbac/server`)

| Export | Type | Description |
|--------|------|-------------|
| `createUsersHandler(config)` | Factory | GET/POST users |
| `createUsersIdHandler(config)` | Factory | GET/PUT/DELETE user by ID |
| `createRolesHandler(config)` | Factory | GET/POST roles |
| `createRolesIdHandler(config)` | Factory | GET/PUT/DELETE role by ID |
| `createPermissionsHandler(config)` | Factory | GET/POST permissions |
| `createPermissionsIdHandler(config)` | Factory | PUT/DELETE permission by ID |
| `createMatrixHandler(config)` | Factory | GET/POST matrice |
| `createCategoriesHandler(config)` | Factory | GET/POST categories |
| `createCategoriesIdHandler(config)` | Factory | PUT/DELETE category by ID |
| `createSeedHandler(config)` | Factory | POST seed RBAC |

### Types

| Type | Description |
|------|-------------|
| `User` | Utilisateur (id, email, firstName, lastName, role, status) |
| `RoleData` | Role (id, name, description, permissions[], userCount) |
| `PermissionData` | Permission (id, name, description, category, roleCount) |
| `CategoryData` | Categorie (id, name, label, icon, order, system) |
| `MatrixData` | Matrice (roles, categories, categoryLabels, matrix) |
| `RBACConfig` | Config composants (apiBasePath, t, systemRoles, colors) |
| `PermissionDefinition` | Definition permission pour seed |
| `RoleDefinition` | Definition role pour seed |
| `CategoryDefinition` | Definition categorie pour seed |

---

## Architecture

```
@mostajs/rbac
├── components/                  # React 'use client'
│   ├── RBACManager.tsx          # Orchestrateur 4 onglets
│   ├── UsersManager.tsx         # CRUD utilisateurs
│   ├── RolesManager.tsx         # CRUD roles
│   ├── PermissionsManager.tsx   # CRUD permissions
│   ├── CategoriesManager.tsx    # CRUD categories
│   ├── PermissionMatrix.tsx     # Matrice interactive
│   └── ui/                      # Shadcn/ui embarques
├── api/                         # Factories serveur
│   ├── users.ts                 # createUsersHandler
│   ├── users-id.ts              # createUsersIdHandler
│   ├── roles.ts                 # createRolesHandler
│   ├── roles-id.ts              # createRolesIdHandler
│   ├── permissions.ts           # createPermissionsHandler
│   ├── permissions-id.ts        # createPermissionsIdHandler
│   ├── matrix.ts                # createMatrixHandler
│   ├── categories.ts            # createCategoriesHandler
│   ├── categories-id.ts         # createCategoriesIdHandler
│   └── seed.ts                  # createSeedHandler
├── lib/
│   ├── rbac-api.ts              # Helpers fetch client
│   └── utils.ts                 # cn() (Tailwind merge)
├── types/
│   └── index.ts                 # Toutes les interfaces
├── index.ts                     # Exports client
└── server.ts                    # Exports serveur
```

### Dependances

```
@mostajs/rbac
├── @mostajs/auth   (required)  # UserRepository, RoleRepository, hashPassword
├── @mostajs/orm    (required)  # getDialect(), abstraction DB
├── @mostajs/audit  (optional)  # logAudit() pour journalisation
├── zod                         # Validation schemas
├── @tanstack/react-query       # Cache & mutations
├── lucide-react                # Icones
├── sonner                      # Toasts
└── radix-ui                    # Primitives UI (Dialog, Tabs, etc.)
```

### Pattern d'injection

```
┌─────────────────────┐     inject config           ┌──────────────────────┐
│   @mostajs/rbac     │ ◄───────────────────────── │   Votre app          │
│                     │                             │                      │
│ createRolesHandler({│                             │ checkPermission,     │
│   checkPermission,  │                             │ 'roles:manage',      │
│   adminPermission,  │                             │ logAudit,            │
│   logAudit?,        │                             │ getAuditUser         │
│ })                  │                             │                      │
└─────────────────────┘                             └──────────────────────┘

┌─────────────────────┐     props                   ┌──────────────────────┐
│ <RBACManager        │ ◄───────────────────────── │   Votre page         │
│   apiBasePath="/api"│                             │                      │
│   t={i18nFunction}  │                             │ dashboard/roles/     │
│   systemRoles={[..]}│                             │ page.tsx             │
│ />                  │                             │                      │
└─────────────────────┘                             └──────────────────────┘
```

---

## License

MIT — Dr Hamid MADANI <drmdh@msn.com>
