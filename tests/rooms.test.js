import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import * as order from '../order.js';
import * as room from '../room-roster.js';
import * as calendar from '../calendar.js';
const html = await readFile(new URL('../rooms.html',import.meta.url),'utf8');
const script = (await readFile(new URL('../rooms.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
const tick = () => new Promise(resolve=>setTimeout(resolve,0));
async function page({configured=true}={}) {
  const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://extension.example/rooms.html?tab=1'});
  const w=dom.window, saved={}; let permissionRequests=0;
  w.chrome={
    tabs:{get:async()=>({url:'https://meet.google.com/abc-defg-hij'})},
    storage:{session:{get:async()=>saved,set:async values=>Object.assign(saved,values)}},
    scripting:{executeScript:async()=>[{result:{participants:[{id:'room1',name:'Room account'}]}}]},
    runtime:{getManifest:()=>configured ? {oauth2:{client_id:'client'}}:{}},
    permissions:{request:async()=>{permissionRequests++;return true;}},
  };
  Object.assign(w,order,room,calendar,{
    loadRooms:key=>room.loadRooms(key,w.chrome.storage.session), collectParticipants:()=>{},
    calendarEvents:async()=>[{hangoutLink:'https://meet.google.com/abc-defg-hij',summary:'Standup',attendees:[{email:'alex@example.com',displayName:'Alex'},{email:'sam@example.com'}]}],
  });
  w.eval(script); await tick();
  return {dom,$:id=>w.document.getElementById(id),saved,permissionRequests:()=>permissionRequests};
}
test('room editor saves people against the selected account and reset restores it',async()=>{
  const f=await page();
  f.$('room-names').value='Alex\nSam';f.$('save-room').click();await tick();
  const value=Object.values(f.saved)[0];assert.deepEqual(Array.from(value.replacements.room1),['Alex','Sam']);
  assert.match(f.$('room-status').textContent,/Saved/);
  f.$('clear-room').click();await tick();assert.equal(Object.values(f.saved)[0].replacements.room1,undefined);
  f.dom.window.close();
});
test('Calendar requires confirmed selection and a speaking name, and does not save automatically',async()=>{
  const f=await page();f.$('connect').click();await tick();
  const rows=[...f.$('invitees').children];assert.equal(rows.length,2);
  assert.ok(rows.every(row=>!row.querySelector('[type=checkbox]').checked));
  f.$('use-invitees').click();assert.equal(f.$('room-names').value,'');
  rows[1].querySelector('[type=checkbox]').checked=true;f.$('use-invitees').click();
  assert.match(f.$('calendar-status').textContent,/Enter a speaking name/);
  rows[1].querySelector('[type=text]').value='Sam';f.$('use-invitees').click();
  assert.equal(f.$('room-names').value,'Sam');assert.equal(Object.keys(f.saved).length,0);
  assert.equal(rows[1].querySelector('[type=checkbox]').checked,false);
  f.dom.window.close();
});
test('unconfigured Calendar gives a setup explanation without opening consent',async()=>{
  const f=await page({configured:false});f.$('connect').click();await tick();
  assert.match(f.$('calendar-status').textContent,/OAuth client/);assert.equal(f.permissionRequests(),0);
  assert.equal(f.$('save-room').disabled,false);f.dom.window.close();
});
