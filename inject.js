(function() {
    'use strict';

    const checkMatch = (host, list) => {
        if (!host || !list) return false;
        return list.some(x => x.startsWith('*.')
            ? (host === x.slice(2) || host.endsWith('.' + x.slice(2)))
            : host === x);
    };

    // SOURCE-based: is the current page allowed to open popups?
    // Used for window.open and location.* cross-origin (programmatic)
    const getPopupAction = () => {
        const curHost = location.hostname.toLowerCase();
        const pal = JSON.parse(document.documentElement.getAttribute('data-nmt-pal') || '[]');
        const pbl = JSON.parse(document.documentElement.getAttribute('data-nmt-pbl') || '[]');
        if (checkMatch(curHost, pal)) return 'ALLOW';
        if (checkMatch(curHost, pbl)) return 'BLOCK';
        return 'ASK';
    };

    // DESTINATION-based: used for <a> click by user action
    // Only block if destination is manually added to navBlock
    const getNavAction = (url) => {
        try {
            const dest = new URL(url, location.href);
            const nbl = JSON.parse(document.documentElement.getAttribute('data-nmt-nbl') || '[]');
            if (checkMatch(dest.hostname.toLowerCase(), nbl)) return 'BLOCK';
        } catch(e) {}
        return 'ALLOW';
    };

    // Sync flag — set IMMEDIATELY when blocking a popup, before postMessage is handled.
    // We don't use DOM check because postMessage is async: the location navigation
    // might finish before nmt-container is added to the DOM.
    let popupPending = false;

    const askPopup = (url, name, specs) => {
        popupPending = true;   // synchronous, immediate
        window.postMessage({
            action: 'NMT_ASK',
            url,
            name,
            specs,
            source: location.hostname
        }, '*');
    };

    // When user closes dialog (Block or Allow Once) → content.js sends NMT_DIALOG_CLOSED
    window.addEventListener('message', e => {
        if (e.data?.action === 'NMT_DIALOG_CLOSED') popupPending = false;
    });

    // ── window.open ─────────────────────────────────────────────────────────
    const originalOpen = window.open;

    const interceptedOpen = function(url, name, specs) {
        const targetUrl = url || 'about:blank';
        const action = getPopupAction();         // decide based on SOURCE
        if (action === 'BLOCK') return null;
        if (action === 'ASK')   { askPopup(targetUrl, name, specs); return null; }
        return originalOpen.call(window, url, name, specs);
    };

    try {
        Object.defineProperty(window, 'open', {
            get: () => interceptedOpen,
            set: () => {},
            configurable: true
        });
    } catch(e) {
        window.open = interceptedOpen;
    }

    // ── location.* cross-origin navigation (programmatic) ───────────────────
    let bypassNext = false;

    const interceptNav = (url, doNavigate) => {
        try {
            const dest = new URL(url, location.href);
            if (dest.origin === location.origin) {
                // Same-origin: permit — UNLESS waiting for user decision on a popup.
                // popupPending is set synchronously in askPopup() → ensures blocking
                // happens before navigation (unlike DOM checks which have race conditions).
                if (!popupPending) doNavigate(url);
                return;
            }
        } catch(e) { doNavigate(url); return; }

        const action = getPopupAction();
        if (action === 'ALLOW') { doNavigate(url); return; }
        if (action === 'BLOCK') return;
        askPopup(url, '_self', '');
        // do not call doNavigate → navigation is blocked, wait for user decision
    };

    const locProto = Location.prototype;
    const origAssign  = locProto.assign;
    const origReplace = locProto.replace;

    try {
        Object.defineProperty(locProto, 'assign', {
            value: function(url) { interceptNav(String(url), u => origAssign.call(this, u)); },
            writable: true, configurable: true
        });
    } catch(_) {}

    try {
        Object.defineProperty(locProto, 'replace', {
            value: function(url) { interceptNav(String(url), u => origReplace.call(this, u)); },
            writable: true, configurable: true
        });
    } catch(_) {}

    try {
        const hrefDesc = Object.getOwnPropertyDescriptor(locProto, 'href');
        if (hrefDesc?.set) {
            const origSet = hrefDesc.set;
            Object.defineProperty(locProto, 'href', {
                get: hrefDesc.get,
                set(v) { interceptNav(String(v), u => origSet.call(this, u)); },
                configurable: true,
                enumerable: hrefDesc.enumerable
            });
        }
    } catch(_) {}

    if (window.navigation) {
        window.navigation.addEventListener('navigate', e => {
            if (e.hashChange || e.downloadRequest) return;
            if (bypassNext) { bypassNext = false; return; }
            try {
                const dest = new URL(e.destination.url);
                if (dest.origin === location.origin) {
                    if (popupPending) e.preventDefault();
                    return;
                }
            } catch(_) { return; }
            const action = getPopupAction();
            if (action === 'BLOCK') { e.preventDefault(); return; }
            if (action === 'ASK')   { e.preventDefault(); askPopup(e.destination.url, '_self', ''); }
        });
    }

    // Allow Once for location navigation
    const navToken = Math.random().toString(36).slice(2);
    document.documentElement.setAttribute('data-nmt-nav-token', navToken);
    window.addEventListener('message', e => {
        if (e.data?.action === 'NMT_DO_NAV' && e.data.token === navToken) {
            bypassNext = true;
            origAssign.call(location, e.data.url);
        }
    });

    // <a> click: user-initiated
    // DO NOT ask cross-origin — user initiated click means user wants to open.
    // Only block if destination is in navBlock (manually added from popup UI).
    const handleLinkEvent = (e) => {
        if (!e.isTrusted) return;
        const a = e.composedPath().find(el => el.tagName === 'A');
        if (!a || !a.href) return;
        const action = getNavAction(a.href);
        if (action === 'BLOCK') {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
        // ALLOW → do nothing, browser opens normally
    };

    document.addEventListener('mousedown', handleLinkEvent, true);
    document.addEventListener('click',     handleLinkEvent, true);

    // ── HTMLElement.prototype.click() — programmatic click on <a> ──────────
    const originalClick = HTMLElement.prototype.click;
    HTMLElement.prototype.click = function() {
        if (this.tagName === 'A' && this.href) {
            try {
                const dest = new URL(this.href, location.href);
                if (dest.origin !== location.origin) {
                    const t = (this.target || '').toLowerCase();
                    const isNewTab = t === '_blank' || t === '_new'
                        || (t !== '' && t !== '_self' && t !== '_top' && t !== '_parent');
                    if (isNewTab) {
                        // Programmatic click opening new tab cross-origin → treat as window.open
                        const action = getPopupAction();
                        if (action === 'BLOCK') return;
                        if (action === 'ASK') { askPopup(this.href); return; }
                    }
                }
            } catch(e) {}
        }
        return originalClick.call(this);
    };

})();
