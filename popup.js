import { isMeetUrl, shuffle, parseNames, formatOrder } from "./order.js";
import { collectParticipants } from "./meet.js";
import { collectInvitees } from "./invitees.js";

const $ = id => document.getElementById(id);
let names = [];
let busy = false;

function status(text) { $("status").textContent = text; }
function warning(text = "") {
  $("warning").textContent = text;
  $("warning").hidden = !text;
}
function syncControls() {
  $("refresh").disabled = busy;
  $("read-invited").disabled = busy;
  $("add-invited").disabled = busy || !$("invitees").querySelector("input:checked");
  $("replace-account").disabled = busy;
  $("invitees").querySelectorAll("input").forEach(input => { input.disabled = busy; });
  $("shuffle").disabled = busy || names.length < 2;
  $("copy").disabled = busy || !$("message").value.trim();
  $("apply").disabled = busy;
  $("names").disabled = busy;
  $("message").disabled = busy;
}
function generate() {
  const select = $("replace-account");
  select.replaceChildren();
  const extra = document.createElement("option"); extra.value = "";
  extra.textContent = "Add names without replacing an account"; select.append(extra);
  names.forEach((name, index) => {
    const option = document.createElement("option"); option.value = String(index); option.textContent = name;
    select.append(option);
  });
  $("message").value = formatOrder(shuffle(names));
  $("count").textContent = `${names.length} participant${names.length === 1 ? "" : "s"}`;
  $("copy").textContent = "Copy message ↗";
  syncControls();
}

function showInvitees(result) {
    $("invitees").replaceChildren();
    result.invitees.forEach(person => {
      const row = document.createElement("label"); row.className = "invitee";
      const input = document.createElement("input"); input.type = "checkbox"; input.value = person.name;
      input.addEventListener("change", syncControls);
      row.append(input, document.createTextNode(person.name)); $("invitees").append(row);
    });
    $("invited-status").textContent = result.warning || "Select people actually present. Invitees are not added automatically.";
  $("shared").open = result.invitees.length > 0;
}

async function refresh() {
  busy = true;
  warning();
  status("Reading participants… Keep this popup open while Meet’s People panel loads.");
  syncControls();
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !isMeetUrl(tab.url)) {
      throw new Error("Open a Google Meet call, then click this extension. You can also enter names below.");
    }
    const [response] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: collectParticipants,
    });
    const result = response?.result;
    if (!result || !Array.isArray(result.names)) throw new Error("Could not read this call. Refresh the Meet tab and try again.");
    names = result.names;
    $("names").value = names.join("\n");
    generate();
    warning(result.warning);
    status(names.length ? "Your order is ready. Copy it into the meeting chat." : "Enter names below or refresh after opening the People panel.");
    $("editor").open = !names.length;
    $("invitees").replaceChildren();
    $("invited-status").textContent = "Reading the Also invited section…";
    try {
      const [invitedResponse] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: collectInvitees });
      if (Array.isArray(invitedResponse?.result?.invitees)) showInvitees(invitedResponse.result);
      else $("invited-status").textContent = "Could not read Also invited. Try Read Meet’s invited list or enter names manually.";
    } catch {
      $("invited-status").textContent = "Could not read Also invited. Your contributors’ order is still available. Try again below.";
    }
  } catch (error) {
    warning(error.message || "Could not access Meet. Reload the meeting and try again.");
    status(names.length ? "Kept your previous order. It has not been refreshed." : "You can still create an order manually.");
    if (!names.length) {
      $("count").textContent = "Waiting for participants";
      $("editor").open = true;
    }
  } finally {
    busy = false;
    syncControls();
  }
}

$("refresh").addEventListener("click", refresh);
$("shuffle").addEventListener("click", () => { generate(); status("Shuffled. Every participant has an equal chance at each position."); });
$("message").addEventListener("input", () => { $("copy").textContent = "Copy message ↗"; syncControls(); });
$("apply").addEventListener("click", () => {
  const entered = parseNames($("names").value);
  if (!entered.length) { status("Add at least one name, one per line."); $("names").focus(); return; }
  names = entered;
  warning();
  generate();
  status("Created an order from your edited participant list.");
  $("editor").open = false;
});
$("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("message").value);
    $("copy").textContent = "Copied ✓";
    status("Copied! Open Meet chat and paste your message.");
  } catch {
    $("message").focus();
    $("message").select();
    status("Copy was blocked. Your message is selected: press ⌘C on Mac or Ctrl+C on Windows.");
  }
});

refresh();

$("read-invited").addEventListener("click", async () => {
  busy = true; $("invitees").replaceChildren(); syncControls();
  $("invited-status").textContent = "Reading Meet’s invited list… Keep this popup open.";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !isMeetUrl(tab.url)) throw new Error("Open this extension in a Google Meet call to read invitees.");
    const [response] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: collectInvitees });
    const result = response?.result;
    if (!Array.isArray(result?.invitees)) throw new Error("Could not read invitees. Open Meet’s invited list and try again.");
    showInvitees(result);
  } catch (error) { $("invited-status").textContent = error.message || "Could not read invitees. Enter names manually below."; }
  finally { busy = false; syncControls(); }
});
$("add-invited").addEventListener("click", () => {
  const selected = [...$("invitees").querySelectorAll("input:checked")].map(input => input.value);
  if (!selected.length) return;
  const account = $("replace-account").value;
  if (account !== "") names.splice(Number(account), 1, ...selected);
  else names.push(...selected);
  $("names").value = names.join("\n");
  $("invitees").querySelectorAll("input").forEach(input => { input.checked = false; });
  generate(); status("Updated the order with your selected people. Check for duplicates before copying.");
});
