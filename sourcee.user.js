// ==UserScript==
// @name         Sourcee
// @namespace    https://tampermonkey.net/
// @version      2.1
// @description  The ultimate HTML export tool. (Slim UI)
// @match        https://*/*
// @match        http://*/*
// @grant        GM_addStyle
// @run-at       document-idle
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
    // ---------- UI Styles ----------
    safeAddStyle(`
      #hx_wrap {
        position: fixed;
        right: 12px; bottom: 80px;
        z-index: 2147483647;
        font: 13px/1.2 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        color: #fff;
        user-select: none;
        touch-action: none;
        max-width: 100vw;
      }
      #hx_fab {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 10px 14px;
        border-radius: 24px;
        border: 1px solid rgba(255,255,255,0.18);
        background: rgba(20,20,20,0.85);
        backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        cursor: pointer;
      }
      #hx_menu {
        margin-top: 12px; width: min(300px, 90vw);
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,0.14);
        background: rgba(25,25,25,0.95);
        backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        box-shadow: 0 16px 40px rgba(0,0,0,0.6);
        padding: 12px;
        display: none;
        flex-direction: column; gap: 10px;
      }
      #hx_menu.show { display: flex; }

      /* Inputs */
      .hx_field, .hx_select {
        width: 100%; box-sizing: border-box;
        padding: 10px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.15);
        background: rgba(0,0,0,0.3);
        color: #fff; outline: none;
        font-size: 13px;
      }
      .hx_select {
        appearance: none;
        background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
        background-repeat: no-repeat;
        background-position: right 10px center;
        background-size: 10px;
        padding-right: 30px;
      }
      .hx_select option { background: #333; }

      /* Buttons */
      .hx_row { display: flex; gap: 8px; }
      .hx_btn {
        flex: 1; padding: 10px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.12);
        background: rgba(255,255,255,0.08);
        color: #eee; cursor: pointer;
        text-align: center; font-weight: 600;
      }
      .hx_btn.primary { background: rgba(80, 160, 255, 0.25); border-color: rgba(80, 160, 255, 0.4); color: #fff; }
      .hx_btn.danger { background: rgba(255,80,80,0.25); border-color: rgba(255,80,80,0.4); color: #ffcccc; }
      .hx_btn.disabled { opacity: 0.4; pointer-events: none; }

      /* Settings Row */
      .hx_settings { display: flex; align-items: center; justify-content: space-between; font-size: 11px; opacity: 0.8; padding: 0 4px; }
      .hx_tiny_inp { width: 50px; padding: 4px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2); background: transparent; color: #fff; text-align: center; }
      .hx_clickable { cursor: pointer; text-decoration: underline; }

      /* Toast */
      #hx_toast {
        position: fixed; left: 50%; bottom: 100px; transform: translateX(-50%) translateY(20px);
        z-index: 2147483647; padding: 10px 16px; border-radius: 20px;
        background: rgba(20,20,20,0.9); border: 1px solid rgba(255,255,255,0.1);
        backdrop-filter: blur(4px); opacity: 0; pointer-events: none;
        transition: opacity .2s, transform .2s; color: #fff; font-weight: 600;
      }
      #hx_toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
    `);

    // ---------- Utilities ----------
    function toast(msg) {
      let el = document.getElementById("hx_toast");
      if (!el) { el = document.createElement("div"); el.id = "hx_toast"; document.body.appendChild(el); }
      el.textContent = msg; el.classList.add("show");
      clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("show"), 2500);
    }
    function sanitize(s) { return (s||"page").replace(/^https?:\/\//i,"").replace(/[^\w.\-]+/g,"_").slice(0,120); }
    function ts() { const d=new Date(), p=n=>String(n).padStart(2,"0"); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`; }
    function dl(txt, name) {
      const b=new Blob([txt],{type:"text/html"}), u=URL.createObjectURL(b), a=document.createElement("a");
      a.href=u; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),2000);
    }
    async function fetchTxt(url) {
      const r = await fetch(url, {cache:"no-store", credentials:"include"});
      if(!r.ok) throw new Error(r.status); return await r.text();
    }
    function beautify(html) {
      const t = (html||"").replace(/>\s+</g,">\n<").replace(/\n{3,}/g,"\n\n");
      let i=0,out=[];
      for(const l of t.split("\n")) {
        const tr=l.trim(); if(!tr) continue;
        if(/^<\/[^>]+>/.test(tr)) i=Math.max(0,i-1);
        out.push("  ".repeat(i)+tr);
        if(/^<[^!/][^>]*[^/]>$/.test(tr) && !/^<(script|style|meta|link|img|br|hr)/i.test(tr)) i++;
      }
      return out.join("\n");
    }

    // ---------- Self-Contained Logic ----------
    async function fetchBase64(url, signal) {
      if(signal?.aborted) throw new Error("STOP");
      const r = await fetch(url, {signal, cache:"no-store"});
      const b = await r.blob();
      return new Promise((res,rej)=>{
        const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.onerror=rej; fr.readAsDataURL(b);
      });
    }

    async function processImages(html, limit, signal, onProg) {
      const doc = new DOMParser().parseFromString(html,"text/html");
      const imgs = Array.from(doc.querySelectorAll("img")).filter(i=>!i.src.startsWith("data:"));
      const total = limit>0 ? Math.min(limit, imgs.length) : imgs.length;
      let count=0;

      for(const img of imgs) {
        if(count >= total) break;
        if(signal?.aborted) return {html:doc.documentElement.outerHTML, stopped:true};
        try {
          const abs = new URL(img.getAttribute("src"), location.href).href;
          onProg(count+1, total);
          const b64 = await fetchBase64(abs, signal);
          img.setAttribute("src", b64);
          img.removeAttribute("srcset"); img.removeAttribute("loading");
        } catch(e) { console.warn(e); }
        count++;
      }
      return {html:doc.documentElement.outerHTML, stopped:false};
    }

    // ---------- UI Construction ----------
    const wrap = document.createElement("div"); wrap.id="hx_wrap";
    wrap.innerHTML = `
      <div id="hx_fab">Sourcee <span>▾</span></div>
      <div id="hx_menu">
        <input id="hx_name" class="hx_field" placeholder="Filename">
        <select id="hx_mode" class="hx_select">
          <option value="fetch">Fetch Source</option>
          <option value="dom">DOM Snapshot</option>
          <option value="pretty">Beautify Fetch</option>
          <option value="self">Self-Contained (Img)</option>
        </select>
        <div class="hx_row">
          <div id="hx_start" class="hx_btn primary">Start</div>
          <div id="hx_stop" class="hx_btn danger disabled">Stop</div>
        </div>
        <div class="hx_settings">
          <label>Limit: <input id="hx_limit" type="number" class="hx_tiny_inp" value="0"></label>
          <span id="hx_ts" class="hx_clickable">Time: ON</span>
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
      partials: wrap.querySelector("#hx_partials"),
      saveP: wrap.querySelector("#hx_save_p"),
      discP: wrap.querySelector("#hx_disc_p"),
      mainBtns: wrap.querySelector(".hx_row") // the start/stop row
    };

    els.name.value = sanitize(location.hostname + location.pathname);
    let useTs = true;
    let ac = null; // AbortController
    let partialRes = null;

    // Toggle Menu
    els.fab.onclick = () => els.menu.classList.toggle("show");
    
    // Toggle Timestamp
    els.ts.onclick = () => { useTs=!useTs; els.ts.textContent = `Time: ${useTs?"ON":"OFF"}`; };

    function getFN(suffix) {
      return `${els.name.value}_${suffix}${useTs ? "_"+ts() : ""}.html`;
    }

    function toggleControls(running) {
      if(running) {
        els.start.classList.add("disabled");
        els.stop.classList.remove("disabled");
        els.mode.disabled = true;
      } else {
        els.start.classList.remove("disabled");
        els.stop.classList.add("disabled");
        els.mode.disabled = false;
        els.start.textContent = "Start";
      }
    }

    els.start.onclick = async () => {
      const mode = els.mode.value;
      const lim = parseInt(els.limit.value)||0;
      
      try {
        if(mode === "fetch") {
          toast("Fetching..."); dl(await fetchTxt(location.href), getFN("source"));
        } else if(mode === "dom") {
          toast("Snapshotting..."); dl("<!doctype html>\n"+document.documentElement.outerHTML, getFN("dom"));
        } else if(mode === "pretty") {
          toast("Beautifying..."); dl(beautify(await fetchTxt(location.href)), getFN("pretty"));
        } else if(mode === "self") {
          ac = new AbortController();
          toggleControls(true);
          toast("Processing Images...");
          
          const raw = document.documentElement.outerHTML;
          const res = await processImages(raw, lim, ac.signal, (c,t) => els.start.textContent = `${c}/${t}`);
          
          if(res.stopped) {
             partialRes = res.html;
             els.mainBtns.style.display = "none";
             els.partials.style.display = "flex";
             toast("Stopped.");
          } else {
             dl(res.html, getFN("self"));
             toast("Done!");
             toggleControls(false);
          }
        }
      } catch(e) {
        toast("Error: " + e.message);
        toggleControls(false);
      }
    };

    els.stop.onclick = () => ac?.abort();

    els.saveP.onclick = () => {
      if(partialRes) dl(partialRes, getFN("partial"));
      resetPartials();
    };
    els.discP.onclick = resetPartials;

    function resetPartials() {
      partialRes = null; ac = null;
      els.partials.style.display = "none";
      els.mainBtns.style.display = "flex";
      toggleControls(false);
    }

    // Draggable Logic (Mobile Friendly)
    let isDrag = false, startX, startY, sL, sT;
    const store = "hx_pos_"+location.hostname;
    
    // Restore Pos
    try { const p=JSON.parse(localStorage.getItem(store)); if(p) { wrap.style.left=p.x+"px"; wrap.style.top=p.y+"px"; wrap.style.right="auto"; wrap.style.bottom="auto"; } } catch(_){}

    els.fab.addEventListener("pointerdown", e => {
      if(e.button!==0)return; els.fab.setPointerCapture(e.pointerId);
      isDrag=false; startX=e.clientX; startY=e.clientY;
      const r=wrap.getBoundingClientRect(); sL=r.left; sT=r.top;
      wrap.style.right="auto"; wrap.style.bottom="auto"; wrap.style.left=sL+"px"; wrap.style.top=sT+"px";
    });
    els.fab.addEventListener("pointermove", e => {
      if(!els.fab.hasPointerCapture(e.pointerId)) return;
      const dx=e.clientX-startX, dy=e.clientY-startY;
      if(Math.abs(dx)+Math.abs(dy)>5) isDrag=true;
      wrap.style.left=(sL+dx)+"px"; wrap.style.top=(sT+dy)+"px";
    });
    els.fab.addEventListener("pointerup", e => {
      els.fab.releasePointerCapture(e.pointerId);
      if(isDrag) localStorage.setItem(store, JSON.stringify({x:parseFloat(wrap.style.left), y:parseFloat(wrap.style.top)}));
      else els.menu.classList.toggle("show"); // Click behavior
    });
    // Override click to prevent double firing with pointer events
    els.fab.onclick = null; 
  }
})();
