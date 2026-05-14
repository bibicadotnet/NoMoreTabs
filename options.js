"use strict";

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
        e = t.value.trim();
    e && chrome.storage.sync.get(["blacklist"], function(n) {
        var c = n.blacklist || [];
        c.includes(e) || (c.push(e), chrome.storage.sync.set({
            blacklist: c
        }, function() {
            t.value = "", renderList()
        }))
    })
}), document.addEventListener("DOMContentLoaded", renderList);