# Google Meet Participant Order

A small Chrome extension that reads the current Google Meet participants and gives you a shuffled, numbered message to copy into chat. No account, API key, server, build step, or paid service is needed.

## Install in Chrome

1. Download this repository using **Code → Download ZIP** and extract it, or clone it with Git.
2. Open `chrome://extensions` and turn on **Developer mode** (top right).
3. Click **Load unpacked** and choose the extracted folder containing `manifest.json`.
4. Use Chrome’s puzzle-piece Extensions menu to pin **Google Meet Participant Order**.

## Use

1. Join a Google Meet call and click the extension’s icon.
2. Keep the popup open while it reads the participants. It may briefly open and scroll Meet’s People panel.
3. Review the generated order. **Shuffle again** creates a fresh random order.
4. Click **Copy message**, open Meet chat, paste, and send.

You can edit the message directly. Expand **Edit participants** to add, remove, or correct names (one per line), then click **Use these names & shuffle**. Different participants with the same display name remain separate entries. Your own name is included if Meet exposes it in the roster; replace “You” with your name if needed.

**Refresh** re-reads the current call and creates a new order. Reopening the popup starts fresh. The extension provides copyable text; it does not post messages automatically.

## Limits and troubleshooting

- Google Meet has no stable public participant-list interface available to a basic Chrome extension. This extension reads its page, and future Meet layout changes can require selector updates in `meet.js`.
- The extension attempts to read the People roster, including rows loaded while scrolling. It warns when the roster is unavailable, the name count differs from Meet’s displayed count, or that total cannot be verified. Very large calls, collapsed groups, presentations, and changing membership can require manual corrections. Check the names before sharing.
- If names are missing, open **People** in Meet, expand the in-call group if necessary, clear any participant search, and press **Refresh** in the extension. Alternatively, enter names manually.
- Join the call first. Meeting landing pages and pre-join screens do not expose the roster.
- If clipboard access is blocked, the message is selected so you can copy with **⌘C** on Mac or **Ctrl+C** on Windows/Linux.
- After changing extension files, click its reload button at `chrome://extensions` and reopen the popup.

## Privacy and permissions

Names are processed locally in popup memory and discarded when it closes. There is no analytics, network request, recording, storage, or background service.

- `activeTab`: temporary access to the tab where you click the extension.
- `scripting`: read the participants from that Meet tab and operate its People panel.
- `clipboardWrite`: copy the message when you click **Copy message**.

The implementation uses Chrome’s [activeTab permission](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab) and [Scripting API](https://developer.chrome.com/docs/extensions/reference/api/scripting). It does not request persistent access to websites.

Read the [privacy policy](PRIVACY.md). For help, [open an issue](https://github.com/bashir-abdelwahed/google-meet-participant-order/issues). Do not include private participant names or meeting links in public issues.

## Development and verification

The extension itself has no runtime dependencies. To run the automated tests:

```sh
npm install
npm test
```

Tests use simulated Meet DOM fixtures, including an 80-person virtualized roster. They cannot guarantee compatibility with every live Meet layout. Before relying on it in a meeting, check the detected names in a real call, including yourself, a camera-off participant, and any participants who share a display name.

Version 1.0.1 was also verified in a live two-person Meet call on 2026-10-03, starting with the People panel closed. It supports the avatar-based People button whose accessible name comes from `aria-labelledby`. The regression suite includes that layout (17 tests total).

## Chrome Web Store package

Run `npm run package` (requires Python 3). This tests the extension and creates `dist/google-meet-participant-order-1.0.2.zip`. The archive includes only the manifest, popup, runtime JavaScript, and icons, with `manifest.json` at the archive root.

The [publishing guide](store/PUBLISHING.md) contains the store description, permission explanations, reviewer instructions, and submission steps. A public source repository is not required by the Chrome Web Store; this repository is public so the implementation can be inspected.

This project is independent and is not affiliated with or endorsed by Google.
