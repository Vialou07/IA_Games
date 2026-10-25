/* =====================================================================================
   test/qa_tour.js — contrôle qualité (intégrateur) : TOUR de toutes les routes et de tous les onglets de la refonte, données
   RÉELLES (robot et LoL Esports en ligne, heure réelle) ou locales (--local : lot1/data/*_pp.json).
   Pour chaque écran : texte affiché (test/qa/tour_<appareil>.txt), et cadrage mesuré indépendamment du socle :
     - document : html/body ne défilent jamais (scrollingElement) ;
     - écran : dépassement 0 (tient, .fit) ou ≥ 120 px (vrai défilement) ; « MINI » si 1 à 119 px ;
     - .fit : rien de COUPÉ (bas du dernier élément visible ≤ bas de l'écran) ; molette sur un écran .fit : il ne bouge pas ;
     - aucun défilement horizontal, aucun élément qui dépasse à droite ou à gauche ;
     - hauteur ÷ écran (premier niveau ≤ 1,5 sauf listes) ; typographie (espace ordinaire avant : ; ? ! %) ;
     - cibles tactiles visibles < 40 px (hors zones élargies par ::after) ; erreurs JS.
   node test/qa_tour.js [iphone12|pixel7|w360|wk_iphone12] [--local]   (port 8914) → test/qa/tour.json
   ===================================================================================== */
const PW="C:/Users/vialo/AppData/Local/Temp/claude/c--Users-vialo-Desktop-Code-Worlds-2026/cead0307-273c-463a-8548-1b2491359512/scratchpad/pw/node_modules/playwright";
const ARGS=process.argv.slice(2),WK=ARGS.some(a=>a.startsWith("wk_"));if(WK)process.env.PLAYWRIGHT_BROWSERS_PATH=require("path").join(PW,"../../browsers");
const {chromium,webkit,devices}=require(PW);const fs=require("fs"),path=require("path"),http=require("http");
const ROOT=path.join(__dirname,".."),DATA=path.join(ROOT,"../data"),OUT=path.join(ROOT,"shots","qa"),PORT=8914;fs.mkdirSync(OUT,{recursive:true});fs.mkdirSync(path.join(__dirname,"qa"),{recursive:true});
const LOCAL=ARGS.includes("--local"),ONLY=ARGS.filter(a=>!a.startsWith("--"));
const DEV={iphone12:{...devices["iPhone 12"]},pixel7:{...devices["Pixel 7"]},w360:{...devices["Galaxy S9+"],viewport:{width:360,height:740},screen:{width:360,height:740}},wk_iphone12:{...devices["iPhone 12"]},wk_iphone13:{...devices["iPhone 13"]}};
const TYPES={html:"text/html; charset=utf-8",js:"text/javascript",json:"application/json",png:"image/png"};
const srv=http.createServer((q,s)=>{const f=path.join(ROOT,decodeURIComponent(q.url.split("?")[0]));if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);s.end();return}
  s.writeHead(200,{"content-type":TYPES[f.split(".").pop()]||"application/octet-stream","cache-control":"no-store"});fs.createReadStream(f).pipe(s)});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
/* écrans « liste » (autorisés au-delà de 1,5 écran) */
const LISTS=/^(pl|teams|cal\/|sui\/bl|sim\/rob|fxl|rk\/|bets\/|t\/[^/]+\/ma|st\/ch\+|m\/[^/]+\/(dr|gm|eq|av)|d\/[^/]+\/ch|lg\/bt|lg\/bg)/;
const measure=async(p,label)=>{const m=await measure0(p,label);if(m.fit){const vp=p.viewportSize();await p.mouse.move(vp.width/2,vp.height*0.6);await p.mouse.wheel(0,300);await wait(250);
    m.wheel=await p.evaluate(y0=>{const el=NAV.length?NAV[NAV.length-1].el:document.querySelector(".home");const d=el.scrollTop-y0;el.scrollTop=y0;return d||document.scrollingElement.scrollTop},m.top)}return m};
const measure0=(p,label)=>p.evaluate(async label=>{const el=NAV.length?NAV[NAV.length-1].el:document.querySelector(".home");const fit=el.classList.contains("fit");
  const er=el.getBoundingClientRect();let maxB=0;const vis=[...el.querySelectorAll("*")].filter(x=>{const r=x.getBoundingClientRect();if(!(r.width>0&&r.height>0))return false;if(x.closest("details:not([open])>:not(summary)"))return false;if(x.checkVisibility&&!x.checkVisibility({contentVisibilityAuto:true,opacityProperty:true,visibilityProperty:true}))return false;const cs=getComputedStyle(x);return cs.visibility!=="hidden"&&cs.opacity!=="0"&&cs.position!=="fixed"&&!x.closest("[hidden],.hbg,.beam")});
  // rectangle réellement visible : rogné par chaque ancêtre qui coupe son contenu (overflow hidden/clip/auto), jusqu'à l'écran
  const clipRect=x=>{let r=x.getBoundingClientRect(),L=r.left,R=r.right,T=r.top,B=r.bottom;for(let a=x.parentElement;a&&a!==el;a=a.parentElement){const cs=getComputedStyle(a);
      if(cs.overflowX!=="visible"||cs.overflowY!=="visible"||cs.contain.includes("paint")||cs.clipPath!=="none"){const q=a.getBoundingClientRect();if(cs.overflowX!=="visible"){L=Math.max(L,q.left);R=Math.min(R,q.right)}if(cs.overflowY!=="visible"){T=Math.max(T,q.top);B=Math.min(B,q.bottom)}}}
    return {L,R,T,B,empty:R<=L||B<=T}};
  vis.forEach(x=>{const c=clipRect(x);if(!c.empty)maxB=Math.max(maxB,c.B+el.scrollTop)});
  const cut=fit?Math.round(maxB-er.bottom):0;
  const wide=vis.filter(x=>{const c=clipRect(x);return !c.empty&&(c.R>innerWidth+1||c.L<-1)&&!x.closest(".beam")}).slice(0,4).map(x=>(x.className&&x.className.baseVal!==undefined?x.className.baseVal:x.className||x.tagName)+"|"+Math.round(clipRect(x).L)+"→"+Math.round(clipRect(x).R));
  const tw=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let x,typo=[];while((x=tw.nextNode())){if(/[^\s] [:;?!%]/.test(x.nodeValue)&&typo.length<3)typo.push(x.nodeValue.trim().slice(0,50))}
  const small=[...el.querySelectorAll("button,[role=button],a[href],input,[data-go],[data-p],[data-t],[data-m],[data-info],[data-pick]")].filter(b=>{const r=b.getBoundingClientRect();if(!(r.width>0&&r.height>0))return false;
    const a=getComputedStyle(b,"::after"),ext=a.content&&a.content!=="none"&&a.position==="absolute"?Math.max(0,-parseFloat(a.top)||0)+Math.max(0,-parseFloat(a.bottom)||0):0;
    if(b.closest(".hc,.home .grid>.w,.mrow,.rowb,.blk.lea-mb .lea-who"))return false;const p=b.parentElement&&b.parentElement.closest("button,[role=button],[data-go],[data-p],[data-t],[data-m]");if(p&&p!==b){const q=p.getBoundingClientRect();if(q.height>=40)return false}
    return r.height+ext<40&&r.width+ext<40||r.height+ext<32}).slice(0,5).map(b=>(b.className||b.tagName)+" "+Math.round(b.getBoundingClientRect().width)+"×"+Math.round(b.getBoundingClientRect().height));
  // molette sur un écran qui tient : il ne doit pas bouger
  const se=document.scrollingElement;
  return {label,fit,top:el.scrollTop,snug:el.classList.contains("snug"),over:fit?0:el.scrollHeight-el.clientHeight,raw:el.scrollHeight-el.clientHeight,ratio:+(el.scrollHeight/innerHeight).toFixed(2),cut:cut>1?cut:0,
    doc:se.scrollHeight-se.clientHeight,docTop:se.scrollTop,hs:el.scrollWidth>el.clientWidth+1||document.documentElement.scrollWidth>innerWidth+1,wide,typo,small,
    txt:(el.innerText||"").replace(/\s+/g," ").slice(0,900)}},label);
(async()=>{await new Promise(r=>srv.listen(PORT,"127.0.0.1",r));
  const ALL={};
  for(const [name,dev] of Object.entries(DEV)){if(ONLY.length?!ONLY.includes(name):name.startsWith("wk_"))continue;
    const b=await (name.startsWith("wk_")?webkit:chromium).launch();const ctx=await b.newContext({...dev,locale:"fr-FR",timezoneId:"Europe/Paris"});
    if(LOCAL)await ctx.route(/raw\.githubusercontent\.com\/Vialou07\/IA_Games\/stats[^/]*\/data\/(\w+)\.json/,r=>{const n=r.request().url().match(/data\/(\w+)\.json/)[1],f=path.join(DATA,n+"_pp.json");r.fulfill({status:fs.existsSync(f)?200:404,contentType:"application/json",body:fs.existsSync(f)?fs.readFileSync(f,"utf8"):""})});
    await ctx.route(/ntfy\.sh|lol\.fandom\.com/,r=>r.abort());
    const p=await ctx.newPage();const errs=[];p.on("pageerror",e=>errs.push(e.message));p.on("console",m=>{if(m.type()==="error"&&!/Failed to load resource|net::ERR|ERR_FAILED|EventSource/.test(m.text()))errs.push("console "+m.text().slice(0,200))});
    await p.goto(`http://127.0.0.1:${PORT}/dist/worlds-b.html?nointro`);await p.waitForFunction(()=>typeof MATCHES!=="undefined"&&MATCHES.length&&document.querySelector(".home .grid .w"),null,{timeout:60000});
    await p.evaluate(async()=>{await Promise.all([loadFJ(),loadDJ(),champMap()].map(x=>x&&x.catch?x.catch(()=>{}):x))});await wait(2500);
    const ctxInfo=await p.evaluate(()=>{const soon=MATCHES.find(m=>m.state==="soon"&&m.t1&&m.t2),done=[...MATCHES].reverse().find(m=>m.winner&&m.bo===1),ser=[...MATCHES].reverse().find(m=>m.winner&&m.bo>1),live=MATCHES.find(m=>m.state==="live"||m.state==="wait");
      const days=[...new Set(MATCHES.filter(m=>m.winner).map(m=>dayKeyL(new Date(m.start))))];
      return {src:SOURCE,moment:HM&&HM.k,soon:soon&&soon.id,done:done&&done.id,ser:ser&&ser.id,live:live&&live.id,eve:days[days.length-1],v:typeof APP_VERSION!=="undefined"?APP_VERSION:null}});
    const res=ALL[name]={ctx:ctxInfo,screens:[],errs};
    res.screens.push(await measure(p,"accueil"));await p.screenshot({path:path.join(OUT,`tour_${name}_accueil.png`)});
    const routes=[["set",["moi","etat","diag"]],["eve/"+ctxInfo.eve,null],["bets",["todo","run","done"]],["lg",null],["lgf/create",null],["lgf/join",null],
      ctxInfo.soon&&["m/"+ctxInfo.soon,"*"],ctxInfo.done&&["m/"+ctxInfo.done,"*"],ctxInfo.ser&&["m/"+ctxInfo.ser,"*"],ctxInfo.live&&["m/"+ctxInfo.live,"*"],
      ["d/T1_faker~GEN_chovy",["du","ch","fo"]],["pl",null],["p/T1_faker",["ap","sa","du","ch"]],["p/KC_caliste",["ap","sa","du","ch"]],["rk",["TOP","JGL","MID","BOT","SUP"]],
      ["cmp/T1_faker~GEN_chovy",["sa","ch","du"]],["spe",["eq","jo"]],["teams",null],["t/GEN",["ap","sa","ma"]],["t/KC",["ap","sa","ma"]],["t/MVK",["ap","sa","ma"]],
      ["sui",["rd","tb","bl","fn"]],["sim",["ti","tb","rob"]],["cal",["next","res"]],["st",["to","ld","ch","lg","nb"]],["fx",null],["fxl",null]].filter(Boolean);
    for(const [r,tabs] of routes){
      try{await p.evaluate(r=>go(r),r.startsWith("rk")?"rk/TOP":r);await wait(r.startsWith("m/")?3500:1800);
        let T=tabs;if(T==="*")T=await p.evaluate(()=>[...NAV[NAV.length-1].el.querySelectorAll(".segw .seg button")].map(b=>b.dataset.tab));
        if(!T||!T.length){const m=await measure(p,r);m.list=LISTS.test(r);res.screens.push(m)}
        else for(const t of T){await p.evaluate(t=>{const b=NAV[NAV.length-1].el.querySelector(`.segw .seg [data-tab="${t}"]`);if(b)b.click()},t);await wait(r.startsWith("m/")||r.startsWith("d/")?2200:1200);
          const lab=r.startsWith("rk")?"rk/"+t:r+"/"+t;const m=await measure(p,lab);m.list=LISTS.test(lab);res.screens.push(m);
          if(m.raw>0&&m.raw<120&&!m.fit||m.cut||m.hs||m.doc)await p.screenshot({path:path.join(OUT,`tour_${name}_${lab.replace(/[\/~]/g,"_")}.png`)})}
        await p.evaluate(async()=>{while(NAV.length){history.back();await new Promise(r=>setTimeout(r,420))}});await wait(300)}
      catch(e){res.screens.push({label:r,crash:String(e.message||e).slice(0,200)})}}
    res.storage=(await p.evaluate(()=>Object.keys(localStorage))).filter(k=>!/^w26_/.test(k));
    await b.close();
    const bad=res.screens.filter(s=>s.crash||s.doc||s.docTop||s.hs||s.wide&&s.wide.length||s.cut||(s.raw>0&&s.raw<120&&!s.fit)||s.wheel||(!s.list&&s.ratio>1.5)||s.typo&&s.typo.length);
    console.log(`=== ${name} (${ctxInfo.src}, moment ${ctxInfo.moment}) : ${res.screens.length} écrans, ${errs.length} erreur(s) JS ${errs.slice(0,3).join(" || ")}`);
    for(const s of res.screens)console.log(`${(s.label||"").padEnd(34)} ×${s.ratio} ${s.fit?"fit":"   "} dépasse ${String(s.over).padStart(4)}${s.list?" (liste)":""}${s.cut?" COUPÉ "+s.cut:""}${s.wheel?" BOUGE "+s.wheel:""}${s.doc||s.docTop?" DOC "+s.doc+"/"+s.docTop:""}${s.hs?" HSCROLL":""}${s.wide&&s.wide.length?" DÉBORDE "+JSON.stringify(s.wide):""}${s.raw>0&&s.raw<120&&!s.fit?" MINI "+s.raw:""}${!s.list&&s.ratio>1.5?" >1,5":""}${s.typo&&s.typo.length?" TYPO "+JSON.stringify(s.typo):""}${s.small&&s.small.length?" petits "+JSON.stringify(s.small):""}${s.crash?" CRASH "+s.crash:""}`);
    console.log(`anomalies : ${bad.length}`);
  }
  srv.close();fs.writeFileSync(path.join(__dirname,"qa",`tour${LOCAL?"_local":""}${ONLY.length?"_"+ONLY.join("_"):""}.json`),JSON.stringify(ALL,null,1));
})();
