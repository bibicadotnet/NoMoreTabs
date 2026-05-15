# NoMoreTabs

Browser extension to handle unwanted popups and tabs.

## Instructions
When a website attempts to open a new tab or window, a confirmation popup will appear within your current tab.

### Popup Actions:
- **Allow Once**: Opens the requested tab this one time.
- **Don't Open**: Blocks the request and closes the popup.
- **Always trust [domain]**: Adds the domain to the allowlist. All future attempts from or to this domain will be permitted without a prompt.
- **Always block [domain]**: Adds the domain to the blacklist. All future attempts to this domain will be silently blocked without showing any prompt.

### Synchronization:
Decisions made via the "Always trust" or "Always block" checkboxes are synchronized across all open browser tabs instantly. You do not need to refresh your pages for changes to take effect.

### Manual Configuration:
You can manage the trusted domains manually by editing `allowlist.json` in the extension's root directory. 
- Use `"domain.com"` for exact matches.
- Use `"*.domain.com"` to include all subdomains.

## Installation
1. Download and extract **[NoMoreTabs.zip](https://github.com/bibicadotnet/NoMoreTabs/releases/latest/download/NoMoreTabs.zip)**.
2. Open `chrome://extensions/` in your browser.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the extracted folder.
