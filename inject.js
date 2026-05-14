"use strict";

function _createForOfIteratorHelper(t, r) {
    var n = "undefined" != typeof Symbol && t[Symbol.iterator] || t["@@iterator"];
    if (!n) {
        if (Array.isArray(t) || (n = _unsupportedIterableToArray(t)) || r && t && "number" == typeof t.length) {
            n && (t = n);
            var e = 0,
                o = function() {};
            return {
                s: o,
                n: function() {
                    return e >= t.length ? {
                        done: !0
                    } : {
                        done: !1,
                        value: t[e++]
                    }
                },
                e: function(t) {
                    throw t
                },
                f: o
            }
        }
        throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")
    }
    var a, i = !0,
        u = !1;
    return {
        s: function() {
            n = n.call(t)
        },
        n: function() {
            var t = n.next();
            return i = t.done, t
        },
        e: function(t) {
            u = !0, a = t
        },
        f: function() {
            try {
                i || null == n.return || n.return()
            } finally {
                if (u) throw a
            }
        }
    }
}

function _unsupportedIterableToArray(t, r) {
    if (t) {
        if ("string" == typeof t) return _arrayLikeToArray(t, r);
        var n = {}.toString.call(t).slice(8, -1);
        return "Object" === n && t.constructor && (n = t.constructor.name), "Map" === n || "Set" === n ? Array.from(t) : "Arguments" === n || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? _arrayLikeToArray(t, r) : void 0
    }
}

function _arrayLikeToArray(t, r) {
    (null == r || r > t.length) && (r = t.length);
    for (var n = 0, e = Array(r); n < r; n++) e[n] = t[n];
    return e
}
! function() {
    var t = window.open;

    function r(t) {
        var listStr = document.documentElement.getAttribute("data-nmt-allowlist") || "[]";
        var al = [];
        try {
            al = JSON.parse(listStr)
        } catch (e) {}
        if (!t) return !1;
        try {
            if (t.startsWith("/") || t.startsWith("#")) return !0;
            var r = new URL(t, window.location.href),
                n = new URL(window.location.href);
            var h = r.hostname.toLowerCase();
            return r.origin === n.origin || al.some(function(x) {
                if (x.indexOf("*.") === 0) {
                    var b = x.slice(2);
                    return h === b || h.endsWith("." + b)
                }
                return h === x
            })
        } catch (t) {
            return !1
        }
    }

    function n(t, r, n) {
        var e = t || "about:blank";
        window.dispatchEvent(new CustomEvent("NMT_WindowOpenAttempt", {
            detail: {
                url: e,
                name: r,
                specs: n
            }
        }))
    }

    function e(t) {
        var e, o = null,
            a = _createForOfIteratorHelper(t.composedPath ? t.composedPath() : [t.target]);
        try {
            for (a.s(); !(e = a.n()).done;) {
                var i = e.value;
                if (i instanceof HTMLAnchorElement) {
                    o = i;
                    break
                }
            }
        } catch (t) {
            a.e(t)
        } finally {
            a.f()
        }
        if (o && "_blank" === o.target) {
            if (r(o.href)) return;
            t.preventDefault(), t.stopPropagation(), t.stopImmediatePropagation(), n(o.href, "_blank", null)
        }
    }
    window.open = function(e, o, a) {
        return r(e) ? t.call(window, e, o, a) : (n(e, o, a), null)
    }, document.addEventListener("click", e, !0);
    var o = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function(t) {
        var r = o.call(this, t);
        try {
            r.addEventListener("click", e, !0)
        } catch (t) {}
        return r
    }
}();