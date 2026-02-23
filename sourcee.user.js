// ==UserScript==
// @name         Sourcee
// @namespace    https://tampermonkey.net/
// @version      4.0
// @description  The ultimate HTML export tool. (Asset Inspector + Smart Checkbox Management)
// @match        https://*/*
// @match        http://*/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      *
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  function initSourcee() {
    if (!document.body) {
        setTimeout(initSourcee, 100); 
        return; 
    }
    runScript();
  }

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
    // ---------- Scaling Setup ----------
    const STORE_SCALE = "hx_scale_" + location.hostname;
    let isTouch = false;
    
    try { 
        isTouch = matchMedia("(pointer: coarse)").matches; 
    } catch (e) {
        // Ignored
    }

    let uiScale = 1.0;
    try {
      const saved = parseFloat(localStorage.getItem(STORE_SCALE));
      if (!isNaN(saved) && saved > 0) {
          uiScale = saved;
      } else {
          uiScale = isTouch ? 1.35 : 1.0;
      }
    } catch (e) {
      uiScale = isTouch ? 1.35 : 1.0;
    }

    // ---------- UI Styles ----------
    safeAddStyle(
      ":root{--hx_scale:" + uiScale + ";}\n" +
      "#hx_wrap{position:fixed;right:12px;bottom:80px;z-index:2147483647;" +
      "font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;" +
      "font-size:calc(13px*var(--hx_scale));line-height:1.2;" +
      "color:#fff;user-select:none;touch-action:none;max-width:100vw;}\n" +
      
      "#hx_fab{display:inline-flex;align-items:center;gap:8px;" +
      "padding:calc(10px*var(--hx_scale)) calc(14px*var(--hx_scale));" +
      "border-radius:24px;border:1px solid rgba(255,255,255,0.18);" +
      "background:rgba(20,20,20,0.85);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);" +
      "box-shadow:0 4px 12px rgba(0,0,0,0.4);cursor:pointer;}\n" +
      
      "#hx_menu{margin-top:12px;width:min(calc(300px*var(--hx_scale)),90vw);border-radius:16px;" +
      "border:1px solid rgba(255,255,255,0.14);background:rgba(25,25,25,0.95);" +
      "backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);" +
      "box-shadow:0 16px 40px rgba(0,0,0,0.6);padding:calc(12px*var(--hx_scale));" +
      "display:none;flex-direction:column;gap:calc(10px*var(--hx_scale));}\n" +
      "#hx_menu.show{display:flex;}\n" +

      ".hx_field,.hx_select{width:100%;box-sizing:border-box;padding:calc(10px*var(--hx_scale));border-radius:8px;" +
      "border:1px solid rgba(255,255,255,0.15);background:rgba(0,0,0,0.3);" +
      "color:#fff;outline:none;font-size:calc(13px*var(--hx_scale));}\n" +
      
      ".hx_select{appearance:auto;}\n" +
      ".hx_select option{background:#333;}\n" +

      ".hx_row{display:flex;gap:calc(8px*var(--hx_scale));}\n" +
      
      ".hx_btn{flex:1;padding:calc(10px*var(--hx_scale));border-radius:8px;border:1px solid rgba(255,255,255,0.12);" +
      "background:rgba(255,255,255,0.08);color:#eee;cursor:pointer;" +
      "text-align:center;font-weight:600;transition:all 0.2s;}\n" +
      ".hx_btn.primary{background:rgba(80,160,255,0.25);border-color:rgba(80,160,255,0.4);color:#fff;}\n" +
      ".hx_btn.danger{background:rgba(255,80,80,0.25);border-color:rgba(255,80,80,0.4);color:#ffcccc;}\n" +
      ".hx_btn.disabled{opacity:0.4;pointer-events:none;}\n" +
      ".hx_btn.working{background:rgba(255,170,0,0.3)!important;border-color:rgba(255,170,0,0.6)!important;" +
      "color:#fff!important;opacity:1!important;pointer-events:none;animation:hx_pulse 1.5s infinite ease-in-out;}\n" +
      "@keyframes hx_pulse{0%{opacity:1;}50%{opacity:0.7;}100%{opacity:1;}}\n" +

      /* Asset Inspector Checklist Styles */
      "#hx_asset_ctrls{display:none;gap:calc(6px*var(--hx_scale));margin-bottom:calc(-4px*var(--hx_scale));flex-wrap:wrap;}\n" +
      ".hx_actrl{padding:3px 6px;border-radius:4px;font-weight:bold;font-size:calc(10px*var(--hx_scale));cursor:pointer;background:rgba(255,255,255,0.15);color:#fff;display:inline-flex;align-items:center;}\n" +
      ".hx_actrl:active{background:rgba(255,255,255,0.3);}\n" +
      ".hx_actrl.css{background:#2962ff;}\n" +
      ".hx_actrl.js{background:#ffd600;color:#000;}\n" +
      ".hx_actrl.html{background:#ff4081;}\n" +

      "#hx_asset_box{display:none;max-height:calc(200px*var(--hx_scale));overflow-y:auto;" +
      "background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.1);border-radius:8px;" +
      "padding:calc(8px*var(--hx_scale));font-size:calc(11px*var(--hx_scale));flex-direction:column;gap:6px;}\n" +
      ".hx_asset_item{display:flex;align-items:center;gap:8px;word-break:break-all;line-height:1.3;cursor:pointer;}\n" +
      ".hx_asset_item input{margin:0;width:calc(16px*var(--hx_scale));height:calc(16px*var(--hx_scale));accent-color:#50a0ff;flex-shrink:0;}\n" +
      ".hx_badge{padding:2px 5px;border-radius:4px;font-weight:bold;font-size:calc(9px*var(--hx_scale));flex-shrink:0;text-transform:uppercase;}\n" +
      ".hx_badge.css{background:#2962ff;color:#fff;}\n" +
      ".hx_badge.js{background:#ffd600;color:#000;}\n" +
      ".hx_badge.html{background:#ff4081;color:#fff;}\n" +
      ".hx_domain{opacity:0.6;font-size:0.9em;margin-right:4px;}\n" +

      ".hx_settings{display:flex;align-items:center;justify-content:space-between;font-size:calc(11px*var(--hx_scale));opacity:0.8;padding:0 4px;}\n" +
      ".hx_tiny_inp{width:calc(50px*var(--hx_scale));padding:calc(4px*var(--hx_scale));border-radius:4px;border:1px solid rgba(255,255,255,0.2);background:transparent;color:#fff;text-align:center;font-size:calc(12px*var(--hx_scale));}\n" +
      ".hx_clickable{cursor:pointer;text-decoration:underline;}\n" +

      "#hx_toast{position:fixed;left:50%;bottom:100px;transform:translateX(-50%) translateY(20px);" +
      "z-index:2147483647;padding:calc(10px*var(--hx_scale)) calc(16px*var(--hx_scale));border-radius:20px;" +
      "background:rgba(20,20,20,0.9);border:1px solid rgba(255,255,255,0.1);" +
      "backdrop-filter:blur(4px);opacity:0;pointer-events:none;" +
      "transition:opacity .2s, transform .2s;color:#fff;font-weight:600;" +
      "font-size:calc(13px*var(--hx_scale));}\n" +
      "#hx_toast.show{opacity:1;transform:translateX(-50%) translateY(0);}\n"
    );

    // ---------- Utilities ----------
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
    
    function sanitize(s) { 
        return (s||"page").replace(/^https?:\/\//i,"").replace(/[^\w.\-]+/g,"_").slice(0,120); 
    }
    
    function ts() { 
        const d=new Date(), p=n=>String(n).padStart(2,"0"); 
        return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`; 
    }
    
    function dl(txt, name) {
      const b = new Blob([txt],{type:"text/plain"});
      const u = URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = u; 
      a.download = name; 
      document.body.appendChild(a); 
      a.click(); 
      a.remove(); 
      setTimeout(()=>URL.revokeObjectURL(u), 2000);
    }
    
    async function fetchTxt(url) {
      const r = await fetch(url, {cache:"no-store", credentials:"include"});
      if(!r.ok) {
          throw new Error(r.status);
      }
      return await r.text();
    }
    
    function fetchCors(url) {
        return new Promise((resolve, reject) => {
            if (typeof GM_xmlhttpRequest === "undefined") {
                return reject("GM_xmlhttpRequest not granted");
            }
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                onload: (res) => resolve(res.responseText),
                onerror: (err) => reject(err)
            });
        });
    }

    function beautify(html) {
      const t = (html||"").replace(/>\s+</g,">\n<").replace(/\n{3,}/g,"\n\n");
      let i = 0;
      let out = [];
      for(const l of t.split("\n")) {
        const tr = l.trim(); 
        if(!tr) continue;
        if(/^<\/[^>]+>/.test(tr)) {
            i = Math.max(0, i - 1);
        }
        out.push("  ".repeat(i) + tr);
        if(/^<[^!/][^>]*[^/]>$/.test(tr) && !/^<(script|style|meta|link|img|br|hr)/i.test(tr)) {
            i++;
        }
      }
      return out.join("\n");
    }

    // ---------- Dev Dump Logic ----------
    function getCleanDOM() {
        const clone = document.documentElement.cloneNode(true);
        const sourceeMenu = clone.querySelector("#hx_wrap");
        if (sourceeMenu) {
            sourceeMenu.remove();
        }
        const sourceeToast = clone.querySelector("#hx_toast");
        if (sourceeToast) {
            sourceeToast.remove();
        }

        clone.querySelectorAll("script, noscript, iframe, canvas, video, audio, picture").forEach(e => e.remove());
        clone.querySelectorAll("svg").forEach(e => { 
            if (e.innerHTML.length > 200) {
                e.innerHTML = ""; 
            }
        });
        
        clone.querySelectorAll("img, source").forEach(e => {
            if (e.src && e.src.startsWith("data:")) {
                e.removeAttribute("src");
            }
            if (e.srcset) {
                e.removeAttribute("srcset");
            }
        });

        clone.querySelectorAll('input[type="hidden"]').forEach(e => e.remove());
        clone.querySelectorAll('input:not([type="hidden"]), textarea').forEach(e => {
            if (e.hasAttribute('value')) {
                e.setAttribute('value', '[REDACTED]');
            }
            if (e.tagName.toLowerCase() === 'textarea') {
                e.textContent = '[REDACTED]';
            }
        });
        return clone.outerHTML;
    }

    async function buildDevDump(onProg) {
        let md = `# AI DEV DUMP: ${location.href}\n\n`;
        md += `## 1. INLINE & INJECTED STYLES (<style>)\n`;
        const styles = document.querySelectorAll("style");
        styles.forEach((s, i) => {
            const css = s.textContent.trim();
            if (css) {
                let ident = [];
                if (s.id) ident.push(`id="${s.id}"`);
                if (s.className) ident.push(`class="${s.className}"`);
                Array.from(s.attributes).forEach(attr => {
                    if (attr.name.startsWith('data-')) ident.push(`${attr.name}="${attr.value}"`);
                });

                let attrString = ident.length > 0 ? ` [${ident.join(", ")}]` : " [Anonymous/Inline]";
                let origin = "Vanilla Site / Unknown";
                let originTag = "";
                
                if (s.id && s.id.toLowerCase().includes("stylus")) { 
                    origin = "Stylus Theme"; originTag = "🎨 "; 
                } else if (s.className && s.className.toLowerCase().includes("stylus")) { 
                    origin = "Stylus Theme"; originTag = "🎨 "; 
                } else if (css.includes("display: none !important") && css.length > 500) { 
                    origin = "AdBlocker / Anti-Tracker"; originTag = "🛡️ "; 
                } else if (css.includes("--hx_scale")) { 
                    origin = "Sourcee Userscript"; originTag = "⚙️ "; 
                } else if (s.parentElement && s.parentElement.tagName.toLowerCase() === 'body') { 
                    origin = "Injected into <body> (Likely Userscript)"; originTag = "💉 "; 
                }

                md += `\n### Style Block ${i + 1} - ${originTag}${origin}${attrString}\n\`\`\`css\n${css}\n\`\`\`\n`;
            }
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
                md += `\`\`\`css\n${cssText.trim()}\n\`\`\`\n`;
            } catch(e) { 
                md += `> [Failed to fetch: CORS or network error]\n`; 
            }
        }

        md += `\n## 3. DOM SNAPSHOT (Sanitized for AI Context)\n`;
        md += `\`\`\`html\n${beautify(getCleanDOM())}\n\`\`\`\n`;
        return md;
    }

    // ---------- Self-Contained Logic ----------
    async function fetchBase64(url, signal) {
      if(signal?.aborted) {
          throw new Error("STOP");
      }
      const r = await fetch(url, {signal, cache:"no-store", credentials:"include"});
      const b = await r.blob();
      return new Promise((res,rej)=>{
        const fr = new FileReader(); 
        fr.onload = () => res(fr.result); 
        fr.onerror = rej; 
        fr.readAsDataURL(b);
      });
    }

    async function processImages(html, limit, signal, onProg) {
      const doc = new DOMParser().parseFromString(html,"text/html");
      const imgs = Array.from(doc.querySelectorAll("img")).filter(i=>!i.src.startsWith("data:"));
      const total = limit>0 ? Math.min(limit, imgs.length) : imgs.length;
      onProg(0, total);
      let count = 0;
      for(const img of imgs) {
        if(count >= total) break;
        if(signal?.aborted) {
            return {html:doc.documentElement.outerHTML, stopped:true};
        }
        try {
          const abs = new URL(img.getAttribute("src"), location.href).href;
          const b64 = await fetchBase64(abs, signal);
          img.setAttribute("src", b64);
          img.removeAttribute("srcset"); 
          img.removeAttribute("loading");
        } catch(e) { 
          if(signal?.aborted) {
              return {html:doc.documentElement.outerHTML, stopped:true};
          }
        }
        count++; 
        onProg(count, total);
      }
      return {html:doc.documentElement.outerHTML, stopped:false};
    }

    // ---------- UI Construction ----------
    const wrap = document.createElement("div"); 
    wrap.id="hx_wrap";
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
          <option value="assets">Asset Inspector (Network)</option>
        </select>
        
        <div id="hx_asset_ctrls">
          <span class="hx_actrl" data-sel="all">All</span>
          <span class="hx_actrl" data-sel="none">None</span>
          <span class="hx_actrl css" data-sel="css">CSS</span>
          <span class="hx_actrl js" data-sel="js">JS</span>
          <span class="hx_actrl html" data-sel="html">FRM</span>
        </div>
        <div id="hx_asset_box"></div>

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
      mainBtns: wrap.querySelector("#hx_main_row"),
      assetBox: wrap.querySelector("#hx_asset_box"),
      assetCtrls: wrap.querySelector("#hx_asset_ctrls")
    };

    els.name.value = sanitize(location.hostname + location.pathname);
    let useTs = true;
    let ac = null;
    let partialRes = null;

    els.ts.onclick = () => { 
        useTs = !useTs; 
        els.ts.textContent = `Time: ${useTs ? "ON" : "OFF"}`; 
    };

    els.scale.onclick = () => {
      const steps = [1.0, 1.15, 1.35, 1.5, 1.7];
      let idx = 0;
      for (let i = 0; i < steps.length; i++) {
        if (Math.abs(steps[i] - uiScale) < 0.02) { 
            idx = i; 
            break; 
        }
      }
      uiScale = steps[(idx + 1) % steps.length];
      document.documentElement.style.setProperty("--hx_scale", String(uiScale));
      els.scale.textContent = `UI: ${Math.round(uiScale * 100)}%`;
      try { 
          localStorage.setItem(STORE_SCALE, String(uiScale)); 
      } catch (e) {
          // Ignored
      }
      toast(`UI scaled to ${Math.round(uiScale * 100)}%`);
    };

    // Asset Box Mode Reset
    els.mode.addEventListener("change", () => {
        els.assetBox.style.display = "none";
        els.assetCtrls.style.display = "none";
        els.assetBox.innerHTML = "";
        if (els.mode.value === "assets") {
            els.start.textContent = "Scan Assets";
        } else {
            els.start.textContent = "Start";
        }
    });

    // Update Download Button dynamically when clicking checkboxes
    els.assetBox.addEventListener("change", (e) => {
        if (e.target.tagName === "INPUT") {
            const count = els.assetBox.querySelectorAll('input:checked').length;
            els.start.textContent = `Download (${count})`;
        }
    });

    // Smart Selection Button Logic
    els.assetCtrls.addEventListener("click", (e) => {
        if (!e.target.classList.contains("hx_actrl")) return;
        const sel = e.target.getAttribute("data-sel");
        const boxes = els.assetBox.querySelectorAll('input[type="checkbox"]');
        
        boxes.forEach(b => {
            if (sel === "all") {
                b.checked = true;
            } else if (sel === "none") {
                b.checked = false;
            } else {
                // If they clicked JS, only check JS, etc.
                if (b.getAttribute("data-type") === sel) {
                    b.checked = true;
                } else {
                    b.checked = false;
                }
            }
        });

        // Trigger the counter update manually
        const count = els.assetBox.querySelectorAll('input:checked').length;
        els.start.textContent = `Download (${count})`;
    });

    function getFN(suffix) { 
        return `${els.name.value}_${suffix}${useTs ? "_"+ts() : ""}.html`; 
    }
    
    function getFNTxt(suffix) { 
        return `${els.name.value}_${suffix}${useTs ? "_"+ts() : ""}.md`; 
    }

    function toggleControls(state) {
        if (state === "running") {
            els.stop.classList.remove("disabled"); 
            els.mode.disabled = true;
            els.assetCtrls.style.pointerEvents = "none"; // Disable smart buttons during download
            els.assetCtrls.style.opacity = "0.5";
        } else {
            els.start.classList.remove("disabled", "working");
            if (els.mode.value !== "assets" || els.assetBox.style.display === "none") {
                els.start.textContent = els.mode.value === "assets" ? "Scan Assets" : "Start";
            }
            els.stop.classList.add("disabled"); 
            els.mode.disabled = false;
            els.assetCtrls.style.pointerEvents = "auto";
            els.assetCtrls.style.opacity = "1";
        }
    }

    els.start.onclick = async () => {
      if (els.start.classList.contains("working") || els.start.classList.contains("disabled")) {
          return;
      }
      const mode = els.mode.value;
      const lim = parseInt(els.limit.value) || 0;
      
      try {
        if(mode === "fetch") {
          toast("Fetching..."); 
          dl(await fetchTxt(location.href), getFN("source"));
          
        } else if(mode === "dom") {
          toast("Snapshotting..."); 
          dl("<!doctype html>\n"+document.documentElement.outerHTML, getFN("dom"));
          
        } else if(mode === "pretty") {
          toast("Beautifying..."); 
          dl(beautify(await fetchTxt(location.href)), getFN("pretty"));
          
        } else if(mode === "devdump") {
          toggleControls("running");
          els.start.classList.add("working");
          els.start.textContent = "Scraping...";
          
          const mdData = await buildDevDump((c,t) => { els.start.textContent = `CSS ${c}/${t}`; });
          dl(mdData, getFNTxt("AI_CONTEXT"));
          toast("Dev Dump Saved!");
          toggleControls("idle");
          
        } else if(mode === "self") {
          ac = new AbortController(); 
          toggleControls("running");
          els.start.classList.add("working"); 
          els.start.textContent = "Prep...";

          const res = await processImages(document.documentElement.outerHTML, lim, ac.signal, (c,t) => els.start.textContent = `Img ${c}/${t}`);
          if(res.stopped) {
             partialRes = res.html; 
             els.mainBtns.style.display = "none";
             els.partials.style.display = "flex"; 
             toast("Stopped.");
          } else {
             dl(res.html, getFN("self")); 
             toast("Done!"); 
             toggleControls("idle");
          }
          
        } else if(mode === "assets") {
          // --- ASSET INSPECTOR MODE ---
          if (els.assetBox.style.display === "none" || els.assetBox.innerHTML === "") {
              // 1. SCAN PHASE
              let assets = [];
              
              document.querySelectorAll('link[rel="stylesheet"]').forEach(el => {
                  if (el.href) assets.push({ type: 'css', badge: 'css', url: el.href });
              });
              
              document.querySelectorAll('script[src]').forEach(el => {
                  if (el.src) assets.push({ type: 'js', badge: 'js', url: el.src });
              });
              
              document.querySelectorAll('iframe[src]').forEach(el => {
                  if (el.src) assets.push({ type: 'html', badge: 'frm', url: el.src });
              });
              
              if (assets.length === 0) {
                  return toast("No external assets found.");
              }

              els.assetBox.innerHTML = "";
              assets.forEach((a, i) => {
                  let urlObj;
                  try { 
                      urlObj = new URL(a.url, location.href); 
                  } catch (e) {
                      // Ignored
                  }
                  
                  let fn = "file_" + i;
                  let domain = "unknown";
                  
                  if (urlObj) {
                      domain = urlObj.hostname.replace(/^www\./, '');
                      let parts = urlObj.pathname.split('/');
                      fn = parts[parts.length - 1] || "index";
                  }
                  
                  if (fn.length > 35) {
                      fn = fn.substring(0, 35) + "...";
                  }
                  
                  let safeDomain = domain.replace(/[^a-zA-Z0-9]/g, '_');
                  let saveFn = `${safeDomain}_${fn}`;
                  if (a.type === 'html' && !saveFn.endsWith('.html')) {
                      saveFn += ".html";
                  }
                  
                  let lbl = document.createElement("label");
                  lbl.className = "hx_asset_item";
                  lbl.title = a.url; 
                  // Adding data-type attribute here makes the Smart Selection buttons work instantly
                  lbl.innerHTML = `
                    <input type="checkbox" checked data-url="${a.url}" data-fn="${saveFn}" data-type="${a.type}">
                    <span class="hx_badge ${a.type}">${a.badge}</span> 
                    <span><span class="hx_domain">[${domain}]</span> ${fn}</span>
                  `;
                  els.assetBox.appendChild(lbl);
              });
              
              els.assetCtrls.style.display = "flex";
              els.assetBox.style.display = "flex";
              els.start.textContent = `Download (${assets.length})`;
          } else {
              // 2. DOWNLOAD PHASE
              let checks = Array.from(els.assetBox.querySelectorAll('input:checked'));
              if (checks.length === 0) {
                  return toast("No assets selected.");
              }

              ac = new AbortController();
              toggleControls("running");
              els.start.classList.add("working");
              
              let chain = Promise.resolve();
              checks.forEach((chk, idx) => {
                  chain = chain.then(() => {
                      if (ac && ac.signal.aborted) {
                          throw new Error("STOP");
                      }
                      els.start.textContent = `Fetching ${idx + 1}/${checks.length}`;
                      let url = chk.getAttribute("data-url");
                      let fn = chk.getAttribute("data-fn"); 
                      
                      return fetchCors(url).then(txt => {
                          dl(txt, fn);
                          return new Promise(r => setTimeout(r, 600));
                      }).catch(e => {
                          console.warn("Sourcee asset fail:", url, e);
                      });
                  });
              });

              chain.then(() => {
                  toast("Assets Downloaded!");
                  toggleControls("idle");
                  els.start.textContent = `Download (${checks.length})`;
              }).catch(e => {
                  toast("Stopped.");
                  toggleControls("idle");
                  els.start.textContent = `Download (${checks.length})`;
              });
          }
        }
      } catch(e) { 
          toast("Error: " + e.message); 
          toggleControls("idle"); 
      }
    };

    els.stop.onclick = () => ac?.abort();
    
    els.saveP.onclick = () => { 
        if(partialRes) {
            dl(partialRes, getFN("partial")); 
        }
        resetPartials(); 
    };
    
    els.discP.onclick = resetPartials;
    
    function resetPartials() { 
        partialRes = null; 
        ac = null; 
        els.partials.style.display = "none"; 
        els.mainBtns.style.display = "flex"; 
        toggleControls("idle"); 
    }

    // ---------- Draggable Logic ----------
    let isDrag = false, startX, startY, sL, sT; 
    const store = "hx_pos_"+location.hostname;
    
    try { 
        const p=JSON.parse(localStorage.getItem(store)); 
        if(p) { 
            wrap.style.left = p.x + "px"; 
            wrap.style.top = p.y + "px"; 
            wrap.style.right = "auto"; 
            wrap.style.bottom = "auto"; 
        } 
    } catch(e) {
        // Ignored
    }
    
    els.fab.addEventListener("pointerdown", e => {
      if(e.button !== 0) return; 
      
      try {
          els.fab.setPointerCapture(e.pointerId);
      } catch (e) {
          // Ignored
      }
      
      isDrag = false; 
      startX = e.clientX; 
      startY = e.clientY;
      const r = wrap.getBoundingClientRect(); 
      sL = r.left; 
      sT = r.top;
    });
    
    els.fab.addEventListener("pointermove", e => {
      try {
          if(!els.fab.hasPointerCapture(e.pointerId)) return;
      } catch (e) {
          // Ignored
      }
      
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      if(!isDrag && (Math.abs(dx) > 15 || Math.abs(dy) > 15)) {
          isDrag = true;
          wrap.style.right = "auto"; 
          wrap.style.bottom = "auto";
      }
      if (isDrag) {
          wrap.style.left = (sL + dx) + "px"; 
          wrap.style.top = (sT + dy) + "px";
      }
    });
    
    els.fab.addEventListener("pointerup", e => {
      try { 
          els.fab.releasePointerCapture(e.pointerId); 
      } catch(err) {
          // Ignored
      }
      
      if(isDrag) {
          try {
              localStorage.setItem(store, JSON.stringify({
                  x: parseFloat(wrap.style.left), 
                  y: parseFloat(wrap.style.top)
              }));
          } catch (e) {
              // Ignored
          }
      } else {
          els.menu.classList.toggle("show");
      }
      isDrag = false;
    });

    els.fab.addEventListener("pointercancel", e => {
      try { 
          els.fab.releasePointerCapture(e.pointerId); 
      } catch(err) {
          // Ignored
      }
      isDrag = false;
    });
  }
})();
            
