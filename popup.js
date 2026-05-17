"use strict";

var staticAllowlist = [], staticLoaded = false;
var toastTimer = 0;
function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2000);
}

function loadStaticAllowlist() {
    if (staticLoaded) return Promise.resolve(staticAllowlist);
    return fetch(chrome.runtime.getURL("allowlist.json"))
        .then(r => r.json())
        .then(list => { staticAllowlist = list; staticLoaded = true; return list; })
        .catch(() => { staticLoaded = true; return []; });
}

function getHostname(t) {
    try {
        if (!t) return null;
        t = t.trim();
        if (t.startsWith('*.')) {
            const base = new URL('http://' + t.slice(2)).hostname;
            return '*.' + base;
        }
        return new URL(t.includes("http") ? t : "http://" + t).hostname;
    } catch(e) { return null; }
}

function isDomainInList(domain, list) {
    return list.some(x => {
        if (x.startsWith('*.')) {
            const base = x.slice(2);
            return domain === x || domain === base || domain.endsWith('.' + base);
        }
        return domain === x;
    });
}

function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

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
            const span = document.createElement('span');
            span.className = 'host';
            span.textContent = item;
            const btn = document.createElement('button');
            btn.className = 'delete-btn';
            btn.title = 'Remove';
            btn.textContent = '\u00d7';
            btn.addEventListener('click', () => onRemove(item));
            li.appendChild(span);
            li.appendChild(btn);
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

function addToList(input, targetKey, otherKeys) {
    const host = getHostname(input);
    if (!host) return;
    loadStaticAllowlist().then(staticList => {
        if (isDomainInList(host, staticList)) {
            showToast(host + ' is in built-in allowlist');
            return;
        }
        const allKeys = [targetKey, ...otherKeys];
        chrome.storage.sync.get(allKeys, data => {
            const target = data[targetKey] || [];
            if (target.includes(host)) return;
            target.push(host);
            const update = { [targetKey]: target };
            otherKeys.forEach(k => {
                update[k] = (data[k] || []).filter(x => x !== host);
            });
            chrome.storage.sync.set(update, () => {
                renderPopupBlocklist(); renderPopupAllowlist(); renderNavBlocklist();
                const inputMap = {
                    popupBlock: 'new-popup-block',
                    popupAllow: 'new-popup-allow',
                    navBlock: 'new-nav-block'
                };
                if (inputMap[targetKey]) {
                    document.getElementById(inputMap[targetKey]).value = '';
                }
            });
        });
    });
}

function addToPopupBlock(input) {
    addToList(input, 'popupBlock', ['popupAllow', 'navBlock']);
}
function addToPopupAllow(input) {
    addToList(input, 'popupAllow', ['popupBlock', 'navBlock']);
}
function addToNavBlock(input) {
    addToList(input, 'navBlock', ['popupBlock', 'popupAllow']);
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

document.addEventListener('DOMContentLoaded', () => {
    renderPopupBlocklist();
    renderPopupAllowlist();
    renderNavBlocklist();
    checkCurrentTab();

    document.getElementById('add-popup-block-btn').onclick = () =>
        addToPopupBlock(document.getElementById('new-popup-block').value);
    document.getElementById('new-popup-block').onkeypress = e => {
        if (e.key === 'Enter') addToPopupBlock(e.target.value);
    };

    document.getElementById('add-popup-allow-btn').onclick = () =>
        addToPopupAllow(document.getElementById('new-popup-allow').value);
    document.getElementById('new-popup-allow').onkeypress = e => {
        if (e.key === 'Enter') addToPopupAllow(e.target.value);
    };

    document.getElementById('add-nav-block-btn').onclick = () =>
        addToNavBlock(document.getElementById('new-nav-block').value);
    document.getElementById('new-nav-block').onkeypress = e => {
        if (e.key === 'Enter') addToNavBlock(e.target.value);
    };
});
