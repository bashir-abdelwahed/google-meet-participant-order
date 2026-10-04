import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { collectParticipants } from "../meet.js";

function fixture(html) {
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://meet.google.com/abc-defg-hij" });
  dom.window.HTMLElement.prototype.getClientRects = function () {
    return this.closest("[hidden]") ? [] : [{}];
  };
  const timer = dom.window.setTimeout.bind(dom.window);
  dom.window.setTimeout = callback => timer(callback, 0);
  return { dom, document: dom.window.document, run: () => dom.window.eval(`(${collectParticipants.toString()})()`) };
}
const row = (id, name, extra = "") => `<div role="listitem" data-participant-id="${id}" ${extra}><span class="zWGUib">${name}</span></div>`;

test("reads the roster, deduplicates IDs, retains namesakes, and ignores tiles/presentations", async () => {
  const f = fixture(`<button aria-label="People (3)"></button><div role="list">${row("1", "Alex (You)")}${row("2", "Alex")}${row("3", "李雷")}${row("2", "Alex")}${row("screen", "Alex’s screen", 'data-is-presentation="true"')}</div><div data-participant-id="tile">Not a participant</div>`);
  const result = await f.run();
  assert.deepEqual([...result.names], ["Alex", "Alex", "李雷"]);
  assert.equal(result.warning, "");
  f.dom.window.close();
});

test("opens the People panel, waits for its roster and restores it", async () => {
  const f = fixture(`<button aria-label="Participants (1)"></button><div id="panel" hidden>${row("1", "Morgan")}</div>`);
  let clicks = 0;
  f.document.querySelector("button").onclick = () => {
    clicks++;
    f.document.getElementById("panel").hidden = !f.document.getElementById("panel").hidden;
  };
  const result = await f.run();
  assert.deepEqual([...result.names], ["Morgan"]);
  assert.equal(clicks, 2);
  assert.ok(f.document.getElementById("panel").hidden);
  f.dom.window.close();
});

test("opens the avatar-based People control labelled by a hidden element", async () => {
  // Reduced from the live Meet DOM observed on 2026-10-03. No icon or aria-label.
  const f = fixture(`<button aria-label="Add people"></button>
    <div role="button" tabindex="0" aria-haspopup="dialog" aria-expanded="false" aria-labelledby="people-label">
      <span id="people-label" style="display:none">People</span><div>2</div>
      <span data-avatar-count="2"><img alt=""><img alt=""></span>
    </div><div id="panel" hidden><div role="list" aria-label="Participants">${row("1", "Alex")}${row("2", "Morgan")}</div></div>`);
  let clicks = 0;
  f.document.querySelector("button").onclick = () => assert.fail("Must not click Add people");
  f.document.querySelector('[role="button"]').onclick = () => {
    clicks++;
    f.document.getElementById("panel").hidden = !f.document.getElementById("panel").hidden;
  };
  const result = await f.run();
  assert.deepEqual([...result.names], ["Alex", "Morgan"]);
  assert.equal(result.warning, "");
  assert.equal(clicks, 2);
  assert.ok(f.document.getElementById("panel").hidden);
  f.dom.window.close();
});

test("scans a virtualized roster and restores its original scroll position", async () => {
  const f = fixture('<button aria-label="People (80)"></button><div id="scroll" style="overflow-y:auto" role="list"></div>');
  const list = f.document.getElementById("scroll");
  let top = 200;
  Object.defineProperties(list, {
    scrollHeight: { value: 1600 }, clientHeight: { value: 200 },
    scrollTop: { get: () => top, set(value) { top = Math.min(1400, Math.max(0, value)); render(); } },
  });
  function render() {
    const start = Math.floor(top / 20);
    list.innerHTML = Array.from({ length: 10 }, (_, i) => row(start + i, `Person ${start + i}`)).join("");
  }
  render();
  const result = await f.run();
  assert.equal(result.names.length, 80);
  assert.equal(new Set(result.names).size, 80);
  assert.equal(result.warning, "");
  assert.equal(top, 200);
  f.dom.window.close();
});

test("warns instead of silently claiming a partial list is complete", async () => {
  const f = fixture(`<button aria-label="People (5)"></button><div role="list">${row("1", "Alice")}</div>`);
  const result = await f.run();
  assert.match(result.warning, /5 participants; read 1/);
  f.dom.window.close();
});

test("visible-tile fallback is explicitly marked incomplete", async () => {
  const f = fixture('<div data-participant-id="1" data-participant-name="Alice"></div>');
  const result = await f.run();
  assert.deepEqual([...result.names], ["Alice"]);
  assert.match(result.warning, /only read visible participants/i);
  f.dom.window.close();
});

test("empty calls and unreadable names provide actionable feedback", async () => {
  const f = fixture('<div role="listitem" data-participant-id="unknown"></div>');
  const result = await f.run();
  assert.equal(result.names.length, 0);
  assert.match(result.warning, /No participants found/);
  f.dom.window.close();
});

test("does not click an already expanded panel while it is loading", async () => {
  const f = fixture('<button aria-label="Personnes (1)" aria-expanded="true"></button>');
  let clicks = 0;
  f.document.querySelector("button").onclick = () => clicks++;
  f.dom.window.setTimeout(() => f.document.body.insertAdjacentHTML("beforeend", row("1", "You")));
  const result = await f.run();
  assert.equal(clicks, 0);
  assert.match(result.warning, /Replace “You”/);
  f.dom.window.close();
});
