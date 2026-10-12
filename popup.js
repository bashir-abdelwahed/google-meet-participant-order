import { isMeetUrl, shuffle, parseNames, formatOrder } from "./order.js";
import { collectParticipants } from "./meet.js";
import { collectInvitees } from "./invitees.js";

const $ = id => document.getElementById(id);
let names = [];
let busy = false;
let contributors = [];
let invited = [];
let contributorWarning = "";
let invitedWarning = "";

function status(text) { $("status").textContent = text; }
function warning(text = "") {
  $("warning").textContent = text;
  $("warning").hidden = !text;
}
function syncControls() {
  $("refresh").disabled = busy;
  $("include-invited").disabled = busy;
  $("shuffle").disabled = busy || names.length < 2;
  $("copy").disabled = busy || !$("message").value.trim();
  $("apply").disabled = busy;
  $("names").disabled = busy;
  $("message").disabled = busy;
}
function generate() {
  $("message").value = formatOrder(shuffle(names));
  $("count").textContent = `${names.length} participant${names.length === 1 ? "" : "s"}`;
  $("copy").textContent = "Copy message ↗";
  syncControls();
}

function useDetectedNames() {
  names = [...contributors, ...($("include-invited").checked ? invited : [])];
  $("names").value = names.join("\n");
  warning([contributorWarning, $("include-invited").checked ? invitedWarning : ""].filter(Boolean).join(" "));
  generate();
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
    contributors = [...result.names];
    contributorWarning = result.warning || "";
    invited = [];
    invitedWarning = "";
    try {
      const [invitedResponse] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: collectInvitees });
      if (!Array.isArray(invitedResponse?.result?.invitees)) throw new Error("Unreadable invited list");
      invited = invitedResponse.result.invitees.map(person => person.name);
      invitedWarning = invitedResponse.result.warning || "";
    } catch {
      invitedWarning = "Could not read Also invited. Showing contributors only. Open that section in Meet and Refresh, or enter missing names manually.";
    }
    useDetectedNames();
    status(names.length ? "Your order is ready. Copy it into the meeting chat." : "Enter names below or refresh after opening the People panel.");
    $("editor").open = !names.length;
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

$("include-invited").addEventListener("change", () => {
  useDetectedNames();
  status($("include-invited").checked ? "Created an order with contributors and invited people." : "Created an order with contributors only.");
});
