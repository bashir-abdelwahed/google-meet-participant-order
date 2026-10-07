import { collectParticipants } from './meet.js';
import { isMeetUrl, parseNames } from './order.js';
import { roomKey, loadRooms } from './room-roster.js';
import { calendarEvents, matchingEvents, invitedPeople, CALENDAR_ORIGIN } from './calendar.js';
const $ = id => document.getElementById(id);
let rules = { replacements: {}, extra: [] };
let key, meetUrl, events = [];
const say = text => { $('room-status').textContent = text; };
function showRoom() {
  const id = $('account').value;
  $('room-names').value = (id ? rules.replacements[id] : rules.extra)?.join('\n') || '';
}
async function persist() {
  await chrome.storage.session.set({ [key]: { ...rules, updatedAt: Date.now() } });
}
$('account').addEventListener('change', showRoom);
$('save-room').addEventListener('click', async () => {
  const names = parseNames($('room-names').value);
  if (!names.length) { say('Enter at least one person. Use Reset to restore the account entry.'); return; }
  try {
    if ($('account').value) rules.replacements[$('account').value] = names;
    else rules.extra = names;
    await persist();
    say('Saved. Return to Meet and reopen the extension to generate everyone’s order.');
  } catch { say('Could not save. Keep this list and try again.'); }
});
$('clear-room').addEventListener('click', async () => {
  try {
    if ($('account').value) delete rules.replacements[$('account').value];
    else rules.extra = [];
    await persist(); showRoom(); say('Reset. This account will use its name from Meet.');
  } catch { say('Could not reset. Try again.'); }
});
function showInvitees() {
  $('invitees').replaceChildren();
  if ($('event').value === "") {
    $('use-invitees').disabled = true;
    $('calendar-status').textContent = "Several events use this Meet link. Choose the meeting you are attending.";
    return;
  }
  const event = events[Number($('event').value)];
  if (!event) return;
  for (const person of invitedPeople(event)) {
    const label = document.createElement('label'); label.className = 'invitee';
    const check = document.createElement('input'); check.type = 'checkbox';
    const name = document.createElement('input'); name.type = 'text'; name.value = person.displayName || '';
    name.placeholder = 'Enter this person’s name'; name.setAttribute('aria-label', `Speaking name for ${person.email || 'invitee'}`);
    const email = document.createElement('span'); email.textContent = person.email || 'Calendar invitee';
    label.append(check, email, name); $('invitees').append(label);
  }
  $('use-invitees').disabled = !$('invitees').children.length;
  $('calendar-status').textContent = event.attendeesOmitted
    ? 'Google returned an incomplete invitation list. Add missing people manually.'
    : 'Check who is present and correct their names. No invitees are selected automatically.';
}
$('event').addEventListener('change', showInvitees);
$('use-invitees').addEventListener('click', () => {
  const selected = [...$('invitees').children].filter(row => row.querySelector('[type=checkbox]').checked);
  if (selected.some(row => !row.querySelector('[type=text]').value.trim())) {
    $('calendar-status').textContent = 'Enter a speaking name for each selected person.'; return;
  }
  const names = selected.map(row => row.querySelector('[type=text]').value.trim());
  if (!names.length) { $('calendar-status').textContent = 'Select the people actually in the room first.'; return; }
  $('room-names').value = [...parseNames($('room-names').value), ...names].join('\n');
  // Consuming suggestions prevents accidental double-adds; namesakes remain distinct.
  selected.forEach(row => { row.querySelector('[type=checkbox]').checked = false; });
  $('calendar-status').textContent = 'Added to the editable room list. Review it, then Save these people.';
});
$('connect').addEventListener('click', async () => {
  if (!chrome.runtime.getManifest().oauth2?.client_id) {
    $('calendar-status').textContent = 'Calendar needs a Google OAuth client configured by the extension developer. See README.md → Calendar setup. You can enter room names above now.'; return;
  }
  if (!meetUrl) return;
  $('connect').disabled = true;
  try {
    const allowed = await chrome.permissions.request({ origins: [CALENDAR_ORIGIN] });
    if (!allowed) throw new Error('Calendar permission was declined. You can still enter names manually.');
    $('calendar-status').textContent = 'Signing in and finding this meeting…';
    events = matchingEvents(await calendarEvents(), meetUrl);
    $('event').replaceChildren(); $('event').hidden = !events.length;
    if (events.length > 1) {
      const placeholder = document.createElement("option"); placeholder.value = ""; placeholder.textContent = "Choose your meeting…"; $("event").append(placeholder);
    }
    events.forEach((event, index) => {
      const option = document.createElement('option'); option.value = index;
      option.textContent = `${event.summary || 'Untitled meeting'} — ${event.start?.dateTime ? new Date(event.start.dateTime).toLocaleString() : event.start?.date || ''}`;
      $('event').append(option);
    });
    $('invitees').replaceChildren(); $('use-invitees').disabled = true;
    if (events.length) showInvitees();
    else $('calendar-status').textContent = 'No matching event on your primary calendar within 12 hours of now. Check the Google account signed into Chrome, or enter room names manually.';
  } catch (error) { $('calendar-status').textContent = error.message || 'Calendar connection failed. Enter room names manually.'; }
  finally { $('connect').disabled = false; }
});
$('disconnect').addEventListener('click', async () => {
  $('disconnect').disabled = true;
  try {
    await chrome.identity.clearAllCachedAuthTokens();
    await chrome.permissions.remove({ origins: [CALENDAR_ORIGIN] });
    events = []; $('invitees').replaceChildren(); $('event').hidden = true; $('use-invitees').disabled = true;
    $('calendar-status').textContent = 'Disconnected locally. To revoke Google’s authorization, use Manage Google account access below. Saved room names remain until Reset or session expiry.';
  } catch { $('calendar-status').textContent = 'Could not disconnect. Use Manage Google account access below.'; }
  finally { $('disconnect').disabled = false; }
});
async function init() {
  try {
    const tabId = Number(new URL(location.href).searchParams.get('tab'));
    if (!Number.isInteger(tabId) || tabId <= 0) throw new Error('Open this page from the extension while in a Meet call.');
    const tab = await chrome.tabs.get(tabId);
    if (!isMeetUrl(tab.url)) throw new Error('Return to your Meet call and open People sharing a room from the extension.');
    meetUrl = tab.url; key = roomKey(tabId, meetUrl);
    rules = await loadRooms(key) || rules;
    const [response] = await chrome.scripting.executeScript({ target: { tabId }, func: collectParticipants });
    for (const person of response?.result?.participants || []) {
      const option = document.createElement('option'); option.value = person.id; option.textContent = person.name;
      $('account').append(option);
    }
    const extra = document.createElement('option'); extra.value = ''; extra.textContent = 'Add people without replacing an account'; $('account').append(extra);
    $('account').disabled = false; $('save-room').disabled = false; $('clear-room').disabled = false;
    showRoom(); say(response?.result?.warning || 'Choose the shared account, then enter everyone in that room.');
  } catch (error) { say(error.message || 'Could not read the meeting. Reopen this page from Meet.'); }
}
init();
