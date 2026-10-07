import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { isMeetUrl, shuffle, parseNames, formatOrder } from "../order.js";

test("only accepts real HTTPS Meet call URLs", () => {
  assert.ok(isMeetUrl("https://meet.google.com/abc-defg-hij?authuser=1"));
  for (const value of [undefined, "https://meet.google.com/", "https://meet.google.com/landing", "https://meet.google.com.evil.org/abc-defg-hij", "http://meet.google.com/abc-defg-hij"]) {
    assert.equal(isMeetUrl(value), false);
  }
});

test("shuffle preserves duplicate names and never mutates its input", () => {
  const names = ["Alex", "Alex", "Zoë", "李雷"];
  const result = shuffle(names, () => 0);
  assert.deepEqual(result, ["Alex", "Zoë", "李雷", "Alex"]);
  assert.deepEqual(names, ["Alex", "Alex", "Zoë", "李雷"]);
  assert.deepEqual(shuffle([]), []);
  assert.deepEqual(shuffle(["Solo"]), ["Solo"]);
});

test("each possible draw for three people produces a distinct permutation", () => {
  const permutations = new Set();
  for (let first = 0; first < 3; first++) {
    for (let second = 0; second < 2; second++) {
      const draws = [first, second];
      permutations.add(shuffle(["A", "B", "C"], () => draws.shift()).join(""));
    }
  }
  assert.equal(permutations.size, 6);
});

test("manual entries and the message preserve Unicode and namesakes", () => {
  assert.deepEqual(parseNames("  Zoë  Chen \r\n\n李雷\nZoë  Chen"), ["Zoë Chen", "李雷", "Zoë Chen"]);
  assert.equal(formatOrder(["Zoë", "李雷"]), "Speaking order:\n1. Zoë\n2. 李雷\n\nPlease take your turn in this order.");
  assert.equal(formatOrder([]), "");
});

test("extension manifest assets exist and permissions stay minimal", async () => {
  const manifest = JSON.parse(await readFile(new URL("../manifest.json", import.meta.url)));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ["activeTab", "scripting", "clipboardWrite", "storage", "identity"]);
  assert.equal(manifest.host_permissions, undefined);
  for (const path of [manifest.action.default_popup, ...Object.values(manifest.icons)]) {
    assert.ok((await readFile(new URL(`../${path}`, import.meta.url))).length);
  }
});
