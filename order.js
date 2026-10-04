export function isMeetUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "meet.google.com" &&
      /^\/[a-z]{3}-[a-z]{4}-[a-z]{3}\/?$/i.test(url.pathname);
  } catch {
    return false;
  }
}

// Rejection sampling avoids modulo bias. Fisher–Yates preserves every entry,
// including different people who happen to share a display name.
export function randomIndex(max) {
  const limit = Math.floor(2 ** 32 / max) * max;
  const buffer = new Uint32Array(1);
  do { crypto.getRandomValues(buffer); } while (buffer[0] >= limit);
  return buffer[0] % max;
}

export function shuffle(names, pick = randomIndex) {
  const result = [...names];
  for (let i = result.length - 1; i > 0; i--) {
    const j = pick(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function parseNames(text) {
  return text.split(/\r?\n/).map(name => name.replace(/\s+/g, " ").trim()).filter(Boolean);
}

export function formatOrder(names) {
  return names.length ? `Speaking order:\n${names.map((name, i) => `${i + 1}. ${name}`).join("\n")}\n\nPlease take your turn in this order.` : "";
}
