(() => {
  "use strict";
  const DB_KEY = "lunara-game-database-v1";
  const STARTER_GAMES = [
    { id:"mc26", title:"Minecraft 26.3", description:"", url:"https://classroom-google-co-m.github.io/js/mc26.html", category:"Games", mode:"redirect", iframeTitle:"Minecraft", iframeAllow:"fullscreen; autoplay; gamepad", iframeSandbox:"allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups", openInNewTab:true },
    { id:"baldi-plus", title:"Baldi's Basics +", description:"", url:"https://classroom-google-co-m.github.io/js/baldi-plus", category:"Games", mode:"redirect", iframeTitle:"Baldi's Basics +", iframeAllow:"fullscreen; autoplay; gamepad", iframeSandbox:"allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups", openInNewTab:true }
  ];
  const $ = selector => document.querySelector(selector);
  const els = { games:$("#games"), count:$("#count"), search:$("#search"), dialog:$("#gameDialog"), form:$("#gameForm"), toast:$("#toast"), save:$("#saveState") };
  let games = [];
  let toastTimer;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const safeUrl = value => { try { const url = new URL(value); return ["http:","https:"].includes(url.protocol) ? url.href : ""; } catch { return ""; } };
  function normalize(input) {
    const rows = Array.isArray(input) ? input : input && Array.isArray(input.games) ? input.games : [];
    return rows.map((g,i) => {
      if (!g || typeof g !== "object" || !safeUrl(g.url)) return null;
      return { id:String(g.id || `game-${Date.now()}-${i}`), title:String(g.title || "Untitled game"), description:String(g.description || ""), url:safeUrl(g.url), category:String(g.category || "Games"), mode:["redirect","iframe","raw"].includes(g.mode) ? g.mode : "redirect", iframeTitle:String(g.iframeTitle || g.title || "Game"), iframeAllow:String(g.iframeAllow || "fullscreen; autoplay; gamepad"), iframeSandbox:String(g.iframeSandbox || "allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups"), openInNewTab:g.openInNewTab !== false };
    }).filter(Boolean);
  }
  function notify(message) { els.toast.textContent=message; els.toast.classList.add("show"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>els.toast.classList.remove("show"),2400); }
  function save() { try { localStorage.setItem(DB_KEY, JSON.stringify({schemaVersion:1,games})); els.save.textContent="Saved just now"; setTimeout(()=>els.save.textContent="Changes save automatically",1500); } catch { els.save.textContent="Could not save in this browser"; } }
  function render() {
    const query=els.search.value.trim().toLowerCase();
    const visible=games.filter(g=>`${g.title} ${g.description} ${g.category}`.toLowerCase().includes(query));
    els.count.textContent=`${games.length} ${games.length===1?"game":"games"}`;
    if (!visible.length) {
      els.games.innerHTML=games.length ? `<div class="empty"><div><strong>No matches</strong>Try another search.</div></div>` : `<div class="empty"><div><strong>Your library is empty</strong>Add a game to start building your collection.<br><button class="btn primary" data-action="add">＋ Add your first game</button></div></div>`;
      return;
    }
    els.games.innerHTML=visible.map((g,i)=>`<article class="card" style="animation-delay:${Math.min(i,8)*55}ms"><div class="card-top"><span class="tag">${esc(g.category)}</span><div class="card-actions"><button class="icon-button" data-action="edit" data-id="${esc(g.id)}" title="Edit game" aria-label="Edit ${esc(g.title)}">✎</button><button class="icon-button" data-action="delete" data-id="${esc(g.id)}" title="Remove game" aria-label="Remove ${esc(g.title)}">×</button></div></div><h2>${esc(g.title)}</h2><p>${esc(g.description)}</p><div class="method">${g.mode.toUpperCase()} · ${(g.mode==="raw"&& !g.openInNewTab)?"THIS TAB":"NEW TAB"}</div><button class="btn primary launch" data-action="launch" data-id="${esc(g.id)}">Launch game <span aria-hidden="true">↗</span></button></article>`).join("");
  }
  function openEditor(game) {
    els.form.reset();
    $("#gameId").value=game?.id||""; $("#dialogTitle").textContent=game?"Edit game":"Add a game";
    $("#title").value=game?.title||""; $("#url").value=game?.url||""; $("#category").value=game?.category||"Games"; $("#mode").value=game?.mode||"redirect"; $("#description").value=game?.description||"";
    $("#iframeSandbox").value=game?.iframeSandbox||"allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups"; $("#iframeAllow").value=game?.iframeAllow||"fullscreen; autoplay; gamepad"; $("#openInNewTab").checked=game?.openInNewTab!==false;
    els.dialog.showModal(); $("#title").focus();
  }
  function download(name, content, type="application/json") { const blob=new Blob([content],{type}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
  function exportDb() { download("lunara-games.json",JSON.stringify({schemaVersion:1,games},null,2)); notify("Database exported as lunara-games.json"); }
  async function launch(game) {
    const url=safeUrl(game.url); if(!url){notify("This game URL is invalid.");return;}
    if(game.mode==="raw") { const tab=window.open(url,game.openInNewTab?"_blank":"_self"); if(!tab)notify("The browser may have blocked the new tab."); return; }
    const tab=window.open("about:blank","_blank"); if(!tab){notify("Allow pop-ups for this site and try again.");return;}
    try { tab.document.title=game.title; tab.document.body.style.margin="0"; tab.document.body.style.background="#000"; } catch {}
    if(game.mode==="iframe") { const frame=tab.document.createElement("iframe"); frame.title=game.iframeTitle||game.title; frame.src=url; frame.allow=game.iframeAllow; frame.referrerPolicy="strict-origin-when-cross-origin"; frame.style.cssText="position:fixed;inset:0;width:100%;height:100%;border:0;background:#000"; if(game.iframeSandbox)frame.setAttribute("sandbox",game.iframeSandbox); tab.document.body.appendChild(frame); return; }
    const status=tab.document.createElement("p"); status.textContent="Loading game…"; status.style.cssText="color:#ddd;font:16px system-ui;padding:24px"; tab.document.body.appendChild(status);
    try { const response=await fetch(url,{cache:"default",credentials:"omit"}); if(!response.ok)throw new Error(`HTTP ${response.status}`); let html=await response.text(); const base=`<base href="${esc(url)}">`; if(/<head\b[^>]*>/i.test(html))html=html.replace(/<head\b[^>]*>/i,m=>`${m}${base}`); else if(/<html\b[^>]*>/i.test(html))html=html.replace(/<html\b[^>]*>/i,m=>`${m}<head>${base}</head>`); else html=`<!doctype html><html><head>${base}</head><body>${html}</body></html>`; tab.document.open();tab.document.write(html);tab.document.close(); }
    catch(error) { tab.document.open();tab.document.write(`<!doctype html><html><body style="margin:0;background:#090b16;color:#fff;font:16px system-ui;padding:24px"><h1>Could not load game HTML</h1><p>${esc(error.message||error)}</p><p>Try iframe mode or direct mode for this URL.</p></body></html>`);tab.document.close(); }
  }
  $("#addButton").addEventListener("click",()=>openEditor()); $("#closeDialog").addEventListener("click",()=>els.dialog.close()); $("#cancelButton").addEventListener("click",()=>els.dialog.close()); $("#exportButton").addEventListener("click",exportDb);
  $("#importButton").addEventListener("click",()=>$("#importFile").click()); $("#importFile").addEventListener("change",async event=>{const file=event.target.files?.[0];if(!file)return;try{const incoming=normalize(JSON.parse(await file.text()));if(!incoming.length && !confirm("This file contains no valid games. Replace the current library with an empty one?"))return;games=incoming;save();render();notify(`Imported ${games.length} games`);}catch{notify("Could not read that JSON database.");}event.target.value="";});
  els.search.addEventListener("input",render);
  els.form.addEventListener("submit",event=>{event.preventDefault();const id=$("#gameId").value;const url=safeUrl($("#url").value);if(!url){notify("Enter a valid http or https URL.");return;}const game={id:id||`game-${Date.now()}`,title:$("#title").value.trim(),url,category:$("#category").value.trim()||"Games",description:$("#description").value.trim(),mode:$("#mode").value,iframeTitle:$("#title").value.trim(),iframeAllow:$("#iframeAllow").value.trim(),iframeSandbox:$("#iframeSandbox").value.trim(),openInNewTab:$("#openInNewTab").checked};const index=games.findIndex(g=>g.id===id);if(index>=0)games[index]=game;else games.unshift(game);save();render();els.dialog.close();notify(index>=0?"Game updated":"Game added to your library");});
  els.games.addEventListener("click",event=>{const button=event.target.closest("[data-action]");if(!button)return;const game=games.find(g=>g.id===button.dataset.id);switch(button.dataset.action){case"add":openEditor();break;case"edit":if(game)openEditor(game);break;case"delete":if(game&&confirm(`Remove “${game.title}” from your library?`)){games=games.filter(g=>g.id!==game.id);save();render();notify("Game removed");}break;case"launch":if(game)void launch(game);break;}});
  els.games.addEventListener("pointermove",event=>{const card=event.target.closest(".card");if(!card)return;const rect=card.getBoundingClientRect();card.style.setProperty("--x",`${event.clientX-rect.left}px`);card.style.setProperty("--y",`${event.clientY-rect.top}px`);},{passive:true});
  async function init() {
    let hasSavedDatabase=false;
    try {const saved=localStorage.getItem(DB_KEY);if(saved){games=normalize(JSON.parse(saved));hasSavedDatabase=true;}} catch {}
    if(!hasSavedDatabase) {
      try {const response=await fetch("./games.json",{cache:"no-store"});if(!response.ok)throw new Error("Database file was not found");games=normalize(await response.json());}
      catch {games=normalize(STARTER_GAMES);}
    }
    render();
  }
  void init();
})();
