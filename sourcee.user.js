// ==UserScript==
// @name         Sourcee
// @namespace    https://tampermonkey.net/
// @version      3.3
// @description  The ultimate HTML export tool. (Bulletproof Mobile Drag + AI Clean Dump)
// @match        https://*/*
// @match        http://*/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
// @connect      *
// ==/UserScript==

(function () {
  "use strict";

  function initSourcee() {
    if (!document.body) { setTimeout(initSourcee, 100); return; }
    runScript();
  }

  function safeAddStyle(css) {
    if (typeof GM_addStyle !== "undefined") GM_addStyle(css);
    else {
      var style = document.createElement("style");
      style.textContent = css;
      document.head.appendChild(style);
    }
  }

  initSourcee();

  function runScript() {
    // ---------- Settings ----------
    var STORE_POS = "hx_pos_" + location.hostname;
    var STORE_SCALE = "hx_scale_" + location.hostname;
    var STORE_TS = "hx_ts_on_" + location.hostname;

    var isTouch = false;
    try { isTouch = matchMedia("(pointer: coarse)").matches; } catch (e) {}

    // default bigger on phones
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

    // ---------- UI Styles ----------
    var css =
      ":root{--hx_scale:" + uiScale + ";}\n" +
      "#hx_wrap{position:fixed;right:12px;bottom:96px;z-index:2147483647;" +
      "font:calc(13px*var(--hx_scale))/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;" +
      "color:#fff;user-select:none;touch-action:none;max-width:100vw;}\n" +

      "#hx_fab{display:inline-flex;align-items:center;gap:10px;" +
      "padding:calc(12px*var(--hx_scale)) calc(16px*var(--hx_scale));" +
      "border-radius:999px;border:1px solid rgba(255,255,255,0.18);" +
      "background:rgba(20,20,20,0.85);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);" +
      "box-shadow:0 6px 18px rgba(0,0,0,0.45);cursor:pointer;}\n" +

      "#hx_menu{margin-top:12px;width:min(calc(340px*var(--hx_scale)),92vw);" +
      "border-radius:18px;border:1px solid rgba(255,255,255,0.14);background:rgba(25,25,25,0.95);" +
      "backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);" +
      "box-shadow:0 18px 46px rgba(0,0,0,0.65);padding:calc(12px*var(--hx_scale));" +
      "display:none;flex-direction:column;gap:calc(10px*var(--hx_scale));}\n" +
      "#hx_menu.show{display:flex;}\n" +

      ".hx_field,.hx_select{width:100%;box-sizing:border-box;padding:calc(11px*var(--hx_scale));" +
      "border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(0,0,0,0.32);" +
      "color:#fff;outline:none;font-size:calc(13px*var(--hx_scale));}\n" +
      ".hx_select{appearance:auto;}\n" +

      ".hx_row{display:flex;gap:calc(8px*var(--hx_scale));}\n" +
      ".hx_btn{flex:1;padding:calc(12px*var(--hx_scale));border-radius:10px;" +
      "border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.09);color:#eee;" +
      "cursor:pointer;text-align:center;font-weight:700;transition:all .2s;}\n" +
      ".hx_btn.primary{background:rgba(80,160,255,0.25);border-color:rgba(80,160,255,0.45);color:#fff;}\n" +
      ".hx_btn.danger{background:rgba(255,80,80,0.25);border-color:rgba(255,80,80,0.45);color:#ffdddd;}\n" +
      ".hx_btn.disabled{opacity:.45;pointer-events:none;}\n" +
      ".hx_btn.working{background:rgba(255,170,0,0.32)!important;border-color:rgba(255,170,0,0.62)!important;" +
      "color:#fff!important;opacity:1!important;pointer-events:none;animation:hx_pulse 1.5s infinite ease-in-out;}\n" +
      "@keyframes hx_pulse{0%{opacity:1}50%{opacity:.72}100%{opacity:1}}\n" +

      ".hx_settings{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;" +
      "font-size:calc(11px*var(--hx_scale));opacity:.86;padding:0 6px;}\n" +
      ".hx_tiny_inp{width:calc(56px*var(--hx_scale));padding:calc(6px*var(--hx_scale));border-radius:8px;" +
      "border:1px solid rgba(255,255,255,0.22);background:transparent;color:#fff;text-align:center;" +
      "font-size:calc(12px*var(--hx_scale));}\n" +
      ".hx_clickable{cursor:pointer;text-decoration:underline;}\n" +

      "#hx_toast{position:fixed;left:50%;bottom:110px;transform:translateX(-50%) translateY(20px);" +
      "z-index:2147483647;padding:calc(10px*var(--hx_scale)) calc(16px*var(--hx_scale));border-radius:999px;" +
      "background:rgba(20,20,20,0.9);border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(6px);" +
      "opacity:0;pointer-events:none;transition:opacity .2s, transform .2s;color:#fff;font-weight:700;" +
      "max-width:92vw;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}\n" +
      "#hx_toast.show{opacity:1;transform:translateX(-50%) translateY(0);}\n" +

      "@media (max-width:480px){#hx_wrap{bottom:110px;}}\n";

    safeAddStyle(css);

    // ---------- Utilities ----------
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

    function fetchCors(url) {
      return new Promise(function (resolve, reject) {
        if (typeof GM_xmlhttpRequest === "undefined") return reject("GM_xmlhttpRequest not granted");
        GM_xmlhttpRequest({
          method: "GET",
          url: url,
          onload: function (res) { resolve(res.responseText); },
          onerror: function (err) { reject(err); }
        });
      });
    }

    function beautify(html) {
      var t = (html || "").replace(/>\s+</g, ">\n<").replace(/\n{3,}/g, "\n\n");
      var i = 0, out = [];
      t.split("\n").forEach(function (l) {
        var tr = l.trim();
        if (!tr) return;
        if (/^<\/[^>]+>/.test(tr)) i = Math.max(0, i - 1);
        out.push("  ".repeat(i) + tr);
        if (/^<[^!/][^>]*[^/]>$/.test(tr) && !/^<(script|style|meta|link|img|br|hr|input)/i.test(tr)) i++;
      });
      return out.join("\n");
    }

    // ---------- Dev Dump ----------
    function getCleanDOM() {
      var clone = document.documentElement.cloneNode(true);
      
      // Auto-remove Sourcee from the dump!
      var sourceeWidget = clone.querySelector("#hx_wrap");
      if (sourceeWidget) sourceeWidget.remove();
      var sourceeToast = clone.querySelector("#hx_toast");
      if (sourceeToast) sourceeToast.remove();

      clone.querySelectorAll("script, noscript, iframe, canvas, video, audio, picture").forEach(function (e) { e.remove(); });
      clone.querySelectorAll("svg").forEach(function (e) { if ((e.innerHTML || "").length > 200) e.innerHTML = ""; });
      clone.querySelectorAll("img, source").forEach(function (e) {
        var src = e.getAttribute("src") || "";
        if (src.indexOf("data:") === 0) e.removeAttribute("src");
        if (e.getAttribute("srcset")) e.removeAttribute("srcset");
      });
      return clone.outerHTML;
    }

    function buildDevDump(onProg) {
      var fence = "```";
      var md = "# AI DEV DUMP: " + location.href + "\n\n";

      md += "## 1. INLINE & INJECTED STYLES (<style>)\n";
      document.querySelectorAll("style").forEach(function (s, idx) {
        var cssText = (s.textContent || "").trim();
        if (!cssText) return;
        md += "\n### Style Block " + (idx + 1) + "\n" + fence + "css\n" + cssText + "\n" + fence + "\n";
      });

      md += "\n## 2. EXTERNAL STYLESHEETS (<link rel=\"stylesheet\">)\n";
      var links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

      var chain = Promise.resolve();
      links.forEach(function (lnk, i) {
        chain = chain.then(function () {
          onProg(i + 1, links.length);
          var href = lnk.href;
          if (!href) return;
          md += "\n### Stylesheet: " + href + "\n";
          return fetchCors(href).then(function (cssText) {
            md += fence + "css\n" + (cssText || "").trim() + "\n" + fence + "\n";
          }).catch(function () {
            md += "> [Failed to fetch: CORS/permissions/network]\n";
          });
        });
      });

      return chain.then(function () {
        md += "\n## 3. DOM SNAPSHOT (Sanitized for AI Context)\n";
        md += fence + "html\n" + beautify(getCleanDOM()) + "\n" + fence + "\n";
        return md;
      });
    }

    // ---------- Self-contained (inline <img src>) ----------
    function fetchBase64(url, signal) {
      if (signal && signal.aborted) return Promise.reject(new Error("STOP"));
      return fetch(url, { signal: signal, cache: "no-store", credentials: "include" })
        .then(function (r) { if (!r.ok) throw new Error("IMG " + r.status); return r.blob(); })
        .then(function (b) {
          return new Promise(function (res, rej) {
            var fr = new FileReader();
            fr.onload = function () { res(fr.result); };
            fr.onerror = rej;
            fr.readAsDataURL(b);
          });
        });
    }

    function processImages(html, limit, signal, onProg) {
      var doc = new DOMParser().parseFromString(html, "text/html");
      var imgs = Array.from(doc.querySelectorAll("img")).filter(function (i) {
        var src = i.getAttribute("src") || "";
        return src && src.indexOf("data:") !== 0;
      });

      var total = limit > 0 ? Math.min(limit, imgs.length) : imgs.length;
      onProg(0, total);
      var count = 0;

      function step() {
        if (count >= total) return Promise.resolve({ html: doc.documentElement.outerHTML, stopped: false });
        if (signal && signal.aborted) return Promise.resolve({ html: doc.documentElement.outerHTML, stopped: true });

        var img = imgs[count];
        var raw = img.getAttribute("src");
        var abs;
        try { abs = new URL(raw, location.href).href; }
        catch (e) { count++; onProg(count, total); return step(); }

        return fetchBase64(abs, signal)
          .then(function (b64) {
            img.setAttribute("src", b64);
            img.removeAttribute("srcset");
            img.removeAttribute("loading");
          })
          .catch(function (e) {
            if (signal && signal.aborted) return;
            console.warn("[Sourcee] image inline failed:", e);
          })
          .then(function () {
            count++;
            onProg(count, total);
            return step();
          });
      }

      return step();
    }

    // ---------- UI ----------
    var wrap = document.createElement("div");
    wrap.id = "hx_wrap";
    wrap.innerHTML =
      '<div id="hx_fab">Sourcee</div>' +
      '<div id="hx_menu">' +
        '<input id="hx_name" class="hx_field" placeholder="Filename">' +
        '<select id="hx_mode" class="hx_select">' +
          '<option value="fetch">Fetch Source (.html)</option>' +
          '<option value="dom">DOM Snapshot (.html)</option>' +
          '<option value="pretty">Beautify Fetch (.html)</option>' +
          '<option value="self">Self-Contained Img (.html)</option>' +
          '<option value="devdump">AI Context Dump (.md)</option>' +
        '</select>' +
        '<div class="hx_row" id="hx_main_row">' +
          '<div id="hx_start" class="hx_btn primary">Start</div>' +
          '<div id="hx_stop" class="hx_btn danger disabled">Stop</div>' +
        '</div>' +
        '<div class="hx_settings">' +
          '<label>Limit: <input id="hx_limit" type="number" class="hx_tiny_inp" value="0"></label>' +
          '<span id="hx_ts" class="hx_clickable">Time: ON</span>' +
          '<span id="hx_scale" class="hx_clickable">UI: ' + Math.round(uiScale * 100) + '%</span>' +
        '</div>' +
        '<div id="hx_partials" class="hx_row" style="display:none">' +
          '<div id="hx_save_p" class="hx_btn primary">Save Partial</div>' +
          '<div id="hx_disc_p" class="hx_btn danger">Discard</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(wrap);

    var els = {
      fab: wrap.querySelector("#hx_fab"),
      menu: wrap.querySelector("#hx_menu"),
      name: wrap.querySelector("#hx_name"),
      mode: wrap.querySelector("#hx_mode"),
      start: wrap.querySelector("#hx_start"),
      stop: wrap.querySelector("#hx_stop"),
      limit: wrap.querySelector("#hx_limit"),
      ts: wrap.querySelector("#hx_ts"),
      scale: wrap.querySelector("#hx_scale"),
      partials: wrap.querySelector("#hx_partials"),
      saveP: wrap.querySelector("#hx_save_p"),
      discP: wrap.querySelector("#hx_disc_p"),
      mainRow: wrap.querySelector("#hx_main_row")
    };

    els.name.value = sanitize(location.hostname + location.pathname);

    function refreshTsLabel() {
      els.ts.textContent = "Time: " + (useTs ? "ON" : "OFF");
      try { localStorage.setItem(STORE_TS, useTs ? "1" : "0"); } catch (e) {}
    }
    refreshTsLabel();

    els.ts.onclick = function () { useTs = !useTs; refreshTsLabel(); };

    els.scale.onclick = function () {
      var steps = [1.0, 1.15, 1.35, 1.5, 1.7];
      var idx = 0;
      for (var i = 0; i < steps.length; i++) {
        if (Math.abs(steps[i] - uiScale) < 0.02) { idx = i; break; }
      }
      uiScale = steps[(idx + 1) % steps.length];
      document.documentElement.style.setProperty("--hx_scale", String(uiScale));
      els.scale.textContent = "UI: " + Math.round(uiScale * 100) + "%";
      try { localStorage.setItem(STORE_SCALE, String(uiScale)); } catch (e2) {}
      toast("UI scale " + Math.round(uiScale * 100) + "%");
    };

    function getFN(base, ext) {
      return els.name.value + "_" + base + (useTs ? "_" + ts() : "") + "." + ext;
    }

    function setRunning(running) {
      if (running) {
        els.stop.classList.remove("disabled");
        els.mode.disabled = true;
        els.start.classList.add("working");
      } else {
        els.stop.classList.add("disabled");
        els.mode.disabled = false;
        els.start.classList.remove("working", "disabled");
        els.start.textContent = "Start";
      }
    }

    var ac = null;
    var partialRes = null;

    els.start.onclick = function () {
      if (els.start.classList.contains("working") || els.start.classList.contains("disabled")) return;

      var mode = els.mode.value;
      var lim = parseInt(els.limit.value, 10) || 0;

      if (mode === "fetch") {
        toast("Fetching...");
        fetchTxt(location.href).then(function (txt) {
          dl(txt, getFN("source", "html"));
          toast("Saved.");
        }).catch(function (e) {
          toast("Error: " + (e && e.message ? e.message : String(e)));
        });
        return;
      }

      if (mode === "dom") {
        toast("Snapshotting...");
        dl("<!doctype html>\n" + document.documentElement.outerHTML, getFN("dom", "html"));
        toast("Saved.");
        return;
      }

      if (mode === "pretty") {
        toast("Beautifying...");
        fetchTxt(location.href).then(function (txt) {
          dl(beautify(txt), getFN("pretty", "html"));
          toast("Saved.");
        }).catch(function (e) {
          toast("Error: " + (e && e.message ? e.message : String(e)));
        });
        return;
      }

      if (mode === "devdump") {
        setRunning(true);
        els.start.textContent = "Scraping...";
        buildDevDump(function (c, t) { els.start.textContent = "CSS " + c + "/" + t; })
          .then(function (md) {
            dl(md, getFN("AI_CONTEXT", "md"));
            toast("Dev dump saved.");
            setRunning(false);
          })
          .catch(function (e) {
            toast("Error: " + (e && e.message ? e.message : String(e)));
            setRunning(false);
          });
        return;
      }

      if (mode === "self") {
        ac = new AbortController();
        setRunning(true);
        els.start.textContent = "Prep...";

        processImages(document.documentElement.outerHTML, lim, ac.signal, function (c, t) {
          els.start.textContent = "Img " + c + "/" + t;
        }).then(function (res) {
          if (res.stopped) {
            partialRes = res.html;
            els.mainRow.style.display = "none";
            els.partials.style.display = "flex";
            toast("Stopped. Save partial?");
            setRunning(false);
          } else {
            dl(res.html, getFN("self", "html"));
            toast("Done.");
            setRunning(false);
          }
        }).catch(function (e) {
          toast("Error: " + (e && e.message ? e.message : String(e)));
          setRunning(false);
        });
      }
    };

    els.stop.onclick = function () {
      if (ac) { toast("Stopping..."); ac.abort(); }
    };

    els.saveP.onclick = function () {
      if (partialRes) dl(partialRes, getFN("partial", "html"));
      resetPartials();
    };

    els.discP.onclick = resetPartials;

    function resetPartials() {
      partialRes = null;
      ac = null;
      els.partials.style.display = "none";
      els.mainRow.style.display = "flex";
      setRunning(false);
      toast("Ready.");
    }

    // ---------- Draggable FAB (Bulletproof Mobile Edition) ----------
    var isDrag = false, startX = null, startY = null, sL = 0, sT = 0;

    try {
      var p = JSON.parse(localStorage.getItem(STORE_POS));
      if (p && isFinite(p.x) && isFinite(p.y)) {
        wrap.style.left = p.x + "px";
        wrap.style.top = p.y + "px";
        wrap.style.right = "auto";
        wrap.style.bottom = "auto";
      }
    } catch (e4) {}

    // Use standard click for opening the menu. This works 100% of the time.
    els.fab.addEventListener("click", function (e) {
      if (isDrag) {
        e.preventDefault();
        return;
      }
      els.menu.classList.toggle("show");
    });

    // Handle drag exclusively with document-level pointer events
    els.fab.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      startX = e.clientX;
      startY = e.clientY;
      isDrag = false;

      var r = wrap.getBoundingClientRect();
      sL = r.left;
      sT = r.top;
    });

    document.addEventListener("pointermove", function (e) {
      if (startX === null) return;
      
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;

      // 12px threshold to differentiate a tap from a drag
      if (!isDrag && (Math.abs(dx) > 12 || Math.abs(dy) > 12)) {
        isDrag = true;
        wrap.style.right = "auto";
        wrap.style.bottom = "auto";
      }

      if (isDrag) {
        wrap.style.left = (sL + dx) + "px";
        wrap.style.top = (sT + dy) + "px";
      }
    });

    document.addEventListener("pointerup", function (e) {
      if (startX !== null) {
        if (isDrag) {
       
