# Privacy policy — Google Meet Participant Order

Effective date: October 7, 2026

Google Meet Participant Order is maintained by [bashir-abdelwahed](https://github.com/bashir-abdelwahed). Its purpose is to create a randomized speaking order from a Google Meet participant list.

## Information used locally

When you open the extension, it checks the active tab's URL to determine whether it is a Google Meet call. In a call, it reads participant display names and participant identifiers from the Meet page, using the identifiers to avoid listing the same participant twice. It may open and scroll the People panel to find participants outside the visible portion of the list.

Participant names, identifiers, the generated message, and any names or message text you enter are processed temporarily in browser memory for this feature. They are not sent to the developer or to a server. The extension does not read or record meeting audio, video, or chat history, and it does not read passwords. Optional Calendar access uses Google OAuth access tokens managed by Chrome.

## Storage and sharing

Confirmed room replacements and extra speaker names are saved locally in Chrome session storage, keyed by Meet tab ID and meeting path. They expire after six hours and expired records are removed when accessed; Chrome clears session storage at the end of the browser session or extension reload/disable. Reset removes the selected room choice. Popup messages and unsaved edits are discarded when the popup closes. A collection already running in the Meet tab may finish shortly afterwards. There is no analytics, tracking, advertising, developer server upload, or persistent database.

If you choose Connect Calendar, the extension requests read-only access to Calendar events and optional access to Google’s API domain. It sends an OAuth access token and a time range to Google Calendar to read your primary calendar’s nearby events, including event titles, dates, Meet links, and attendee names, email addresses and response statuses. It matches those links to your current Meet call locally; the Meet URL and room names are not included in Calendar API requests. Event results remain in the room-editor tab’s memory until it closes or you disconnect. Only names you explicitly save enter session storage. These data are used solely to help you identify and confirm speakers sharing a room or account. Invitees are not automatically treated as present.

Chrome manages OAuth tokens in its Identity API cache; the extension does not write them to its own storage. Disconnect clears that cache for this extension and removes its optional API permission. Google authorization can separately be revoked at https://myaccount.google.com/permissions. Saved room choices remain until reset, expiry or session end. Google processes API requests under its own policies.

Clicking **Copy message** writes the displayed message to your system clipboard. That copy may remain after the popup closes and may be retained or synced by your operating system or clipboard manager. You control whether and where to paste or send it. The extension does not automatically send messages to other meeting participants.

If you voluntarily post a support issue on GitHub, GitHub processes that information under its own privacy policy and public issues are visible to others. Do not include private names, meeting URLs, or other confidential information in issues.

## Permissions

- **activeTab:** temporarily access the active tab after you click the extension and check whether it is a Meet call.
- **scripting:** read the Meet participant list and open, scroll, and restore the People panel as necessary.
- **clipboardWrite:** copy the message when you choose Copy message.
- **storage:** retain confirmed room choices in local session storage.
- **identity:** obtain and clear OAuth tokens for optional Calendar suggestions.
- **Optional Google APIs host access:** read Calendar events only after you choose Connect Calendar and grant access.

These permissions are used only for the extension's speaking-order feature. User data is not sold, used for advertising, used to determine creditworthiness, or transferred for unrelated purposes. The extension's use of user data adheres to the Chrome Web Store User Data Policy, including its Limited Use requirements. Use of information received from Google APIs also adheres to the Google API Services User Data Policy, including Limited Use requirements.

## Contact and updates

Questions about this policy can be raised through the [project's issue tracker](https://github.com/bashir-abdelwahed/google-meet-participant-order/issues). This policy will be updated when the extension's data practices change.
