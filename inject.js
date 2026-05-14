(function() {
    const originalOpen = window.open;
    
    const checkMatch = (domain, list) => {
        if (!domain) return false;
        return list.some(x => x.startsWith('*.') ? 
            (domain === x.slice(2) || domain.endsWith('.' + x.slice(2))) : 
            domain === x);
    };

    const isAllowed = (url) => {
        const al = JSON.parse(document.documentElement.dataset.nmtAllowlist || '[]');
        const bl = JSON.parse(document.documentElement.dataset.nmtBlacklist || '[]');
        const curHost = location.hostname.toLowerCase();
        
        // If current site is trusted, allow everything
        if (checkMatch(curHost, al)) return { allowed: true };
        
        if (!url || url === 'about:blank') return { allowed: false, blocked: true };
        
        try {
            const target = new URL(url, location.href);
            const targetHost = target.hostname.toLowerCase();
            
            if (target.origin === location.origin) return { allowed: true };
            if (checkMatch(targetHost, al)) return { allowed: true };
            if (checkMatch(targetHost, bl)) return { allowed: false, blocked: true }; // Already blacklisted
            
            return { allowed: false }; // Need to ask
        } catch (e) {
            return { allowed: true };
        }
    };

    window.open = function(url, name, specs) {
        const res = isAllowed(url);
        if (res.allowed) return originalOpen.call(window, url, name, specs);
        if (!res.blocked) window.dispatchEvent(new CustomEvent('NMT_BLOCKED', { detail: { url: url || 'about:blank', name, specs } }));
        return null;
    };

    document.addEventListener('click', e => {
        const a = e.composedPath().find(el => el.tagName === 'A' && el.target === '_blank');
        if (a) {
            const res = isAllowed(a.href);
            if (!res.allowed) {
                e.preventDefault();
                if (!res.blocked) window.dispatchEvent(new CustomEvent('NMT_BLOCKED', { detail: { url: a.href } }));
            }
        }
    }, true);
})();