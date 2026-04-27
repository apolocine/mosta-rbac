# Multi-tenant — modèle β (Account.parent FK)

> **Auteur** : Dr Hamid MADANI <drmdh@msn.com>
> **Statut** : implémenté en `@mostajs/rbac@2.4.0`
> **Modules consommateurs** : `@mostajs/net` (row-level scoping middleware), `@mostajs/api-keys`, `@mostajs/subscriptions-plan`, `@mostajs/project-life`

---

## Contexte

Quand plusieurs **Octocloud** (ou tout autre portail/client trusted) se connectent à un même **Octonet**, on a besoin de cloisonner les données : les users de l'Octocloud A ne doivent pas voir les données de l'Octocloud B.

L'entité **Account** (définie ici dans `@mostajs/rbac`) est la **frontière de tenant** — elle est référencée par `account` FK dans :
- `@mostajs/api-keys`        → ApiKey.account
- `@mostajs/project-life`    → Project.account
- `@mostajs/subscriptions-plan` → Subscription.account, Invoice.account, UsageLog.account

La question : **comment relier les Accounts personnels des users à l'Account "tenant" du portail** pour scoper les requêtes ?

---

## 4 modèles considérés

| Modèle | Sens | Schema change |
|---|---|---|
| α tenant flat | `ApiKey.account = portal_account` ; ajouter `createdBy: userId` à ApiKey | ✅ ApiKey.createdBy |
| **β parent FK** ⭐ | `Account.parent` FK nullable. Personal account a `parent = portal_account`. Filter via `account.parent` | ✅ Account.parent |
| γ M2M direct | `ApiKey.account = portal` directement ; user est member via `account_members` | ⚠️ besoin `createdBy` aussi pour distinguer "mes apikeys" |
| δ M2M filter | `ApiKey.account = personal` ; middleware filtre via `account_members` 2-hop join | ❌ aucun |

---

## Pourquoi β (le choix retenu)

### 1. SQL trivial

```sql
-- Filter sur entités account-scoped (api_keys, projects, …) :
SELECT * FROM api_keys
WHERE account IN (
  SELECT id FROM accounts
  WHERE id = :portal_account_id OR parent = :portal_account_id
)
```

vs. δ qui demande un double join sur `accounts` ET `account_members`.

### 2. FK integrity

La DB garantit que `Account.parent` pointe vers un Account valide. Pas d'orphelins possibles. Avec δ, des rows `account_members` peuvent rester orphelines si on supprime mal.

### 3. Pattern SaaS standard

Stripe Connect, GCP folders/projects, Salesforce orgs/sub-orgs → tous utilisent une hiérarchie d'accounts via parent FK. δ est plus rare (Auth0 Organizations, Slack workspaces — où la M2M est intentionnelle pour multi-membership natif).

### 4. Future-proof

β supporte naturellement **tenant-of-tenant** :

```
Account 'mostajs-corp'   (type='portal',       parent=null)
  └── Account 'team-fr'  (type='organization', parent=mostajs-corp)
        └── Account 'alice-personal' (type='personal', parent=team-fr)
```

Une apikey rattachée à `mostajs-corp` peut voir tous les descendants. δ ne supporte pas ça nativement (M2M flat).

### 5. Migration simple

```sql
ALTER TABLE accounts ADD COLUMN parent TEXT REFERENCES accounts(id);
CREATE INDEX idx_accounts_parent ON accounts(parent);
```

C'est tout. Pas de re-modélisation des données existantes (le parent est nullable).

---

## Schema effectif (`@mostajs/rbac@2.4.0`)

```ts
export const AccountSchema: EntitySchema = {
  name: 'Account',
  collection: 'accounts',
  timestamps: true,
  fields: {
    name:             { type: 'string', required: true, trim: true },
    type:             { type: 'string',
                        enum: ['personal', 'organization', 'trial', 'system', 'portal'],
                        default: 'personal' },
    plan:             { type: 'string', default: 'free' },
    status:           { type: 'string', enum: ['active','suspended','deleted'], default: 'active' },
    stripeCustomerId: { type: 'string' },
    metadata:         { type: 'json' },
  },
  relations: {
    owner:   { type: 'many-to-one',  target: 'User',    required: true },
    parent:  { type: 'many-to-one',  target: 'Account', required: false },  // ← B3 modèle β
    members: { type: 'many-to-many', target: 'User',    through: 'account_members' },
  },
  indexes: [
    { fields: { type:   'asc' } },
    { fields: { status: 'asc' } },
    { fields: { parent: 'asc' } },  // ← critique pour les filter scoping
  ],
}
```

### Type 'portal'

Nouveau type ajouté à l'enum (depuis 2.4.0). Représente un **tenant racine** :
- 1 portal = 1 portail/client trusted (Octocloud-amia, Octocloud-eu, …)
- Possède une `portal apikey` rattachée (cf. `@mostajs/api-keys`)
- Cette apikey ouvre l'accès aux entités scoped sur le portal **et tous ses children**

---

## API ajoutée (`AccountRepository`)

```ts
class AccountRepository extends BaseRepository<AccountDTO> {
  // ─ existant ─
  findByOwner(userId): Promise<AccountDTO | null>
  findByType(type):    Promise<AccountDTO | null>

  // ─ ajouté en 2.4.0 ─
  findChildren(parentId):   Promise<AccountDTO[]>   // 1 niveau
  expandTenant(parentId):   Promise<string[]>       // [parent, ...directChildren]
}
```

`expandTenant` est le helper utilisé par le middleware row-level d'Octonet.

⚠️ **Limite actuelle** : 1 seul niveau de descendance. Si on veut une vraie récursivité (tenant-of-tenant-of-…), il faudra :
- Soit itérer dans `expandTenant` (O(profondeur))
- Soit ajouter une variante `expandTenantRecursive` qui utilise un CTE postgres `WITH RECURSIVE`

Pour l'instant (2.4.0) : 1 niveau couvre Octocloud → personal accounts. Suffisant pour PH#2 et probablement les 6 prochains mois.

---

## Comparaison ligne-par-ligne β vs δ (rejetée)

### Filter "mes api_keys" depuis un portal

**β (retenu)** :
```ts
const allowed = await accountRepo.expandTenant(portalAccountId)
// allowed = [portal_id, personal_user1_id, personal_user2_id, ...]
const keys = await apikeyRepo.findAll({ account: { $in: allowed } })
```

**δ (rejeté)** :
```ts
// 2-hop : portal → members (users) → leur personal accounts → api_keys
const memberUserIds = await query(
  'SELECT user_id FROM account_members WHERE account_id = $1',
  [portalAccountId]
)
const personalAccounts = await accountRepo.findAll({ owner: { $in: memberUserIds } })
const keys = await apikeyRepo.findAll({ account: { $in: personalAccounts.map(a => a.id) } })
```

→ β est plus court, plus performant, plus lisible.

### Move user from tenant A to tenant B

**β** :
```sql
UPDATE accounts SET parent = :new_portal_id WHERE id = :user_personal_account_id
```
1 row updated. Trivial.

**δ** :
```sql
DELETE FROM account_members WHERE account_id = :old_portal AND user_id = :user_id;
INSERT INTO account_members (account_id, user_id) VALUES (:new_portal, :user_id);
```
2 ops, transaction nécessaire pour atomicité.

→ β plus simple.

### User dans 2 tenants (cas marginal)

**β** : duplique le personal account (1 par tenant). Le user a 2 personal accounts, chacun avec un `parent` différent.

**δ** : 2 rows dans `account_members` (1 user, 2 accounts).

→ δ plus naturel pour multi-membership, mais ce cas est **marginal** dans notre usage (un user ≈ un portail principal). β le supporte au prix d'une duplication, jugé acceptable.

---

## Comportement d'enforcement (côté `@mostajs/net`)

Le row-level scoping middleware (`mosta-net/src/auth/account-scope-middleware.ts`) :

1. Lit `ctx.accountId` depuis l'apikey middleware (mosta-net auth chain)
2. Charge l'Account correspondant via `AccountRepository`
3. Si `account.type === 'portal'` → expand via `expandTenant(accountId)`, sinon `[accountId]` seul
4. Pour chaque entité account-scoped (ApiKey, Project, Subscription, Invoice, UsageLog) :
   - Lecture (find/findOne/count/aggregate) → injecte filter `account IN (allowed)`
   - findById → vérifie post-fetch que `row.account ∈ allowed`, sinon 403
   - create → vérifie que `data.account ∈ allowed`, sinon 403
   - updateMany/deleteMany → injecte filter `account IN (allowed)`
5. Pour l'entité Account elle-même : filter `WHERE id IN allowed OR parent IN allowed`
6. Pour User : pas de filter row-level direct (pas de colonne `account`). Le cloisonnement passe par `account_members` ou par les `Roles`.

---

## Ce qu'on N'a PAS fait (limites assumées)

- ❌ Récursion profonde dans `expandTenant` (1 niveau seulement)
- ❌ Filter row-level pour User (need M2M join via account_members — to-do post-PH)
- ❌ Update/delete by id pre-flight ownership check (TODO : à ajouter en B3.4 post-PH)
- ❌ Migration script automatique des `Account.parent` sur installations existantes (à scripter au cas par cas — ex: amia)

Ces limites n'impactent pas PH#2 mono-tenant. Elles sont à adresser quand un 2ᵉ Octocloud se déploie en parallèle (post-PH).

---

## Décision

**β retenu pour `@mostajs/rbac@2.4.0` et tous les modules consommateurs.**

Motivations consignées :
- SQL trivial, performance optimale
- FK integrity garanti par la DB
- Pattern SaaS standard (Stripe Connect, GCP)
- Extensible nativement (forêt de tenants)
- Migration trivialement réversible (drop column)

Modèle alternatif **δ** documenté pour mémoire — peut être réintroduit si on a besoin de **multi-membership natif** (un user dans plusieurs tenants simultanément), via les `account_members` qui restent dans le schéma à cet usage.

---

## Licence

AGPL-3.0-or-later. Commercial : drmdh@msn.com.
