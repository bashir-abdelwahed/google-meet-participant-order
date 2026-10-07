# Google Meet Participant Order

A small Chrome extension that reads the current Google Meet participants and gives you a shuffled, numbered message to copy into chat. The basic speaking order and shared-room editor work without an account or server. Optional Google Calendar suggestions require Google sign-in and developer OAuth setup.

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

**Refresh** re-reads the current call and creates a new order. Saved room choices are applied again when reopening the popup or refreshing. Other manual edits and message edits are popup-only. The extension provides copyable text; it does not post messages automatically.

## People sharing one account or room

1. In Meet, open the extension and click **People sharing a room…**.
2. Select the account representing the room.
3. Enter each person actually present, one per line, including the account owner if they are taking a turn.
4. Click **Save these people**, return to Meet, and reopen the extension.

For example, “Conference room” can become “Alex”, “Sam”, and “Morgan”, each with their own position in the order. Other accounts remain separate. You can configure several rooms, reset a room to its original account name, or choose **Add people without replacing an account** for extra speakers. Account replacements apply only while that participant ID is present; extra speakers remain until reset or expiry. Check the list after someone leaves. Rejoining under a different participant ID requires configuring that account again.

**Calendar suggestions:** expand the Calendar section, connect, and select the matching event if several use the same Meet link. Select invitees who are actually in the room, correct or enter their speaking names, click **Add selected names to room**, then **Save these people**. Invitations do not prove attendance; nobody is added automatically. Declined invitees and room resources are excluded. Only events on the Chrome Google account’s primary calendar overlapping the 12 hours before or after now are searched. This cannot identify uninvited people, detect a room’s occupants, or read actual attendance behind a shared account.

## Calendar setup (extension developer)

Calendar integration is implemented but **not enabled in the repository’s default build**, because a real OAuth client must be registered for your extension ID. No placeholder credential or secret is shipped.

1. In [Google Cloud Console](https://console.cloud.google.com/), create/select a project and enable **Google Calendar API**.
2. Configure Google Auth Platform branding, audience and read-only scope `https://www.googleapis.com/auth/calendar.events.readonly`. In testing mode, add the Google account you will test with as a test user. Public distribution may require Google OAuth verification separately from Chrome Web Store review.
3. Create an OAuth client of type **Chrome Extension** with the extension ID shown in `chrome://extensions`. For publication, use the ID allocated to your Chrome Web Store item; development and production IDs must each match their registered client. Follow Google’s [Chrome extension OAuth setup](https://developer.chrome.com/docs/extensions/how-to/integrate/oauth).
4. Run `python3 scripts/configure-calendar.py YOUR_CLIENT_ID.apps.googleusercontent.com`. The client ID is public configuration; **do not put a client secret in this extension**.
5. Reload the extension, then use **Connect Calendar & find meeting** in the room editor. Chrome handles sign-in and consent. See the [Identity API](https://developer.chrome.com/docs/extensions/reference/api/identity) and [Calendar events API](https://developers.google.com/workspace/calendar/api/v3/reference/events/list).
6. Test on your own calendar before packaging. Test a shared room, missing display names, two events sharing a link, denied consent, and Disconnect. Our automated tests use simulated API responses; they do not verify your OAuth project or live Calendar.

Disconnect clears this extension’s Chrome token cache and removes its optional API permission. To revoke authorization at Google, use [Google account permissions](https://myaccount.google.com/permissions). It does not delete confirmed room names; use Reset or end the browser session.

## Limits and troubleshooting

- Google Meet has no stable public participant-list interface available to a basic Chrome extension. This extension reads its page, and future Meet layout changes can require selector updates in `meet.js`.
- The extension attempts to read the People roster, including rows loaded while scrolling. It warns when the roster is unavailable, the name count differs from Meet’s displayed count, or that total cannot be verified. Very large calls, collapsed groups, presentations, and changing membership can require manual corrections. Check the names before sharing.
- If names are missing, open **People** in Meet, expand the in-call group if necessary, clear any participant search, and press **Refresh** in the extension. Alternatively, enter names manually.
- Join the call first. Meeting landing pages and pre-join screens do not expose the roster.
- If clipboard access is blocked, the message is selected so you can copy with **⌘C** on Mac or **Ctrl+C** on Windows/Linux.
- After changing extension files, click its reload button at `chrome://extensions` and reopen the popup.

## Privacy and permissions

Names are processed locally. Shared-room replacements are kept in `chrome.storage.session`, scoped to the Meet tab and meeting link, and expire after six hours or the browser session ends. Expired records are removed when accessed. Calendar data is fetched only when you click Connect Calendar, and event results stay in that editor tab’s memory. There is no analytics, recording, or developer server.

- `activeTab`: temporary access to the tab where you click the extension.
- `scripting`: read the participants from that Meet tab and operate its People panel.
- `clipboardWrite`: copy the message when you click **Copy message**.
- `storage`: keep confirmed room choices for the browser session.
- `identity`: authorize optional read-only Calendar access; Chrome manages the token cache.
- Optional `https://www.googleapis.com/*`: requested on Connect Calendar to read Google Calendar events.

The implementation uses Chrome’s [activeTab permission](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab) and [Scripting API](https://developer.chrome.com/docs/extensions/reference/api/scripting). It does not request persistent access to Meet. Calendar API access is optional.

Read the [privacy policy](PRIVACY.md). For help, [open an issue](https://github.com/bashir-abdelwahed/google-meet-participant-order/issues). Do not include private participant names or meeting links in public issues.

## Development and verification

The extension itself has no runtime dependencies. To run the automated tests:

```sh
npm install
npm test
```

Tests use simulated Meet DOM fixtures, including an 80-person virtualized roster. They cannot guarantee compatibility with every live Meet layout. Before relying on it in a meeting, check the detected names in a real call, including yourself, a camera-off participant, and any participants who share a display name.

Version 1.0.1 was also verified in a live two-person Meet call on 2026-10-03, starting with the People panel closed. It supports the avatar-based People button whose accessible name comes from `aria-labelledby`. The regression suite includes that layout The new shared-room and Calendar flows are covered by additional simulated tests; real Calendar OAuth has not yet been verified.

## Chrome Web Store package

Run `npm run package` (requires Python 3). This tests the extension and creates `dist/google-meet-participant-order-1.1.0.zip`. The archive includes only the manifest, popup, runtime JavaScript, and icons, with `manifest.json` at the archive root.

The [publishing guide](store/PUBLISHING.md) contains the store description, permission explanations, reviewer instructions, and submission steps. A public source repository is not required by the Chrome Web Store; this repository is public so the implementation can be inspected.

This project is independent and is not affiliated with or endorsed by Google.
