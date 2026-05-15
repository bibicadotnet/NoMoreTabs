(function() {
    'use strict';

    // ── Helpers ───────────────────────────────────────────────────────────────
    const checkMatch = (host, list) => {
        if (!host || !list) return false;
        return list.some(x => x.startsWith('*.') 
            ? (host === x.slice(2) || host.endsWith('.' + x.slice(2))) 
            : host === x);
    };

    const getAction = (url) => {
        if (!url || url.startsWith('javascript:') || url.startsWith('mailto:') 
            || url.startsWith('tel:') || url.startsWith('#')) {
            return 'ALLOW';
        }
        const al = JSON.parse(document.documentElement.getAttribute("data-nmt-al") || "[]");
        const bl = JSON.parse(document.documentElement.getAttribute("data-nmt-bl") || "[]");
        const curHost = location.hostname.toLowerCase();

        if (checkMatch(curHost, al)) return 'ALLOW';

        try {
            const target = new URL(url, location.href);
            const tHost = target.hostname.toLowerCase();
            if (checkMatch(tHost, bl)) return 'BLOCK';
            if (checkMatch(tHost, al)) return 'ALLOW';
            if (target.origin !== location.origin) return 'ASK';
        } catch (e) {
            if (url && !url.includes('://') && !url.startsWith('/')
                && !url.startsWith('.') && !url.startsWith('#')) return 'ASK';
        }
        return 'ALLOW';
    };

    const askPopup = (url, name, specs, source = 'open') =>
        window.postMessage({ action: 'NMT_ASK', url, name, specs, source }, '*');

    // ── Override window.open ──────────────────────────────────────────────────
    const originalOpen = window.open;

    const interceptedOpen = function(url, name, specs) {
        const targetUrl = url || 'about:blank';
        const action = getAction(targetUrl);

        if (action === 'ALLOW') {
            try {
                const target = new URL(targetUrl, location.href);
                if (target.origin === location.origin) {
                    const al = JSON.parse(document.documentElement.getAttribute("data-nmt-al") || "[]");
                    if (!checkMatch(location.hostname.toLowerCase(), al)) {
                        askPopup(targetUrl, name, specs, 'open');
                        return null;
                    }
                }
            } catch(e) {}
            return originalOpen.call(window, url, name, specs);
        }
        if (action === 'BLOCK') return null;

        askPopup(targetUrl, name, specs, 'open');
        return null;
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

    // ── Intercept location navigation ─────────────────────────────────────────
    // location.assign / location.replace / location.href đều là read-only property
    // trên Location instance — không thể gán trực tiếp.
    // Cách đúng: Object.defineProperty trên Location.prototype cho từng method/accessor.

    let bypassNext = false;

    const blockNav = (url, doNavigate) => {
        const action = getAction(url);
        if (action === 'ALLOW') { doNavigate(url); return; }
        if (action === 'BLOCK') return;
        askPopup(url, '_self', '', 'location');
        // không gọi doNavigate → navigation bị chặn
    };

    const locProto = Location.prototype;

    // Lưu native methods trước khi override
    const origAssign  = locProto.assign;
    const origReplace = locProto.replace;

    // Override assign
    try {
        Object.defineProperty(locProto, 'assign', {
            value: function(url) { blockNav(String(url), u => origAssign.call(this, u)); },
            writable: true, configurable: true
        });
    } catch(_) {}

    // Override replace
    try {
        Object.defineProperty(locProto, 'replace', {
            value: function(url) { blockNav(String(url), u => origReplace.call(this, u)); },
            writable: true, configurable: true
        });
    } catch(_) {}

    // Override href setter
    try {
        const hrefDesc = Object.getOwnPropertyDescriptor(locProto, 'href');
        if (hrefDesc?.set) {
            const origSet = hrefDesc.set;
            Object.defineProperty(locProto, 'href', {
                get: hrefDesc.get,
                set(v) { blockNav(String(v), u => origSet.call(this, u)); },
                configurable: true,
                enumerable: hrefDesc.enumerable
            });
        }
    } catch(_) {}

    // Navigation API — safety net: bắt mọi navigation còn sót
    // (nếu browser không cho override Location.prototype)
    if (window.navigation) {
        window.navigation.addEventListener('navigate', e => {
            if (e.hashChange || e.downloadRequest) return;
            if (bypassNext) { bypassNext = false; return; }
            const action = getAction(e.destination.url);
            if (action === 'BLOCK') { e.preventDefault(); return; }
            if (action === 'ASK') {
                e.preventDefault();
                askPopup(e.destination.url, '_self', '', 'location');
            }
        });
    }

    // Allow Once cho location navigation: gửi NMT_DO_NAV → bypass intercept 1 lần
    const navToken = Math.random().toString(36).slice(2);
    document.documentElement.setAttribute('data-nmt-nav-token', navToken);

    window.addEventListener('message', e => {
        if (e.data?.action === 'NMT_DO_NAV' && e.data.token === navToken) {
            bypassNext = true;
            origAssign.call(location, e.data.url);
        }
    });

    // ── Intercept <a> clicks ──────────────────────────────────────────────────
    const handleLinkEvent = (e) => {
        const a = e.composedPath().find(el => el.tagName === 'A');
        if (!a || !a.href) return;
        const action = getAction(a.href);
        if (action === 'ASK') {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            if (e.type === 'click') askPopup(a.href, a.target || '_blank', '', 'open');
        } else if (action === 'BLOCK') {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
    };

    document.addEventListener('mousedown', handleLinkEvent, true);
    document.addEventListener('click',     handleLinkEvent, true);

})();
