(function () {
    'use strict';

    const checkMatch = (host, list) => {
        if (!host || !list) return false;
        return list.some(x => x.startsWith('*.')
            ? (host === x.slice(2) || host.endsWith('.' + x.slice(2)))
            : host === x);
    };

    const getPopupAction = () => {
        const pal = JSON.parse(document.documentElement.getAttribute('data-nmt-pal') || '[]');
        const pbl = JSON.parse(document.documentElement.getAttribute('data-nmt-pbl') || '[]');

        let topHost;
        try {
            topHost = new URL(window.top.location.href).hostname.toLowerCase();
        } catch (e) {
            return 'ASK';
        }

        if (checkMatch(topHost, pal)) return 'ALLOW';
        if (checkMatch(topHost, pbl)) return 'BLOCK';
        return 'ASK';
    };

    const getNavAction = (url) => {
        try {
            const dest = new URL(url, location.href);
            const nbl = JSON.parse(document.documentElement.getAttribute('data-nmt-nbl') || '[]');
            if (checkMatch(dest.hostname.toLowerCase(), nbl)) return 'BLOCK';
        } catch (e) { }
        return 'ALLOW';
    };

    let popupPending = false;

    const askPopup = (url, name, specs) => {
        popupPending = true;
        window.postMessage({
            action: 'NMT_ASK',
            url,
            name,
            specs,
            source: location.hostname
        }, '*');
    };

    window.addEventListener('message', e => {
        if (e.data?.action === 'NMT_DIALOG_CLOSED') popupPending = false;
    });

    const originalOpen = window.open;

    const interceptedOpen = function (url, name, specs) {
        const targetUrl = url || 'about:blank';
        const action = getPopupAction();
        if (action === 'BLOCK') return null;
        if (action === 'ASK') { askPopup(targetUrl, name, specs); return null; }
        return originalOpen.call(window, url, name, specs);
    };

    try {
        Object.defineProperty(window, 'open', {
            get: () => interceptedOpen,
            set: () => { },
            configurable: true
        });
    } catch (e) {
        window.open = interceptedOpen;
    }

    let bypassNext = false;

    const interceptNav = (url, doNavigate) => {
        try {
            const dest = new URL(url, location.href);
            if (dest.origin === location.origin) {
                if (!popupPending) doNavigate(url);
                return;
            }
        } catch (e) { doNavigate(url); return; }

        const action = getPopupAction();
        if (action === 'ALLOW') { doNavigate(url); return; }
        if (action === 'BLOCK') return;
        askPopup(url, '_self', '');
    };

    const locProto = Location.prototype;
    const origAssign = locProto.assign;
    const origReplace = locProto.replace;

    try {
        Object.defineProperty(locProto, 'assign', {
            value: function (url) { interceptNav(String(url), u => origAssign.call(this, u)); },
            writable: true, configurable: true
        });
    } catch (_) { }

    try {
        Object.defineProperty(locProto, 'replace', {
            value: function (url) { interceptNav(String(url), u => origReplace.call(this, u)); },
            writable: true, configurable: true
        });
    } catch (_) { }

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
    } catch (_) { }


    const navToken = Math.random().toString(36).slice(2);
    document.documentElement.setAttribute('data-nmt-nav-token', navToken);
    window.addEventListener('message', e => {
        if (e.data?.action === 'NMT_DO_NAV' && e.data.token === navToken) {
            bypassNext = true;
            origAssign.call(location, e.data.url);
        }
    });

    const handleLinkEvent = (e) => {
        if (!e.isTrusted) return;
        const a = e.composedPath().find(el => el.tagName === 'A');
        if (!a || !a.href) return;

        // Check destination blocklist
        const navAction = getNavAction(a.href);
        if (navAction === 'BLOCK') {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return;
        }

        // Check if link opens a new tab
        const t = (a.target || '').toLowerCase();
        const isNewTab = t === '_blank' || t === '_new'
            || (t !== '' && t !== '_self' && t !== '_top' && t !== '_parent');

        if (isNewTab) {
            try {
                const dest = new URL(a.href, location.href);
                if (dest.origin === location.origin) return;
            } catch (_) { return; }

            const action = getPopupAction();
            if (action === 'BLOCK') {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return;
            }
            if (action === 'ASK') {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                askPopup(a.href, a.target || '_blank', '');
                return;
            }
        }
    };

    document.addEventListener('mousedown', handleLinkEvent, true);
    document.addEventListener('click', handleLinkEvent, true);

    const originalClick = HTMLElement.prototype.click;
    HTMLElement.prototype.click = function () {
        if (this.tagName === 'A' && this.href) {
            try {
                const dest = new URL(this.href, location.href);
                if (dest.origin !== location.origin) {
                    const t = (this.target || '').toLowerCase();
                    const isNewTab = t === '_blank' || t === '_new'
                        || (t !== '' && t !== '_self' && t !== '_top' && t !== '_parent');
                    if (isNewTab) {
                        const action = getPopupAction();
                        if (action === 'BLOCK') return;
                        if (action === 'ASK') { askPopup(this.href); return; }
                    }
                }
            } catch (e) { }
        }
        return originalClick.call(this);
    };

})();
