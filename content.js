"use strict";

const loadLists = async () => {
    const staticList = await fetch(chrome.runtime.getURL("allowlist.json")).then(r => r.json()).catch(() => []);
    const data = await chrome.storage.sync.get(["allowlist", "blacklist"]);
    return {
        al: [...new Set([...staticList, ...(data.allowlist || [])])],
        bl: data.blacklist || []
    };
};

const showPopup = (url, host) => {
    if (window !== window.top) {
        window.top.postMessage({ action: "NMT_FWD", url }, "*");
        return;
    }
    if (document.getElementById("nmt-container") || host === "unknown") return;

    const container = document.createElement("div");
    container.id = "nmt-container";
    container.style.cssText = "position:fixed;top:0;left:0;z-index:2147483647;width:0;height:0;";
    document.body.appendChild(container);

    const shadow = container.attachShadow({ mode: "open" });
    const iconUrl = chrome.runtime.getURL("app_icon_128.png");

    shadow.innerHTML = `
        <style>
            .ov { position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;font-family:sans-serif; }
            .cd { background:#fff;width:400px;padding:24px;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.4);animation:popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
            .hd { display:flex;align-items:center;gap:12px;margin-bottom:16px; }
            .hd img { width:24px;height:24px; }
            .hd h3 { margin:0;font-size:16px;color:#111; }
            .u { background:#f8fafc;padding:12px;border-radius:6px;font-size:13px;margin-bottom:20px;word-break:break-all;color:#334155;border:1px solid #e2e8f0;line-height:1.4; }
            .ch-grp { display:flex;flex-direction:column;gap:10px;margin-bottom:24px; }
            .ch { display:flex;align-items:center;gap:10px;font-size:13px;cursor:pointer;color:#475569; }
            .btns { display:flex;gap:12px;justify-content:flex-end; }
            button { border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:600;font-size:14px;background:#1e293b;color:#fff;transition:all 0.2s;min-width:110px; }
            button:hover { background:#0f172a; transform: translateY(-1px); }
            @keyframes popIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        </style>
        <div class="ov">
            <div class="cd">
                <div class="hd"><img src="${iconUrl}"><h3>Blocked Popup</h3></div>
                <div class="u">${url}</div>
                <div class="ch-grp">
                    <label class="ch"><input type="checkbox" id="al"> Always trust <b>${host}</b></label>
                    <label class="ch"><input type="checkbox" id="bl"> Always block <b>${host}</b></label>
                </div>
                <div class="btns">
                    <button id="c" style="background:#64748b;">Allow Once</button>
                    <button id="b">Don't Open</button>
                </div>
            </div>
        </div>`;

    const alCb = shadow.getElementById("al");
    const blCb = shadow.getElementById("bl");
    alCb.onchange = () => alCb.checked && (blCb.checked = !1);
    blCb.onchange = () => blCb.checked && (alCb.checked = !1);

    shadow.getElementById("c").onclick = () => {
        if (alCb.checked) {
            chrome.storage.sync.get(["allowlist", "blacklist"], (data) => {
                let al = data.allowlist || [];
                let bl = data.blacklist || [];
                if (!al.includes(host)) {
                    chrome.storage.sync.set({ allowlist: [...al, host], blacklist: bl.filter(i => i !== host) });
                }
            });
        }
        window.open(url, "_blank");
        container.remove();
    };

    shadow.getElementById("b").onclick = () => {
        if (blCb.checked) {
            chrome.storage.sync.get(["allowlist", "blacklist"], (data) => {
                let al = data.allowlist || [];
                let bl = data.blacklist || [];
                if (!bl.includes(host)) {
                    chrome.storage.sync.set({ blacklist: [...bl, host], allowlist: al.filter(i => i !== host) });
                }
            });
        }
        container.remove();
    };
};

const getHost = (url) => {
    try {
        const u = url.startsWith('http') ? url : 'http://' + url;
        return new URL(u).hostname.toLowerCase();
    } catch (e) { return "unknown"; }
};

const syncData = async () => {
    const { al, bl } = await loadLists();
    document.documentElement.setAttribute("data-nmt-al", JSON.stringify(al));
    document.documentElement.setAttribute("data-nmt-bl", JSON.stringify(bl));
};

// Initial sync
syncData();

window.addEventListener("message", e => {
    if (e.data?.action === 'NMT_ASK') {
        showPopup(e.data.url, getHost(e.data.url));
    }
    if (e.data?.action === "NMT_FWD") {
        showPopup(e.data.url, getHost(e.data.url));
    }
});

chrome.storage.onChanged.addListener(syncData);