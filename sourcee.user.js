// ==UserScript==
// @name         Sourcee
// @namespace    https://tampermonkey.net/
// @version      3.1.2
// @description  HTML export tool (ASCII-safe: no glyphs, no SVG data URIs; mobile-friendly)
// @match        https://*/*
// @match        http://*/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
// @connect      *
// ==/UserScript==

(function () {
  "use strict";

  function init() {
    if (!document.body) { setTimeout(init, 100); return; }
    run();
  }

  function addStyle(css) {
    if (typeof GM_addStyle !== "undefined") GM_addStyle(css);
    else {
      var s = document.createElement("style");
      s.textContent = css;
      document.head.appendChild(s);
    }
  }

  init();

  function run() {
    var STORE_POS = "hx_pos_" + location.hostname;
    var STORE_SCALE = "hx_scale_" + location.hostname;
    var STORE_TS = "hx_ts_on_" + location.hostname;

    var isTouch = false;
    try { isTouch = matchMedia("(pointer: coarse)").matches; } catch (e) {}

    var uiScale = 1.0;
    try {
      var saved = parseFloat(localStorage.getItem(STORE_SCALE));
      if (!isNaN(saved) && saved > 0) uiScale = saved;
      else uiScale = isTouch ? 1.35 : 1.0;
    } catch (e2) {
      uiScale = isTouch ? 1.35 : 1.0;
    }

    var useTs = true;
    try { if (localStorage.getItem(STORE_TS) === "0") useTs = false; } catch (e3) {}

    addStyle(
      ":root{--hx_scale:" + uiScale + ";}\n" +
      "#hx_wrap{position:fixed;right:12px;bottom:96px;z-index:2147483647;" +
      "font:calc(13px*var(--hx_scale))/1.25 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;" +
      "color:#fff;user-select:none;touch-action:none;max-width:100vw;}\n" +

      "#hx_fab{display:inline-flex;align-items:center;gap:10px;" +
      "padding:calc(12px*var(--hx_scale)) calc(16px*var(--hx_scale));" +
      "border-radius:999px;border:1px solid rgba(255,255,255,0.18);" +
      "background:rgba(20,20,20,0.85);backdrop-filter:blur(10px);" +
      "-webkit-backdrop-filter:blur(10px);box-shadow:0 6px 18px rgba(0,0,0,0.45);" +
      "cursor:pointer;}\n" +

      "#hx_menu{margin-top:12px;width:min(calc(340px*var(--hx_scale)),92vw);" +
      "border-radius:18px;border:1px solid rgba(255,255,255,0.14);" +
      "background:rgba(25,25,25,0.95);backdrop-filter:blur(12px);" +
      "-webkit-backdrop-filter:blur(12px);box-shadow:0 18px 46px rgba(0,0,0,0.65);" +
      "padding:calc(12px*var(--hx_scale));display:none;flex-direction:column;" +
      "gap:calc(10px*var(--hx_scale));}\n" +
      "#hx_menu.show{display:flex;}\n" +

      ".hx_field,.hx_select{width:100%;box-sizing:border-box;" +
      "padding:calc(11px*var(--hx_scale));border-radius:10px;" +
      "border:1px solid rgba(255,255,255,0.15);background:rgba(0,0,0,0.32);" +
      "color:#fff;outline:none;font-size:calc(13px*var(--hx_scale));}\n" +

      /* No SVG data URI arrow. Just use a plain select. */
      ".hx_select{appearance:auto;}\n" +

      ".hx_row{display:flex;gap:calc(8px*var(--hx_scale));}\n" +
      ".hx_btn{flex:1;padding:calc(12px*var(--hx_scale));border-radius:10px;" +
      "border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.09);" +
      "color:#eee;cursor:pointer;text-align:center;font-weight:700;transition:all .2s;}\n" +
      ".hx_btn.primary{background:rgba(80,160,255,0.25);border-color:rgba(80,160,255,0.45);color:#fff;}\n" +
      ".hx_btn.danger{background:rgba(255,80,80,0.25);border-color:rgba(255,80,80,0.45);color:#ffdddd;}\n" +
      ".hx_btn.disabled{opacity:.45;pointer-events:none;}\n" +

      ".hx_settings{display:flex;align-items:center;justify-content:space-between;" +
      "font-size:calc(11px*var(--hx_scale));opacity:.86;padding:0 6px;gap:10px;flex-wrap:wrap;}\n" +
      ".hx_tiny_inp{width:calc(56px*var(--hx_scale));padding:calc(6px*var(--hx_scale));" +
      "border-radius:8px;border:1px solid rgba(255,255,255,0.22);background:transparent;" +
      "color:#fff;text-align:center;font-size:calc(12px*var(--hx_scale));}\n" +
      ".hx_clickable{cursor:pointer;text-decoration:underline;}\n" +

      "#hx_toast{position:fixed;left:50%;bottom:110px;" +
      "transform:translateX(-50%) translateY(20px);z-index:2147483647;" +
      "padding:calc(10px*var(--hx_scale)) calc(16px*var(--hx_scale));" +
      "border-radius:999px;background:rgba(20,20,20,0.9);" +
      "border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(6px);" +
      "opacity:0;pointer-events:none;transition:opacity .2s, transform .2s;" +
      "color:#fff;font-weight:700;max-width:92vw;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}\n" +
      "#hx_toast.show{opacity:1;transform:translateX(-50%) translateY(0);}\n"
    );

    function toast(msg) {
      var el = document.getElementById("hx_toast");
      if (!el) { el = document.createElement("div"); el.id = "hx_toast"; document.body.appendChild(el); }
      el.textContent = msg;
      el.classList.add("show");
      clearTimeout(el._t);
      el._t = setTimeout(function () { el.classList.remove("show"); }, 2500);
    }

    function sanitize(s) {
      s = (s || "page").replace(/^https?:\/\//i, "").replace(/[^\w.\-]+/g, "_").slice(0, 120);
      return s || "page";
    }

    function ts() {
      var d = new Date();
      function p(n) { return String(n).padStart(2, "0"); }
      return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "_" + p(d.getHours()) + "-" + p(d.getMinutes());
    }

    function dl(txt, name) {
      var b = new Blob([txt], { type: "text/plain" });
      var u = URL.createObjectURL(b);
      var a = document.createElement("a");
      a.href = u; a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(u); }, 2000);
    }

    function fetchTxt(url) {
      return fetch(url, { cache: "no-store", credentials: "include" })
        .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.text(); });
    }

    // UI
    var wrap = document.createElement("div");
    wrap.id = "hx_wrap";
    wrap.innerHTML =
      '<div id="hx_fab">Sourcee</div>' +
      '<div id="hx_menu">' +
        '<input id="hx_name" class="hx_field" placeholder="Filename">' +
        '<select id="hx_mode" class="hx_select">' +
          '<option value="fetch">Fetch Source (.html)</option>' +
          '<option value="dom">DOM Snapshot (.html)</option>' +
        '</select>' +
        '<div class="hx_row" id="hx_main_row">' +
          '<div id="hx_start" class="hx_btn primary">Start</div>' +
        '</div>' +
        '<div class="hx_settings">' +
          '<span id="hx_ts" class="hx_clickable">Time</span>' +
          '<span id="hx_scale" class="hx_clickable">UI</span>' +
        '</div>' +
      '</div>';

    document.body.appendChild(wrap);

    var fab = wrap.querySelector("#hx_fab");
    var menu = wrap.querySelector("#hx_menu");
    var nameEl = wrap.querySelector("#hx_name");
    var modeEl = wrap.querySelector("#hx_mode");
    var startEl = wrap.querySelector("#hx_start");
    var tsEl = wrap.querySelector("#hx_ts");
    var scaleEl = wrap.querySelector("#hx_scale");

    nameEl.value = sanitize(location.hostname + location.pathname);

    function refreshTs() {
      tsEl.textContent = "Time: " + (useTs ? "ON" : "OFF");
      try { localStorage.setItem(STORE_TS, useTs ? "1" : "0"); } catch (e) {}
    }
    refreshTs();

    tsEl.onclick = function () { useTs = !useTs; refreshTs(); };

    scaleEl.onclick = function () {
      var steps = [1.0, 1.15, 1.35, 1.5, 1.7];
      var idx = 0;
      for (var i = 0; i < steps.length; i++) if (Math.abs(steps[i] - uiScale) < 0.02) { idx = i; break; }
      uiScale = steps[(idx + 1) % steps.length];
      document.documentElement.style.setProperty("--hx_scale", String(uiScale));
      try { localStorage.setItem(STORE_SCALE, String(uiScale)); } catch (e2) {}
      toast("UI " + Math.round(uiScale * 100) + "%");
    };

    startEl.onclick = function () {
      var mode = modeEl.value;
      if (mode === "fetch") {
        toast("Fetching...");
        fetchTxt(location.href).then(function (t) {
          var fn = nameEl.value + "_source" + (useTs ? "_" + ts() : "") + ".html";
          dl(t, fn);
          toast("Saved.");
        }).catch(function (e) { toast("Error: " + (e && e.message ? e.message : String(e))); });
      } else if (mode === "dom") {
        toast("Snapshot...");
        var fn2 = nameEl.value + "_dom" + (useTs ? "_" + ts() : "") + ".html";
        dl("<!doctype html>\n" + document.documentElement.outerHTML, fn2);
        toast("Saved.");
      }
    };

    // drag/tap
    var isDrag = false, startX = 0, startY = 0, sL = 0, sT = 0;

    try {
      var p = JSON.parse(localStorage.getItem(STORE_POS));
      if (p && isFinite(p.x) && isFinite(p.y)) {
        wrap.style.left = p.x + "px";
        wrap.style.top = p.y + "px";
        wrap.style.right = "auto";
        wrap.style.bottom = "auto";
      }
    } catch (e4) {}

    fab.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      fab.setPointerCapture(e.pointerId);
      isDrag = false;
      startX = e.clientX; startY = e.clientY;
      var r = wrap.getBoundingClientRect();
      sL = r.left; sT = r.top;
      wrap.style.right = "auto"; wrap.style.bottom = "auto";
      wrap.style.left = sL + "px"; wrap.style.top = sT + "px";
    });

    fab.addEventListener("pointermove", function (e) {
      if (!fab.hasPointerCapture(e.pointerId)) return;
      var dx = e.clientX - startX, dy = e.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 6) isDrag = true;
      wrap.style.left = (sL + dx) + "px";
      wrap.style.top = (sT + dy) + "px";
    });

    fab.addEventListener("pointerup", function (e) {
      try { if (fab.hasPointerCapture(e.pointerId)) fab.releasePointerCapture(e.pointerId); } catch (x) {}
      if (isDrag) {
        try { localStorage.setItem(STORE_POS, JSON.stringify({ x: parseFloat(wrap.style.left), y: parseFloat(wrap.style.top) })); } catch (e5) {}
      } else {
        menu.classList.toggle("show");
      }
    });

    toast("Sourcee loaded");
  }
})();
