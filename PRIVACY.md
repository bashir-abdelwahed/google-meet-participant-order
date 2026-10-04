# Privacy policy — Google Meet Participant Order

Effective date: October 4, 2026

Google Meet Participant Order is maintained by [bashir-abdelwahed](https://github.com/bashir-abdelwahed). Its purpose is to create a randomized speaking order from a Google Meet participant list.

## Information used locally

When you open the extension, it checks the active tab's URL to determine whether it is a Google Meet call. In a call, it reads participant display names and participant identifiers from the Meet page, using the identifiers to avoid listing the same participant twice. It may open and scroll the People panel to find participants outside the visible portion of the list.

Participant names, identifiers, the generated message, and any names or message text you enter are processed temporarily in browser memory for this feature. They are not sent to the developer or to a server. The extension does not read or record meeting audio, video, or chat history, and it does not access your Google account credentials.

## Storage and sharing

The extension does not save participant information to extension storage, files, or a database. Popup data is discarded when the popup closes; a collection already running in the Meet tab may finish shortly afterwards. The extension does not use analytics, tracking, advertising, or external network requests.

Clicking **Copy message** writes the displayed message to your system clipboard. That copy may remain after the popup closes and may be retained or synced by your operating system or clipboard manager. You control whether and where to paste or send it. The extension does not automatically send messages to other meeting participants.

If you voluntarily post a support issue on GitHub, GitHub processes that information under its own privacy policy and public issues are visible to others. Do not include private names, meeting URLs, or other confidential information in issues.

## Permissions

- **activeTab:** temporarily access the active tab after you click the extension and check whether it is a Meet call.
- **scripting:** read the Meet participant list and open, scroll, and restore the People panel as necessary.
- **clipboardWrite:** copy the message when you choose Copy message.

These permissions are used only for the extension's speaking-order feature. User data is not sold, used for advertising, used to determine creditworthiness, or transferred for unrelated purposes. The extension's use of user data adheres to the Chrome Web Store User Data Policy, including its Limited Use requirements.

## Contact and updates

Questions about this policy can be raised through the [project's issue tracker](https://github.com/bashir-abdelwahed/google-meet-participant-order/issues). This policy will be updated when the extension's data practices change.
