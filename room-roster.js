export const ROOM_TTL = 6 * 60 * 60 * 1000;
export function roomKey(tabId, url) {
  return `room:${tabId}:${new URL(url).pathname.toLowerCase()}`;
}
export function applyRooms(participants, rules) {
  return participants.flatMap(person => {
    const replacement = rules?.replacements?.[person.id];
    return Array.isArray(replacement) && replacement.length ? replacement : [person.name];
  }).concat(rules?.extra || []);
}
export async function loadRooms(key, storage = chrome.storage.session, now = Date.now()) {
  const value = (await storage.get(key))[key];
  if (!value || now - value.updatedAt > ROOM_TTL) {
    if (value) await storage.remove(key);
    return null;
  }
  return value;
}
