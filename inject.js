(function() {
    'use strict';
    const originalOpen = window.open;

    const checkMatch = (host, list) => {
        if (!host || !list) return false;
        return list.some(x => x.startsWith('*.') ? (host === x.slice(2) || host.endsWith('.' + x.slice(2))) : host === x);
    };

    const getAction = (url) => {
        // Read directly from the attributes set by content.js
        const al = JSON.parse(document.documentElement.getAttribute("data-nmt-al") || "[]");
        const bl = JSON.parse(document.documentElement.getAttribute("data-nmt-bl") || "[]");
        const curHost = location.hostname.toLowerCase();
        
        // If the current site is whitelisted, allow everything
        if (checkMatch(curHost, al)) return 'ALLOW';

        try {
            const target = new URL(url, location.href);
            const tHost = target.hostname.toLowerCase();
            
            if (checkMatch(tHost, bl)) return 'BLOCK';
            if (checkMatch(tHost, al)) return 'ALLOW';

            // Cross-origin links are always suspicious
            if (target.origin !== location.origin) return 'ASK';
        } catch (e) {
            // Treat weird/obfuscated URLs as suspicious
            if (url && !url.includes('://') && !url.startsWith('/') && !url.startsWith('#')) return 'ASK';
        }
        
        return 'ALLOW';
    };

    // ACTION 1: window.open (Used by ads for same-origin pop-unders)
    window.open = function(url, name, specs) {
        const targetUrl = url || 'about:blank';
        const action = getAction(targetUrl);

        // For window.open, we NEVER blindly trust same-origin (unless the site itself is whitelisted)
        // because that's how ad-redirects work.
        if (action === 'ALLOW') {
            try {
                const target = new URL(targetUrl, location.href);
                if (target.origin === location.origin) {
                    const al = JSON.parse(document.documentElement.getAttribute("data-nmt-al") || "[]");
                    if (!checkMatch(location.hostname.toLowerCase(), al)) {
                        window.postMessage({ action: 'NMT_ASK', url: targetUrl, name, specs }, '*');
                        return null;
                    }
                }
            } catch(e) {}
            return originalOpen.call(window, url, name, specs);
        }
        
        if (action === 'BLOCK') return null;
        
        window.postMessage({ action: 'NMT_ASK', url: targetUrl, name, specs }, '*');
        return null;
    };

    // ACTION 2: Direct link clicks
    document.addEventListener('click', e => {
        const a = e.composedPath().find(el => el.tagName === 'A');
        if (a && a.href) {
            const action = getAction(a.href);
            if (action === 'ASK') {
                e.preventDefault();
                window.postMessage({ action: 'NMT_ASK', url: a.href }, '*');
            } else if (action === 'BLOCK') {
                e.preventDefault();
            }
        }
    }, true);

    // Visual cleanup
    const style = document.createElement('style');
    style.textContent = '.is-catfish, .modal-backdrop, .sspp-modal, .sspp-area { display: none !important; }';
    (document.head || document.documentElement).appendChild(style);
})();