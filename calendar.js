export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events.readonly';
export const CALENDAR_ORIGIN = 'https://www.googleapis.com/*';
export function meetCode(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'meet.google.com'
      ? url.pathname.match(/^\/([a-z]{3}-[a-z]{4}-[a-z]{3})\/?$/i)?.[1].toLowerCase() : undefined;
  } catch { return undefined; }
}
export function matchingEvents(events, url) {
  const code = meetCode(url);
  if (!code) return [];
  return events.filter(event => event.status !== 'cancelled' &&
    [event.hangoutLink, ...(event.conferenceData?.entryPoints || [])
      .filter(entry => entry.entryPointType === 'video').map(entry => entry.uri)]
      .some(link => meetCode(link) === code));
}
export function invitedPeople(event) {
  return (event.attendees || []).filter(person => !person.resource && person.responseStatus !== 'declined');
}
export async function calendarEvents({ identity = chrome.identity, fetcher = fetch, now = new Date(), interactive = true } = {}) {
  let auth = await identity.getAuthToken({ interactive, scopes: [CALENDAR_SCOPE] });
  if (!auth.token) throw new Error('Calendar sign-in was not completed. You can enter room names manually.');
  const events = [];
  let pageToken;
  let retried = false;
  while (true) {
    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.search = new URLSearchParams({
      timeMin: new Date(now.getTime() - 12 * 3600000).toISOString(),
      timeMax: new Date(now.getTime() + 12 * 3600000).toISOString(),
      singleEvents: 'true', orderBy: 'startTime', maxResults: '250',
      fields: 'nextPageToken,items(id,status,summary,start,end,hangoutLink,conferenceData(entryPoints),attendees,attendeesOmitted)',
      ...(pageToken ? { pageToken } : {}),
    });
    const response = await fetcher(url.href, { headers: { Authorization: `Bearer ${auth.token}` }, signal: AbortSignal.timeout(20000) });
    if (response.status === 401 && !retried) {
      retried = true;
      await identity.removeCachedAuthToken({ token: auth.token });
      auth = await identity.getAuthToken({ interactive: false, scopes: [CALENDAR_SCOPE] });
      if (!auth.token) throw new Error('Please connect Calendar again.');
      continue;
    }
    if (!response.ok) throw new Error(response.status === 403
      ? 'Calendar access was denied. Check consent, the Calendar API configuration, or your organization’s policy. Manual room names still work.'
      : `Calendar could not be read (${response.status}). Try again or enter room names manually.`);
    const data = await response.json();
    events.push(...(data.items || []));
    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }
  return events;
}
