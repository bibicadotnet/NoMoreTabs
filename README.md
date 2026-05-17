# NoMoreTabs

**[🇻🇳 Tiếng Việt](README.vi.md)**

![srvMVjnP](https://img.bibica.net/srvMVjnP.png)

Browser extension to handle unwanted popups and tabs.

## How it works
When a website tries to open a new tab, window, or navigate you to another site, a confirmation dialog appears inside your current tab.

### Action buttons
- **Open once** — Allow this specific request one time only. The tab or page opens, but no rule is saved.
- **Block** — Stop the request and close the dialog. Nothing opens.

### Optional checkboxes
These appear inside the dialog. Each checkbox is tied to a specific button:

**When clicking Open once:**
- **Always allow [source domain] to open new tabs** — Adds the source domain to the allow list. All future attempts **from** this domain will be permitted automatically.

**When clicking Block:**
- **Always block [source domain] from opening new tabs** — Adds the source domain to the block list. All future attempts **from** this domain will be silently blocked.
- **Block all network requests to [destination domain]** — *(Only shown when the destination differs from the source and is not already listed.)* Adds the destination domain to the network block list. All requests **to** this domain (scripts, images, frames, etc.) will be blocked at the network level via `declarativeNetRequest`.

### Extension popup settings
Click the extension icon to manage lists manually:

- **🚫 Block popups from domain** — Source domains that are **not allowed** to open new tabs. Supports `*.example.com` wildcards.
- **✅ Allow popups from domain** — Source domains that are **allowed** to open new tabs freely.
- **🔗 Block navigation to domain** — Destination domains blocked at the **network level** (all resource types).

Adding a domain to one list automatically removes it from the other two.

### Built-in allowlist
`allowlist.json` contains a default list of trusted domains (Google, Facebook, banks, etc.) that are always permitted. These domains cannot be added to the block lists via the popup UI.

### Synchronization
All list changes are synchronized across open tabs instantly via `chrome.storage.sync`.

## Installation
1. Download and extract **[NoMoreTabs.zip](https://github.com/bibicadotnet/NoMoreTabs/releases/latest/download/NoMoreTabs.zip)**.
2. Open `chrome://extensions/` in your browser.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the extracted folder.