"use strict";

var staticAllowlist = [], staticLoaded = false;

function loadStaticAllowlist() {
    if (staticLoaded) return Promise.resolve(staticAllowlist);
    return fetch(chrome.runtime.getURL("allowlist.json"))
        .then(r => r.json())
        .then(list => { staticAllowlist = list; staticLoaded = true; return list; })
        .catch(() => { staticLoaded = true; return []; });
}

function getHostname(t) {
    try { return new URL(t.includes("http") ? t : "http://" + t).hostname; }
    catch(e) { return null; }
}

function isDomainInList(domain, list) {
    return list.some(x => x.startsWith('*.') 
        ? (domain === x.slice(2) || domain.endsWith('.' + x.slice(2)))
        : domain === x);
}

// ── Render lists ──────────────────────────────────────────────────────────────

function renderList(storageKey, listId, emptyId, onRemove) {
    chrome.storage.sync.get([storageKey], data => {
        const items = data[storageKey] || [];
        const ul = document.getElementById(listId);
        const em = document.getElementById(emptyId);
        ul.innerHTML = '';
        if (items.length === 0) { em.style.display = 'block'; return; }
        em.style.display = 'none';
        items.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="host">${item}</span><button class="delete-btn" title="Remove">&times;</button>`;
            li.querySelector('.delete-btn').addEventListener('click', () => onRemove(item));
            ul.appendChild(li);
        });
    });
}

function renderPopupBlocklist() {
    renderList('popupBlock', 'popup-blocklist', 'empty-popup-block-msg', removeFromPopupBlock);
}
function renderPopupAllowlist() {
    renderList('popupAllow', 'popup-allowlist', 'empty-popup-allow-msg', removeFromPopupAllow);
}
function renderNavBlocklist() {
    renderList('navBlock', 'nav-blocklist', 'empty-nav-block-msg', removeFromNavBlock);
}

// ── Add / Remove ──────────────────────────────────────────────────────────────

function addToPopupBlock(input) {
    const host = getHostname(input);
    if (!host) return;
    loadStaticAllowlist().then(staticList => {
        if (isDomainInList(host, staticList)) return;
        chrome.storage.sync.get(['popupBlock', 'popupAllow'], data => {
            const pbl = data.popupBlock || [];
            const pal = (data.popupAllow || []).filter(x => x !== host);
            if (!pbl.includes(host)) pbl.push(host);
            chrome.storage.sync.set({ popupBlock: pbl, popupAllow: pal }, () => {
                renderPopupBlocklist(); renderPopupAllowlist();
                document.getElementById('new-popup-block').value = '';
            });
        });
    });
}

function addToPopupAllow(input) {
    const host = getHostname(input);
    if (!host) return;
    loadStaticAllowlist().then(staticList => {
        if (isDomainInList(host, staticList)) return;
        chrome.storage.sync.get(['popupBlock', 'popupAllow'], data => {
            const pal = data.popupAllow || [];
            const pbl = (data.popupBlock || []).filter(x => x !== host);
            if (!pal.includes(host)) pal.push(host);
            chrome.storage.sync.set({ popupAllow: pal, popupBlock: pbl }, () => {
                renderPopupAllowlist(); renderPopupBlocklist();
                document.getElementById('new-popup-allow').value = '';
            });
        });
    });
}

function addToNavBlock(input) {
    const host = getHostname(input);
    if (!host) return;
    chrome.storage.sync.get(['navBlock'], data => {
        const nbl = data.navBlock || [];
        if (!nbl.includes(host)) nbl.push(host);
        chrome.storage.sync.set({ navBlock: nbl }, () => {
            renderNavBlocklist();
            document.getElementById('new-nav-block').value = '';
        });
    });
}

function removeFromPopupBlock(host) {
    chrome.storage.sync.get(['popupBlock'], data => {
        chrome.storage.sync.set({ popupBlock: (data.popupBlock || []).filter(x => x !== host) }, renderPopupBlocklist);
    });
}
function removeFromPopupAllow(host) {
    chrome.storage.sync.get(['popupAllow'], data => {
        chrome.storage.sync.set({ popupAllow: (data.popupAllow || []).filter(x => x !== host) }, renderPopupAllowlist);
    });
}
function removeFromNavBlock(host) {
    chrome.storage.sync.get(['navBlock'], data => {
        chrome.storage.sync.set({ navBlock: (data.navBlock || []).filter(x => x !== host) }, renderNavBlocklist);
    });
}

// ── Quick buttons for current tab ───────────────────────────────────────────
function checkCurrentTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (!tabs[0]?.url) return;
        const host = getHostname(tabs[0].url);
        if (!host) return;
        loadStaticAllowlist().then(staticList => {
            if (isDomainInList(host, staticList)) return;
            const btnBlock = document.getElementById('quick-popup-block');
            const btnAllow = document.getElementById('quick-popup-allow');
            btnBlock.textContent = `Block popups from ${host}`;
            btnAllow.textContent = `Allow popups from ${host}`;
            btnBlock.style.display = 'block';
            btnAllow.style.display = 'block';
            btnBlock.onclick = () => addToPopupBlock(host);
            btnAllow.onclick = () => addToPopupAllow(host);
        });
    });
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    renderPopupBlocklist();
    renderPopupAllowlist();
    renderNavBlocklist();
    checkCurrentTab();

    document.getElementById('add-popup-block-btn').onclick = () =>
        addToPopupBlock(document.getElementById('new-popup-block').value);
    document.getElementById('new-popup-block').onkeypress = e =>
        e.key === 'Enter' && addToPopupBlock(e.target.value);

    document.getElementById('add-popup-allow-btn').onclick = () =>
        addToPopupAllow(document.getElementById('new-popup-allow').value);
    document.getElementById('new-popup-allow').onkeypress = e =>
        e.key === 'Enter' && addToPopupAllow(e.target.value);

    document.getElementById('add-nav-block-btn').onclick = () =>
        addToNavBlock(document.getElementById('new-nav-block').value);
    document.getElementById('new-nav-block').onkeypress = e =>
        e.key === 'Enter' && addToNavBlock(e.target.value);
});
