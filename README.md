# NoMoreTabs

![srvMVjnP](https://img.bibica.net/srvMVjnP.png)

Browser extension to handle unwanted popups and tabs.

## Instructions
When a website attempts to open a new tab or window, a confirmation popup will appear within your current tab.

### Popup Actions:
- **Open once**: Permits the current request this one time.
- **Block**: Stops the request and closes the popup.
- **Always allow [domain]**: Adds the domain to the allowlist. All future attempts from this domain will be permitted without a prompt.
- **Always block [domain]**: Adds the domain to the blocklist. All future attempts from this domain will be silently blocked.

### Manual Configuration:
You can manage your lists via the extension popup or by editing `allowlist.json` in the extension's root directory.
- **Block popups from domain**: Strictly forbid specific domains from opening tabs.
- **Allow popups from domain**: Permit specific domains to open tabs freely.
- **Block navigation to domain**: Prevent any navigation to specific destination domains (e.g., ad sites).

### Synchronization:
Decisions made via the checkboxes are synchronized across all open browser tabs instantly.

## Installation
1. Download and extract **[NoMoreTabs.zip](https://github.com/bibicadotnet/NoMoreTabs/releases/latest/download/NoMoreTabs.zip)**.
2. Open `chrome://extensions/` in your browser.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the extracted folder.
