import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { collectInvitees } from '../invitees.js';
import { collectParticipants } from '../meet.js';
function fixture(html) {
  const dom = new JSDOM(html, { runScripts:'outside-only' });
  const w = dom.window;
  w.HTMLElement.prototype.getClientRects = function() { return this.closest('[hidden]') ? [] : [{}]; };
  const timer = w.setTimeout.bind(w); w.setTimeout = callback => timer(callback,0);
  return { dom, document:w.document, run:fn=>w.eval(`(${fn.toString()})()`) };
}
const row = (id,name) => `<div role="listitem" data-participant-id="${id}"><span class="zWGUib">${name}</span></div>`;
test('reads only invitees, preserves namesakes and does not treat them as live participants', async()=>{
  const f=fixture(`<button aria-label="People (1)" aria-expanded="true"></button><section><h3>In call</h3><div role="list">${row('live','Room')}</div></section><section><h3>Invited (3)</h3><div role="list" aria-label="Invited">${row('a','Alex')}${row('b','Alex')}${row('c','Zoë')}${row('c','Zoë')}</div></section>`);
  const invited=await f.run(collectInvitees);assert.deepEqual(Array.from(invited.invitees,p=>p.name),['Alex','Alex','Zoë']);
  const live=await f.run(collectParticipants);assert.deepEqual([...live.names],['Room']);
  f.dom.window.close();
});
test('opens and restores the panel and collapsed invited group',async()=>{
  const f=fixture(`<button id="people" aria-label="People" aria-expanded="false"></button><section id="panel" hidden><button id="invited" aria-expanded="false" aria-controls="list">Invited (1)</button><div id="list" role="list" aria-label="Invited" hidden>${row('a','Sam')}</div></section>`);
  const people=f.document.getElementById('people'), invited=f.document.getElementById('invited');
  for(const [button,id] of [[people,'panel'],[invited,'list']]) button.onclick=()=>{
    const el=f.document.getElementById(id); el.hidden=!el.hidden;button.setAttribute('aria-expanded',String(!el.hidden));
  };
  const result=await f.run(collectInvitees);assert.equal(result.invitees[0].name,'Sam');
  assert.equal(people.getAttribute('aria-expanded'),'false');assert.equal(invited.getAttribute('aria-expanded'),'false');
  f.dom.window.close();
});
test('rows without account IDs remain usable and same-name invitees remain separate',async()=>{
  const f=fixture('<div role="list" aria-label="Invités"><div role="listitem"><span class="zWGUib">Alex</span></div><div role="listitem"><span class="zWGUib">Alex</span></div><div role="listitem"><button>Call</button></div></div>');
  const result=await f.run(collectInvitees);assert.equal(result.invitees.length,2);assert.equal(result.warning,'');f.dom.window.close();
});
test('missing invited section explains how to recover instead of reusing the live roster',async()=>{
  const f=fixture(`<div role="list" aria-label="Participants">${row('live','Alex')}</div>`);
  const result=await f.run(collectInvitees);assert.equal(result.invitees.length,0);assert.match(result.warning,/Could not locate/);f.dom.window.close();
});

test('scrolls virtualized invitees and restores the original scroll position', async()=>{
  const f=fixture('<div id="list" role="list" aria-label="Invited" style="overflow-y:auto"></div>');
  const list=f.document.getElementById('list');let top=100;
  const render=()=>{const start=Math.floor(top/20);list.innerHTML=Array.from({length:10},(_,i)=>row(start+i,`Person ${start+i}`)).join('');};
  Object.defineProperties(list,{scrollHeight:{value:800},clientHeight:{value:200},scrollTop:{get:()=>top,set:value=>{top=Math.min(600,Math.max(0,value));render();}}});
  render(); const result=await f.run(collectInvitees);
  assert.equal(result.invitees.length,40);assert.equal(top,100);f.dom.window.close();
});

test('Meet Contributors and Also invited accordion markup reads both sections separately', async()=>{
  // Reduced and anonymized from the supplied Meet DOM; no private meeting data.
  const f=fixture(`<h3>In the meeting</h3>
    <div><div role="button" aria-expanded="true" aria-controls="contributors"><div class="V6tdP">Contributors</div><div>2</div><i>keyboard_arrow_down</i></div>
      <span id="contributors" role="region" aria-label="In call"><div role="list" aria-label="Participants">${row('a','Alex')}${row('b','Sam')}</div></span></div>
    <div><div role="button" aria-expanded="true" aria-controls="guests"><div class="V6tdP">Also invited</div><div>2</div><i>keyboard_arrow_down</i></div>
      <span id="guests"><div role="list" aria-label="Guests"><div role="listitem" aria-label="Morgan" tooltips-id="guest1"><span class="zWGUib">Morgan</span><button>Chat with this guest</button></div><div role="listitem" aria-label="Zoë"><span class="zWGUib">Zoë</span></div></div></span></div>`);
  assert.deepEqual(Array.from((await f.run(collectParticipants)).names),['Alex','Sam']);
  assert.deepEqual(Array.from((await f.run(collectInvitees)).invitees,p=>p.name),['Morgan','Zoë']);
  f.dom.window.close();
});
