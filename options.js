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
        return staticAllowlist = [], staticLoaded = !0, []
    })
}

function isDomainInList(domain, list) {
    return list.some(function(x) {
        if (x.indexOf("*.") === 0) {
            var b = x.slice(2);
            return domain === b || domain.endsWith("." + b)
        }
        return domain === x
    })
}

function renderList() {
    chrome.storage.sync.get(["blacklist"], function(t) {
        var e = t.blacklist || [],
            n = document.getElementById("list");
        n.innerHTML = "", e.forEach(function(t) {
            var e = document.createElement("li");
            e.innerHTML = "\n                <span>".concat(t, '</span>\n                <button class="delete-btn" data-host="').concat(t, '">Remove</button>\n            '), n.appendChild(e)
        }), document.querySelectorAll(".delete-btn").forEach(function(t) {
            t.addEventListener("click", function(t) {
                removeHost(t.target.getAttribute("data-host"))
            })
        })
    })
}

function removeHost(t) {
    chrome.storage.sync.get(["blacklist"], function(e) {
        var n = e.blacklist || [];
        n = n.filter(function(e) {
            return e !== t
        }), chrome.storage.sync.set({
            blacklist: n
        }, renderList)
    })
}
document.getElementById("add-btn").addEventListener("click", function() {
    var t = document.getElementById("new-host"),
        e = t.value.trim().toLowerCase();
    if (!e) return;
    loadStaticAllowlist().then(function(staticList) {
        // If domain is in static allowlist, don't allow blacklisting
        if (isDomainInList(e, staticList)) {
            alert("This domain is in the global allowlist and cannot be blocked.");
            t.value = "";
            return;
        }
        chrome.storage.sync.get(["blacklist"], function(n) {
            var c = n.blacklist || [];
            c.includes(e) || (c.push(e), chrome.storage.sync.set({
                blacklist: c
            }, function() {
                t.value = "", renderList()
            }))
        })
    })
}), document.addEventListener("DOMContentLoaded", renderList);