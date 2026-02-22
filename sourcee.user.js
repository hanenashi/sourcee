// ==UserScript==
// @name         Sourcee
// @namespace    https://tampermonkey.net/
// @version      3.1
// @description  The ultimate HTML export tool. (Slim UI + AI Dev Dump) [patched: @connect, creds, stop, bigger UI]
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
    if (typeof GM_addStyle !== "undefined") { GM_addStyle(css); }
    else {
      const style = document.createElement("style");
      style.textContent = css;
      document.head.appendChild(style);
    }
  }

  initSourcee();

  function runScript() {
    // ---------- Persistent Settings ----------
    const STORE = {
      pos: "hx_pos_" + location.hostname,
      scale: "hx_scale_" + location.hostname,
      ts: "hx_ts_on_" + location.hostname
    };

    function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

    // UI scale: Pixel 8 makes some “system-ui 13px” UIs feel tiny.
    // Default to 1.25 on touch devices; 1.0 on desktop.
    const isTouch = matchMedia("(pointer: coarse)").matches;
    let uiScale = 1.0;
    try {
      const saved = parseFloat(localStorage.getItem(STORE.scale));
      if (!Number.isNaN(saved) && saved > 0) uiScale = saved;
      else uiScale = isTouch ? 1.25 : 1.0;
    } catch (_) {
      uiScale = isTouch ? 1.25 : 1.0;
    }

    let useTs = true;
    try {
      const savedTs = localStorage.getItem(STORE.ts);
      if (savedTs === "0") useTs = false;
    } catch (_) {}

    // ---------- UI Styles ----------
    safeAddStyle(`
      :root { --hx_scale: ${uiScale}; }

      #hx_wrap {
        position: fixed;
        right: 12px;
        bottom: 96px;
        z-index: 2147483647;
        font: calc(13px * var(--hx_scale))/1.25 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        color: #fff;
        user-select: none;
        touch-action: none;
        max-width: 100vw;
      }

      /* Make tap targets properly chunky on mobile */
      #hx_fab {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: calc(12px * var(--hx_scale)) calc(16px * var(--hx_scale));
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.18);
        background: rgba(20,20,20,0.85);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        box-shadow: 0 6px 18px rgba(0,0,0,0.45);
        cursor: pointer;
      }
      #hx_fab span { opacity: 0.85; }

      #hx_menu {
        margin-top: 12px;
        width: min(calc(320px * var(--hx_scale)), 92vw);
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,0.14);
        background: rgba(25,25,25,0.95);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        box-shadow: 0 18px 46px rgba(0,0,0,0.65);
        padding: calc(12px * var(--hx_scale));
        display: none;
        flex-direction: column;
        gap: calc(10px * var(--hx_scale));
      }
      #hx_menu.show { display: flex; }

      .hx_field, .hx_select {
        width: 100%;
        box-sizing: border-box;
        padding: calc(11px * var(--hx_scale));
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.15);
        background: rgba(0,0,0,0.32);
        color: #fff;
        outline: none;
        font-size: calc(13px * var(--hx_scale));
      }

      .hx_select {
        appearance: none;
        background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
        background-repeat: no-repeat;
        background-position: right calc(10px * var(--hx_scale)) center;
        background-size: calc(12px * var(--hx_scale));
        padding-right: calc(34px * var(--hx_scale));
      }
      .hx_select option { background: #333; }

      .hx_row { display: flex; gap: calc(8px * var(--hx_scale)); }

      .hx_btn {
        flex: 1;
        padding: calc(12px * var(--hx_scale));
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.12);
        background: rgba(255,255,255,0.09);
        color: #eee;
        cursor: pointer;
        text-align: center;
        font-weight: 700;
        transition: all 0.2s;
      }
      .hx_btn.primary { background: rgba(80,160,255,0.25); border-color: rgba(80,160,255,0.45); color: #fff; }
      .hx_btn.danger  { background: rgba(255,80,80,0.25); border-color: rgba(255,80,80,0.45); color: #ffdddd; }
      .hx_btn.disabled { opacity: 0.45; pointer-events: none; }

      .hx_btn.working {
        background: rgba(255, 170, 0, 0.32) !important;
        border-color: rgba(255, 170, 0, 0.62) !important;
        color: #fff !important;
        opacity: 1 !important;
        pointer-events: none;
        animation: hx_pulse 1.5s infinite ease-in-out;
      }
      @keyframes hx_pulse { 0% { opacity: 1; } 50% { opacity: 0.72; } 100% { opacity: 1; } }

      .hx_settings {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: calc(11px * var(--hx_scale));
        opacity: 0.86;
        padding: 0 6px;
        gap: 10px;
        flex-wrap: wrap;
      }
      .hx_tiny_inp {
        width: calc(56px * var(--hx_scale));
        padding: calc(6px * var(--hx_scale));
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.22);
        background: transparent;
        color: #fff;
        text-align: center;
        font-size: calc(12px * var(--hx_scale));
      }
      .hx_clickable { cursor: pointer; text-decoration: underline; }

      #hx_toast {
        position: fixed;
        left: 50%;
        bottom: 110px;
        transform: translateX(-50%) translateY(20px);
        z-index: 2147483647;
        padding: calc(10px * var(--hx_scale)) calc(16px * var(--hx_scale));
        border-radius: 999px;
        background: rgba(20,20,20,0.9);
        border: 1px solid rgba(255,255,255,0.1);
        backdrop-filter: blur(6px);
        opacity: 0;
        pointer-events: none;
        transition: opacity .2s, transform .2s;
        color: #fff;
        font-weight: 700;
        max-width: 92vw;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
      }
      #hx_toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

      /* Extra nudge for very high DPR phones */
      @media (max-width: 480px) {
        #hx_wrap { bottom: 110px; }
      }
    `);

    // ---------- Utilities ----------
    function toast(msg) {
      let el = document.getElementById("hx_toast");
      if (!el) { el = document.createElement("div"); el.id = "hx_toast"; document.body.appendChild(el); }
      el.textContent = msg;
      el.classList.add("show");
      clearTimeout(el._t);
      el._t = setTimeout(() => el.classList.remove("show"), 2600);
    }

    function sanitize(s) {
      return (s || "page")
        .replace(/^https?:\/\//i, "")
        .replace(/[^\w.\-]+/g, "_")
        .slice(0, 120) || "page";
    }

    function ts() {
      const d = new Date(), p = n => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`;
    }

    function dl(txt, name) {
      const b = new Blob([txt], { type: "text/plain" });
      const u = URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = u;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(u), 2000);
    }

    async function fetchTxt(url) {
      const r = await fetch(url, { cache: "no-store", credentials: "include" });
      if (!r.ok) throw new Error(String(r.status));
      return await r.text();
    }

    // Wrapped GM_xmlhttpRequest for cross-origin CSS fetching
    function fetchCors(url) {
      return new Promise((resolve, reject) => {
        if (typeof GM_xmlhttpRequest === "undefined") return reject("GM_xmlhttpRequest not granted");
        GM_xmlhttpRequest({
          method: "GET",
          url,
          onload: (res) => resolve(res.responseText),
          onerror: (err) => reject(err)
        });
      });
    }

    function beautify(html) {
      const t = (html || "")
        .replace(/>\s+</g, ">\n<")
        .replace(/\n{3,}/g, "\n\n");
      let i = 0, out = [];
      for (const l of t.split("\n")) {
        const tr = l.trim();
        if (!tr) continue;
        if (/^<\/[^>]+>/.test(tr)) i = Math.max(0, i - 1);
        out.push("  ".repeat(i) + tr);
        if (
          /^<[^!/][^>]*[^/]>$/.test(tr) &&
          !/^<(script|style|meta|link|img|br|hr|input)/i.test(tr)
        ) i++;
      }
      return out.join("\n");
    }

    // ---------- Dev Dump Logic ----------
    function getCleanDOM() {
      const clone = document.documentElement.cloneNode(true);

      // Strip heavy/unnecessary tags
      clone.querySelectorAll("script, noscript, iframe, canvas, video, audio, picture").forEach(e => e.remove());

      // Shrink huge SVGs
      clone.querySelectorAll("svg").forEach(e => { if ((e.innerHTML || "").length > 200) e.innerHTML = ""; });

      // Strip base64 images + srcset
      clone.querySelectorAll("img, source").forEach(e => {
        if (e.getAttribute("src") && e.getAttribute("src").startsWith("data:")) e.removeAttribute("src");
        if (e.getAttribute("srcset")) e.removeAttribute("srcset");
      });

      // NOTE: This does NOT redact tokens / form fields. That’s a product warning, not a bug.
      return clone.outerHTML;
    }

    async function buildDevDump(onProg) {
      let md = `# AI DEV DUMP: ${location.href}\n\n`;

      md += `## 1. INLINE & INJECTED STYLES (<style>)\n`;
      const styles = document.querySelectorAll("style");
      styles.forEach((s, i) => {
        const css = (s.textContent || "").trim();
        if (css) md += `\n### Style Block ${i + 1}\n\`\`\`css\n${css}\n\`\`\`\n`;
      });

      md += `\n## 2. EXTERNAL STYLESHEETS (<link rel="stylesheet">)\n`;
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

      for (let i = 0; i < links.length; i++) {
        onProg(i + 1, links.length);
        const href = links[i].href;
        if (!href) continue;
        md += `\n### Stylesheet: ${href}\n`;
        try {
          const cssText = await fetchCors(href);
          md += `\`\`\`css\n${(cssText || "").trim()}\n\`\`\`\n`;
        } catch (e) {
          md += `> [Failed to fetch: CORS/permissions/network]\n`;
        }
      }

      md += `\n## 3. DOM SNAPSHOT (Sanitized for AI Context)\n`;
      md += `\`\`\`html\n${beautify(getCleanDOM())}\n\`\`\`\n`;

      return md;
    }

    // ---------- Self-Contained Logic ----------
    async function fetchBase64(url, signal) {
      if (signal?.aborted) throw new Error("STOP");
      const r = await fetch(url, {
        signal,
        cache: "no-store",
        credentials: "include" // important for same-site authenticated images
      });
      if (!r.ok) throw new Error(`IMG ${r.status}`);
      const b = await r.blob();
      return await new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.onerror = rej;
        fr.readAsDataURL(b);
      });
    }

    async function processImages(html, limit, signal, onProg) {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const imgs = Array.from(doc.querySelectorAll("img")).filter(i => {
        const src = i.getAttribute("src") || "";
        return src && !src.startsWith("data:");
      });

      const total = limit > 0 ? Math.min(limit, imgs.length) : imgs.length;
      onProg(0, total);

      let count = 0;
      for (const img of imgs) {
        if (count >= total) break;
        if (signal?.aborted) return { html: doc.documentElement.outerHTML, stopped: true };

        try {
          const raw = img.getAttribute("src");
          const abs = new URL(raw, location.href).href;
          const b64 = await fetchBase64(abs, signal);
          img.setAttribute("src", b64);
          img.removeAttribute("srcset");
          img.removeAttribute("loading");
        } catch (e) {
          if (signal?.aborted) return { html: doc.documentElement.outerHTML, stopped: true };
          console.warn("[Sourcee] image inline failed:", e);
        }

        count++;
        onProg(count, total);
      }

      return { html: doc.documentElement.outerHTML, stopped: false };
    }

    // ---------- UI Construction ----------
    const wrap = document.createElement("div");
    wrap.id = "hx_wrap";
    wrap.innerHTML = `
      <div id="hx_fab">Sourcee <span>▾</span></div>
      <div id="hx_menu">
        <input id="hx_name" class="hx_field" placeholder="Filename">
        <select id="hx_mode" class="hx_select">
          <option value="fetch">Fetch Source (.html)</option>
          <option value="dom">DOM Snapshot (.html)</option>
          <option value="pretty">Beautify Fetch (.html)</option>
          <option value="self">Self-Contained Img (.html)</option>
          <option value="devdump">AI Context Dump (.md)</option>
        </select>

        <div class="hx_row" id="hx_main_row">
          <div id="hx_start" class="hx_btn primary">Start</div>
          <div id="hx_stop" class="hx_btn danger disabled">Stop</div>
        </div>

        <div class="hx_settings">
          <label>Limit: <input id="hx_limit" type="number" class="hx_tiny_inp" value="0"></label>
          <span id="hx_ts" class="hx_clickable">Time: ON</span>
          <span id="hx_scale" class="hx_clickable">UI: ${Math.round(uiScale * 100)}%</span>
        </div>

        <div id="hx_partials" class="hx_row" style="display:none">
          <div id="hx_save_p" class="hx_btn primary">Save Partial</div>
          <div id="hx_disc_p" class="hx_btn danger">Discard</div>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    // ---------- Logic Binding ----------
    const els = {
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

    // Persist TS toggle
    function refreshTsLabel() {
      els.ts.textContent = `Time: ${useTs ? "ON" : "OFF"}`;
      try { localStorage.setItem(STORE.ts, useTs ? "1" : "0"); } catch (_) {}
    }
    refreshTsLabel();

    // UI scale toggle (cycles)
    els.scale.onclick = () => {
      const steps = [1.0, 1.15, 1.25, 1.4, 1.6];
      let idx = steps.findIndex(x => Math.abs(x - uiScale) < 0.01);
      idx = (idx < 0) ? 0 : idx;
      uiScale = steps[(idx + 1) % steps.length];
      document.documentElement.style.setProperty("--hx_scale", String(uiScale));
      els.scale.textContent = `UI: ${Math.round(uiScale * 100)}%`;
      try { localStorage.setItem(STORE.scale, String(uiScale)); } catch (_) {}
      toast(`UI scale ${Math.round(uiScale * 100)}%`);
    };

    let ac = null;
    let partialRes = null;

    function getFN(suffix) {
      return `${els.name.value}_${suffix}${useTs ? "_" + ts() : ""}.html`;
    }
    function getFNTxt(suffix) {
      return `${els.name.value}_${suffix}${useTs ? "_" + ts() : ""}.md`;
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

    function openMenu() { els.menu.classList.add("show"); }
    function toggleMenu() { els.menu.classList.toggle("show"); }

    // Toggle time label
    els.ts.onclick = () => { useTs = !useTs; refreshTsLabel(); };

    // Start handler
    els.start.onclick = async () => {
      if (els.start.classList.contains("working") || els.start.classList.contains("disabled")) return;

      const mode = els.mode.value;
      const lim = parseInt(els.limit.value, 10) || 0;

      try {
        if (mode === "fetch") {
          toast("Fetching...");
          dl(await fetchTxt(location.href), getFN("source"));
          toast("Saved.");
        } else if (mode === "dom") {
          toast("Snapshotting...");
          dl("<!doctype html>\n" + document.documentElement.outerHTML, getFN("dom"));
          toast("Saved.");
        } else if (mode === "pretty") {
          toast("Beautifying...");
          dl(beautify(await fetchTxt(location.href)), getFN("pretty"));
          toast("Saved.");
        } else if (mode === "devdump") {
          setRunning(true);
          els.start.textContent = "Scraping...";
          const mdData = await buildDevDump((c, t) => { els.start.textContent = `CSS ${c}/${t}`; });
          dl(mdData, getFNTxt("AI_CONTEXT"));
          toast("Dev dump saved.");
          setRunning(false);
        } else if (mode === "self") {
          ac = new AbortController();
          setRunning(true);
          els.start.textContent = "Prep...";

          const res = await processImages(
            document.documentElement.outerHTML,
            lim,
            ac.signal,
            (c, t) => { els.start.textContent = `Img ${c}/${t}`; }
          );

          if (res.stopped) {
            partialRes = res.html;
            els.mainRow.style.display = "none";
            els.partials.style.display = "flex";
            toast("Stopped. Save partial?");
            // keep running state off because we’re in decision UI
            setRunning(false);
          } else {
            dl(res.html, getFN("self"));
            toast("Done.");
            setRunning(false);
          }
        }
      } catch (e) {
        toast("Error: " + (e?.message || String(e)));
        setRunning(false);
      }
    };

    // Stop handler
    els.stop.onclick = () => {
      if (ac) {
        toast("Stopping...");
        ac.abort();
      }
    };

    // Partials
    els.saveP.onclick = () => {
      if (partialRes) dl(partialRes, getFN("partial"));
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

    // ---------- Draggable + Tap (no double-toggle) ----------
    // We do pointer drag. If it wasn’t a drag, we toggle menu.
    let isDrag = false, startX = 0, startY = 0, sL = 0, sT = 0;

    // Restore position
    try {
      const p = JSON.parse(localStorage.getItem(STORE.pos));
      if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) {
        wrap.style.left = p.x + "px";
        wrap.style.top = p.y + "px";
        wrap.style.right = "auto";
        wrap.style.bottom = "auto";
     
