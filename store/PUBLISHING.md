# Chrome Web Store submission

## Package and URLs

- Build: `npm ci && npm run package`
- Upload: `dist/google-meet-participant-order-1.1.0.zip`
- Homepage: https://github.com/bashir-abdelwahed/google-meet-participant-order
- Support: https://github.com/bashir-abdelwahed/google-meet-participant-order/issues
- Privacy policy: https://github.com/bashir-abdelwahed/google-meet-participant-order/blob/main/PRIVACY.md
- Language: English
- Suggested category: Productivity / Workflow & Planning (choose the matching available category)
- Distribution: free, public

Prepared images:
- Store icon: `icons/128.png`
- Screenshot: `store/screenshot-1280x800.jpg`
- Small promotional tile: `store/promo-440x280.jpg`

The screenshot uses the actual popup markup with fictional sample names. To regenerate the image layouts, run `python3 scripts/store-preview.py`, serve the repository locally, and capture `store/preview.html` at 1280×800 and `store/promo.html` at 440×280. These previews are static artwork, not an alternate running extension.

## Store description

Give everyone a turn in Google Meet.

Google Meet Participant Order reads the participants in your current call, shuffles their names, and creates a numbered message you can copy into the meeting chat. Useful for standups, round-table discussions, check-ins, and team introductions.

HOW IT WORKS
1. Join a Google Meet call and click the extension.
2. Review the randomly ordered participant names.
3. Click Copy message, then paste and send it in Meet chat.

FEATURES
• Generate a random speaking order with one click.
• Shuffle again whenever you want a new order.
• Refresh the list as people join or leave.
• Edit the message before copying.
• Add, remove, or correct participant names manually.
• Replace a shared-room account with individual speakers.
• Optionally suggest room names from the matching Google Calendar invitation (requires configured Google sign-in).
• Keep separate entries for people with the same display name.

PRIVATE BY DESIGN
Names are processed locally. Room choices are kept locally for the browser session. There is no analytics, advertising, recording, or developer server upload. Optional Calendar suggestions require Google sign-in and read-only access to nearby events; you confirm who is actually present. The extension accesses the active Meet tab only when you open it. Copying a message places it on your system clipboard; you decide where to paste it.

The extension may briefly open and scroll Meet's People panel. Check the names before sharing: Meet layout changes, very large calls, or collapsed participant groups can affect detection. Manual editing remains available if automatic detection is incomplete.

This extension creates copyable text; it does not send chat messages automatically. Independent project, not affiliated with or endorsed by Google.

## Privacy tab

Single purpose:
Generate a randomized, editable speaking order from the current Google Meet participant list and let the user copy it to share in meeting chat.

activeTab justification:
After the user clicks the extension, check the active tab URL and temporarily access that Google Meet call to read the participants. No persistent Meet host permissions are requested. Google Calendar API host access is optional.

scripting justification:
Inject a bundled function into the active Google Meet tab to read participant display names and identifiers, open and scroll the People panel, and restore its state. This is necessary to generate the speaking order, including participants outside the visible video grid.

clipboardWrite justification:
Write the user-reviewed speaking-order message to the clipboard only when the user clicks Copy message.

storage justification:
Retain user-confirmed shared-room speaker replacements in local session storage, scoped to a Meet tab and meeting path, with six-hour expiry.

identity justification:
Sign in to Google only when the user requests Calendar name suggestions; Chrome manages access tokens and Disconnect clears them.

Optional Google APIs host justification:
Fetch nearby events from the user’s primary Calendar to match a Meet link and suggest invited speakers. No Calendar data is changed.

Remote code: No. All executable code is bundled in the uploaded ZIP.

Data disclosures: The extension locally handles participant display names and identifiers and user-entered text. It does not transmit them to the developer. Optional Calendar requests send OAuth tokens and time-range queries to Google; matching and confirmed room names are processed locally. Declare Calendar event titles/times/links, attendee names/emails/response statuses, OAuth authentication information, and local room choices as applicable. Review the dashboard's current definitions when completing the data-use questionnaire; do not claim it never accesses personal data. Ensure all declarations match PRIVACY.md and the implementation.

## Reviewer instructions

1. Install the extension in Chrome.
2. Join a Google Meet call with another participant, keeping the People panel closed initially. Normal Google Meet access is needed; there is no separate extension account or subscription.
3. Click Google Meet Participant Order in the toolbar. Keep the popup open while names load.
4. Verify that both participants appear once in the numbered message. The People panel may briefly open and close.
5. Click Shuffle again. The same participants remain; a random shuffle may occasionally produce the same order.
6. Edit the message and click Copy message. Paste into a local text editor to verify the exact text without sending a meeting message.
7. Expand Edit participants, enter one name per line, and click Use these names & shuffle. Verify the manually entered names produce a message.
8. On a non-Meet tab, verify the extension explains how to join a Meet and allows manual name entry.

9. Click People sharing a room, replace one account with two names, save, then reopen the popup in Meet. Verify both people replace that account and remain after Refresh. Reset the account and verify its original name returns.
10. If Calendar is configured, connect with an authorized test account, choose a matching event and explicitly confirm invitees. Nobody should be selected or saved automatically. Test missing attendee names and disconnect.

## Calendar release prerequisite

The default build supports manual rooms but lacks an OAuth client ID. Before advertising working Calendar connection, complete README.md’s Calendar setup for the store item ID, verify live sign-in/event matching, update this guide with reviewer access instructions, and rebuild. OAuth verification and Chrome Web Store review are separate. Do not publish the default package as having an enabled Calendar connection. Existing store artwork predates the room editor; refresh screenshots before submission.

## Submission steps

1. Register at the [developer dashboard](https://chrome.google.com/webstore/devconsole), accept Google's agreement, and pay the registration fee shown by Google. Complete any requested account verification.
2. Add a new item and upload the ZIP.
3. Fill in the listing using the text above; upload the 128×128 icon, a 1280×800 screenshot, and a 440×280 promotional tile.
4. Fill in Privacy, Distribution, and Test instructions. Supply the public privacy policy URL.
5. Submit for review. Choose automatic publishing after approval if you want it to go live as soon as Google approves it.
6. Future updates require increasing the manifest version, rebuilding the ZIP, uploading it to the same listing, and submitting for review. A GitHub push alone does not update the store.

References: [publishing](https://developer.chrome.com/docs/webstore/publish/), [registration](https://developer.chrome.com/docs/webstore/register/), [images](https://developer.chrome.com/docs/webstore/images/).
