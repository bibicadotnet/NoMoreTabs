# NoMoreTabs

A lightweight browser extension designed to block unwanted popups and tabs.

## Key Features
- **Blocks `window.open`**: Intercepts script-initiated popup attempts.
- **Link Protection**: Prevents `<a>` tags from opening new tabs via `target="_blank"`.
- **Advanced Coverage**: Works inside Iframes and Shadow DOMs.
- **Smart Allowlist**: 
  - Supports **Exact Match** for specific domains.
  - Supports **Wildcards** (e.g., `*.google.com` whitelists all Google subdomains).

## Installation
1. Download the **[NoMoreTabs.zip](https://github.com/bibicadotnet/NoMoreTabs/releases/latest/download/NoMoreTabs.zip)** file and extract it.
2. Open your browser and go to `chrome://extensions/`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the extracted folder.

## Allowlist Management
There are two ways to trust a website:
1. **Via UI**: Click the Extension icon in the toolbar to quickly whitelist the current site.
2. **Via File**: Edit the `allowlist.json` file in the extension directory.
   - Format: `["domain.com", "*.trusted-site.net"]`

---
*Version: 1.0*
