import test from 'node:test';
import assert from 'node:assert/strict';
import { harness, deferred, settle } from './helpers/ui-harness.mjs';
const payment = { orderId: 'ORDER-A', tier: 'starter', credits: 15 };
function sdk({ loaded = true } = {}) {
  const instances=[], requests=[], successes=[], failures=[];let confettiCount=0;
  const window = {};
  if (loaded) window.paypal = { Buttons: options => {
    const render=deferred();
    const instance={options,render,closed:0};
    instances.push(instance);
    return {render:()=>render.promise,close:()=>{++instance.closed;return Promise.resolve();}};
  } };
  const script={};
  const body={appendChild:s=>{s.parentNode=body;},removeChild:s=>{s.parentNode=null;}};
  const h=harness({'canvas-confetti':()=>{++confettiCount;}},{
    window, document:{createElement:()=>script,body},
    process:{env:{NEXT_PUBLIC_PAYPAL_CLIENT_ID:'SYNTHETIC'}},
    fetch:(url,init)=>{const d=deferred();requests.push({url,init,...d});return d.promise;},
    console:{log(){},warn(){},error(){}},
  });
  const {PayPalButtonsAdvanced}=h.load('components/payment/paypal-buttons-advanced.tsx');
  const props={tier:'starter',price:'$4.99',credits:15,onSuccess:p=>successes.push(p),onError:e=>failures.push(e)};
  const container={innerHTML:''};
  const render=(next=props)=>{h.render(PayPalButtonsAdvanced,next,container);h.flush();};
  render();if(loaded)render();
  return {h,render,props,instances,requests,successes,failures,script,confetti:()=>confettiCount};
}
const response = (receipt=payment, success=true) => Response.json({success,payment:receipt});

test('duplicate approvals share one capture and one success; stable rerenders do not recreate buttons',async()=>{
  const s=sdk();s.render();assert.equal(s.instances.length,1);
  const options=s.instances[0].options;
  const first=options.onApprove({orderID:'ORDER-A'}),second=options.onApprove({orderID:'ORDER-A'});
  assert.equal(first,second);await settle();assert.equal(s.requests.length,1);
  s.requests[0].resolve(response());await first;
  await options.onApprove({orderID:'ORDER-A'});
  assert.deepEqual(s.successes,[payment]);assert.equal(s.confetti(),1);assert.equal(s.requests.length,1);
  s.h.unmount();assert.equal(s.instances[0].closed,1);
});

test('changing tier closes old buttons; late capture and render rejection cannot affect the new session',async()=>{
  const s=sdk();const old=s.instances[0];const pending=old.options.onApprove({orderID:'ORDER-A'});await settle();
  s.render({...s.props,tier:'pro',credits:50});assert.equal(old.closed,1);assert.equal(s.instances.length,2);
  const writes=s.h.writes.length;
  old.render.reject(new Error('old rendering failed'));s.requests[0].resolve(response());await pending;await settle();
  assert.equal(s.h.writes.length,writes);assert.equal(s.successes.length,0);assert.equal(s.confetti(),0);
  assert.equal(await old.options.onApprove({orderID:'LATE'}),undefined);assert.equal(s.requests.length,1);
  const current=s.instances[1].options.onApprove({orderID:'ORDER-B'});await settle();
  const actual={orderId:'ORDER-B',tier:'pro',credits:50};s.requests[1].resolve(response(actual));await current;
  assert.deepEqual(s.successes,[actual]);s.h.unmount();assert.equal(s.instances[1].closed,1);
});

test('unmount keeps capture running but ignores UI updates; reopening has a fresh instance',async()=>{
  const old=sdk();const pending=old.instances[0].options.onApprove({orderID:'ORDER-A'});await settle();
  old.h.unmount();const writes=old.h.writes.length;old.requests[0].resolve(response());await pending;
  assert.equal(old.instances[0].closed,1);assert.equal(old.h.writes.length,writes);
  assert.equal(old.successes.length,0);assert.equal(old.confetti(),0);
  const reopened=sdk();assert.equal(reopened.instances.length,1);assert.equal(reopened.successes.length,0);reopened.h.unmount();
});

test('an order creation completing after unmount cannot start a stale checkout',async()=>{
  const s=sdk();const creating=s.instances[0].options.createOrder();s.h.unmount();
  const writes=s.h.writes.length;s.requests[0].resolve(Response.json({orderId:'ORDER-A'}));
  await assert.rejects(creating,/session closed/);assert.equal(s.h.writes.length,writes);
});

test('a failed or mismatched capture never succeeds and the same order can retry',async()=>{
  const s=sdk();const options=s.instances[0].options;
  const failed=options.onApprove({orderID:'ORDER-A'});await settle();s.requests[0].resolve(response({...payment,orderId:'WRONG'}));await failed;
  assert.equal(s.successes.length,0);assert.equal(s.failures.length,1);assert.equal(s.confetti(),0);
  const retry=options.onApprove({orderID:'ORDER-A'});await settle();s.requests[1].resolve(response());await retry;
  assert.deepEqual(s.successes,[payment]);s.h.unmount();
});

test('SDK script handlers cannot update a component after unmount',()=>{
  const s=sdk({loaded:false});const onload=s.script.onload;const onerror=s.script.onerror;s.h.unmount();const writes=s.h.writes.length;
  onload();onerror(new Error('late script'));assert.equal(s.h.writes.length,writes);
  assert.equal(s.script.onload,null);assert.equal(s.script.onerror,null);assert.equal(s.script.parentNode,null);
});
