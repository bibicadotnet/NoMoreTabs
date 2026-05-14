"use strict";

var staticAllowlist = [],
    staticLoaded = !1;

function loadStaticAllowlist() {
    if (staticLoaded) return Promise.resolve(staticAllowlist);
    return fetch(chrome.runtime.getURL("allowlist.json")).then(function(n) {
        return n.json()
    }).then(function(n) {
        return staticAllowlist = n, staticLoaded = !0, n
    }).catch(function(n) {
        return console.error("[NoMoreTabs] Error loading allowlist:", n), staticAllowlist = [], staticLoaded = !0, []
    })
}

function injectScript() {
    try {
        var n = document.createElement("script");
        n.src = chrome.runtime.getURL("inject.js"), (document.head || document.documentElement).appendChild(n), n.onload = function() {
            n.remove()
        }
    } catch (n) {
        console.log("[NoMoreTabs] Cannot inject script.")
    }
}

function getHostname(n) {
    try {
        var e = n.trim();
        return e.match(/^https?:\/\//i) || (e = "http://" + e), new URL(e).hostname.toLowerCase()
    } catch (e) {
        try {
            var o = n.replace(/^https?:\/\//i, "");
            return (o = o.split("/")[0].split(":")[0].toLowerCase()) || "unknown-host"
        } catch (n) {
            return "unknown-host"
        }
    }
}

function addToBlacklist(n) {
    chrome.storage.sync.get(["blacklist", "allowlist"], function(e) {
        var o = e.blacklist || [],
            t = (e.allowlist || []).filter(function(e) {
                return e !== n
            });
        o.includes(n) ? chrome.storage.sync.set({
            allowlist: t
        }) : (o.push(n), chrome.storage.sync.set({
            blacklist: o,
            allowlist: t
        }))
    })
}

function addToAllowlist(n) {
    chrome.storage.sync.get(["blacklist", "allowlist"], function(e) {
        var o = e.blacklist || [],
            t = e.allowlist || [],
            a = o.filter(function(e) {
                return e !== n
            });
        t.includes(n) ? chrome.storage.sync.set({
            blacklist: a
        }) : (t.push(n), chrome.storage.sync.set({
            allowlist: t,
            blacklist: a
        }))
    })
}

function showConfirmationPopup(n, e, o, a) {
    if (window === window.top) {
        var i = document.getElementById("no-more-tabs-host");
        i && i.remove();
        var c = document.createElement("div");
        c.id = "no-more-tabs-host", c.style.cssText = "position: fixed; top: 0; left: 0; z-index: 2147483647; width: 0; height: 0;", document.body.appendChild(c);
        var r = c.attachShadow({
                mode: "open"
            }),
            s = a ? "display: none;" : "",
            d = a ? "Already Blocked" : "Allow",
            p = a ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : "",
            f = document.createElement("div");
        f.innerHTML = '\n        <style>\n            .overlay {\n                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;\n                background: rgba(0, 0, 0, 0.6);\n                backdrop-filter: blur(4px);\n                display: flex; align-items: center; justify-content: center;\n                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\n            }\n            .card {\n                background: #fff; width: 420px; max-width: 90%;\n                padding: 24px; border-radius: 12px;\n                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);\n                animation: popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);\n            }\n            h2 { margin: 0 0 12px 0; font-size: 18px; color: #111827; display: flex; align-items: center; gap: 8px;}\n            p { margin: 0 0 16px 0; color: #4b5563; font-size: 14px; line-height: 1.5; }\n            .url-box {\n                background: #eff6ff; padding: 12px; border-radius: 6px; border: 1px solid #bfdbfe;\n                word-break: break-all; font-family: \'Courier New\', monospace; color: #1d4ed8;\n                margin-bottom: 16px; font-size: 13px; max-height: 80px; overflow-y: auto;\n            }\n            .checkbox-group {\n                display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px;\n            }\n            .checkbox-wrapper {\n                display: flex; align-items: center; gap: 10px;\n                font-size: 13px; color: #374151; user-select: none;\n            }\n            input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; }\n            input[type="checkbox"]#block-domain { accent-color: #dc2626; }\n            input[type="checkbox"]#allow-domain { accent-color: #15803d; }\n            .actions { display: flex; gap: 12px; justify-content: flex-end; }\n            button {\n                border: none; padding: 10px 20px; border-radius: 6px;\n                font-weight: 600; cursor: pointer; font-size: 14px; transition: opacity 0.2s;\n            }\n            .btn-cancel { background: #f3f4f6; color: #374151; }\n            .btn-cancel:hover { background: #e5e7eb; }\n            .btn-confirm { background: #dc2626; color: white; }\n            .btn-confirm:hover { background: #b91c1c; }\n            @keyframes popIn {\n                from { transform: scale(0.95); opacity: 0; }\n                to { transform: scale(1); opacity: 1; }\n            }\n        </style>\n        <div class="overlay">\n            <div class="card">\n                <h2>🛡️ NoMoreTabs Alert</h2>\n                <p>This site wants to open a new tab to <strong>'.concat(e, '</strong>.</p>\n                <div class="url-box">').concat(n, '</div>\n                <div class="checkbox-group" style="').concat(s, '">\n                    <div class="checkbox-wrapper">\n                        <input type="checkbox" id="allow-domain">\n                        <label for="allow-domain">Always allow <strong>').concat(e, '</strong></label>\n                    </div>\n                    <div class="checkbox-wrapper">\n                        <input type="checkbox" id="block-domain">\n                        <label for="block-domain">Always block <strong>').concat(e, '</strong></label>\n                    </div>\n                </div>\n                <div class="actions">\n                    <button id="btn-cancel" class="btn-cancel" ').concat(p, ">").concat(d, '</button>\n                    <button id="btn-confirm" class="btn-confirm">').concat(a ? "Close" : "Don't Open", "</button>\n                </div>\n            </div>\n        </div>\n    "), r.appendChild(f);
        var m = r.getElementById("allow-domain"),
            h = r.getElementById("block-domain");
        m.addEventListener("change", function() {
            m.checked && (h.checked = !1)
        }), h.addEventListener("change", function() {
            h.checked && (m.checked = !1)
        }), r.getElementById("btn-confirm").onclick = function() {
            m.checked ? addToAllowlist(e) : h.checked && addToBlacklist(e), c.remove()
        }, r.getElementById("btn-cancel").onclick = function() {
            a ? c.remove() : (m.checked ? addToAllowlist(e) : h.checked && addToBlacklist(e), o(), c.remove())
        }
    }
}

function handleRequest(n) {
    if (window === window.top) {
        var e = getHostname(n),
            cur = location.hostname.toLowerCase();
        loadStaticAllowlist().then(function(staticList) {
            chrome.storage.sync.get(["blacklist", "allowlist"], function(t) {
                var a = t.blacklist || [],
                    dynamicList = t.allowlist || [];
                var al = staticList.concat(dynamicList);
                var isAllowed = al.some(function(x) {
                    if (x.indexOf("*.") === 0) {
                        var b = x.slice(2);
                        return e === b || e.endsWith("." + b)
                    }
                    return e === x
                });
                isAllowed ? window.open(n, "_blank") : a.includes(e) ? showConfirmationPopup(n, e, function() {}, !0) : showConfirmationPopup(n, e, function() {
                    window.open(n, "_blank")
                })
            })
        })
    } else window.top.postMessage({
        action: "NMT_IFRAME_REQUEST",
        url: n
    }, "*")
}
chrome.storage.sync.get("allowlist", function(d) {
    var dynamicList = d.allowlist || [];
    loadStaticAllowlist().then(function(staticList) {
        var al = staticList.concat(dynamicList);
        document.documentElement.setAttribute("data-nmt-allowlist", JSON.stringify(al)), injectScript()
    })
}), window.addEventListener("NMT_WindowOpenAttempt", function(n) {
    handleRequest(n.detail.url)
}), window === window.top && window.addEventListener("message", function(n) {
    n.data && "NMT_IFRAME_REQUEST" === n.data.action && handleRequest(n.data.url)
});