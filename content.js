"use strict";

// Storage keys:
//   popupAllow  — SOURCE domains allowed to open tabs (whitelist)
//   popupBlock  — SOURCE domains blocked from opening tabs completely
//   navBlock    — DESTINATION domains blocked from navigation (manually added)

const loadLists = async () => {
    const staticList = await fetch(chrome.runtime.getURL("allowlist.json"))
        .then(r => r.json()).catch(() => []);
    const data = await chrome.storage.sync.get(["popupAllow", "popupBlock", "navBlock"]);
    return {
        pal: [...new Set([...staticList, ...(data.popupAllow || [])])],
        pbl: data.popupBlock || [],
        nbl: data.navBlock || []
    };
};

const syncData = async () => {
    const { pal, pbl, nbl } = await loadLists();
    document.documentElement.setAttribute("data-nmt-pal", JSON.stringify(pal));
    document.documentElement.setAttribute("data-nmt-pbl", JSON.stringify(pbl));
    document.documentElement.setAttribute("data-nmt-nbl", JSON.stringify(nbl));
};

syncData();
chrome.storage.onChanged.addListener(syncData);

// ── Popup UI ──────────────────────────────────────────────────────────────────
const showPopup = (url, source, name = "_blank", specs = "", isNav = false) => {
    if (window !== window.top) {
        window.top.postMessage({ action: "NMT_IFRAME", url, source, name, specs, isNav }, "*");
        return;
    }
    if (document.getElementById("nmt-container")) return;

    const container = document.createElement("div");
    container.id = "nmt-container";
    container.style.cssText = "position:fixed;top:0;left:0;z-index:2147483647;width:0;height:0;";
    document.body.appendChild(container);

    const shadow = container.attachShadow({ mode: "open" });
    const iconUrl = chrome.runtime.getURL("app_icon_128.png");

    shadow.innerHTML = `
        <style>
            * { box-sizing: border-box; }
            .ov { position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
            .cd { background:#fff;width:420px;padding:24px 24px 20px;border-radius:14px;box-shadow:0 16px 48px rgba(0,0,0,0.35);animation:popIn 0.18s cubic-bezier(0.16,1,0.3,1); }
            .hd { display:flex;align-items:center;gap:10px;margin-bottom:6px; }
            .hd img { width:22px;height:22px;flex-shrink:0; }
            .hd h3 { margin:0;font-size:15px;font-weight:700;color:#111; }
            .src { font-size:13px;color:#475569;margin-bottom:12px;line-height:1.5; }
            .src b { color:#0f172a; }
            .dst-label { font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px; }
            .dst { background:#f1f5f9;padding:9px 11px;border-radius:7px;font-size:12px;color:#475569;word-break:break-all;line-height:1.45;margin-bottom:18px; }
            .ch-grp { display:flex;flex-direction:column;gap:8px;margin-bottom:20px; }
            .ch { display:flex;align-items:center;gap:9px;font-size:13px;color:#334155;cursor:pointer;user-select:none; }
            .ch input { width:15px;height:15px;accent-color:#1e293b;cursor:pointer;flex-shrink:0; }
            .btns { display:flex;gap:10px;justify-content:flex-end; }
            .btn { border:none;padding:9px 20px;border-radius:7px;cursor:pointer;font-weight:600;font-size:13px;transition:background .15s; }
            .btn-allow { background:#e2e8f0;color:#1e293b; }
            .btn-allow:hover { background:#cbd5e1; }
            .btn-block { background:#1e293b;color:#fff; }
            .btn-block:hover { background:#0f172a; }
            @keyframes popIn { from{transform:scale(0.94);opacity:0}to{transform:scale(1);opacity:1} }
        </style>
        <div class="ov">
            <div class="cd">
                <div class="hd">
                    <img src="${iconUrl}">
                    <h3>Popup Blocked</h3>
                </div>
                <p class="src">
                    <b>${source}</b> is trying to automatically open a ${isNav ? 'new page' : 'new tab'}:
                </p>
                <div class="dst-label">Destination URL</div>
                <div class="dst">${url.length > 150 ? url.substring(0, 150) + '...' : url}</div>
                <div class="ch-grp">
                    <label class="ch">
                        <input type="checkbox" id="cb-allow">
                        Always allow <b>${source}</b> to open new tabs
                    </label>
                    <label class="ch">
                        <input type="checkbox" id="cb-block">
                        Always block <b>${source}</b> from opening new tabs
                    </label>
                </div>
                <div class="btns">
                    <button class="btn btn-allow" id="btn-open">Open once</button>
                    <button class="btn btn-block" id="btn-block">Block</button>
                </div>
            </div>
        </div>`;

    const cbAllow = shadow.getElementById("cb-allow");
    const cbBlock = shadow.getElementById("cb-block");
    cbAllow.onchange = () => cbAllow.checked && (cbBlock.checked = false);
    cbBlock.onchange = () => cbBlock.checked && (cbAllow.checked = false);

    const closeDialog = () => {
        container.remove();
        window.postMessage({ action: 'NMT_DIALOG_CLOSED' }, '*');
    };

    // Open once — do not remember action, just open this URL
    shadow.getElementById("btn-open").onclick = () => {
        if (cbAllow.checked) saveSource(source, 'allow');
        closeDialog();
        if (isNav) {
            const token = document.documentElement.getAttribute('data-nmt-nav-token');
            window.postMessage({ action: 'NMT_DO_NAV', url, token }, '*');
        } else {
            window.open(url, name, specs);
        }
    };

    // Block — if "always block" is checked, save SOURCE to popupBlock
    shadow.getElementById("btn-block").onclick = () => {
        if (cbBlock.checked) saveSource(source, 'block');
        closeDialog();
    };
};

const saveSource = (source, action) => {
    if (action === 'allow') {
        chrome.storage.sync.get(["popupAllow", "popupBlock"], data => {
            const pal = data.popupAllow || [];
            const pbl = (data.popupBlock || []).filter(x => x !== source);
            if (!pal.includes(source)) pal.push(source);
            chrome.storage.sync.set({ popupAllow: pal, popupBlock: pbl });
        });
    } else {
        chrome.storage.sync.get(["popupAllow", "popupBlock"], data => {
            const pbl = data.popupBlock || [];
            const pal = (data.popupAllow || []).filter(x => x !== source);
            if (!pbl.includes(source)) pbl.push(source);
            chrome.storage.sync.set({ popupBlock: pbl, popupAllow: pal });
        });
    }
};

const getHost = url => {
    try { return new URL(url.startsWith('http') ? url : 'http://' + url).hostname.toLowerCase(); }
    catch (e) { return 'unknown'; }
};

window.addEventListener("message", e => {
    if (e.data?.action === 'NMT_ASK' || e.data?.action === 'NMT_IFRAME') {
        const source = e.data.source || getHost(e.data.url);
        if (source === 'unknown') return;
        showPopup(e.data.url, source, e.data.name, e.data.specs, e.data.isNav || false);
    }
});
