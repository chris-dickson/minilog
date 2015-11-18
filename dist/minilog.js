(function(){
var r=function(){var e="function"==typeof require&&require,r=function(i,o,u){o||(o=0);var n=r.resolve(i,o),t=r.m[o][n];if(!t&&e){if(t=e(n))return t}else if(t&&t.c&&(o=t.c,n=t.m,t=r.m[o][t.m],!t))throw new Error('failed to require "'+n+'" from '+o);if(!t)throw new Error('failed to require "'+i+'" from '+u);return t.exports||(t.exports={},t.call(t.exports,t,t.exports,r.relative(n,o))),t.exports};return r.resolve=function(e,n){var i=e,t=e+".js",o=e+"/index.js";return r.m[n][t]&&t?t:r.m[n][o]&&o?o:i},r.relative=function(e,t){return function(n){if("."!=n.charAt(0))return r(n,t,e);var o=e.split("/"),f=n.split("/");o.pop();for(var i=0;i<f.length;i++){var u=f[i];".."==u?o.pop():"."!=u&&o.push(u)}return r(o.join("/"),t,e)}},r}();r.m = [];
r.m[0] = {
"microee": {"c":2,"m":"index.js"},
"lib/web/index.js": function(module, exports, require){
var Minilog = require("../common/minilog.js"), oldEnable = Minilog.enable, oldDisable = Minilog.disable, isChrome = typeof navigator != "undefined" && /chrome/i.test(navigator.userAgent), console = require("./console.js");

Minilog.defaultBackend = isChrome ? console.minilog : console;

if (typeof window != "undefined") {
    try {
        Minilog.enable(JSON.parse(window.localStorage.minilogSettings));
    } catch (e) {}
    if (window.location && window.location.search) {
        var match = RegExp("[?&]minilog=([^&]*)").exec(window.location.search);
        match && Minilog.enable(decodeURIComponent(match[1]));
    }
}

Minilog.enable = function() {
    oldEnable.call(Minilog, !0);
    try {
        window.localStorage.minilogSettings = JSON.stringify(!0);
    } catch (e) {}
    return this;
}, Minilog.disable = function() {
    oldDisable.call(Minilog);
    try {
        delete window.localStorage.minilogSettings;
    } catch (e) {}
    return this;
}, exports = module.exports = Minilog, exports.backends = {
    array: require("./array.js"),
    browser: Minilog.defaultBackend,
    localStorage: require("./localstorage.js"),
    jQuery: require("./jquery_simple.js")
};
},
"lib/web/array.js": function(module, exports, require){
var Transform = require("../common/transform.js"), cache = [], logger = new Transform;

logger.write = function(e, t, n) {
    cache.push([ e, t, n ]);
}, logger.get = function() {
    return cache;
}, logger.empty = function() {
    cache = [];
}, module.exports = logger;
},
"lib/web/console.js": function(module, exports, require){
var Transform = require("../common/transform.js"), newlines = /\n+$/, logger = new Transform;

logger.write = function(e, t, n) {
    var r = n.length - 1;
    if (typeof console == "undefined" || !console.log) return;
    if (console.log.apply) return console.log.apply(console, [ e, t ].concat(n));
    if (JSON && JSON.stringify) {
        n[r] && typeof n[r] == "string" && (n[r] = n[r].replace(newlines, ""));
        try {
            for (r = 0; r < n.length; r++) n[r] = JSON.stringify(n[r]);
        } catch (i) {}
        console.log(n.join(" "));
    }
}, logger.formatters = [ "color", "minilog" ], logger.color = require("./formatters/color.js"), logger.minilog = require("./formatters/minilog.js"), module.exports = logger;
},
"lib/common/filter.js": function(module, exports, require){
// default filter
function Filter() {
    this.enabled = !0, this.defaultResult = !0, this.clear();
}

function test(e, t) {
    return e.n.test ? e.n.test(t) : e.n == t;
}

var Transform = require("./transform.js"), levelMap = {
    debug: 1,
    info: 2,
    warn: 3,
    error: 4
};

Transform.mixin(Filter), Filter.prototype.allow = function(e, t) {
    return this._white.push({
        n: e,
        l: levelMap[t]
    }), this;
}, Filter.prototype.deny = function(e, t) {
    return this._black.push({
        n: e,
        l: levelMap[t]
    }), this;
}, Filter.prototype.clear = function() {
    return this._white = [], this._black = [], this;
}, Filter.prototype.test = function(e, t) {
    var n, r = Math.max(this._white.length, this._black.length);
    for (n = 0; n < r; n++) {
        if (this._white[n] && test(this._white[n], e) && levelMap[t] >= this._white[n].l) return !0;
        if (this._black[n] && test(this._black[n], e) && levelMap[t] < this._black[n].l) return !1;
    }
    return this.defaultResult;
}, Filter.prototype.write = function(e, t, n) {
    if (!this.enabled || this.test(e, t)) return this.emit("item", e, t, n);
}, module.exports = Filter;
},
"lib/common/minilog.js": function(module, exports, require){
var Transform = require("./transform.js"), Filter = require("./filter.js"), log = new Transform, slice = Array.prototype.slice;

exports = module.exports = function(t) {
    var n = function() {
        return log.write(t, undefined, slice.call(arguments)), n;
    };
    return n.debug = function() {
        return log.write(t, "debug", slice.call(arguments)), n;
    }, n.info = function() {
        return log.write(t, "info", slice.call(arguments)), n;
    }, n.warn = function() {
        return log.write(t, "warn", slice.call(arguments)), n;
    }, n.error = function() {
        return log.write(t, "error", slice.call(arguments)), n;
    }, n.log = n.debug, n.suggest = exports.suggest, n.format = log.format, n;
}, exports.defaultBackend = exports.defaultFormatter = null, exports.pipe = function(e) {
    return log.pipe(e);
}, exports.end = exports.unpipe = exports.disable = function(e) {
    return log.unpipe(e);
}, exports.Transform = Transform, exports.Filter = Filter, exports.suggest = new Filter, exports.enable = function() {
    return exports.defaultFormatter ? log.pipe(exports.suggest).pipe(exports.defaultFormatter).pipe(exports.defaultBackend) : log.pipe(exports.suggest).pipe(exports.defaultBackend);
};
},
"lib/common/transform.js": function(module, exports, require){
function Transform() {}

var microee = require("microee");

microee.mixin(Transform), Transform.prototype.write = function(e, t, n) {
    this.emit("item", e, t, n);
}, Transform.prototype.end = function() {
    this.emit("end"), this.removeAllListeners();
}, Transform.prototype.pipe = function(e) {
    function n() {
        e.write.apply(e, Array.prototype.slice.call(arguments));
    }
    function r() {
        !e._isStdio && e.end();
    }
    var t = this;
    return t.emit("unpipe", e), e.emit("pipe", t), t.on("item", n), t.on("end", r), t.when("unpipe", function(i) {
        var o = i === e || typeof i == "undefined";
        return o && (t.removeListener("item", n), t.removeListener("end", r), e.emit("unpipe")), o;
    }), e;
}, Transform.prototype.unpipe = function(e) {
    return this.emit("unpipe", e), this;
}, Transform.prototype.format = function(e) {
    throw new Error([ "Warning: .format() is deprecated in Minilog v2! Use .pipe() instead. For example:", "var Minilog = require('minilog');", "Minilog", "  .pipe(Minilog.backends.console.formatClean)", "  .pipe(Minilog.backends.console);" ].join("\n"));
}, Transform.mixin = function(e) {
    var t = Transform.prototype, n;
    for (n in t) t.hasOwnProperty(n) && (e.prototype[n] = t[n]);
}, module.exports = Transform;
},
"lib/web/localstorage.js": function(module, exports, require){
var Transform = require("../common/transform.js"), cache = !1, logger = new Transform;

logger.write = function(e, t, n) {
    if (typeof window == "undefined" || typeof JSON == "undefined" || !JSON.stringify || !JSON.parse) return;
    try {
        cache || (cache = window.localStorage.minilog ? JSON.parse(window.localStorage.minilog) : []), cache.push([ (new Date).toString(), e, t, n ]), window.localStorage.minilog = JSON.stringify(cache);
    } catch (r) {}
}, module.exports = logger;
},
"lib/web/jquery_simple.js": function(module, exports, require){
function AjaxLogger(e) {
    this.url = e.url || "", this.cache = [], this.timer = null, this.interval = e.interval || 3e4, this.enabled = !0, this.jQuery = window.jQuery, this.extras = {}, this.json = e.json || !1;
}

var Transform = require("../common/transform.js"), cid = (new Date).valueOf().toString(36);

Transform.mixin(AjaxLogger), AjaxLogger.prototype.write = function(e, t, n) {
    this.timer || this.init(), this.cache.push([ e, t ].concat(n));
}, AjaxLogger.prototype.init = function() {
    if (!this.enabled || !this.jQuery) return;
    var e = this;
    this.timer = setTimeout(function() {
        var t, n = [], r, i = e.url;
        if (e.cache.length == 0) return e.init();
        for (t = 0; t < e.cache.length; t++) try {
            n.push(JSON.stringify(e.cache[t]));
        } catch (s) {}
        e.jQuery.isEmptyObject(e.extras) && !e.json ? (r = n.join("\n"), i = e.url + "?client_id=" + cid) : e.extras ? r = JSON.stringify(e.jQuery.extend({
            logs: n
        }, e.extras)) : r = JSON.stringify({
            logs: n
        }), e.jQuery.ajax(i, {
            type: "POST",
            cache: !1,
            processData: !1,
            data: r,
            contentType: "application/json",
            timeout: 1e4
        }).success(function(t, n, r) {
            t.interval && (e.interval = Math.max(1e3, t.interval));
        }).error(function() {
            e.interval = 3e4;
        }).always(function() {
            e.init();
        }), e.cache = [];
    }, this.interval);
}, AjaxLogger.prototype.end = function() {}, AjaxLogger.jQueryWait = function(e) {
    if (typeof window != "undefined" && (window.jQuery || window.$)) return e(window.jQuery || window.$);
    typeof window != "undefined" && setTimeout(function() {
        AjaxLogger.jQueryWait(e);
    }, 200);
}, module.exports = AjaxLogger;
},
"lib/web/formatters/util.js": function(module, exports, require){
function color(e, t) {
    return t ? "color: #fff; background: " + hex[e] + ";" : "color: " + hex[e] + ";";
}

var hex = {
    black: "#000",
    red: "#c23621",
    green: "#25bc26",
    yellow: "#bbbb00",
    blue: "#492ee1",
    magenta: "#d338d3",
    cyan: "#33bbc8",
    gray: "#808080",
    purple: "#708"
};

module.exports = color;
},
"lib/web/formatters/color.js": function(module, exports, require){
var Transform = require("../../common/transform.js"), color = require("./util.js"), colors = {
    debug: [ "cyan" ],
    info: [ "purple" ],
    warn: [ "yellow", !0 ],
    error: [ "red", !0 ]
}, logger = new Transform;

logger.write = function(e, t, n) {
    var r = console.log;
    console[t] && console[t].apply && (r = console[t], r.apply(console, [ "%c" + e + " %c" + t, color("gray"), color.apply(color, colors[t]) ].concat(n)));
}, logger.pipe = function() {}, module.exports = logger;
},
"lib/web/formatters/minilog.js": function(module, exports, require){
var Transform = require("../../common/transform.js"), color = require("./util.js"), colors = {
    debug: [ "gray" ],
    info: [ "purple" ],
    warn: [ "yellow", !0 ],
    error: [ "red", !0 ]
}, logger = new Transform;

logger.write = function(e, t, n) {
    var r = console.log;
    t != "debug" && console[t] && (r = console[t]);
    var i = [], s = 0;
    if (t != "info") {
        for (; s < n.length; s++) if (typeof n[s] != "string") break;
        r.apply(console, [ "%c" + e + " " + n.slice(0, s).join(" "), color.apply(color, colors[t]) ].concat(n.slice(s)));
    } else r.apply(console, [ "%c" + e, color.apply(color, colors[t]) ].concat(n));
}, logger.pipe = function() {}, module.exports = logger;
}
};
r.m[1] = {
};
r.m[2] = {
"index.js": function(module, exports, require){
function M() {
    this._events = {};
}

M.prototype = {
    on: function(e, t) {
        this._events || (this._events = {});
        var n = this._events;
        return (n[e] || (n[e] = [])).push(t), this;
    },
    removeListener: function(e, t) {
        var n = this._events[e] || [], r;
        for (r = n.length - 1; r >= 0 && n[r]; r--) (n[r] === t || n[r].cb === t) && n.splice(r, 1);
    },
    removeAllListeners: function(e) {
        e ? this._events[e] && (this._events[e] = []) : this._events = {};
    },
    emit: function(e) {
        this._events || (this._events = {});
        var t = Array.prototype.slice.call(arguments, 1), n, r = this._events[e] || [];
        for (n = r.length - 1; n >= 0 && r[n]; n--) r[n].apply(this, t);
        return this;
    },
    when: function(e, t) {
        return this.once(e, t, !0);
    },
    once: function(e, t, n) {
        function r() {
            n || this.removeListener(e, r), t.apply(this, arguments) && n && this.removeListener(e, r);
        }
        return t ? (r.cb = t, this.on(e, r), this) : this;
    }
}, M.mixin = function(e) {
    var t = M.prototype, n;
    for (n in t) t.hasOwnProperty(n) && (e.prototype[n] = t[n]);
}, module.exports = M;
},
"package.json": function(module, exports, require){
module.exports = {
  "name": "microee",
  "description": "A tiny EventEmitter-like client and server side library",
  "version": "0.0.2",
  "author": {
    "name": "Mikito Takada",
    "email": "mixu@mixu.net",
    "url": "http://mixu.net/"
  },
  "keywords": [
    "event",
    "events",
    "eventemitter",
    "emitter"
  ],
  "repository": {
    "type": "git",
    "url": "git://github.com/mixu/microee"
  },
  "main": "index.js",
  "scripts": {
    "test": "./node_modules/.bin/mocha --ui exports --reporter spec --bail ./test/microee.test.js"
  },
  "devDependencies": {
    "mocha": "*"
  },
  "_id": "microee@0.0.2",
  "dist": {
    "shasum": "72e80d477075e5e799470f5defea96d1dd121587",
    "tarball": "http://registry.npmjs.org/microee/-/microee-0.0.2.tgz"
  },
  "_npmVersion": "1.1.59",
  "_npmUser": {
    "name": "mixu",
    "email": "mixu@mixu.net"
  },
  "maintainers": [
    {
      "name": "mixu",
      "email": "mixu@mixu.net"
    }
  ],
  "directories": {},
  "_shasum": "72e80d477075e5e799470f5defea96d1dd121587",
  "_from": "microee@0.0.2",
  "_resolved": "https://registry.npmjs.org/microee/-/microee-0.0.2.tgz"
};
}
};
Minilog = r("lib/web/index.js");}());
