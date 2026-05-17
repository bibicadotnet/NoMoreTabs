# NoMoreTabs

**[🇻🇳 Tiếng Việt](README.vi.md)**

![srvMVjnP](https://img.bibica.net/srvMVjnP.png)

Browser extension to handle unwanted popups and tabs.

## How it works
When a website tries to open a new tab, window, or navigate you to another site, a dialog appears inside your current tab.

### Action buttons
- **Allow this time** (green) — Allow this specific request once. No rule is saved.
- **Block this time** (red) — Block this specific request once. No rule is saved.

### Checkboxes
Checkboxes save permanent rules. Checking a checkbox automatically disables the opposite button:

- **Always allow [source] to open new tabs** — Future attempts from this domain will be allowed automatically. Disables **Block this time**.
- **Always block [source] from opening new tabs** — Future attempts from this domain will be silently blocked. Disables **Allow this time**.
- **Block all network requests to [destination]** — All requests to this domain (scripts, images, frames, etc.) will be blocked at the network level. The page reloads automatically. Disables **Allow this time**. *(Only shown when destination differs from source.)*

### Extension popup
Click the extension icon to manage lists manually:

- **🚫 Block popups from domain** — Source domains not allowed to open new tabs.
- **✅ Allow popups from domain** — Source domains allowed to open new tabs freely.
- **🔗 Block navigation to domain** — Destination domains blocked at the network level (all resource types).

Supports `*.example.com` wildcards. Adding a domain to one list removes it from the other two.

### Built-in allowlist
`allowlist.json` contains trusted domains (Google, Facebook, banks, etc.) that are always permitted and cannot be added to block lists via the UI.

### Synchronization
All changes sync across open tabs instantly via `chrome.storage.sync`.

## Installation
1. Download and extract **[NoMoreTabs.zip](https://github.com/bibicadotnet/NoMoreTabs/releases/latest/download/NoMoreTabs.zip)**.
2. Open `chrome://extensions/` in your browser.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the extracted folder.