// @mostajs/rbac — Unit tests (no DB required)
// Author: Dr Hamid MADANI drmdh@msn.com

import { hasPermission, matchesPermission } from '../helpers/permissions.js'
import { moduleInfo } from '../lib/module-info.js'

let passed = 0
let failed = 0

function assert(condition: boolean, label: string) {
  if (condition) { passed++; console.log('  ✅', label) }
  else { failed++; console.error('  ❌', label) }
}

function run() {
  // ── T1 — Wildcard hasPermission ──
  console.log('T1 — Wildcard hasPermission')
  assert(hasPermission(['*'], 'anything') === true, '* matches anything')
  assert(hasPermission(['cloud.admin.*'], 'cloud.admin.users') === true, 'cloud.admin.* matches cloud.admin.users')
  assert(hasPermission(['cloud.admin.*'], 'cloud.admin.metrics') === true, 'cloud.admin.* matches cloud.admin.metrics')
  assert(hasPermission(['cloud.admin.*'], 'cloud.project.create') === false, 'cloud.admin.* does NOT match cloud.project.create')
  assert(hasPermission(['cloud.project.*'], 'cloud.project.create') === true, 'cloud.project.* matches cloud.project.create')
  assert(hasPermission(['cloud.billing.read'], 'cloud.billing.read') === true, 'exact match works')
  assert(hasPermission(['cloud.billing.read'], 'cloud.billing.manage') === false, 'exact mismatch rejected')
  assert(hasPermission([], 'anything') === false, 'empty array → false')
  console.log('')

  // ── T2 — matchesPermission direct tests ──
  console.log('T2 — matchesPermission')
  assert(matchesPermission('cloud.admin.users', '*') === true, '* matches any required')
  assert(matchesPermission('cloud.admin.users', 'cloud.admin.*') === true, 'wildcard prefix match')
  assert(matchesPermission('cloud.admin.users', 'cloud.admin.users') === true, 'exact match')
  assert(matchesPermission('cloud.admin.users', 'cloud.project.*') === false, 'wrong prefix')
  assert(matchesPermission('cloud.admin.users', 'cloud.admin.metrics') === false, 'different exact')
  assert(matchesPermission('cloud.billing.read', 'cloud.billing.*') === true, 'billing wildcard')
  assert(matchesPermission('cloud.billing.read', 'cloud.*') === true, 'cloud.* matches cloud.billing.read')
  console.log('')

  // ── T3 — Module info ──
  console.log('T3 — Module info')
  assert(moduleInfo.version === '2.1.0', 'moduleInfo.version === 2.1.0')
  assert(moduleInfo.name === 'rbac', 'moduleInfo.name === rbac')
  console.log('')

  // ── Summary ──
  console.log('════════════════════════════════════════')
  console.log(`  Resultats: ${passed} passed, ${failed} failed`)
  console.log('════════════════════════════════════════')
  if (failed > 0) process.exit(1)
}

run()
