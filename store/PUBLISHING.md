# Chrome Web Store submission

## Package and URLs

- Build: `npm ci && npm run package`
- Upload: `dist/meet-speaking-order-1.0.1.zip`
- Homepage: https://github.com/bashir-abdelwahed/google-meet-extension
- Support: https://github.com/bashir-abdelwahed/google-meet-extension/issues
- Privacy policy: https://github.com/bashir-abdelwahed/google-meet-extension/blob/main/PRIVACY.md
- Language: English
- Suggested category: Productivity / Workflow & Planning (choose the matching available category)
- Distribution: free, public

## Store description

Give everyone a turn in Google Meet.

Meet Speaking Order reads the participants in your current call, shuffles their names, and creates a numbered message you can copy into the meeting chat. Useful for standups, round-table discussions, check-ins, and team introductions.

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
• Keep separate entries for people with the same display name.

PRIVATE BY DESIGN
Names are processed locally. There is no account, analytics, advertising, recording, or server upload. The extension accesses the active Meet tab only when you open it. Copying a message places it on your system clipboard; you decide where to paste it.

The extension may briefly open and scroll Meet's People panel. Check the names before sharing: Meet layout changes, very large calls, or collapsed participant groups can affect detection. Manual editing remains available if automatic detection is incomplete.

This extension creates copyable text; it does not send chat messages automatically. Independent project, not affiliated with or endorsed by Google.

## Privacy tab

Single purpose:
Generate a randomized, editable speaking order from the current Google Meet participant list and let the user copy it to share in meeting chat.

activeTab justification:
After the user clicks the extension, check the active tab URL and temporarily access that Google Meet call to read the participants. No persistent host permissions are requested.

scripting justification:
Inject a bundled function into the active Google Meet tab to read participant display names and identifiers, open and scroll the People panel, and restore its state. This is necessary to generate the speaking order, including participants outside the visible video grid.

clipboardWrite justification:
Write the user-reviewed speaking-order message to the clipboard only when the user clicks Copy message.

Remote code: No. All executable code is bundled in the uploaded ZIP.

Data disclosures: The extension locally handles participant display names and identifiers and user-entered text. It does not transmit them to the developer or any service. Review the dashboard's current definitions when completing the data-use questionnaire; do not claim it never accesses personal data. Ensure all declarations match PRIVACY.md and the implementation.

## Reviewer instructions

1. Install the extension in Chrome.
2. Join a Google Meet call with another participant, keeping the People panel closed initially. Normal Google Meet access is needed; there is no separate extension account or subscription.
3. Click Meet Speaking Order in the toolbar. Keep the popup open while names load.
4. Verify that both participants appear once in the numbered message. The People panel may briefly open and close.
5. Click Shuffle again. The same participants remain; a random shuffle may occasionally produce the same order.
6. Edit the message and click Copy message. Paste into a local text editor to verify the exact text without sending a meeting message.
7. Expand Edit participants, enter one name per line, and click Use these names & shuffle. Verify the manually entered names produce a message.
8. On a non-Meet tab, verify the extension explains how to join a Meet and allows manual name entry.

## Submission steps

1. Register at the [developer dashboard](https://chrome.google.com/webstore/devconsole), accept Google's agreement, and pay the registration fee shown by Google. Complete any requested account verification.
2. Add a new item and upload the ZIP.
3. Fill in the listing using the text above; upload the 128×128 icon, a 1280×800 screenshot, and a 440×280 promotional tile.
4. Fill in Privacy, Distribution, and Test instructions. Supply the public privacy policy URL.
5. Submit for review. Choose automatic publishing after approval if you want it to go live as soon as Google approves it.
6. Future updates require increasing the manifest version, rebuilding the ZIP, uploading it to the same listing, and submitting for review. A GitHub push alone does not update the store.

References: [publishing](https://developer.chrome.com/docs/webstore/publish/), [registration](https://developer.chrome.com/docs/webstore/register/), [images](https://developer.chrome.com/docs/webstore/images/).
