// ==UserScript==
// @name         Sourcee
// @namespace    https://tampermonkey.net/
// @version      2.0
// @description  The ultimate HTML export tool. (Mobile Fixed)
// @match        https://*/*
// @match        http://*/*
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  // 1. Safe Start Check
  function initSourcee() {
    if (!document.body) {
      setTimeout(initSourcee, 100);
      return;
    }
    runScript();
  }

  // Shim GM_addStyle if missing (sometimes happens in weird contexts)
  function safeAddStyle(css) {
    if (typeof GM_addStyle !== "undefined") {
      GM_addStyle(css);
    } else {
      const style = document.createElement("style");
      style.textContent = css;
      document.head.appendChild(style);
    }
  }

  initSourcee();

  function runScript() {
    // ---------- UI Styles ----------
    safeAddStyle(`
      #hx_wrap {
        position: fixed;
        right: 12px;
        bottom: 80px; /* Moved up slightly for mobile nav bars */
        z-index: 2147483647;
        font: 13px/1.2 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        color: #fff;
        user-select: none;
        touch-action: none; /* Crucial for mobile dragging */
        -webkit-user-select: none;
        max-width: 100vw;
      }

      #hx_fab {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px; /* Larger touch target */
        border-radius: 24px;
        border: 1px solid rgba(255,255,255,0.18);
        background: rgba(20,20,20,0.85);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        cursor: pointer;
        transition: transform 0.1s;
      }
      #hx_fab:active { transform: scale(0.96); }

      #hx_drag_hint {
        opacity: 0.6;
        font-size: 11px;
        margin-left: 2px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      #hx_menu {
        margin-top: 12px;
        width: min(340px, 92vw);
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,0.14);
        background: rgba(25,25,25,0.95); /* More opaque for mobile readability */
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        box-shadow: 0 16px 40px rgba(0,0,0,0.6);
        padding: 14px;
        display: none;
        transform-origin: bottom right;
        animation: hx_fade 0.2s ease-out;
      }
      #hx_menu.show { display: block; }
      
      @keyframes hx_fade {
        from { opacity: 0; transform: scale(0.95) translateY(10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }

      .hx_row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin: 10px 0;
      }

      .hx_btn {
        flex: 1;
        min-width: 100px;
        padding: 11px 10px; /* Taller for touch */
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.12);
        background: rgba(255,255,255,0.06);
        color: #eee;
        cursor: pointer;
        text-align: center;
        font-weight: 500;
        font-size: 13px;
      }
      .hx_btn:active { background: rgba(255,255,255,0.15); }
      
      .hx_btn.primary {
        background: rgba(80, 160, 255, 0.2);
        border-color: rgba(80, 160, 255, 0.3);
        color: #fff;
      }
      .hx_btn.danger {
        background: rgba(255,80,80,0.15);
        border-color: rgba(255,80,80,0.25);
        color: #ffcccc;
      }
      .hx_btn.disabled {
        opacity: 0.4;
        pointer-events: none;
      }

      .hx_field {
        width: 100%;
        box-sizing: border-box;
        padding: 10px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.15);
        background: rgba(0,0,0,0.3);
        color: #fff;
        outline: none;
        font-family: monospace;
      }

      .hx_inline {
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
      }

      .hx_num {
        width: 70px;
        padding: 8px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.15);
        background: rgba(0,0,0,0.3);
        color: #fff;
        text-align: center;
      }

      .hx_toggle {
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 8px 12px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.14);
        background: rgba(255,255,255,0.06);
        cursor: pointer;
        min-width: 110px;
      }

      #hx_toast {
        position: fixed;
        left: 50%;
        bottom: 100px;
        transform: translateX(-50%) translateY(20px);
        z-index: 2147483647;
        padding: 10px 16px;
        border-radius: 20px;
        background: rgba(20,20,20,0.9);
        border: 1px solid rgba(255,255,255,0.1);
        backdrop-filter: blur(4px);
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        opacity: 0;
        transition: opacity .2s ease, transform .2s ease;
        pointer-events: none;
        max-width: 80vw;
        text-align: center;
        color: #ff5555;
        font-weight: 600;
      }
      #hx_toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

      /* Cancel decision bar */
      #hx_cancel_bar {
        display: none;
        margin-top: 10px;
        padding: 12px;
        border-radius: 12px;
        border: 1px solid rgba(255,80,80,0.3);
        background: rgba(40,10,10,0.5);
      }
      #hx_cancel_bar.show { display: block; }

      .hx_small { font-size: 11px; opacity: 0.7; margin-bottom: 4px; }
      .hx_hr { height: 1px; background: rgba(255,255,255,0.1); margin: 12px 0; }
    `);

    // ---------- Helpers ----------
    function toast(msg) {
      let el = document.getElementById("hx_toast");
      if (!el) {
        el = document.createElement("div");
        el.id = "hx_toast";
        document.body.appendChild(el);
      }
      el.textContent = msg;
      el.classList.add("show");
      clearTimeout(el._t);
      el._t = setTimeout(() => el.classList.remove("show"), 2500);
    }

    function sanitizeName(s) {
      return (s || "page")
        .replace(/^https?:\/\//i, "")
        .replace(/[^\w.\-]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 140);
    }

    function tsStamp() {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
    }

    function downloadText(text, filename) {
      const blob = new Blob([text], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    async function fetchTextNoStore(url) {
      const res = await fetch(url, { cache: "no-store", credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    }

    function makeCancelToken() {
      return {
        canceled: false,
        controller: (typeof AbortController !== "undefined") ? new AbortController() : null,
        cancel() {
          this.canceled = true;
          try { this.controller?.abort(); } catch (_) {}
        }
      };
    }

    async function fetchAsDataURL(url, cancelToken) {
      if (cancelToken?.canceled) throw new Error("CANCELED");
      const init = { cache: "no-store", credentials: "include" };
      if (cancelToken?.controller) init.signal = cancelToken.controller.signal;

      const res = await fetch(url, init);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve({ dataUrl: r.result, mime: blob.type });
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
    }

    function absolutizeUrl(baseUrl, maybeRelative) {
      try { return new URL(maybeRelative, baseUrl).toString(); }
      catch { return null; }
    }

    function pickSrcsetBest(srcset, baseUrl) {
      if (!srcset) return null;
      const parts = srcset.split(",").map(s => s.trim()).filter(Boolean);
      if (!parts.length) return null;
      let best = null, bestScore = -1;
      for (const p of parts) {
        const [u, descriptor] = p.split(/\s+/);
        const abs = absolutizeUrl(baseUrl, u);
        if (!abs) continue;
        let score = 0;
        if (descriptor) {
            const mW = descriptor.match(/^(\d+)w$/);
            const mX = descriptor.match(/^(\d+(\.\d+)?)x$/);
            if (mW) score = parseInt(mW[1], 10);
            else if (mX) score = Math.round(parseFloat(mX[1]) * 1000);
        }
        if (score > bestScore) { bestScore = score; best = abs; }
        if (bestScore < 0) best = abs; 
      }
      return best;
    }

    async function makeSelfContainedHTML(baseUrl, htmlText, cancelToken, embedLimit, onProgress) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, "text/html");
      const imgs = Array.from(doc.querySelectorAll("img")).filter(img => {
          const src = img.getAttribute("src") || "";
          return !src.startsWith("data:");
      });

      if (!imgs.length) {
        return { html: "<!doctype html>\n" + doc.documentElement.outerHTML, embedded: 0, failed: 0, canceled: false, total: 0, processed: 0 };
      }

      const cache = new Map();
      let embedded = 0, failed = 0, processed = 0;
      const maxToProcess = (embedLimit && embedLimit > 0) ? Math.min(embedLimit, imgs.length) : imgs.length;

      for (let i = 0; i < imgs.length; i++) {
        if (processed >= maxToProcess) break;
        if (cancelToken?.canceled) return { html: "<!doctype html>\n" + doc.documentElement.outerHTML, embedded, failed, canceled: true, total: maxToProcess, processed };

        const img = imgs[i];
        const curSrc = img.getAttribute("src") || "";
        const srcset = img.getAttribute("srcset");
        const target = pickSrcsetBest(srcset, baseUrl) || absolutizeUrl(baseUrl, curSrc);
        
        if (!target) { failed++; processed++; continue; }
        onProgress?.(processed + 1, maxToProcess, target);

        try {
          let dataUrl = cache.get(target);
          if (!dataUrl) {
            const r = await fetchAsDataURL(target, cancelToken);
            dataUrl = r.dataUrl;
            cache.set(target, dataUrl);
          }
          img.setAttribute("src", dataUrl);
          img.removeAttribute("srcset");
          img.removeAttribute("loading");
          embedded++;
        } catch (e) {
          if (String(e?.message || e).includes("CANCELED") || cancelToken?.canceled) {
            return { html: "<!doctype html>\n" + doc.documentElement.outerHTML, embedded, failed, canceled: true, total: maxToProcess, processed };
          }
          failed++;
        } finally {
          processed++;
        }
      }
      return { html: "<!doctype html>\n" + doc.documentElement.outerHTML, embedded, failed, canceled: false, total: maxToProcess, processed };
    }

    function beautifyHTML(html) {
      const text = (html || "").replace(/\r\n/g, "\n").replace(/>\s+</g, ">\n<").replace(/\n{3,}/g, "\n\n");
      const lines = text.split("\n");
      let indent = 0;
      const out = [];
      for (const line of lines) {
        const l = line.trim();
        if (!l) continue;
        if (/^<\/[^>]+>/.test(l)) indent = Math.max(0, indent - 1);
        out.push("  ".repeat(indent) + l);
        if (/^<[^!/][^>]*[^/]>$/.test(l) && !/^<[^>]+\/>$/.test(l) && !/^<(script|style|meta|link)/i.test(l)) indent++;
      }
      return out.join("\n") + "\n";
    }

    function defaultBaseName() {
      return sanitizeName(location.hostname + location.pathname) || "page";
    }

    function space(h) { const d = document.createElement("div"); d.style.height = h + "px"; return d; }
    function hr() { const d = document.createElement("div"); d.className = "hx_hr"; return d; }

    // ---------- Build UI ----------
    const wrap = document.createElement("div");
    wrap.id = "hx_wrap";

    const fab = document.createElement("div");
    fab.id = "hx_fab";
    fab.innerHTML = `<strong>Sourcee</strong><span id="hx_drag_hint">::</span>`;

    const menu = document.createElement("div");
    menu.id = "hx_menu";

    // Inputs
    const filenameInput = document.createElement("input");
    filenameInput.className = "hx_field";
    filenameInput.value = defaultBaseName();

    let addTimestamp = true;
    const toggleTs = document.createElement("div");
    toggleTs.className = "hx_toggle";
    toggleTs.innerHTML = `<span>Time</span><strong id="hx_ts_state">ON</strong>`;
    toggleTs.onclick = () => {
        addTimestamp = !addTimestamp;
        toggleTs.querySelector("#hx_ts_state").textContent = addTimestamp ? "ON" : "OFF";
    };

    const limitInput = document.createElement("input");
    limitInput.className = "hx_num";
    limitInput.type = "number";
    limitInput.value = "0";

    // Buttons
    const btnFetch = document.createElement("div"); btnFetch.className = "hx_btn primary"; btnFetch.textContent = "Fetch";
    const btnDOM = document.createElement("div"); btnDOM.className = "hx_btn"; btnDOM.textContent = "DOM";
    const btnPretty = document.createElement("div"); btnPretty.className = "hx_btn"; btnPretty.textContent = "Pretty";
    const btnSelf = document.createElement("div"); btnSelf.className = "hx_btn"; btnSelf.textContent = "Self-Contained";
    const btnCancel = document.createElement("div"); btnCancel.className = "hx_btn danger disabled"; btnCancel.textContent = "Stop";
    const btnClose = document.createElement("div"); btnClose.className = "hx_btn danger"; btnClose.textContent = "Close";

    // Rows
    const row1 = document.createElement("div"); row1.className = "hx_row";
    row1.append(btnFetch, btnDOM, btnPretty);
    const row2 = document.createElement("div"); row2.className = "hx_row";
    row2.append(btnSelf, btnCancel);
    const row3 = document.createElement("div"); row3.className = "hx_row";
    row3.append(btnClose);

    // Cancel Bar
    const cancelBar = document.createElement("div"); cancelBar.id = "hx_cancel_bar";
    const btnSaveP = document.createElement("div"); btnSaveP.className = "hx_btn primary"; btnSaveP.textContent = "Save Partial";
    const btnDiscP = document.createElement("div"); btnDiscP.className = "hx_btn danger"; btnDiscP.textContent = "Discard";
    const cRow = document.createElement("div"); cRow.className = "hx_row";
    cRow.append(btnSaveP, btnDiscP);
    cancelBar.append(document.createTextNode("Stopped."), cRow);

    // Assemble
    const title = document.createElement("div"); title.innerHTML = "<b>Sourcee</b> Options";
    menu.append(title, space(8), filenameInput, space(8));
    
    const settingsRow = document.createElement("div"); settingsRow.className = "hx_inline";
    settingsRow.append(toggleTs, document.createTextNode("Limit:"), limitInput);
    menu.append(settingsRow, hr(), row1, row2, cancelBar, row3);

    wrap.append(fab, menu);
    
    // IMPORTANT: Append to BODY, not DocumentElement
    document.body.appendChild(wrap);

    // Load Position
    const POS_KEY = "hx_pos_" + location.hostname;
    try {
        const saved = JSON.parse(localStorage.getItem(POS_KEY));
        if (saved) {
            wrap.style.left = saved.x + "px";
            wrap.style.top = saved.y + "px";
            wrap.style.right = "auto";
            wrap.style.bottom = "auto";
        }
    } catch (_) {}

    // Event Logic
    function buildFN(suf) {
        return `${filenameInput.value}${suf ? "_"+suf : ""}${addTimestamp ? "_"+tsStamp() : ""}.html`;
    }

    let activeToken = null;
    let partialHTML = null;

    btnFetch.onclick = async () => {
        toast("Fetching...");
        try { downloadText(await fetchTextNoStore(location.href), buildFN("source")); }
        catch(e) { toast("Err: " + e.message); }
    };
    btnDOM.onclick = () => {
        downloadText("<!doctype html>\n" + document.documentElement.outerHTML, buildFN("dom"));
        toast("DOM Saved");
    };
    btnPretty.onclick = async () => {
        toast("Prettifying...");
        try { downloadText(beautifyHTML(await fetchTextNoStore(location.href)), buildFN("pretty")); }
        catch(e) { toast("Err: " + e.message); }
    };

    btnSelf.onclick = async () => {
        if (activeToken) return;
        activeToken = makeCancelToken();
        partialHTML = null;
        btnSelf.classList.add("disabled");
        btnCancel.classList.remove("disabled");
        
        try {
            const res = await makeSelfContainedHTML(location.href, document.documentElement.outerHTML, activeToken, parseInt(limitInput.value)||0, (c,t)=>btnSelf.textContent=`${c}/${t}`);
            if (res.canceled) {
                partialHTML = res.html;
                cancelBar.classList.add("show");
            } else {
                downloadText(res.html, buildFN("self"));
                toast(`Done: ${res.embedded} imgs`);
                resetSelf();
            }
        } catch (e) { toast("Err: " + e.message); resetSelf(); }
    };

    btnCancel.onclick = () => activeToken?.cancel();
    
    function resetSelf() {
        activeToken = null;
        btnSelf.textContent = "Self-Contained";
        btnSelf.classList.remove("disabled");
        btnCancel.classList.add("disabled");
    }

    btnSaveP.onclick = () => {
        if(partialHTML) downloadText(partialHTML, buildFN("partial"));
        cancelBar.classList.remove("show");
        resetSelf();
    };
    btnDiscP.onclick = () => {
        cancelBar.classList.remove("show");
        resetSelf();
    };

    btnClose.onclick = () => menu.classList.remove("show");

    // Toggle Menu (Smart)
    let moved = 0;
    fab.onclick = () => {
        if (moved < 5) menu.classList.toggle("show");
    };

    // Robust Dragging for Mobile
    let startX = 0, startY = 0, startLeft = 0, startTop = 0;
    fab.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        fab.setPointerCapture(e.pointerId);
        startX = e.clientX; startY = e.clientY;
        const r = wrap.getBoundingClientRect();
        startLeft = r.left; startTop = r.top;
        moved = 0;
        
        // Reset to left/top positioning
        wrap.style.right = "auto";
        wrap.style.bottom = "auto";
        wrap.style.left = startLeft + "px";
        wrap.style.top = startTop + "px";
    });
    
    fab.addEventListener("pointermove", (e) => {
        if (!fab.hasPointerCapture(e.pointerId)) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        moved += Math.abs(dx) + Math.abs(dy);
        
        wrap.style.left = (startLeft + dx) + "px";
        wrap.style.top = (startTop + dy) + "px";
    });
    
    fab.addEventListener("pointerup", (e) => {
        fab.releasePointerCapture(e.pointerId);
        if (moved > 5) {
            const r = wrap.getBoundingClientRect();
            localStorage.setItem(POS_KEY, JSON.stringify({x: r.left, y: r.top}));
        }
    });
  }
})();
