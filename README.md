# @mostajs/rbac

> User, Role, Permission, PermissionCategory — schemas, repositories, seed, admin creation.
> Author: Dr Hamid MADANI drmdh@msn.com

## Install

```bash
npm install @mostajs/rbac @mostajs/orm
```

## How to Use

### 1. Schemas (client-safe)

```typescript
import { UserSchema, RoleSchema, PermissionSchema, PermissionCategorySchema } from '@mostajs/rbac'
```

### 2. Repositories (server-side)

```typescript
import { UserRepository, RoleRepository } from '@mostajs/rbac/server'

const dialect = await getDialect()
const userRepo = new UserRepository(dialect)
const user = await userRepo.findByEmail('admin@test.com')
await userRepo.findByIdWithRoles(user.id)
await userRepo.addRole(user.id, roleId)
```

### 3. Seed RBAC (from setup.json data)

```typescript
import { seedRBAC } from '@mostajs/rbac/server'

await seedRBAC({
  categories: [{ name: 'admin', label: 'Administration', icon: 'Settings', order: 0, system: true }],
  permissions: [{ code: 'admin:access', name: 'admin:access', description: 'Admin access', category: 'admin' }],
  roles: { admin: { name: 'admin', description: 'Administrator', permissions: ['*'] } },
})
```

### 4. Create Admin

```typescript
import { createAdmin } from '@mostajs/rbac/lib/create-admin'

await createAdmin({ email: 'admin@test.com', password: 'Admin123!', firstName: 'Admin', lastName: 'Test' })
// Handles: bcrypt hash + find admin role + create user + link role
```

### 5. Module Info (for @mostajs/setup)

```typescript
import { getSchemas, moduleInfo } from '@mostajs/rbac/lib/module-info'

const schemas = getSchemas()  // [UserSchema, RoleSchema, PermissionSchema, PermissionCategorySchema]
await moduleInfo.seed(setupJson.rbac)
await moduleInfo.createAdmin({ email, password, firstName, lastName })
```

### 6. Dual ORM/NET Mode

```typescript
import { getRbacRepos } from '@mostajs/rbac/lib/repos-factory'

const { users, roles, permissions, categories } = await getRbacRepos()
// In ORM mode: BaseRepository + dialect
// In NET mode: NetClient-backed repositories
// Controlled by MOSTA_DATA=orm|net
```

### 7. API Handlers (Next.js)

```typescript
import { createUsersHandler } from '@mostajs/rbac/api/users'
export const { GET, POST } = createUsersHandler({ checkPermission, adminPermission: 'admin:access' })
```
