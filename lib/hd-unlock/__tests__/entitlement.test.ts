import test from 'node:test'
import assert from 'node:assert/strict'
import { isEntitledToHd, HdUnlockRecord, HdViewer } from '../entitlement'

const anon: HdViewer = { userId: null, tier: null, role: null, isOwner: false }
const completedUnlock: HdUnlockRecord = {
  status: 'completed',
  paypal_order_id: 'PP-123',
  user_id: 'buyer-uuid',
}

test('anonymous with no unlock is denied', () => {
  assert.equal(isEntitledToHd(null, anon, null), false)
})

test('admin is always entitled', () => {
  const admin: HdViewer = { userId: 'u1', tier: null, role: 'admin', isOwner: false }
  assert.equal(isEntitledToHd(null, admin, null), true)
})

test('owner with a paid tier is entitled (legacy parity)', () => {
  const owner: HdViewer = { userId: 'u1', tier: 'pro', role: 'user', isOwner: true }
  assert.equal(isEntitledToHd(null, owner, null), true)
})

test('owner on free tier is denied', () => {
  const owner: HdViewer = { userId: 'u1', tier: null, role: 'user', isOwner: true }
  assert.equal(isEntitledToHd(null, owner, null), false)
})

test('non-owner with a paid tier is denied', () => {
  const stranger: HdViewer = { userId: 'u2', tier: 'master', role: 'user', isOwner: false }
  assert.equal(isEntitledToHd(null, stranger, null), false)
})

test('guest with matching orderId on a completed unlock is entitled', () => {
  assert.equal(isEntitledToHd(completedUnlock, anon, 'PP-123'), true)
})

test('guest with wrong orderId is denied', () => {
  assert.equal(isEntitledToHd(completedUnlock, anon, 'PP-999'), false)
})

test('pending unlock grants nothing', () => {
  const pending: HdUnlockRecord = { ...completedUnlock, status: 'pending' }
  assert.equal(isEntitledToHd(pending, anon, 'PP-123'), false)
})

test('logged-in buyer of the unlock is entitled without orderId', () => {
  const buyer: HdViewer = { userId: 'buyer-uuid', tier: null, role: 'user', isOwner: false }
  assert.equal(isEntitledToHd(completedUnlock, buyer, null), true)
})

test('failed unlock grants nothing', () => {
  assert.equal(isEntitledToHd({ ...completedUnlock, status: 'failed' }, anon, 'PP-123'), false)
})

test('logged-in non-buyer with no matching orderId is denied even on a completed unlock', () => {
  const other: HdViewer = { userId: 'someone-else', tier: null, role: 'user', isOwner: false }
  assert.equal(isEntitledToHd(completedUnlock, other, null), false)
})
