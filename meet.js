// This function is serialized by chrome.scripting.executeScript. Keep all its
// dependencies inside the function; it runs in an isolated world on the Meet tab.
export async function collectParticipants() {
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const clean = value => (value || "").replace(/\s+/g, " ").trim();
  const visible = element => !!element && !element.closest('[hidden], [aria-hidden="true"]') &&
    element.getClientRects().length > 0;
  const all = (selector, root = document) => [...root.querySelectorAll(selector)];
  const rowSelector = '[role="listitem"][data-participant-id], [role="listitem"] [data-participant-id]';
  const nameSelector = '[data-participant-name], .zWGUib, [jsname="X6ZFRb"], [data-self-name]';
  const peopleLabels = /participants|people|personnes|personas|teilnehmer|partecipanti|participantes/i;
  const warnings = [];
  let button;
  let opened = false;
  let scroller;
  let originalScroll = 0;

  function accessibleLabel(element) {
    // Meet's avatar-based People control uses aria-labelledby rather than
    // aria-label, and its referenced label is intentionally display:none.
    const labelledBy = (element.getAttribute("aria-labelledby") || "")
      .split(/\s+/).filter(Boolean)
      .map(id => document.getElementById(id)?.textContent || "").join(" ");
    return clean(labelledBy || element.getAttribute("aria-label"));
  }

  function peopleButton() {
    const buttons = all('button, [role="button"]').filter(visible);
    // Prefer the panel control over actions such as "Add people".
    return buttons.find(el => peopleLabels.test(accessibleLabel(el)) &&
      (el.hasAttribute("aria-expanded") || el.hasAttribute("aria-pressed"))) ||
      buttons.find(el => (
      peopleLabels.test(accessibleLabel(el)) ||
      all('[data-google-symbols], i, .google-symbols, .material-icons', el)
        .some(icon => /^(people|group|people_alt)$/.test(clean(icon.textContent)))
    ));
  }

  function rows() {
    return all(rowSelector).filter(visible);
  }

  function readName(row) {
    const explicit = clean(row.getAttribute("data-participant-name"));
    if (explicit) return explicit;
    const el = row.querySelector(nameSelector);
    if (el) {
      return clean(el.getAttribute("data-participant-name") || el.textContent)
        .replace(/\s*\((you|vous|du|tú|tu|você)\)$/i, "");
    }
    // A list item's accessible name is a fallback only inside the roster.
    return clean(row.getAttribute("aria-label"))
      .replace(/\s*\((you|vous|du|tú|tu|você)\)$/i, "");
  }

  function isPresentation(row) {
    return row.matches('[data-is-presentation="true"], [data-is-presentation="1"]') ||
      !!row.closest('[data-is-presentation="true"], [data-is-presentation="1"]');
  }

  function expectedCount() {
    if (!button) return null;
    const text = `${accessibleLabel(button)} ${button.textContent}`;
    const numbers = [...new Set(text.match(/\d+/g) || [])];
    return numbers.length === 1 ? Number(numbers[0]) : null;
  }

  try {
    button = peopleButton();
    if (!rows().length && button && button.getAttribute("aria-pressed") !== "true" &&
      button.getAttribute("aria-expanded") !== "true") {
      button.click();
      opened = true;
    }
    // Give Meet time to mount its People panel.
    for (let i = 0; i < 20 && !rows().length; i++) await pause(150);

    const firstRows = rows();
    const participants = new Map();
    let missingName = false;
    const remember = row => {
      if (isPresentation(row)) return;
      const id = row.getAttribute("data-participant-id");
      const name = readName(row);
      if (id && name) participants.set(id, name);
      else missingName = true;
    };

    if (firstRows.length) {
      // Read the roster, not video tiles: cameras may be off and grids paginated.
      // Walk its scrolling ancestor to include virtualized list items.
      for (let node = firstRows[0].parentElement; node && node !== document.body; node = node.parentElement) {
        if (node.scrollHeight > node.clientHeight + 2 &&
          /auto|scroll/.test(getComputedStyle(node).overflowY)) {
          scroller = node;
          break;
        }
      }
      if (scroller) {
        originalScroll = scroller.scrollTop;
        scroller.scrollTop = 0;
        await pause(180);
      }
      const deadline = Date.now() + 12000;
      let bottomPasses = 0;
      let finished = false;
      while (Date.now() < deadline) {
        rows().forEach(remember);
        if (!scroller) { finished = true; break; }
        const bottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
        bottomPasses = bottom ? bottomPasses + 1 : 0;
        if (bottomPasses >= 3) { finished = true; break; }
        scroller.scrollTop += Math.max(100, scroller.clientHeight * 0.75);
        await pause(160);
      }
      if (!finished) warnings.push("The participant list took too long to load. Check for missing names, then refresh.");
    } else {
      // Best-effort fallback is deliberately labeled incomplete in the popup.
      all('[data-participant-id]').filter(visible).forEach(remember);
      warnings.push("Could only read visible participants. Open Meet’s People panel and refresh, or add missing names below.");
    }

    if (!participants.size) {
      return { names: [], warning: "No participants found. Join the call, open Meet’s People panel, then refresh. You can also enter names below." };
    }
    if (missingName) warnings.push("Some participant names could not be read. Review the list before copying.");
    const expected = expectedCount();
    if (expected !== null && expected !== participants.size) {
      warnings.push(`Meet shows ${expected} participants; read ${participants.size} names. Check the list for missing people or presentation entries.`);
    } else if (expected === null) {
      warnings.push("Check the names before copying; Meet’s total participant count could not be verified.");
    }
    if ([...participants.values()].some(name => /^(you|vous|du|tú|tu|você)$/i.test(name))) {
      warnings.push("Replace “You” with your name so the shared order is clear.");
    }
    return { names: [...participants.values()], warning: warnings.join(" ") };
  } finally {
    if (scroller?.isConnected) scroller.scrollTop = originalScroll;
    // Close only the People panel we opened, and only if it is still visible.
    if (opened && button?.isConnected && rows().length) button.click();
  }
}
