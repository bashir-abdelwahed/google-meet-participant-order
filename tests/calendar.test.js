import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarEvents, matchingEvents, invitedPeople, CALENDAR_SCOPE } from '../calendar.js';
import { applyRooms, loadRooms, ROOM_TTL } from '../room-roster.js';
const url = 'https://meet.google.com/abc-defg-hij?authuser=1';
test('matching links excludes other meetings and cancelled events, keeps ambiguous occurrences for user choice', () => {
  const one = { id:'1', hangoutLink:url };
  const two = { id:'2', conferenceData:{ entryPoints:[{entryPointType:'video',uri:url}] } };
  assert.deepEqual(matchingEvents([one, two, {...one, status:'cancelled'}, {hangoutLink:'https://meet.google.com.evil.org/abc-defg-hij'}], url), [one,two]);
  assert.deepEqual(matchingEvents([one], 'invalid'), []);
});
test('invite suggestions exclude rooms and declined people without collapsing namesakes', () => {
  const people = [{displayName:'Alex',email:'a@example.com'}, {displayName:'Alex',email:'b@example.com'}, {email:'c@example.com'}, {resource:true}, {responseStatus:'declined'}];
  assert.deepEqual(invitedPeople({attendees:people}),people.slice(0,3));
});
test('calendar paginates, renews a rejected token and does not limit invitees', async () => {
  const calls = [], removed = [];
  let count = 0;
  const result = await calendarEvents({
    now:new Date('2026-10-07T10:00:00Z'),
    identity:{getAuthToken:async opts => { assert.deepEqual(opts.scopes,[CALENDAR_SCOPE]); return {token:++count === 1 ? 'old':'new'}; }, removeCachedAuthToken:async value=>removed.push(value)},
    fetcher:async (value,options)=> {
      const u = new URL(value); calls.push(u);
      assert.equal(u.searchParams.has('maxAttendees'),false);
      if(calls.length===1) return {status:401,ok:false};
      assert.equal(options.headers.Authorization,'Bearer new');
      return {ok:true,json:async()=> calls.length===2 ? {items:[{id:'1'}],nextPageToken:'page2'} : {items:[{id:'2'}]}};
    }
  });
  assert.deepEqual(result,[{id:'1'},{id:'2'}]);
  assert.deepEqual(removed,[{token:'old'}]);
  assert.equal(calls[2].searchParams.get('pageToken'),'page2');
  assert.equal(calls[0].searchParams.get('timeMin'),'2026-10-06T22:00:00.000Z');
});
test('denied Calendar permission fails with a useful manual fallback', async () => {
  await assert.rejects(calendarEvents({identity:{getAuthToken:async()=>({token:'t'})},fetcher:async()=>({ok:false,status:403})}),/Manual room names still work/);
});
test('shared accounts become individuals, namesakes survive, departed accounts are omitted', () => {
  const rules={replacements:{room:['Alex','Sam'],departed:['Gone']},extra:['Alex']};
  assert.deepEqual(applyRooms([{id:'room',name:'Room account'},{id:'remote',name:'Alex'}],rules),['Alex','Sam','Alex','Alex']);
});
test('room choices expire and are removed from session storage', async () => {
  let removed;
  const storage={get:async key=>({[key]:{updatedAt:1000}}),remove:async key=>{removed=key;}};
  assert.equal(await loadRooms('key',storage,1000+ROOM_TTL+1),null);
  assert.equal(removed,'key');
});
