import test from 'node:test';
import assert from 'node:assert/strict';
import { harness, deferred, settle, text } from './helpers/ui-harness.mjs';
function menu() {
  const requests = [], listeners = new Map();
  const client = { from: () => { const q = { select: () => q, eq: () => q, single: () => {
    const d = deferred();requests.push(d);return d.promise;
  } };return q; } };
  const h = harness({ '@/lib/auth/actions': { signOut() {} }, '@/lib/supabase/client': { createClient: () => client } }, {
    window: { addEventListener: (event, fn) => listeners.set(event, fn), removeEventListener: event => listeners.delete(event) },
  });
  const { UserMenu } = h.load('components/auth/user-menu.tsx');
  const render = (id='USER-A') => h.render(UserMenu, { user: { id, email: `${id}@example.test`, user_metadata: {} } });
  render();h.flush();
  return { h, requests, listeners, render };
}
test('a slower pre-purchase query cannot overwrite the refreshed balance', async () => {
  const m = menu();m.listeners.get('credits-updated')();
  m.requests[1].resolve({ data: { credits: 65 }, error: null });await settle();
  assert.match(text(m.render()), /65/);
  m.requests[0].resolve({ data: { credits: 15 }, error: null });await settle();
  assert.match(text(m.render()), /65/);
  assert.doesNotMatch(text(m.render()), /15/);
});
test('unmount removes listener and ignores an outstanding query', async () => {
  const m=menu();m.h.unmount();const writes=m.h.writes.length;
  m.requests[0].resolve({ data: { credits: 99 }, error: null });await settle();
  assert.equal(m.h.writes.length,writes);assert.equal(m.listeners.size,0);
});
test('changing user clears prior balance and prevents old-user response updates', async () => {
  const m=menu();m.render('USER-B');m.h.flush();
  m.requests[1].resolve({ data: { credits: 27 }, error: null });await settle();
  m.requests[0].resolve({ data: { credits: 99 }, error: null });await settle();
  assert.match(text(m.render('USER-B')), /27/);assert.doesNotMatch(text(m.render('USER-B')), /99/);
});
