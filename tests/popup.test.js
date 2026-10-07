import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import * as rooms from "../room-roster.js";
import * as order from "../order.js";
import { collectParticipants } from "../meet.js";

const html = await readFile(new URL("../popup.html", import.meta.url), "utf8");
const script = (await readFile(new URL("../popup.js", import.meta.url), "utf8")).replace(/^import .*;\n/gm, "");
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

async function popup({ url = "https://meet.google.com/abc-defg-hij", names = ["Alex", "Zoë", "李雷"], rejectClipboard = false, rules = null } = {}) {
  const dom = new JSDOM(html, { runScripts: "outside-only" });
  const window = dom.window;
  let copied;
  let injections = 0;
  Object.assign(window, order, rooms, { collectParticipants, loadRooms: key => rooms.loadRooms(key, window.chrome.storage.session) });
  window.chrome = {
    storage: { session: { get: async key => rules ? { [key]: { ...rules, updatedAt: Date.now() } } : {} } },
    tabs: { query: async () => [{ id: 1, url }] },
    scripting: { executeScript: async () => { injections++; return [{ result: { names, participants: names.map((name, index) => ({ id: String(index), name })), warning: "" } }]; } },
  };
  Object.defineProperty(window.navigator, "clipboard", { value: {
    writeText: async text => { if (rejectClipboard) throw new Error("Denied"); copied = text; },
  } });
  window.eval(script);
  await tick();
  return { dom, window, $: id => window.document.getElementById(id), copied: () => copied, injections: () => injections };
}

test("opening generates a message and Copy uses the exact edited message", async () => {
  const f = await popup();
  assert.equal(f.injections(), 1);
  assert.match(f.$("count").textContent, /3 participants/);
  assert.equal(f.$("copy").disabled, false);
  f.$("message").value = "Our custom turn order:\n1. Zoë\n2. 李雷\n3. Alex";
  f.$("copy").click();
  await tick();
  assert.equal(f.copied(), f.$("message").value);
  assert.match(f.$("status").textContent, /Copied!/);
  f.dom.window.close();
});

test("wrong tabs do not inject, and manual editing still produces a copyable order", async () => {
  const f = await popup({ url: "https://example.com" });
  assert.equal(f.injections(), 0);
  assert.equal(f.$("copy").disabled, true);
  assert.ok(f.$("editor").open);
  f.$("names").value = "Alex\nAlex\n<script>alert(1)</script>";
  f.$("apply").click();
  assert.match(f.$("count").textContent, /3 participants/);
  assert.match(f.$("message").value, /<script>alert\(1\)<\/script>/);
  assert.equal(f.window.document.querySelectorAll("script").length, 1);
  assert.equal(f.$("copy").disabled, false);
  f.dom.window.close();
});

test("clipboard rejection selects the message for manual copy", async () => {
  const f = await popup({ rejectClipboard: true });
  f.$("copy").click();
  await tick();
  assert.equal(f.$("message").selectionStart, 0);
  assert.equal(f.$("message").selectionEnd, f.$("message").value.length);
  assert.match(f.$("status").textContent, /Copy was blocked/);
  f.dom.window.close();
});

test("a failed refresh preserves the previous message and explains it is stale", async () => {
  const f = await popup();
  const previous = f.$("message").value;
  f.window.chrome.scripting.executeScript = async () => { throw new Error("Tab closed"); };
  f.$("refresh").click();
  assert.equal(f.$("copy").disabled, true);
  await tick();
  assert.equal(f.$("message").value, previous);
  assert.equal(f.$("copy").disabled, false);
  assert.match(f.$("status").textContent, /not been refreshed/);
  f.dom.window.close();
});

test("room choices survive reopening and Refresh without adding the shared account", async () => {
  const options = { names: ["Room", "Remote"], rules: { replacements: { "0": ["Alex", "Sam"] }, extra: [] } };
  const f = await popup(options);
  assert.match(f.$("count").textContent, /3 participants/);
  assert.doesNotMatch(f.$("message").value, /Room/);
  f.$("refresh").click(); await tick();
  assert.match(f.$("count").textContent, /3 participants/);
  f.dom.window.close();
  const reopened = await popup(options);
  assert.match(reopened.$("message").value, /Sam/);
  reopened.dom.window.close();
});
