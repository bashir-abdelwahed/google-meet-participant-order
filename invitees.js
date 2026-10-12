// Serialized into Meet by executeScript; all dependencies must stay inside.
export async function collectInvitees() {
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const clean = value => (value || '').replace(/\s+/g, ' ').trim();
  const visible = el => !!el && !el.closest('[hidden], [aria-hidden="true"]') && el.getClientRects().length > 0;
  const all = (selector, root = document) => [...root.querySelectorAll(selector)];
  const label = el => clean((el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean)
    .map(id => document.getElementById(id)?.textContent || '').join(' ') || el.getAttribute('aria-label') || el.querySelector('.V6tdP')?.textContent || el.textContent);
  const invitedLabel = /^(invited|not in (?:the )?call|also invited|invités?|personnes invitées|absents?|eingeladen|nicht im anruf|invitados?|no están en la llamada|invitati|non presenti|convidados?)(?:\s|\(|\d|$)/i;
  const inCallLabel = /^(in (?:the )?call|participants in (?:the )?call|dans l’appel|dans l'appel|en cours d'appel)(?:\s|\(|\d|$)/i;
  const rowSelector = '[role="listitem"], [data-invited-email], [data-invitee-id]';
  let toolbar, opened = false, section, sectionOpened = false, scroll, originalScroll;
  function control() {
    const buttons = all('button, [role="button"]').filter(visible);
    const matches = el => /^(people|participants|personnes|teilnehmer|personas|partecipanti|participantes)(?:\s|\(|$)/i.test(label(el));
    return buttons.find(el => matches(el) && (el.hasAttribute('aria-expanded') || el.hasAttribute('aria-pressed'))) || buttons.find(matches);
  }
  function findSection() {
    const list = all('[role="list"], [role="group"], [role="region"]').find(el => invitedLabel.test(label(el)) &&
      (el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')));
    const heading = all('button, [role="button"], [role="heading"], h2, h3, h4').filter(visible)
      .find(el => invitedLabel.test(label(el)));
    if (!heading) return list || null;
    section = heading;
    if (list) return list;
    const controlsId = heading.getAttribute('aria-controls');
    if (controlsId && document.getElementById(controlsId)) return document.getElementById(controlsId);
    // Stop before a parent containing the separate in-call section.
    for (let parent = heading.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
      if (all('button, [role="button"], [role="heading"], h2, h3, h4', parent)
        .some(el => el !== heading && inCallLabel.test(label(el)))) break;
      if (parent.querySelector(rowSelector)) return parent;
    }
    return null;
  }
  try {
    toolbar = control();
    if (toolbar && toolbar.getAttribute('aria-expanded') !== 'true' && toolbar.getAttribute('aria-pressed') !== 'true') {
      toolbar.click(); opened = true;
    }
    let root;
    for (let i = 0; i < 20; i++) {
      root = findSection();
      const collapsed = section?.getAttribute('aria-expanded') === 'false';
      if (collapsed && !sectionOpened) { section.click(); sectionOpened = true; }
      if (root && all(rowSelector, root).some(visible)) break;
      await pause(150);
    }
    if (!root) return { invitees: [], warning: 'Could not locate Meet’s invited list. Open People, expand Invited or Not in call, clear any search, then try again. You can enter missing names manually.' };
    const items = () => all(rowSelector, root).filter(visible)
      .filter(row => !row.parentElement?.closest(rowSelector) || !root.contains(row.parentElement.closest(rowSelector)));
    const first = items()[0];
    for (let el = first?.parentElement; el && el !== document.body; el = el.parentElement) {
      if (el.scrollHeight > el.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(el).overflowY)) { scroll = el; break; }
    }
    if (scroll) { originalScroll = scroll.scrollTop; scroll.scrollTop = 0; await pause(160); }
    const people = new Map(); let unreadable = false, finished = false, bottomPasses = 0;
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      const occurrences = new Map();
      for (const row of items()) {
        const el = row.querySelector('[data-participant-name], [data-invitee-name], .zWGUib, [jsname="X6ZFRb"]');
        const name = clean(row.getAttribute('data-participant-name') || row.getAttribute('data-invitee-name') || el?.getAttribute('data-participant-name') || el?.textContent);
        const email = clean(row.getAttribute('data-invited-email') || row.getAttribute('data-email') || row.querySelector('[data-email]')?.getAttribute('data-email'));
        let id = row.getAttribute('data-invitee-id') || row.getAttribute('data-participant-id') || email;
        if (!name) { unreadable = true; continue; }
        // Don't invent a person's name from row buttons or status text.
        if (!id) {
          const occurrence = occurrences.get(name) || 0; occurrences.set(name, occurrence + 1);
          id = `display:${name}:${occurrence}`;
          if (scroll) unreadable = true; // Namesakes across virtualized pages cannot be verified.
        }
        people.set(id, { id, name });
      }
      if (!scroll) { finished = true; break; }
      const bottom = scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 2;
      bottomPasses = bottom ? bottomPasses + 1 : 0;
      if (bottomPasses >= 3) { finished = true; break; }
      scroll.scrollTop += Math.max(100, scroll.clientHeight * .75); await pause(160);
    }
    const warnings = ['Includes invited people who may not be in the call. Review the names before sharing.'];
    if (!people.size) warnings.unshift('No readable invitees found. Expand the invited list and clear any search, or enter names manually.');
    if (unreadable || !finished) warnings.unshift('Some invited entries could not be read. The suggested list may be incomplete.');
    return { invitees: [...people.values()], warning: warnings.join(' ') };
  } finally {
    if (scroll?.isConnected) scroll.scrollTop = originalScroll;
    if (sectionOpened && section?.isConnected && section.getAttribute('aria-expanded') === 'true') section.click();
    if (opened && toolbar?.isConnected) toolbar.click();
  }
}
