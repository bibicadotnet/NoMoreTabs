"use strict";

function getHostname(t) {
    try {
        return new URL(t.includes("http") ? t : "http://".concat(t)).hostname
    } catch (t) {
        return null
    }
}

function renderBlacklist() {
    chrome.storage.sync.get(["blacklist"], function(t) {
        var e = t.blacklist || [],
            l = document.getElementById("blacklist"),
            n = document.getElementById("empty-block-msg");
        l.innerHTML = "", 0 === e.length ? n.style.display = "block" : (n.style.display = "none", e.forEach(function(t) {
            var e = document.createElement("li");
            e.innerHTML = '\n                    <span class="host">'.concat(t, '</span>\n                    <button class="delete-btn" title="Remove">&times;</button>\n                '), e.querySelector(".delete-btn").addEventListener("click", function() {
                removeFromBlacklist(t)
            }), l.appendChild(e)
        }))
    })
}

function renderAllowlist() {
    chrome.storage.sync.get(["allowlist"], function(t) {
        var e = t.allowlist || [],
            l = document.getElementById("allowlist"),
            n = document.getElementById("empty-allow-msg");
        l.innerHTML = "", 0 === e.length ? n.style.display = "block" : (n.style.display = "none", e.forEach(function(t) {
            var e = document.createElement("li");
            e.innerHTML = '\n                    <span class="host">'.concat(t, '</span>\n                    <button class="delete-btn" title="Remove">&times;</button>\n                '), e.querySelector(".delete-btn").addEventListener("click", function() {
                removeFromAllowlist(t)
            }), l.appendChild(e)
        }))
    })
}

function addToBlacklist(t) {
    var e = getHostname(t);
    e && chrome.storage.sync.get(["blacklist", "allowlist"], function(t) {
        var l = t.blacklist || [],
            n = (t.allowlist || []).filter(function(t) {
                return t !== e
            });
        l.includes(e) ? chrome.storage.sync.set({
            allowlist: n
        }, function() {
            renderAllowlist()
        }) : (l.push(e), chrome.storage.sync.set({
            blacklist: l,
            allowlist: n
        }, function() {
            renderBlacklist(), renderAllowlist(), document.getElementById("new-block-host").value = ""
        }))
    })
}

function addToAllowlist(t) {
    var e = getHostname(t);
    e && chrome.storage.sync.get(["blacklist", "allowlist"], function(t) {
        var l = t.blacklist || [],
            n = t.allowlist || [],
            o = l.filter(function(t) {
                return t !== e
            });
        n.includes(e) ? chrome.storage.sync.set({
            blacklist: o
        }, function() {
            renderBlacklist()
        }) : (n.push(e), chrome.storage.sync.set({
            allowlist: n,
            blacklist: o
        }, function() {
            renderAllowlist(), renderBlacklist(), document.getElementById("new-allow-host").value = ""
        }))
    })
}

function removeFromBlacklist(t) {
    chrome.storage.sync.get(["blacklist"], function(e) {
        var l = e.blacklist || [];
        l = l.filter(function(e) {
            return e !== t
        }), chrome.storage.sync.set({
            blacklist: l
        }, renderBlacklist)
    })
}

function removeFromAllowlist(t) {
    chrome.storage.sync.get(["allowlist"], function(e) {
        var l = e.allowlist || [];
        l = l.filter(function(e) {
            return e !== t
        }), chrome.storage.sync.set({
            allowlist: l
        }, renderAllowlist)
    })
}

function checkCurrentTab() {
    chrome.tabs.query({
        active: !0,
        currentWindow: !0
    }, function(t) {
        if (t[0] && t[0].url) {
            var e = getHostname(t[0].url);
            if (e) {
                var l = document.getElementById("block-current"),
                    n = document.getElementById("allow-current");
                l.innerText = "Block ".concat(e), n.innerText = "Allow ".concat(e), l.style.display = "block", n.style.display = "block", l.onclick = function() {
                    addToBlacklist(e)
                }, n.onclick = function() {
                    addToAllowlist(e)
                }
            }
        }
    })
}
document.addEventListener("DOMContentLoaded", function() {
    renderBlacklist(), renderAllowlist(), checkCurrentTab(), document.getElementById("add-block-btn").addEventListener("click", function() {
        addToBlacklist(document.getElementById("new-block-host").value)
    }), document.getElementById("new-block-host").addEventListener("keypress", function(t) {
        "Enter" === t.key && addToBlacklist(t.target.value)
    }), document.getElementById("add-allow-btn").addEventListener("click", function() {
        addToAllowlist(document.getElementById("new-allow-host").value)
    }), document.getElementById("new-allow-host").addEventListener("keypress", function(t) {
        "Enter" === t.key && addToAllowlist(t.target.value)
    })
});